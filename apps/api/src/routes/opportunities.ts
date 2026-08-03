import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { UpdateOpportunityStatusSchema } from "@uzimatek/shared-types";
import { runScanAndPersist } from "../lib/opportunityScanService";

export async function opportunitiesRoutes(app: FastifyInstance) {
  // GET /v1/opportunities
  app.get("/", { preHandler: [requireAuth] }, async (request) => {
    const {
      page = 1,
      pageSize = 25,
      status,
      category,
    } = request.query as {
      page?: number;
      pageSize?: number;
      status?: string;
      category?: string;
    };

    const where = {
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.opportunity.count({ where }),
      prisma.opportunity.findMany({
        where,
        orderBy: { compositeScore: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items, total, page, pageSize };
  });

  // GET /v1/opportunities/scan-runs
  app.get("/scan-runs", { preHandler: [requireAuth] }, async (request) => {
    const { limit = 10 } = request.query as { limit?: number };
    const items = await prisma.opportunityScanRun.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
    });
    return { items };
  });

  // POST /v1/opportunities/scan — run a scan now
  app.post("/scan", { preHandler: [requireAuth] }, async (_request, reply) => {
    try {
      const summary = await runScanAndPersist();
      return reply.code(201).send(summary);
    } catch (err) {
      return reply.code(502).send({ error: `Scan failed: ${(err as Error).message}` });
    }
  });

  // GET /v1/opportunities/:id
  app.get("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const opportunity = await prisma.opportunity.findUnique({ where: { id } });
    if (!opportunity) return reply.code(404).send({ error: "Opportunity not found" });
    return opportunity;
  });

  // PATCH /v1/opportunities/:id
  app.patch("/:id", { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdateOpportunityStatusSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });

    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Opportunity not found" });

    const updated = await prisma.opportunity.update({
      where: { id },
      data: { status: body.data.status },
    });
    return updated;
  });
}
