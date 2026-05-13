import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { emitAuditEvent } from "../lib/audit";
import { requireAuth } from "../middleware/auth";
import { CreateEncounterSchema } from "@uzimatek/shared-types";
import { runCodingPipeline, fallbackKeywordMatcher } from "@uzimatek/ai";

export async function encountersRoutes(app: FastifyInstance) {
  // GET /v1/encounters
  app.get("/", { preHandler: [requireAuth] }, async (request) => {
    const { page = 1, pageSize = 20, status } = request.query as {
      page?: number; pageSize?: number; status?: string;
    };

    const where = {
      facilityId: request.user.facilityId,
      ...(status ? { status } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.encounter.count({ where }),
      prisma.encounter.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          provider: { select: { name: true, specialty: true } },
          items: true,
          _count: { select: { claims: true } },
        },
      }),
    ]);

    return { items, total, page, pageSize };
  });

  // GET /v1/encounters/:id
  app.get("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const encounter = await prisma.encounter.findFirst({
      where: { id, facilityId: request.user.facilityId },
      include: {
        provider: true,
        patient: true,
        items: { orderBy: { createdAt: "asc" } },
        claims: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!encounter) return reply.code(404).send({ error: "Encounter not found" });
    return encounter;
  });

  // POST /v1/encounters
  app.post("/", { preHandler: [requireAuth] }, async (request, reply) => {
    const body = CreateEncounterSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });

    const data = body.data;
    const facilityId = request.user.facilityId;

    // Upsert patient
    const patient = await prisma.patient.upsert({
      where: { facilityId_shaNumber: { facilityId, shaNumber: data.patientShaNumber } },
      update: {},
      create: {
        facilityId,
        shaNumber: data.patientShaNumber,
        nationalId: data.patientNationalId,
        nameHash: data.patientName, // TODO: hash in prod
        dob: new Date(data.patientDob),
        sex: data.patientSex,
        phone: data.patientPhone,
      },
    });

    const encounter = await prisma.encounter.create({
      data: {
        facilityId,
        patientId: patient.id,
        providerId: data.providerId,
        patientShaNumber: data.patientShaNumber,
        patientName: data.patientName,
        visitDate: new Date(data.visitDate),
        visitType: data.visitType,
        admissionDate: data.admissionDate ? new Date(data.admissionDate) : null,
        dischargeDate: data.dischargeDate ? new Date(data.dischargeDate) : null,
        chiefComplaint: data.chiefComplaint,
        narrative: data.narrative,
        status: "ready_to_code",
        source: "manual",
      },
    });

    await emitAuditEvent({
      facilityId,
      actorId: request.user.sub,
      action: "encounter.create",
      entityType: "encounter",
      entityId: encounter.id,
      afterJson: { patientShaNumber: data.patientShaNumber, visitDate: data.visitDate },
      ip: request.ip,
      userAgent: request.headers["user-agent"] || "",
    });

    return reply.code(201).send(encounter);
  });

  // POST /v1/encounters/:id/code
  app.post("/:id/code", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const encounter = await prisma.encounter.findFirst({
      where: { id, facilityId: request.user.facilityId },
      include: { provider: true },
    });

    if (!encounter) return reply.code(404).send({ error: "Encounter not found" });
    if (!["ready_to_code", "draft"].includes(encounter.status)) {
      return reply.code(409).send({ error: `Cannot code encounter in status: ${encounter.status}` });
    }

    // Update status to coding
    await prisma.encounter.update({ where: { id }, data: { status: "coding" } });

    try {
      const facility = await prisma.facility.findUnique({ where: { id: request.user.facilityId } });

      let result;
      try {
        result = await runCodingPipeline(
          encounter.narrative,
          encounter.chiefComplaint,
          encounter.visitType,
          facility?.level || "4"
        );
      } catch (aiError) {
        console.warn("AI coding failed, using fallback:", aiError);
        result = fallbackKeywordMatcher(encounter.narrative, encounter.chiefComplaint);
      }

      // Delete existing AI items and replace
      await prisma.encounterItem.deleteMany({
        where: { encounterId: id, source: "ai" },
      });

      const items = await prisma.$transaction(
        result.items.map((item) =>
          prisma.encounterItem.create({
            data: {
              encounterId: id,
              type: item.itemType,
              rawText: item.entityText,
              code: item.code,
              codeSystem: item.codeSystem,
              description: item.description,
              confidence: item.confidence,
              confidenceBand: item.confidenceBand,
              rationale: item.rationale,
              source: "ai",
            },
          })
        )
      );

      const overallBand = result.items.some((i) => i.confidenceBand === "low")
        ? "low"
        : result.items.some((i) => i.confidenceBand === "medium")
        ? "medium"
        : "high";

      await prisma.encounter.update({
        where: { id },
        data: {
          status: "coded",
          promptVersionId: result.promptVersionId,
        },
      });

      await emitAuditEvent({
        facilityId: request.user.facilityId,
        actorId: request.user.sub,
        action: "coding.complete",
        entityType: "encounter",
        entityId: id,
        afterJson: {
          itemCount: items.length,
          overallBand,
          latencyMs: result.latencyMs,
          flags: result.validationFlags,
        },
        ip: request.ip,
        userAgent: request.headers["user-agent"] || "",
      });

      return {
        encounterId: id,
        items,
        codingNotes: result.codingNotes,
        validationFlags: result.validationFlags,
        overallBand,
        latencyMs: result.latencyMs,
      };
    } catch (err) {
      await prisma.encounter.update({ where: { id }, data: { status: "error" } });
      throw err;
    }
  });

  // POST /v1/encounters/bulk
  app.post("/bulk", { preHandler: [requireAuth] }, async (request, reply) => {
    const { rows } = request.body as { rows: Record<string, string>[] };
    if (!rows?.length) return reply.code(400).send({ error: "No rows provided" });

    const facilityId = request.user.facilityId;
    const results = { created: 0, errors: [] as Array<{ row: number; error: string }> };

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const provider = await prisma.provider.findFirst({
          where: { facilityId, kmpdcNo: row.provider_kmpdc },
        });
        if (!provider) throw new Error(`Provider KMPDC ${row.provider_kmpdc} not found`);

        const patient = await prisma.patient.upsert({
          where: { facilityId_shaNumber: { facilityId, shaNumber: row.patient_sha_number } },
          update: {},
          create: {
            facilityId,
            shaNumber: row.patient_sha_number,
            nameHash: row.patient_name,
            dob: new Date(row.patient_dob),
            sex: row.patient_sex as "M" | "F",
          },
        });

        await prisma.encounter.create({
          data: {
            facilityId,
            patientId: patient.id,
            providerId: provider.id,
            patientShaNumber: row.patient_sha_number,
            patientName: row.patient_name,
            visitDate: new Date(row.visit_date),
            visitType: row.visit_type,
            chiefComplaint: row.chief_complaint,
            narrative: row.narrative,
            status: "ready_to_code",
            source: "csv",
          },
        });
        results.created++;
      } catch (err: unknown) {
        results.errors.push({ row: i + 1, error: (err as Error).message });
      }
    }

    return results;
  });
}
