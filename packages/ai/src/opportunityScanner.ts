import Anthropic from "@anthropic-ai/sdk";
import {
  ScannedOpportunitySchema,
  type OpportunityCategory,
  type ScannedOpportunity,
} from "@uzimatek/shared-types";
import {
  OPPORTUNITY_SYSTEM_PROMPT,
  SCAN_CATEGORIES,
  buildCategoryUserMessage,
} from "./opportunityPrompts";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-opus-5";
const MAX_PAUSE_RESUMES = 2;

const SUBMIT_OPPORTUNITIES_TOOL = {
  name: "submit_opportunities",
  description:
    "Submit the final list of real, currently-open opportunities found for this category after searching the web.",
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    properties: {
      opportunities: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string", description: "Opportunity/program name" },
            organization: { type: "string", description: "Organization running it" },
            sourceUrl: { type: "string", description: "Direct URL to the listing" },
            region: {
              type: "string",
              description: "Eligible region, e.g. 'Kenya', 'Africa', 'Global'",
            },
            deadline: {
              type: "string",
              description: "Application deadline as an ISO date (YYYY-MM-DD), omitted if rolling/none stated",
            },
            fundingAmountText: {
              type: "string",
              description: "Funding/prize amount as stated on the listing, verbatim",
            },
            fundingAmountUsd: {
              type: "number",
              description: "Funding/prize amount converted to approximate USD, only if confidently derivable",
            },
            description: { type: "string", description: "2-4 sentence description of the opportunity" },
            relevanceReason: {
              type: "string",
              description: "1-2 sentences on why this fits Uzimatek specifically",
            },
          },
          required: ["title", "sourceUrl", "description", "relevanceReason"],
        },
      },
    },
    required: ["opportunities"],
  },
};

export class ScanCategoryError extends Error {
  constructor(
    public readonly category: OpportunityCategory,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ScanCategoryError";
  }
}

export interface CategoryOpportunity extends ScannedOpportunity {
  category: OpportunityCategory;
}

function findSubmitToolUse(
  content: Anthropic.Messages.ContentBlock[]
): Anthropic.Messages.ToolUseBlock | undefined {
  return content.find(
    (block): block is Anthropic.Messages.ToolUseBlock =>
      block.type === "tool_use" && block.name === "submit_opportunities"
  );
}

async function scanCategory(
  categoryDef: (typeof SCAN_CATEGORIES)[number]
): Promise<CategoryOpportunity[]> {
  const { category } = categoryDef;
  const tools = [
    { type: "web_search_20260209" as const, name: "web_search" as const },
    SUBMIT_OPPORTUNITIES_TOOL,
  ];

  let messages: Anthropic.Messages.MessageParam[] = [
    { role: "user", content: buildCategoryUserMessage(categoryDef) },
  ];

  let response: Anthropic.Messages.Message;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: "adaptive", display: "summarized" },
      output_config: { effort: "high" },
      system: OPPORTUNITY_SYSTEM_PROMPT,
      tools,
      tool_choice: { type: "auto" },
      messages,
    });
  } catch (err) {
    throw new ScanCategoryError(category, `API request failed: ${(err as Error).message}`, err);
  }

  // Server-side web_search loop can pause after its round limit — resume by
  // resending {user, assistant} unchanged, per Anthropic's pause_turn contract.
  let resumes = 0;
  while (response.stop_reason === "pause_turn" && resumes < MAX_PAUSE_RESUMES) {
    messages = [...messages, { role: "assistant", content: response.content }];
    resumes++;
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        thinking: { type: "adaptive", display: "summarized" },
        output_config: { effort: "high" },
        system: OPPORTUNITY_SYSTEM_PROMPT,
        tools,
        tool_choice: { type: "auto" },
        messages,
      });
    } catch (err) {
      throw new ScanCategoryError(category, `API request failed on resume: ${(err as Error).message}`, err);
    }
  }

  if (response.stop_reason === "refusal") {
    throw new ScanCategoryError(category, "Model declined the request (safety refusal)");
  }

  let submitCall = findSubmitToolUse(response.content);

  // Model searched but ended the turn without submitting — nudge once.
  if (!submitCall && response.stop_reason === "end_turn") {
    messages = [
      ...messages,
      { role: "assistant", content: response.content },
      {
        role: "user",
        content: "Call submit_opportunities now with every opportunity you found so far. If you found none, call it with an empty array.",
      },
    ];
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        thinking: { type: "adaptive", display: "summarized" },
        output_config: { effort: "high" },
        system: OPPORTUNITY_SYSTEM_PROMPT,
        tools,
        tool_choice: { type: "any" },
        messages,
      });
    } catch (err) {
      throw new ScanCategoryError(category, `API request failed on nudge: ${(err as Error).message}`, err);
    }
    submitCall = findSubmitToolUse(response.content);
  }

  if (!submitCall) {
    throw new ScanCategoryError(
      category,
      `Model never called submit_opportunities (stop_reason: ${response.stop_reason})`
    );
  }

  const parsed = ScannedOpportunitySchema.array().safeParse(
    (submitCall.input as { opportunities?: unknown[] }).opportunities ?? []
  );
  if (!parsed.success) {
    throw new ScanCategoryError(
      category,
      `submit_opportunities returned an invalid shape: ${parsed.error.message}`
    );
  }

  return parsed.data.map((opp) => ({ ...opp, category }));
}

export interface FullScanResult {
  opportunities: CategoryOpportunity[];
  categoriesRun: OpportunityCategory[];
  categoryErrors: Array<{ category: OpportunityCategory; message: string }>;
  usedFallback: boolean;
}

// Small curated fallback so the digest is never silently empty when the API
// key is missing or every category scan fails.
const FALLBACK_OPPORTUNITIES: CategoryOpportunity[] = [
  {
    category: "clinical_research",
    title: "Grand Challenges Africa",
    organization: "African Academy of Sciences / Bill & Melinda Gates Foundation",
    sourceUrl: "https://grandchallenges.org/africa",
    region: "Africa",
    description:
      "Recurring grant program funding African-led health and development innovations, including digital health and health-systems strengthening. Check the site for the current call cycle and deadline.",
    relevanceReason:
      "Recurring funding vehicle for African health innovation — directly relevant to Uzimatek's SHA revenue-cycle and clinical AI work; verify current call status before relying on this entry.",
  },
  {
    category: "accelerator_fellowship",
    title: "Villgro Africa",
    organization: "Villgro Africa",
    sourceUrl: "https://villgroafrica.org",
    region: "Africa",
    description:
      "Impact accelerator supporting early-stage African health and agri-tech ventures with funding, mentorship, and investor access. Check the site for open cohort application windows.",
    relevanceReason:
      "Health-focused African accelerator — a plausible recurring fit for Uzimatek; verify the current cohort is open before applying.",
  },
];

export async function runFullScan(): Promise<FullScanResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      opportunities: FALLBACK_OPPORTUNITIES,
      categoriesRun: [],
      categoryErrors: [
        {
          category: "clinical_research",
          message: "ANTHROPIC_API_KEY not set — served curated fallback list",
        },
      ],
      usedFallback: true,
    };
  }

  const settled = await Promise.allSettled(SCAN_CATEGORIES.map((def) => scanCategory(def)));

  const opportunities: CategoryOpportunity[] = [];
  const categoriesRun: OpportunityCategory[] = [];
  const categoryErrors: Array<{ category: OpportunityCategory; message: string }> = [];

  settled.forEach((result, i) => {
    const category = SCAN_CATEGORIES[i].category;
    if (result.status === "fulfilled") {
      categoriesRun.push(category);
      opportunities.push(...result.value);
    } else {
      const reason = result.reason;
      categoryErrors.push({
        category,
        message: reason instanceof Error ? reason.message : String(reason),
      });
    }
  });

  if (categoriesRun.length === 0) {
    return {
      opportunities: FALLBACK_OPPORTUNITIES,
      categoriesRun: [],
      categoryErrors,
      usedFallback: true,
    };
  }

  return { opportunities, categoriesRun, categoryErrors, usedFallback: false };
}
