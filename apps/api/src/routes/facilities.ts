import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { emitAuditEvent } from "../lib/audit";
import { requireAuth, requireRole } from "../middleware/auth";
import { FacilitySetupSchema, ProviderSchema, RegisterSchema, InviteUserSchema } from "@uzimatek/shared-types";
import bcrypt from "bcryptjs";

export async function facilitiesRoutes(app: FastifyInstance) {
  // GET /v1/facilities/me
  app.get("/me", { preHandler: [requireAuth] }, async (request) => {
    const facility = await prisma.facility.findUnique({
      where: { id: request.user.facilityId },
      include: {
        providers: { where: { isActive: true }, orderBy: { name: "asc" } },
        users: { where: { status: "active" }, select: { id: true, name: true, email: true, role: true, lastLoginAt: true } },
        subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
        usageMeters: { orderBy: { period: "desc" }, take: 3 },
      },
    });
    return facility;
  });

  // PUT /v1/facilities/me
  app.put("/me", { preHandler: [requireRole("facility_admin", "super_admin")] }, async (request, reply) => {
    const body = FacilitySetupSchema.partial().safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });

    const before = await prisma.facility.findUnique({ where: { id: request.user.facilityId } });

    const updated = await prisma.facility.update({
      where: { id: request.user.facilityId },
      data: body.data,
    });

    await emitAuditEvent({
      facilityId: request.user.facilityId,
      actorId: request.user.sub,
      action: "facility.update",
      entityType: "facility",
      entityId: request.user.facilityId,
      beforeJson: before as Record<string, unknown>,
      afterJson: body.data as Record<string, unknown>,
      ip: request.ip,
      userAgent: request.headers["user-agent"] || "",
    });

    return updated;
  });

  // GET /v1/facilities/providers
  app.get("/providers", { preHandler: [requireAuth] }, async (request) => {
    const providers = await prisma.provider.findMany({
      where: { facilityId: request.user.facilityId, isActive: true },
      orderBy: { name: "asc" },
    });
    return providers;
  });

  // POST /v1/facilities/providers
  app.post("/providers", { preHandler: [requireRole("facility_admin", "super_admin")] }, async (request, reply) => {
    const body = ProviderSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });

    const provider = await prisma.provider.create({
      data: { ...body.data, facilityId: request.user.facilityId },
    });
    return reply.code(201).send(provider);
  });

  // GET /v1/facilities/users
  app.get("/users", { preHandler: [requireRole("facility_admin", "manager", "super_admin")] }, async (request) => {
    const users = await prisma.user.findMany({
      where: { facilityId: request.user.facilityId },
      select: { id: true, name: true, email: true, role: true, status: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return users;
  });

  // POST /v1/facilities/users/invite
  app.post("/users/invite", { preHandler: [requireRole("facility_admin", "super_admin")] }, async (request, reply) => {
    const body = InviteUserSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });

    const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        facilityId: request.user.facilityId,
        email: body.data.email,
        name: body.data.name,
        role: body.data.role,
        passwordHash,
        status: "invited",
      },
    });

    // TODO: Send invite email via Resend

    return reply.code(201).send({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tempPassword,
    });
  });

  // Setup wizard (POST /v1/facilities/setup)
  app.post("/setup", async (request, reply) => {
    const body = z.object({
      facility: FacilitySetupSchema,
      adminUser: RegisterSchema,
    }).safeParse(request.body);

    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });

    // Check if facility already exists
    const existing = await prisma.facility.findUnique({
      where: { shaCode: body.data.facility.shaCode },
    });
    if (existing) return reply.code(409).send({ error: "A facility with this SHA code already exists" });

    const facility = await prisma.facility.create({ data: body.data.facility });

    const passwordHash = await bcrypt.hash(body.data.adminUser.password, 12);
    const user = await prisma.user.create({
      data: {
        facilityId: facility.id,
        email: body.data.adminUser.email,
        name: body.data.adminUser.name,
        passwordHash,
        role: "facility_admin",
        status: "active",
      },
    });

    // Create starter subscription
    const now = new Date();
    await prisma.subscription.create({
      data: {
        facilityId: facility.id,
        plan: "starter",
        status: "active",
        currentPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
        currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      facilityId: facility.id,
      name: user.name,
    };

    const accessToken = app.jwt.sign(payload, { expiresIn: "30m" });
    const refreshToken = app.jwt.sign(payload, { expiresIn: "14d" });

    return reply.code(201).send({ facility, accessToken, refreshToken });
  });
}

import { z } from "zod";
