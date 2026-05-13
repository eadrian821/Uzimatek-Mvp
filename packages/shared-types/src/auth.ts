import { z } from "zod";

export const UserRole = z.enum([
  "super_admin",
  "facility_admin",
  "manager",
  "biller",
  "read_only",
]);
export type UserRole = z.infer<typeof UserRole>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  facilityId: z.string().uuid().optional(),
  role: UserRole.default("biller"),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const OtpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});
export type OtpVerifyInput = z.infer<typeof OtpVerifySchema>;

export const InviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: UserRole,
  facilityId: z.string().uuid(),
});
export type InviteUserInput = z.infer<typeof InviteUserSchema>;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  facilityId: string;
  facilityName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
