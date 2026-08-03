import { z } from "zod";

export const OpportunityCategory = z.enum([
  "clinical_research",
  "digital_health",
  "startup_competition",
  "accelerator_fellowship",
  "investor_event",
]);
export type OpportunityCategory = z.infer<typeof OpportunityCategory>;

export const OpportunityStatus = z.enum([
  "new",
  "shortlisted",
  "applied",
  "dismissed",
  "expired",
]);
export type OpportunityStatus = z.infer<typeof OpportunityStatus>;

export const ScanRunStatus = z.enum([
  "running",
  "completed",
  "completed_with_errors",
  "failed",
]);
export type ScanRunStatus = z.infer<typeof ScanRunStatus>;

// Shape Claude's submit_opportunities tool must produce for a single category scan.
export const ScannedOpportunitySchema = z.object({
  title: z.string().min(3),
  organization: z.string().optional(),
  sourceUrl: z.string().url(),
  region: z.string().optional(),
  deadline: z.string().optional(), // ISO date string, or omitted if rolling/no deadline
  fundingAmountText: z.string().optional(),
  fundingAmountUsd: z.number().optional(),
  description: z.string().min(10),
  relevanceReason: z.string().min(5),
});
export type ScannedOpportunity = z.infer<typeof ScannedOpportunitySchema>;

export const SubmitOpportunitiesInputSchema = z.object({
  opportunities: z.array(ScannedOpportunitySchema),
});
export type SubmitOpportunitiesInput = z.infer<
  typeof SubmitOpportunitiesInputSchema
>;

export const UpdateOpportunityStatusSchema = z.object({
  status: OpportunityStatus,
});
export type UpdateOpportunityStatusInput = z.infer<
  typeof UpdateOpportunityStatusSchema
>;

export interface Opportunity {
  id: string;
  title: string;
  organization: string | null;
  sourceUrl: string;
  category: OpportunityCategory;
  region: string | null;
  deadline: string | null;
  fundingAmountText: string | null;
  fundingAmountUsd: number | null;
  description: string;
  relevanceReason: string | null;
  yieldScore: number;
  effortScore: number;
  compositeScore: number;
  status: OpportunityStatus;
  discoveredAt: string;
  scanRunId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityScanRun {
  id: string;
  status: ScanRunStatus;
  categoriesRun: string[];
  opportunitiesFound: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}
