import type { CategoryOpportunity } from "@uzimatek/ai";

export interface OpportunityScore {
  yieldScore: number;
  effortScore: number;
  compositeScore: number;
}

const RELEVANCE_KEYWORDS = [
  "sha",
  "social health authority",
  "revenue cycle",
  "claims",
  "ehr",
  "electronic health record",
  "clinical ai",
  "health informatics",
  "insurance",
  "billing",
];

const COMPLEXITY_KEYWORDS = [
  "full proposal",
  "multiple stages",
  "multi-stage",
  "in-person pitch",
  "letter of intent",
  "extensive",
  "due diligence",
  "business plan required",
];

const SIMPLICITY_KEYWORDS = [
  "no application",
  "simple form",
  "one-page",
  "one page application",
  "quick apply",
  "rolling admission",
];

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function fundingBonus(opp: CategoryOpportunity): number {
  if (typeof opp.fundingAmountUsd === "number") {
    if (opp.fundingAmountUsd >= 500_000) return 40;
    if (opp.fundingAmountUsd >= 100_000) return 30;
    if (opp.fundingAmountUsd >= 20_000) return 20;
    if (opp.fundingAmountUsd >= 1_000) return 10;
    return 5;
  }
  if (opp.fundingAmountText) return 10;
  return 0;
}

function categoryBonus(opp: CategoryOpportunity): number {
  switch (opp.category) {
    case "clinical_research":
    case "digital_health":
      return 15;
    case "startup_competition":
    case "accelerator_fellowship":
      return 10;
    case "investor_event":
      return 5;
    default:
      return 0;
  }
}

function regionBonus(opp: CategoryOpportunity): number {
  const region = (opp.region ?? "").toLowerCase();
  if (region.includes("kenya")) return 15;
  if (region.includes("africa")) return 10;
  if (region.includes("global") || region.includes("worldwide")) return 5;
  return 0;
}

function relevanceBonus(opp: CategoryOpportunity): number {
  const text = `${opp.description} ${opp.relevanceReason}`.toLowerCase();
  return RELEVANCE_KEYWORDS.some((kw) => text.includes(kw)) ? 10 : 0;
}

function deadlinePenalty(opp: CategoryOpportunity): number {
  if (!opp.deadline) return 20; // ambiguous — no stated deadline
  const deadline = new Date(opp.deadline).getTime();
  if (Number.isNaN(deadline)) return 20;

  const daysUntil = (deadline - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntil < 0) return 50; // already passed — heavily deprioritize
  if (daysUntil <= 3) return 35; // too rushed to realistically apply
  if (daysUntil <= 14) return 10; // soon but doable
  if (daysUntil <= 45) return 0; // ideal window
  return 15; // far future — lower urgency, could change before then
}

function complexityPenalty(opp: CategoryOpportunity): number {
  const text = opp.description.toLowerCase();
  const complexityHits = COMPLEXITY_KEYWORDS.filter((kw) => text.includes(kw)).length;
  const simplicityHits = SIMPLICITY_KEYWORDS.filter((kw) => text.includes(kw)).length;
  return Math.min(24, complexityHits * 8) - Math.min(20, simplicityHits * 10);
}

export function scoreOpportunity(opp: CategoryOpportunity): OpportunityScore {
  const yieldScore = clamp(
    20 + fundingBonus(opp) + categoryBonus(opp) + regionBonus(opp) + relevanceBonus(opp)
  );
  const effortScore = clamp(20 + deadlinePenalty(opp) + complexityPenalty(opp));
  const compositeScore = yieldScore - effortScore;

  return { yieldScore, effortScore, compositeScore };
}
