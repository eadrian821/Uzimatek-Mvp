import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { PRICING_TIERS } from "@uzimatek/shared-types";

export async function billingRoutes(app: FastifyInstance) {
  // GET /v1/billing/usage
  app.get("/usage", { preHandler: [requireAuth] }, async (request) => {
    const facilityId = request.user.facilityId;
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [usage, subscription, invoices] = await Promise.all([
      prisma.usageMeter.findUnique({ where: { facilityId_period: { facilityId, period } } }),
      prisma.subscription.findFirst({ where: { facilityId, status: "active" }, orderBy: { createdAt: "desc" } }),
      prisma.invoice.findMany({
        where: { subscription: { facilityId } },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { subscription: { select: { plan: true } } },
      }),
    ]);

    const claimsCount = usage?.claimsCount || 0;
    const tier =
      claimsCount > 5000 ? "scale" : claimsCount > 1000 ? "growth" : "starter";
    const rate = PRICING_TIERS[tier].perClaim;
    const monthlyMin = PRICING_TIERS[tier].monthlyMin;
    const estimatedAmount = Math.max(claimsCount * rate, monthlyMin);

    return {
      period,
      claimsCount,
      claimsBilled: usage?.claimsBilled || 0,
      tier,
      perClaimRate: rate,
      monthlyMin,
      estimatedAmount,
      plan: subscription?.plan || "starter",
      subscriptionStatus: subscription?.status || "active",
      invoices,
    };
  });

  // POST /v1/billing/mpesa/initiate
  app.post("/mpesa/initiate", { preHandler: [requireRole("facility_admin", "super_admin")] }, async (request, reply) => {
    const { amount, phone, invoiceId } = request.body as {
      amount: number; phone: string; invoiceId: string;
    };

    if (!process.env.ENABLE_MPESA || process.env.ENABLE_MPESA !== "true") {
      return reply.code(503).send({ error: "M-Pesa integration not enabled in this environment" });
    }

    // TODO: Daraja STK push implementation
    return { checkoutRequestId: "mock-checkout-id", message: "STK push sent to " + phone };
  });

  // POST /v1/billing/mpesa/callback
  app.post("/mpesa/callback", async (request) => {
    // Daraja callback — process payment confirmation
    // TODO: Implement full Daraja callback handling
    const body = request.body as Record<string, unknown>;
    console.log("M-Pesa callback received:", JSON.stringify(body));
    return { ResultCode: 0, ResultDesc: "Accepted" };
  });
}
