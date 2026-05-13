import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { emitAuditEvent } from "../lib/audit";
import { requireAuth } from "../middleware/auth";
import { UpdateClaimSchema, ClaimsFilterSchema } from "@uzimatek/shared-types";
import { nanoid } from "nanoid";

export async function claimsRoutes(app: FastifyInstance) {
  // GET /v1/claims
  app.get("/", { preHandler: [requireAuth] }, async (request) => {
    const query = ClaimsFilterSchema.safeParse(request.query);
    if (!query.success) return { error: query.error.flatten() };

    const { status, dateFrom, dateTo, confidenceBand, search, page, pageSize } = query.data;

    const where = {
      facilityId: request.user.facilityId,
      ...(status ? { status } : {}),
      ...(confidenceBand ? { confidenceBand } : {}),
      ...(dateFrom || dateTo ? {
        createdAt: {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        },
      } : {}),
      ...(search ? {
        OR: [
          { encounter: { patientName: { contains: search, mode: "insensitive" as const } } },
          { encounter: { patientShaNumber: { contains: search, mode: "insensitive" as const } } },
          { claimNumber: { contains: search, mode: "insensitive" as const } },
        ],
      } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.claim.count({ where }),
      prisma.claim.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          encounter: {
            include: {
              provider: { select: { name: true } },
            },
          },
          lines: true,
          _count: { select: { denials: true } },
        },
      }),
    ]);

    return { items, total, page, pageSize };
  });

  // GET /v1/claims/:id
  app.get("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const claim = await prisma.claim.findFirst({
      where: { id, facilityId: request.user.facilityId },
      include: {
        encounter: {
          include: {
            provider: true,
            patient: true,
            items: true,
          },
        },
        lines: true,
        submissions: { orderBy: { createdAt: "desc" }, take: 5 },
        denials: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!claim) return reply.code(404).send({ error: "Claim not found" });
    return claim;
  });

  // PATCH /v1/claims/:id
  app.patch("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdateClaimSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });

    const claim = await prisma.claim.findFirst({
      where: { id, facilityId: request.user.facilityId },
    });
    if (!claim) return reply.code(404).send({ error: "Claim not found" });
    if (["submitted", "paid"].includes(claim.status)) {
      return reply.code(409).send({ error: "Cannot edit a submitted or paid claim" });
    }

    const { notes } = body.data;

    const updated = await prisma.claim.update({
      where: { id },
      data: { notes: notes ?? undefined },
    });

    await emitAuditEvent({
      facilityId: request.user.facilityId,
      actorId: request.user.sub,
      action: "claim.update",
      entityType: "claim",
      entityId: id,
      beforeJson: { status: claim.status, notes: claim.notes },
      afterJson: { notes: updated.notes },
      ip: request.ip,
      userAgent: request.headers["user-agent"] || "",
    });

    return updated;
  });

  // POST /v1/claims/:id/submit
  app.post("/:id/submit", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const claim = await prisma.claim.findFirst({
      where: { id, facilityId: request.user.facilityId },
      include: { encounter: true, lines: true },
    });
    if (!claim) return reply.code(404).send({ error: "Claim not found" });
    if (!["draft", "pending_review", "approved"].includes(claim.status)) {
      return reply.code(409).send({ error: `Cannot submit claim in status: ${claim.status}` });
    }
    if (claim.lines.length === 0) {
      return reply.code(422).send({ error: "Claim has no billing lines" });
    }

    const idempotencyKey = `claim-${id}-attempt-${nanoid(8)}`;
    const claimNumber = `SHA-${Date.now()}-${nanoid(6).toUpperCase()}`;

    // Simulate SHA API submission (mock in dev)
    const submissionResult = await mockShaSubmission(claim, claimNumber);

    const submission = await prisma.submission.create({
      data: {
        claimId: id,
        channel: "api",
        requestPayload: { claimId: id, claimNumber, lines: claim.lines.length },
        responsePayload: submissionResult,
        statusCode: submissionResult.success ? 200 : 422,
        latencyMs: submissionResult.latencyMs,
        idempotencyKey,
        attempt: 1,
        status: submissionResult.success ? "success" : "failed",
      },
    });

    await prisma.claim.update({
      where: { id },
      data: {
        status: submissionResult.success ? "submitted" : "draft",
        claimNumber: submissionResult.success ? claimNumber : null,
        submittedAt: submissionResult.success ? new Date() : null,
      },
    });

    await emitAuditEvent({
      facilityId: request.user.facilityId,
      actorId: request.user.sub,
      action: "claim.submit",
      entityType: "claim",
      entityId: id,
      afterJson: { claimNumber, channel: "api", success: submissionResult.success },
      ip: request.ip,
      userAgent: request.headers["user-agent"] || "",
    });

    return { submissionId: submission.id, claimNumber, success: submissionResult.success };
  });

  // POST /v1/claims/bulk-submit
  app.post("/bulk-submit", { preHandler: [requireAuth] }, async (request) => {
    const { claimIds } = request.body as { claimIds: string[] };
    const results = [];

    for (const claimId of claimIds) {
      try {
        const claim = await prisma.claim.findFirst({
          where: { id: claimId, facilityId: request.user.facilityId },
          include: { lines: true },
        });
        if (!claim || claim.lines.length === 0) {
          results.push({ claimId, success: false, error: "Claim not found or empty" });
          continue;
        }

        const claimNumber = `SHA-${Date.now()}-${nanoid(6).toUpperCase()}`;
        await prisma.claim.update({
          where: { id: claimId },
          data: { status: "submitted", claimNumber, submittedAt: new Date() },
        });
        results.push({ claimId, success: true, claimNumber });
      } catch (err) {
        results.push({ claimId, success: false, error: (err as Error).message });
      }
    }

    return { results, submitted: results.filter((r) => r.success).length };
  });

  // POST /v1/claims/:id/resubmit
  app.post("/:id/resubmit", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { changes } = request.body as { changes: string };

    const claim = await prisma.claim.findFirst({
      where: { id, facilityId: request.user.facilityId },
    });
    if (!claim) return reply.code(404).send({ error: "Claim not found" });

    const claimNumber = `SHA-${Date.now()}-${nanoid(6).toUpperCase()}`;
    await prisma.claim.update({
      where: { id },
      data: { status: "submitted", claimNumber, submittedAt: new Date() },
    });

    await emitAuditEvent({
      facilityId: request.user.facilityId,
      actorId: request.user.sub,
      action: "claim.resubmit",
      entityType: "claim",
      entityId: id,
      afterJson: { claimNumber, changes },
      ip: request.ip,
      userAgent: request.headers["user-agent"] || "",
    });

    return { success: true, claimNumber };
  });

  // POST /v1/claims (generate from encounter)
  app.post("/from-encounter/:encounterId", { preHandler: [requireAuth] }, async (request, reply) => {
    const { encounterId } = request.params as { encounterId: string };

    const encounter = await prisma.encounter.findFirst({
      where: { id: encounterId, facilityId: request.user.facilityId },
      include: { items: true },
    });

    if (!encounter) return reply.code(404).send({ error: "Encounter not found" });
    if (encounter.status !== "coded") {
      return reply.code(422).send({ error: "Encounter must be coded before generating a claim" });
    }

    const tariffItems = encounter.items.filter((i) => i.codeSystem === "SHA-Tariff");
    const lines = tariffItems.map((item) => ({
      shaTariffCode: item.code || "SHA-CONS-001",
      description: item.description || item.rawText,
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 500,
      lineTotal: (item.quantity || 1) * (item.unitPrice || 500),
      icdCode: encounter.items.find((i) => i.type === "diagnosis")?.code,
    }));

    const totalAmount = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const overallBand = encounter.items.some((i) => i.confidenceBand === "low")
      ? "low"
      : encounter.items.some((i) => i.confidenceBand === "medium")
      ? "medium"
      : "high";

    const claim = await prisma.claim.create({
      data: {
        facilityId: request.user.facilityId,
        encounterId,
        payer: "SHA",
        status: "pending_review",
        totalAmount,
        confidenceBand: overallBand,
        hasFlags: encounter.items.some((i) => (i.confidence || 1) < 0.85),
        lines: { create: lines },
      },
      include: { lines: true },
    });

    await prisma.encounter.update({ where: { id: encounterId }, data: { status: "claim_generated" } });

    await emitAuditEvent({
      facilityId: request.user.facilityId,
      actorId: request.user.sub,
      action: "claim.create",
      entityType: "claim",
      entityId: claim.id,
      afterJson: { totalAmount, linesCount: lines.length },
      ip: request.ip,
      userAgent: request.headers["user-agent"] || "",
    });

    return reply.code(201).send(claim);
  });
}

async function mockShaSubmission(claim: { id: string; totalAmount: number }, claimNumber: string) {
  const start = Date.now();
  // Simulate 200-800ms latency
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 600));
  const latencyMs = Date.now() - start;
  // 95% success rate in mock
  const success = Math.random() > 0.05;
  return {
    success,
    claimNumber: success ? claimNumber : null,
    shaRefNumber: success ? `SHA-REF-${nanoid(10).toUpperCase()}` : null,
    message: success ? "Claim received and queued for processing" : "Validation error: missing pre-auth code",
    latencyMs,
  };
}
