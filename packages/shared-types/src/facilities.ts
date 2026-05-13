import { z } from "zod";

export const FacilityLevel = z.enum(["3", "4", "5", "6"]);
export type FacilityLevel = z.infer<typeof FacilityLevel>;

export const FacilitySetupSchema = z.object({
  name: z.string().min(3),
  shaCode: z.string().regex(/^[A-Z0-9]{6,12}$/, "Invalid SHA facility code"),
  kmpdcLicense: z.string().min(5),
  kraPin: z.string().regex(/^[AP]\d{9}[A-Z]$/, "Invalid KRA PIN format"),
  level: FacilityLevel,
  county: z.string(),
  subCounty: z.string(),
  ward: z.string(),
  phone: z.string(),
  email: z.string().email(),
  address: z.string(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  mpesaPaybill: z.string().optional(),
});
export type FacilitySetupInput = z.infer<typeof FacilitySetupSchema>;

export const ProviderSchema = z.object({
  facilityId: z.string().uuid(),
  name: z.string().min(2),
  kmpdcNo: z.string().min(4),
  specialty: z.string(),
  role: z.enum(["doctor", "nurse", "clinical_officer", "pharmacist", "other"]),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});
export type ProviderInput = z.infer<typeof ProviderSchema>;

export interface Facility {
  id: string;
  name: string;
  shaCode: string;
  kmpdcLicense: string;
  kraPin: string;
  level: string;
  county: string;
  subCounty: string;
  ward: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface Provider {
  id: string;
  facilityId: string;
  name: string;
  kmpdcNo: string;
  specialty: string;
  role: string;
  signatureUrl?: string;
  createdAt: string;
}
