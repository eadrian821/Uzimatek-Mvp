import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

let lastHash = "GENESIS";

export async function emitAuditEvent(params: {
  facilityId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
  ip: string;
  userAgent: string;
}) {
  const payload = JSON.stringify({
    ...params,
    hashPrev: lastHash,
    ts: new Date().toISOString(),
  });

  const hashSelf = crypto.createHash("sha256").update(payload).digest("hex");

  const event = await prisma.auditEvent.create({
    data: {
      facilityId: params.facilityId,
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeJson: params.beforeJson as Prisma.InputJsonValue ?? undefined,
      afterJson: params.afterJson as Prisma.InputJsonValue ?? undefined,
      ip: params.ip,
      userAgent: params.userAgent,
      hashPrev: lastHash,
      hashSelf,
    },
  });

  lastHash = hashSelf;
  return event;
}
