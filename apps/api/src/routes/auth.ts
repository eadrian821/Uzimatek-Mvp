import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { emitAuditEvent } from "../lib/audit";
import { requireAuth } from "../middleware/auth";
import { LoginSchema, OtpVerifySchema } from "@uzimatek/shared-types";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function authRoutes(app: FastifyInstance) {
  // POST /v1/auth/login
  app.post("/login", async (request, reply) => {
    const body = LoginSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() });

    const { email, password } = body.data;

    const user = await prisma.user.findUnique({ where: { email }, include: { facility: true } });

    const ip = request.ip;
    const ua = request.headers["user-agent"] || "";

    if (!user || user.status === "suspended") {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return reply.code(429).send({ error: `Account locked. Try again in ${minutesLeft} minutes.` });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      const attempts = user.failedAttempts + 1;
      const lockUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: attempts, lockedUntil: lockUntil },
      });

      await emitAuditEvent({
        facilityId: user.facilityId,
        actorId: user.id,
        action: "auth.login_failed",
        entityType: "user",
        entityId: user.id,
        ip,
        userAgent: ua,
      });

      return reply.code(401).send({
        error: attempts >= MAX_ATTEMPTS
          ? `Account locked for ${LOCK_MINUTES} minutes after too many failed attempts.`
          : "Invalid credentials",
      });
    }

    // Successful login
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId,
      name: user.name,
    };

    const accessToken = app.jwt.sign(payload, { expiresIn: "30m" });
    const refreshToken = app.jwt.sign(payload, { expiresIn: "14d" });

    await emitAuditEvent({
      facilityId: user.facilityId,
      actorId: user.id,
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
      ip,
      userAgent: ua,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 1800,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        facilityId: user.facilityId,
        facilityName: user.facility.name,
        shaCode: user.facility.shaCode,
      },
    };
  });

  // POST /v1/auth/refresh
  app.post("/refresh", async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    if (!refreshToken) return reply.code(400).send({ error: "Refresh token required" });

    try {
      const decoded = app.jwt.verify<{ sub: string; role: string; facilityId: string; name: string; email: string }>(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: decoded.sub } });

      if (!user || user.status !== "active") return reply.code(401).send({ error: "Invalid token" });

      const payload = { sub: user.id, email: user.email, role: user.role, facilityId: user.facilityId, name: user.name };
      const accessToken = app.jwt.sign(payload, { expiresIn: "30m" });

      return { accessToken, expiresIn: 1800 };
    } catch {
      return reply.code(401).send({ error: "Invalid or expired refresh token" });
    }
  });

  // POST /v1/auth/logout
  app.post("/logout", async () => {
    // Client-side token disposal; no server-side session to invalidate in stateless JWT
    return { success: true };
  });

  // POST /v1/auth/me
  app.get("/me", { preHandler: [requireAuth] }, async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.sub },
      include: { facility: true },
    });

    if (!user) return { error: "User not found" };

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      facilityId: user.facilityId,
      facilityName: user.facility.name,
    };
  });
}

// Register authenticate decorator
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: {
      sub: string;
      email: string;
      role: string;
      facilityId: string;
      name: string;
    };
  }
}
