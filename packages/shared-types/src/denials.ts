import { z } from "zod";

export const DenialCategory = z.enum([
  "missing_doc",
  "coding_error",
  "eligibility",
  "duplicate",
  "tariff_mismatch",
  "pre_auth_required",
  "benefit_limit",
  "other",
]);
export type DenialCategory = z.infer<typeof DenialCategory>;

export const DENIAL_CATEGORY_LABELS: Record<DenialCategory, string> = {
  missing_doc: "Missing Documentation",
  coding_error: "Coding Error",
  eligibility: "Eligibility Issue",
  duplicate: "Duplicate Claim",
  tariff_mismatch: "Tariff Mismatch",
  pre_auth_required: "Pre-Auth Required",
  benefit_limit: "Benefit Limit Exceeded",
  other: "Other",
};

export const ResubmitClaimSchema = z.object({
  claimId: z.string().uuid(),
  changes: z.string().min(10, "Describe the changes made"),
  attachments: z.array(z.string()).optional(),
});
export type ResubmitClaimInput = z.infer<typeof ResubmitClaimSchema>;

export interface Denial {
  id: string;
  claimId: string;
  claimNumber: string;
  patientName: string;
  patientShaNumber: string;
  visitDate: string;
  totalAmount: number;
  reasonCode: string;
  reasonText: string;
  classifiedCategory: DenialCategory;
  suggestedFix: string;
  resolvedAt: string | null;
  appealDeadline: string;
  createdAt: string;
}
