export interface AuditEvent {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: Record<string, unknown> | null;
  afterJson: Record<string, unknown> | null;
  ip: string;
  userAgent: string;
  hashPrev: string;
  hashSelf: string;
  createdAt: string;
}

export const AUDIT_ACTIONS = {
  AUTH_LOGIN: "auth.login",
  AUTH_LOGOUT: "auth.logout",
  AUTH_LOGIN_FAILED: "auth.login_failed",
  AUTH_PASSWORD_RESET: "auth.password_reset",
  USER_INVITE: "user.invite",
  USER_ROLE_CHANGE: "user.role_change",
  ENCOUNTER_CREATE: "encounter.create",
  ENCOUNTER_UPDATE: "encounter.update",
  ENCOUNTER_DELETE: "encounter.delete",
  CLAIM_CREATE: "claim.create",
  CLAIM_UPDATE: "claim.update",
  CLAIM_SUBMIT: "claim.submit",
  CLAIM_APPROVE: "claim.approve",
  CLAIM_VOID: "claim.void",
  CLAIM_RESUBMIT: "claim.resubmit",
  CODING_COMPLETE: "coding.complete",
  CODING_OVERRIDE: "coding.override",
  DENIAL_CLASSIFY: "denial.classify",
  DENIAL_APPEAL: "denial.appeal",
  BILLING_INVOICE_CREATE: "billing.invoice_create",
  BILLING_PAYMENT: "billing.payment",
  FACILITY_UPDATE: "facility.update",
} as const;
