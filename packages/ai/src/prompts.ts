export const SYSTEM_PROMPT = `You are an expert medical coder specializing in the Kenyan Social Health Authority (SHA) and Social Health Insurance Fund (SHIF) billing system.

Your role is to analyze clinical encounter narratives from Kenyan healthcare facilities (predominantly Level 4 private and faith-based hospitals) and extract structured medical coding information.

Context:
- Kenya transitioned from NHIF to SHA on 1 October 2024
- SHA uses ICD-10 (10th revision) for diagnosis coding
- SHA has its own tariff schedule for procedures, drugs, and investigations
- Facilities are Level 3–6 with different tariff packages
- Common conditions: malaria, typhoid, pneumonia, diabetes, hypertension, TB, HIV, maternal health

Rules:
1. Extract ONLY diagnoses and procedures explicitly documented or clearly implied in the narrative
2. Use ICD-10 codes for diagnoses (format: letter + 2 digits + optional decimal + 1-2 chars, e.g., J18.9)
3. Suggest SHA tariff codes for procedures (format: SHA-XXX-NNN)
4. Provide a confidence score 0.0–1.0 for each code
5. Never hallucinate codes that do not exist in standard ICD-10 or the SHA tariff schedule
6. Do not include PII in rationale fields
7. For uncertain diagnoses, provide multiple options with confidence scores
8. Consider Kenyan epidemiology: malaria, TB, HIV are common; tropical diseases apply

Confidence scoring guidelines:
- 0.9–1.0: Explicitly stated with exact match, no ambiguity
- 0.7–0.89: Clearly documented with standard mapping
- 0.5–0.69: Implied or partially documented, may need review
- Below 0.5: Uncertain, requires human verification`;

export const ENTITY_EXTRACTION_TOOL = {
  name: "extract_clinical_entities",
  description: "Extract structured clinical entities from the encounter narrative for medical coding",
  input_schema: {
    type: "object" as const,
    properties: {
      diagnoses: {
        type: "array",
        items: { type: "string" },
        description: "List of diagnoses as plain text (e.g., 'malaria', 'type 2 diabetes with poor glycaemic control')"
      },
      procedures: {
        type: "array",
        items: { type: "string" },
        description: "List of procedures performed (e.g., 'IV cannula insertion', 'wound dressing', 'appendicectomy')"
      },
      drugs: {
        type: "array",
        items: { type: "string" },
        description: "Medications prescribed or administered (e.g., 'artemether-lumefantrine', 'amoxicillin 500mg 21 days')"
      },
      investigations: {
        type: "array",
        items: { type: "string" },
        description: "Laboratory tests and imaging ordered (e.g., 'full blood count', 'malaria RDT', 'chest X-ray PA')"
      },
      visit_summary: {
        type: "string",
        description: "One-sentence clinical summary suitable for claim documentation"
      }
    },
    required: ["diagnoses", "procedures", "drugs", "investigations", "visit_summary"]
  }
};

export const CODE_MAPPING_TOOL = {
  name: "map_to_codes",
  description: "Map extracted clinical entities to ICD-10 diagnosis codes and SHA tariff codes",
  input_schema: {
    type: "object" as const,
    properties: {
      coded_items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            entity_text: { type: "string", description: "Original clinical text" },
            item_type: { type: "string", enum: ["diagnosis", "procedure", "drug", "investigation"] },
            code: { type: "string", description: "ICD-10 code (for diagnosis) or SHA tariff code (for others)" },
            code_system: { type: "string", enum: ["ICD-10", "SHA-Tariff", "ATC"] },
            description: { type: "string", description: "Official code description" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            rationale: { type: "string", description: "Brief clinical reasoning (no PII)" },
            is_primary: { type: "boolean", description: "Is this the primary diagnosis/procedure?" },
            alternative_codes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  description: { type: "string" },
                  confidence: { type: "number" }
                },
                required: ["code", "description", "confidence"]
              },
              description: "Alternative code options if confidence < 0.85"
            }
          },
          required: ["entity_text", "item_type", "code", "code_system", "description", "confidence", "rationale", "is_primary"]
        }
      },
      coding_notes: {
        type: "string",
        description: "Any important coding notes, bundling rules applied, or flags for the biller"
      },
      validation_flags: {
        type: "array",
        items: { type: "string" },
        description: "List of potential issues: missing pre-auth, bundling violations, documentation gaps"
      }
    },
    required: ["coded_items", "coding_notes", "validation_flags"]
  }
};
