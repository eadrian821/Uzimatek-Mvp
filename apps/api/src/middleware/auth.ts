import { FastifyRequest, FastifyReply } from "fastify";

export interface JwtPayload {
  sub: string;       // user id
  email: string;
  role: string;
  facilityId: string;
  name: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: "Unauthorized" });
  }
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply);
    if (!request.user || !roles.includes(request.user.role)) {
      reply.code(403).send({ error: "Forbidden: insufficient permissions" });
    }
  };
}

export function requireSameFacility(
  request: FastifyRequest,
  reply: FastifyReply,
  facilityId: string
) {
  if (
    request.user.role !== "super_admin" &&
    request.user.facilityId !== facilityId
  ) {
    reply.code(403).send({ error: "Forbidden: cross-facility access denied" });
    return false;
  }
  return true;
}
