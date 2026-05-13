import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, ENTITY_EXTRACTION_TOOL, CODE_MAPPING_TOOL } from "./prompts";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ClinicalEntity {
  diagnoses: string[];
  procedures: string[];
  drugs: string[];
  investigations: string[];
  visitSummary: string;
}

export interface CodedItem {
  entityText: string;
  itemType: "diagnosis" | "procedure" | "drug" | "investigation";
  code: string;
  codeSystem: string;
  description: string;
  confidence: number;
  confidenceBand: "high" | "medium" | "low";
  rationale: string;
  isPrimary: boolean;
  alternativeCodes?: Array<{ code: string; description: string; confidence: number }>;
}

export interface CodingResult {
  items: CodedItem[];
  codingNotes: string;
  validationFlags: string[];
  promptVersionId: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  totalCostKes: number;
}

function getConfidenceBand(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.6) return "medium";
  return "low";
}

function estimateCostKes(inputTokens: number, outputTokens: number): number {
  // Claude Sonnet pricing ~$3/MTok input, $15/MTok output; 1 USD ≈ 130 KES
  const usd = (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;
  return Math.round(usd * 130 * 100) / 100;
}

export async function runCodingPipeline(
  narrative: string,
  chiefComplaint: string,
  visitType: string,
  facilityLevel: string,
  existingDiagnoses?: string[],
  existingProcedures?: string[]
): Promise<CodingResult> {
  const startTime = Date.now();

  const userMessage = `
ENCOUNTER DATA:
Chief Complaint: ${chiefComplaint}
Visit Type: ${visitType}
Facility Level: ${facilityLevel}
${existingDiagnoses?.length ? `Documented Diagnoses: ${existingDiagnoses.join(", ")}` : ""}
${existingProcedures?.length ? `Documented Procedures: ${existingProcedures.join(", ")}` : ""}

CLINICAL NARRATIVE:
${narrative}

Step 1: Extract all clinical entities from this encounter.
`;

  // Stage 1: Entity extraction
  const extractionResponse = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    temperature: 0.1,
    system: SYSTEM_PROMPT,
    tools: [ENTITY_EXTRACTION_TOOL as Anthropic.Tool],
    tool_choice: { type: "any" },
    messages: [{ role: "user", content: userMessage }],
  });

  let entities: ClinicalEntity = {
    diagnoses: [],
    procedures: [],
    drugs: [],
    investigations: [],
    visitSummary: "",
  };

  let totalInputTokens = extractionResponse.usage.input_tokens;
  let totalOutputTokens = extractionResponse.usage.output_tokens;

  const extractionToolCall = extractionResponse.content.find(
    (c) => c.type === "tool_use" && c.name === "extract_clinical_entities"
  );

  if (extractionToolCall && extractionToolCall.type === "tool_use") {
    const input = extractionToolCall.input as Record<string, unknown>;
    entities = {
      diagnoses: (input.diagnoses as string[]) || [],
      procedures: (input.procedures as string[]) || [],
      drugs: (input.drugs as string[]) || [],
      investigations: (input.investigations as string[]) || [],
      visitSummary: (input.visit_summary as string) || "",
    };
  }

  // Stage 2: Code mapping
  const mappingMessage = `
EXTRACTED ENTITIES:
Diagnoses: ${entities.diagnoses.join("; ") || "none"}
Procedures: ${entities.procedures.join("; ") || "none"}
Drugs: ${entities.drugs.join("; ") || "none"}
Investigations: ${entities.investigations.join("; ") || "none"}

Now map each entity to the correct ICD-10 diagnosis code or SHA tariff code.
Use only valid codes — do not hallucinate. If uncertain, lower the confidence score.
`;

  const mappingResponse = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    temperature: 0.1,
    system: SYSTEM_PROMPT,
    tools: [CODE_MAPPING_TOOL as Anthropic.Tool],
    tool_choice: { type: "any" },
    messages: [
      { role: "user", content: userMessage },
      { role: "assistant", content: extractionResponse.content },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id:
              extractionToolCall?.type === "tool_use"
                ? extractionToolCall.id
                : "unknown",
            content: JSON.stringify(entities),
          },
          { type: "text", text: mappingMessage },
        ],
      },
    ],
  });

  totalInputTokens += mappingResponse.usage.input_tokens;
  totalOutputTokens += mappingResponse.usage.output_tokens;

  const latencyMs = Date.now() - startTime;

  const mappingToolCall = mappingResponse.content.find(
    (c) => c.type === "tool_use" && c.name === "map_to_codes"
  );

  if (!mappingToolCall || mappingToolCall.type !== "tool_use") {
    throw new Error("AI coding pipeline failed: no code mapping returned");
  }

  const mappingOutput = mappingToolCall.input as {
    coded_items: Array<{
      entity_text: string;
      item_type: string;
      code: string;
      code_system: string;
      description: string;
      confidence: number;
      rationale: string;
      is_primary: boolean;
      alternative_codes?: Array<{ code: string; description: string; confidence: number }>;
    }>;
    coding_notes: string;
    validation_flags: string[];
  };

  const items: CodedItem[] = (mappingOutput.coded_items || []).map((item) => ({
    entityText: item.entity_text,
    itemType: item.item_type as CodedItem["itemType"],
    code: item.code,
    codeSystem: item.code_system,
    description: item.description,
    confidence: item.confidence,
    confidenceBand: getConfidenceBand(item.confidence),
    rationale: item.rationale,
    isPrimary: item.is_primary,
    alternativeCodes: item.alternative_codes,
  }));

  return {
    items,
    codingNotes: mappingOutput.coding_notes || "",
    validationFlags: mappingOutput.validation_flags || [],
    promptVersionId: "00000000-0000-0000-0000-000000000001",
    latencyMs,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    totalCostKes: estimateCostKes(totalInputTokens, totalOutputTokens),
  };
}

// Deterministic fallback when LLM is unavailable
export function fallbackKeywordMatcher(
  narrative: string,
  chiefComplaint: string
): CodingResult {
  const text = (narrative + " " + chiefComplaint).toLowerCase();
  const items: CodedItem[] = [];

  const KEYWORD_MAP: Array<{
    keywords: string[];
    code: string;
    system: string;
    description: string;
    type: CodedItem["itemType"];
  }> = [
    { keywords: ["malaria", "plasmodium", "fever chills"], code: "B50.9", system: "ICD-10", description: "Plasmodium falciparum malaria, unspecified", type: "diagnosis" },
    { keywords: ["pneumonia", "chest infection", "consolidation"], code: "J18.9", system: "ICD-10", description: "Pneumonia, unspecified organism", type: "diagnosis" },
    { keywords: ["upper respiratory", "cough", "cold", "urti"], code: "J06.9", system: "ICD-10", description: "Acute upper respiratory infection, unspecified", type: "diagnosis" },
    { keywords: ["diabetes", "diabetic", "hyperglycaemia", "hyperglycemia"], code: "E11.9", system: "ICD-10", description: "Type 2 diabetes mellitus without complications", type: "diagnosis" },
    { keywords: ["hypertension", "high blood pressure", "hbp"], code: "I10", system: "ICD-10", description: "Essential (primary) hypertension", type: "diagnosis" },
    { keywords: ["uti", "urinary tract infection", "dysuria"], code: "N39.0", system: "ICD-10", description: "Urinary tract infection, site not specified", type: "diagnosis" },
    { keywords: ["appendicitis", "appendix"], code: "K35.9", system: "ICD-10", description: "Acute appendicitis, unspecified", type: "diagnosis" },
    { keywords: ["consultation", "consult", "review"], code: "SHA-CONS-001", system: "SHA-Tariff", description: "Outpatient General Consultation", type: "procedure" },
    { keywords: ["blood count", "fbc", "full blood"], code: "SHA-LAB-001", system: "SHA-Tariff", description: "Full Blood Count (FBC)", type: "investigation" },
    { keywords: ["malaria test", "malaria rdt", "rdt"], code: "SHA-LAB-003", system: "SHA-Tariff", description: "Malaria Rapid Test", type: "investigation" },
    { keywords: ["chest x-ray", "cxr", "chest xray"], code: "SHA-IMG-001", system: "SHA-Tariff", description: "Chest X-Ray (PA)", type: "investigation" },
  ];

  for (const mapping of KEYWORD_MAP) {
    if (mapping.keywords.some((kw) => text.includes(kw))) {
      items.push({
        entityText: mapping.keywords.find((kw) => text.includes(kw)) || mapping.description,
        itemType: mapping.type,
        code: mapping.code,
        codeSystem: mapping.system,
        description: mapping.description,
        confidence: 0.6,
        confidenceBand: "medium",
        rationale: "Matched via keyword — verify with clinical notes",
        isPrimary: items.filter((i) => i.itemType === mapping.type).length === 0,
      });
    }
  }

  return {
    items,
    codingNotes: "DEGRADED MODE — AI unavailable. Keyword matching only. Human review required.",
    validationFlags: ["DEGRADED_MODE: AI coder unavailable — all codes require biller verification"],
    promptVersionId: "00000000-0000-0000-0000-000000000001",
    latencyMs: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalCostKes: 0,
  };
}
