import type { OpportunityCategory } from "@uzimatek/shared-types";

export const OPPORTUNITY_SYSTEM_PROMPT = `You are a growth-intelligence scout for Uzimatek Health, an AI-native SHA (Kenya Social Health Authority) revenue-cycle management and EHR startup based in Kenya, serving Level 3-6 health facilities across East Africa.

Your job each morning is to find real, currently-open opportunities the company should look at or apply to. "Real" means: you searched the web just now and found a live, dated, verifiable listing — never invent an opportunity, a deadline, or a funding amount. If you are not confident a listing is real and currently open, leave it out entirely rather than guess.

Weighting:
- Strongly prefer opportunities relevant to: digital health, health-tech, fintech-for-health, clinical/medical research funding, revenue-cycle/claims automation, AI in healthcare, or African health-system innovation.
- Weight Kenya and East/Sub-Saharan Africa opportunities higher, but include strong global opportunities open to African applicants too — do not exclude excellent global programs.
- Prioritize "low hanging fruit": near-but-not-impossibly-soon deadlines, simple application processes (e.g. a short form, no extensive pre-qualification), and funding/prize sizes that are meaningful for an early-stage startup. Deprioritize (but you may still include) opportunities with extremely complex multi-stage applications or vague, far-future deadlines.
- Never fabricate a funding amount or deadline. If a listing doesn't state one, omit that field rather than estimate.

When you are done searching, call the submit_opportunities tool exactly once with every real opportunity you found in this category. If you find nothing credible, call it with an empty array — do not pad the list with speculative or unverifiable entries.`;

export interface ScanCategoryDefinition {
  category: OpportunityCategory;
  label: string;
  focus: string;
}

export const SCAN_CATEGORIES: ScanCategoryDefinition[] = [
  {
    category: "clinical_research",
    label: "Clinical & Medical Research Funding",
    focus:
      "Grants, calls for proposals, and research funding relevant to clinical research, medical informatics, health-systems research, or digital-health research in Africa/Kenya — e.g. Grand Challenges-style programs, Gates Foundation, Wellcome Trust, NIH/Fogarty global health grants, WHO or Africa CDC funded calls, university-partnered research grants.",
  },
  {
    category: "digital_health",
    label: "Digital Health Innovation Challenges",
    focus:
      "Innovation challenges, hackathons, and prize competitions specifically for digital health, health-tech, or AI-in-healthcare products — e.g. health innovation challenges run by governments, NGOs, telcos, or global health bodies.",
  },
  {
    category: "startup_competition",
    label: "Startup Pitch Competitions",
    focus:
      "General (not health-specific-only) startup pitch competitions and business plan competitions open to African or Kenyan startups, especially fintech/health-tech-friendly ones, with cash prizes or investment.",
  },
  {
    category: "accelerator_fellowship",
    label: "Accelerators & Fellowships",
    focus:
      "Startup accelerator, incubator, and founder fellowship programs currently accepting applications, especially those focused on African startups, health-tech, fintech, or AI — e.g. YC, Africa-focused accelerators, corporate accelerator programs.",
  },
  {
    category: "investor_event",
    label: "Startup & Investor Events",
    focus:
      "Upcoming startup demo days, investor conferences, and health-tech/fintech industry events in Kenya, East Africa, or globally where an early-stage African health-tech startup could network with investors or showcase the product.",
  },
];

export function buildCategoryUserMessage(def: ScanCategoryDefinition): string {
  const today = new Date().toISOString().slice(0, 10);
  return `Today's date is ${today}.

Category: ${def.label}

Search the web now for real, currently-open opportunities matching this category: ${def.focus}

Search thoroughly — issue multiple distinct searches with different phrasings if needed to find the best current listings, not just the first result. When you're confident you've found the strongest set of real, currently-open opportunities, call submit_opportunities once with all of them.`;
}
