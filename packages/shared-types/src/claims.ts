import { z } from "zod";

export const ClaimStatus = z.enum([
  "draft",
  "pending_review",
  "approved",
  "submitted",
  "acknowledged",
  "paid",
  "partially_paid",
  "denied",
  "appealed",
  "void",
]);
export type ClaimStatus = z.infer<typeof ClaimStatus>;

export const SubmissionChannel = z.enum(["api", "rpa", "manual"]);
export type SubmissionChannel = z.infer<typeof SubmissionChannel>;

export const UpdateClaimSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.enum(["diagnosis", "procedure", "drug", "investigation"]),
        rawText: z.string(),
        code: z.string(),
        codeSystem: z.string(),
        description: z.string(),
        quantity: z.number().positive().optional(),
        unitPrice: z.number().nonnegative().optional(),
      })
    )
    .optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});
export type UpdateClaimInput = z.infer<typeof UpdateClaimSchema>;

export interface ClaimLine {
  id: string;
  claimId: string;
  shaTariffCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  icdCode?: string;
}

export interface Claim {
  id: string;
  facilityId: string;
  encounterId: string;
  payer: string;
  claimNumber: string | null;
  status: ClaimStatus;
  totalAmount: number;
  paidAmount: number | null;
  submittedAt: string | null;
  paidAt: string | null;
  denialReasonCode: string | null;
  patientName: string;
  patientShaNumber: string;
  visitDate: string;
  visitType: string;
  providerName: string;
  confidenceBand: "high" | "medium" | "low";
  hasFlags: boolean;
  lines: ClaimLine[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimsQueue {
  items: Claim[];
  total: number;
  page: number;
  pageSize: number;
}

export const ClaimsFilterSchema = z.object({
  status: ClaimStatus.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  providerId: z.string().uuid().optional(),
  confidenceBand: z.enum(["high", "medium", "low"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().positive().max(200).default(20),
});
export type ClaimsFilterInput = z.infer<typeof ClaimsFilterSchema>;
