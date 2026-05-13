import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { emitAuditEvent } from "../lib/audit";
import { requireAuth } from "../middleware/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function denialsRoutes(app: FastifyInstance) {
  // GET /v1/denials
  app.get("/", { preHandler: [requireAuth] }, async (request) => {
    const { page = 1, pageSize = 20, resolved } = request.query as {
      page?: number; pageSize?: number; resolved?: string;
    };

    const claims = await prisma.claim.findMany({
      where: {
        facilityId: request.user.facilityId,
        status: "denied",
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        encounter: { include: { provider: { select: { name: true } } } },
        denials: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const total = await prisma.claim.count({
      where: { facilityId: request.user.facilityId, status: "denied" },
    });

    return { items: claims, total, page, pageSize };
  });

  // GET /v1/denials/:claimId
  app.get("/:claimId", { preHandler: [requireAuth] }, async (request, reply) => {
    const { claimId } = request.params as { claimId: string };

    const claim = await prisma.claim.findFirst({
      where: { id: claimId, facilityId: request.user.facilityId },
      include: {
        encounter: { include: { provider: true, items: true } },
        lines: true,
        denials: { orderBy: { createdAt: "desc" } },
        submissions: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!claim) return reply.code(404).send({ error: "Claim not found" });

    // Generate suggested fix if denial exists
    const latestDenial = claim.denials[0];
    if (latestDenial && !latestDenial.suggestedFix) {
      const suggestedFix = generateSuggestedFix(
        latestDenial.classifiedCategory,
        latestDenial.reasonText
      );
      await prisma.denial.update({
        where: { id: latestDenial.id },
        data: { suggestedFix },
      });
      latestDenial.suggestedFix = suggestedFix;
    }

    return claim;
  });

  // POST /v1/denials/:claimId/classify
  app.post("/:claimId/classify", { preHandler: [requireAuth] }, async (request, reply) => {
    const { claimId } = request.params as { claimId: string };
    const { reasonCode, reasonText } = request.body as { reasonCode: string; reasonText: string };

    const claim = await prisma.claim.findFirst({
      where: { id: claimId, facilityId: request.user.facilityId },
    });
    if (!claim) return reply.code(404).send({ error: "Claim not found" });

    const category = classifyDenialReason(reasonCode, reasonText);
    const suggestedFix = generateSuggestedFix(category, reasonText);
    const appealDeadline = new Date();
    appealDeadline.setDate(appealDeadline.getDate() + 30);

    const denial = await prisma.denial.create({
      data: {
        claimId,
        reasonCode,
        reasonText,
        classifiedCategory: category,
        suggestedFix,
        appealDeadline,
      },
    });

    await prisma.claim.update({ where: { id: claimId }, data: { status: "denied", denialReasonCode: reasonCode } });

    return denial;
  });

  // POST /v1/denials/:claimId/appeal-letter
  app.post("/:claimId/appeal-letter", { preHandler: [requireAuth] }, async (request, reply) => {
    const { claimId } = request.params as { claimId: string };

    const claim = await prisma.claim.findFirst({
      where: { id: claimId, facilityId: request.user.facilityId },
      include: {
        encounter: { include: { provider: true } },
        lines: true,
        denials: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!claim) return reply.code(404).send({ error: "Claim not found" });

    const denial = claim.denials[0];
    if (!denial) return reply.code(404).send({ error: "No denial found for this claim" });

    const facility = await prisma.facility.findUnique({
      where: { id: request.user.facilityId },
    });

    const appealLetter = await generateAppealLetter(
      facility?.name || "Healthcare Facility",
      claim.encounter.patientShaNumber,
      claim.claimNumber || claimId,
      denial.reasonText,
      denial.classifiedCategory,
      claim.encounter.provider?.name || "Attending Clinician",
      claim.totalAmount
    );

    await prisma.denial.update({
      where: { id: denial.id },
      data: { appealLetterDraft: appealLetter },
    });

    return { appealLetter };
  });
}

function classifyDenialReason(code: string, text: string): string {
  const t = text.toLowerCase();
  if (t.includes("document") || t.includes("record") || t.includes("attach")) return "missing_doc";
  if (t.includes("code") || t.includes("icd") || t.includes("tariff code")) return "coding_error";
  if (t.includes("eligib") || t.includes("sha number") || t.includes("member")) return "eligibility";
  if (t.includes("duplicate") || t.includes("already submitted")) return "duplicate";
  if (t.includes("tariff") || t.includes("rate") || t.includes("price")) return "tariff_mismatch";
  if (t.includes("pre-auth") || t.includes("prior auth") || t.includes("authorization")) return "pre_auth_required";
  if (t.includes("limit") || t.includes("benefit") || t.includes("exceeded")) return "benefit_limit";
  return "other";
}

function generateSuggestedFix(category: string, reasonText: string): string {
  const fixes: Record<string, string> = {
    missing_doc: "Attach the discharge summary, lab reports, and any referral letters. Ensure all supporting clinical documentation is uploaded before resubmission.",
    coding_error: "Review the ICD-10 diagnosis codes against the clinical narrative. Verify that procedure codes match the documented services. Use the AI coder to re-check the mapping.",
    eligibility: "Verify the patient's SHA number and membership status directly on the SHA portal. Confirm the visit date falls within an active membership period.",
    duplicate: "Check if this claim was previously submitted. If so, reference the original claim number. If not, contact SHA to resolve the duplicate flag.",
    tariff_mismatch: "Cross-check the SHA tariff codes against the current effective tariff schedule for your facility level. Some packages require specific facility tiers.",
    pre_auth_required: "Obtain the pre-authorization reference number from SHA for this procedure. Attach the pre-auth approval document to the resubmission.",
    benefit_limit: "Review the patient's remaining annual benefit. Consider splitting services across benefit periods or seeking co-payment arrangements.",
    other: `Review the denial reason carefully: "${reasonText}". Contact the SHA provider helpline if the reason is unclear.`,
  };
  return fixes[category] || fixes.other;
}

async function generateAppealLetter(
  facilityName: string,
  shaNumber: string,
  claimNumber: string,
  denialReason: string,
  category: string,
  providerName: string,
  amount: number
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: `Write a formal SHA claim appeal letter for the following:
Facility: ${facilityName}
Patient SHA Number: ${shaNumber}
Claim Number: ${claimNumber}
Denial Reason: ${denialReason}
Denial Category: ${category}
Attending Provider: ${providerName}
Claim Amount: KES ${amount.toLocaleString()}
Date: ${new Date().toLocaleDateString("en-KE")}

The letter should be professional, reference the Social Health Insurance Act 2023 provisions, and include specific grounds for appeal. Keep to 3 paragraphs. Do not include PII beyond what's stated above.`,
        },
      ],
    });

    return response.content[0].type === "text" ? response.content[0].text : "";
  } catch {
    return `[DRAFT APPEAL LETTER — Edit before submission]\n\nDear SHA Claims Review Department,\n\nWe write to formally appeal the denial of Claim No. ${claimNumber} for patient SHA No. ${shaNumber}, submitted by ${facilityName}.\n\nThe denial reason cited was: "${denialReason}". We respectfully submit that the clinical services rendered were medically necessary, properly documented, and fall within the applicable SHA benefit package per the Social Health Insurance Act 2023.\n\nWe request a formal review of this claim and attach all supporting documentation. Please contact our billing department for any additional information required.\n\nYours faithfully,\n${facilityName} — Medical Records & Billing Department`;
  }
}
