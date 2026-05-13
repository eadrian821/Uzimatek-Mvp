import { z } from "zod";

export const PRICING_TIERS = {
  starter: { maxClaims: 1000, perClaim: 50, monthlyMin: 25000 },
  growth: { maxClaims: 5000, perClaim: 35, monthlyMin: 70000 },
  scale: { maxClaims: Infinity, perClaim: 25, monthlyMin: 200000 },
} as const;

export interface UsageRecord {
  facilityId: string;
  period: string;
  claimsCount: number;
  claimsBilled: number;
  amountKes: number;
  tier: "starter" | "growth" | "scale";
}

export interface Invoice {
  id: string;
  facilityId: string;
  facilityName: string;
  period: string;
  claimsCount: number;
  amountKes: number;
  status: "pending" | "paid" | "overdue" | "void";
  dueDate: string;
  paidAt: string | null;
  paymentMethod: string | null;
  mpesaRef: string | null;
  createdAt: string;
}

export const MpesaCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(
            z.object({
              Name: z.string(),
              Value: z.union([z.string(), z.number()]).optional(),
            })
          ),
        })
        .optional(),
    }),
  }),
});
export type MpesaCallbackInput = z.infer<typeof MpesaCallbackSchema>;
