import { z } from "zod";

export const EncounterStatus = z.enum([
  "draft",
  "ready_to_code",
  "coding",
  "coded",
  "claim_generated",
  "error",
]);
export type EncounterStatus = z.infer<typeof EncounterStatus>;

export const VisitType = z.enum([
  "outpatient",
  "inpatient",
  "day_case",
  "emergency",
  "maternity",
]);
export type VisitType = z.infer<typeof VisitType>;

export const EncounterItemType = z.enum([
  "diagnosis",
  "procedure",
  "drug",
  "investigation",
]);
export type EncounterItemType = z.infer<typeof EncounterItemType>;

export const ConfidenceBand = z.enum(["high", "medium", "low"]);
export type ConfidenceBand = z.infer<typeof ConfidenceBand>;

export const CreateEncounterSchema = z.object({
  patientShaNumber: z
    .string()
    .min(8, "SHA number must be at least 8 characters"),
  patientNationalId: z.string().optional(),
  patientName: z.string().min(2),
  patientDob: z.string(),
  patientSex: z.enum(["M", "F"]),
  patientPhone: z.string().optional(),
  visitDate: z.string(),
  visitType: VisitType,
  admissionDate: z.string().optional(),
  dischargeDate: z.string().optional(),
  providerId: z.string().uuid(),
  chiefComplaint: z.string().min(5),
  narrative: z.string().min(10),
  diagnosesRaw: z.array(z.string()).optional(),
  proceduresRaw: z.array(z.string()).optional(),
  drugsRaw: z.array(z.string()).optional(),
  investigationsRaw: z.array(z.string()).optional(),
});
export type CreateEncounterInput = z.infer<typeof CreateEncounterSchema>;

export interface EncounterItem {
  id: string;
  encounterId: string;
  type: EncounterItemType;
  rawText: string;
  code: string | null;
  codeSystem: string | null;
  description: string | null;
  confidence: number | null;
  confidenceBand: ConfidenceBand | null;
  rationale: string | null;
  source: "ai" | "biller";
  unitPrice?: number;
  quantity?: number;
}

export interface Encounter {
  id: string;
  facilityId: string;
  patientShaNumber: string;
  patientName: string;
  patientDob: string;
  patientSex: string;
  visitDate: string;
  visitType: string;
  providerId: string;
  providerName: string;
  chiefComplaint: string;
  narrative: string;
  status: EncounterStatus;
  source: "manual" | "csv" | "api";
  items: EncounterItem[];
  createdAt: string;
  updatedAt: string;
}

export const BulkEncounterRowSchema = z.object({
  patient_sha_number: z.string(),
  patient_name: z.string(),
  patient_dob: z.string(),
  patient_sex: z.enum(["M", "F"]),
  visit_date: z.string(),
  visit_type: z.string(),
  provider_kmpdc: z.string(),
  chief_complaint: z.string(),
  narrative: z.string(),
  diagnoses: z.string().optional(),
  procedures: z.string().optional(),
  drugs: z.string().optional(),
  investigations: z.string().optional(),
});
export type BulkEncounterRow = z.infer<typeof BulkEncounterRowSchema>;
