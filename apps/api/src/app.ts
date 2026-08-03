import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";

import { authRoutes } from "./routes/auth";
import { facilitiesRoutes } from "./routes/facilities";
import { encountersRoutes } from "./routes/encounters";
import { claimsRoutes } from "./routes/claims";
import { denialsRoutes } from "./routes/denials";
import { dashboardsRoutes } from "./routes/dashboards";
import { auditRoutes } from "./routes/audit";
import { billingRoutes } from "./routes/billing";
import { opportunitiesRoutes } from "./routes/opportunities";
import { registerOpportunityScheduler } from "./lib/opportunityScheduler";

const app = Fastify({
  logger: { level: process.env.NODE_ENV === "production" ? "info" : "debug" },
  trustProxy: true,
});

async function start() {
  const dbUrl = process.env.DATABASE_URL || "";
  console.log(`DATABASE_URL starts with: [${dbUrl.slice(0, 20)}]`);

  // ── Plugins ────────────────────────────────────────────────────────────────
  await app.register(helmet, { contentSecurityPolicy: false });

  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    skipOnError: false,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "uzimatek-dev-secret-change-in-prod",
    sign: { expiresIn: "30m" },
  });

  // ── Health check ───────────────────────────────────────────────────────────
  app.get("/health", async () => ({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  }));

  // ── Routes ─────────────────────────────────────────────────────────────────
  await app.register(authRoutes, { prefix: "/v1/auth" });
  await app.register(facilitiesRoutes, { prefix: "/v1/facilities" });
  await app.register(encountersRoutes, { prefix: "/v1/encounters" });
  await app.register(claimsRoutes, { prefix: "/v1/claims" });
  await app.register(denialsRoutes, { prefix: "/v1/denials" });
  await app.register(dashboardsRoutes, { prefix: "/v1/dashboards" });
  await app.register(auditRoutes, { prefix: "/v1/audit" });
  await app.register(billingRoutes, { prefix: "/v1/billing" });
  await app.register(opportunitiesRoutes, { prefix: "/v1/opportunities" });

  // ── Background jobs ────────────────────────────────────────────────────────
  await registerOpportunityScheduler().catch((err) => {
    console.warn("[app] Opportunity scheduler failed to register:", err.message);
  });

  // ── Start ──────────────────────────────────────────────────────────────────
  const port = parseInt(process.env.PORT || process.env.API_PORT || "3001");
  const host = process.env.API_HOST || "0.0.0.0";

  await app.listen({ port, host });
  console.log(`\n🚀 Uzimatek API running at http://${host}:${port}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
