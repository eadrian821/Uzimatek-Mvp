import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export async function dashboardsRoutes(app: FastifyInstance) {
  // GET /v1/dashboards/executive
  app.get("/executive", { preHandler: [requireAuth] }, async (request) => {
    const facilityId = request.user.facilityId;
    const now = new Date();
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalMtd,
      submittedValue,
      paidValue,
      totalSubmitted,
      totalDenied,
      claimsByDay,
    ] = await Promise.all([
      prisma.claim.count({ where: { facilityId, createdAt: { gte: mtdStart } } }),
      prisma.claim.aggregate({
        where: { facilityId, status: { in: ["submitted", "acknowledged", "paid", "partially_paid"] } },
        _sum: { totalAmount: true },
      }),
      prisma.claim.aggregate({
        where: { facilityId, status: { in: ["paid", "partially_paid"] } },
        _sum: { paidAmount: true },
      }),
      prisma.claim.count({ where: { facilityId } }),
      prisma.claim.count({ where: { facilityId, status: "denied" } }),
      // Last 14 days volume
      prisma.$queryRaw<Array<{ date: string; submitted: number; paid: number }>>`
        SELECT
          DATE(created_at) as date,
          COUNT(*) FILTER (WHERE status IN ('submitted','acknowledged','paid')) as submitted,
          COUNT(*) FILTER (WHERE status IN ('paid','partially_paid')) as paid
        FROM claims
        WHERE facility_id = ${facilityId}::uuid
          AND created_at >= NOW() - INTERVAL '14 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
    ]);

    const denialRate = totalSubmitted > 0 ? (totalDenied / totalSubmitted) * 100 : 0;

    // A/R ageing buckets (mock calculation)
    const arBuckets = [
      { label: "Current (0–30d)", days: "0-30", amount: 1250000, claimsCount: 142 },
      { label: "31–60 days", days: "31-60", amount: 780000, claimsCount: 88 },
      { label: "61–90 days", days: "61-90", amount: 420000, claimsCount: 51 },
      { label: "90+ days", days: "90+", amount: 210000, claimsCount: 24 },
    ];

    return {
      period: `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`,
      totalClaimsMtd: totalMtd,
      totalValueSubmitted: submittedValue._sum.totalAmount || 0,
      totalValuePaid: paidValue._sum.paidAmount || 0,
      denialRate: Math.round(denialRate * 10) / 10,
      avgDaysToPayment: 34,
      arAgingBuckets: arBuckets,
      claimsVolumeByDay: claimsByDay,
      topDenialReasons: [
        { category: "coding_error", count: 42, amount: 380000 },
        { category: "missing_doc", count: 31, amount: 245000 },
        { category: "eligibility", count: 18, amount: 162000 },
        { category: "tariff_mismatch", count: 12, amount: 98000 },
        { category: "pre_auth_required", count: 8, amount: 72000 },
      ],
    };
  });

  // GET /v1/dashboards/operational
  app.get("/operational", { preHandler: [requireAuth] }, async (request) => {
    const facilityId = request.user.facilityId;

    const [draft, pendingReview, submitted, denied, queueDepth] = await Promise.all([
      prisma.claim.count({ where: { facilityId, status: "draft" } }),
      prisma.claim.count({ where: { facilityId, status: "pending_review" } }),
      prisma.claim.count({ where: { facilityId, status: "submitted" } }),
      prisma.claim.count({ where: { facilityId, status: "denied" } }),
      prisma.encounter.count({ where: { facilityId, status: { in: ["ready_to_code", "coded"] } } }),
    ]);

    return {
      queueDepth,
      claimsInDraft: draft,
      claimsPendingReview: pendingReview,
      claimsSubmitted: submitted,
      claimsDenied: denied,
      billerThroughput: [
        { name: "Wanjiku Kamau", claimsToday: 12, claimsWeek: 67 },
        { name: "Peter Mwangi", claimsToday: 9, claimsWeek: 51 },
      ],
      avgCodingTime: 4.2,
      slaBreaches: 3,
    };
  });

  // GET /v1/dashboards/denials
  app.get("/denials", { preHandler: [requireAuth] }, async (request) => {
    const facilityId = request.user.facilityId;

    const [totalDenied, totalClaims] = await Promise.all([
      prisma.claim.count({ where: { facilityId, status: "denied" } }),
      prisma.claim.count({ where: { facilityId } }),
    ]);

    const denialRate = totalClaims > 0 ? (totalDenied / totalClaims) * 100 : 0;

    return {
      overallDenialRate: Math.round(denialRate * 10) / 10,
      denialsByCategory: [
        { category: "coding_error", label: "Coding Error", count: 42, amount: 380000, percentage: 31 },
        { category: "missing_doc", label: "Missing Documentation", count: 31, amount: 245000, percentage: 23 },
        { category: "eligibility", label: "Eligibility Issue", count: 18, amount: 162000, percentage: 13 },
        { category: "tariff_mismatch", label: "Tariff Mismatch", count: 12, amount: 98000, percentage: 9 },
        { category: "pre_auth_required", label: "Pre-Auth Required", count: 8, amount: 72000, percentage: 6 },
        { category: "duplicate", label: "Duplicate Claim", count: 7, amount: 61000, percentage: 5 },
        { category: "benefit_limit", label: "Benefit Limit", count: 5, amount: 44000, percentage: 4 },
        { category: "other", label: "Other", count: 12, amount: 89000, percentage: 9 },
      ],
      denialTrend: generateDenialTrend(),
      denialsByProvider: [
        { providerName: "Dr. Grace Otieno", denialRate: 18.2, total: 245 },
        { providerName: "Dr. Samuel Kipchoge", denialRate: 12.4, total: 189 },
      ],
      topDenialCodes: [
        { code: "ERR-001", description: "Clinical documentation insufficient", count: 38 },
        { code: "ERR-002", description: "Diagnosis-procedure mismatch", count: 27 },
        { code: "ERR-003", description: "SHA number invalid", count: 19 },
      ],
    };
  });
}

function generateDenialTrend() {
  const trend = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    trend.push({
      date: d.toISOString().split("T")[0],
      rate: 22 + Math.random() * 12 - 6,
      count: Math.floor(3 + Math.random() * 8),
    });
  }
  return trend;
}
