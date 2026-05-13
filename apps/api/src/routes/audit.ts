import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export async function auditRoutes(app: FastifyInstance) {
  // GET /v1/audit
  app.get("/", { preHandler: [requireAuth] }, async (request) => {
    const { entityType, entityId, actorId, page = 1, pageSize = 50 } = request.query as {
      entityType?: string;
      entityId?: string;
      actorId?: string;
      page?: number;
      pageSize?: number;
    };

    const where = {
      facilityId: request.user.facilityId,
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(actorId ? { actorId } : {}),
    };

    const [total, events] = await Promise.all([
      prisma.auditEvent.count({ where }),
      prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          actor: { select: { name: true, email: true, role: true } },
        },
      }),
    ]);

    return { events, total, page, pageSize };
  });

  // GET /v1/audit/claim/:claimId
  app.get("/claim/:claimId", { preHandler: [requireAuth] }, async (request) => {
    const { claimId } = request.params as { claimId: string };

    const events = await prisma.auditEvent.findMany({
      where: {
        facilityId: request.user.facilityId,
        entityId: claimId,
      },
      orderBy: { createdAt: "asc" },
      include: {
        actor: { select: { name: true, role: true } },
      },
    });

    return events;
  });
}
