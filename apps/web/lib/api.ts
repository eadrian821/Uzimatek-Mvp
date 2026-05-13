const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("uzimatek-auth");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed.state?.accessToken || null;
    } catch {
      return null;
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ error: res.statusText }));
      throw new ApiError(res.status, errorBody.error || "Request failed", errorBody);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  // Auth
  login(email: string, password: string) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
        facilityId: string;
        facilityName: string;
        shaCode: string;
      };
    }>("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  refreshToken(refreshToken: string) {
    return this.request<{ accessToken: string; expiresIn: number }>(
      "/v1/auth/refresh",
      { method: "POST", body: JSON.stringify({ refreshToken }) }
    );
  }

  // Encounters
  getEncounters(params?: Record<string, string | number>) {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return this.request<{ items: unknown[]; total: number; page: number; pageSize: number }>(
      `/v1/encounters${qs}`
    );
  }

  getEncounter(id: string) {
    return this.request<unknown>(`/v1/encounters/${id}`);
  }

  createEncounter(data: unknown) {
    return this.request<unknown>("/v1/encounters", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  codeEncounter(id: string) {
    return this.request<unknown>(`/v1/encounters/${id}/code`, { method: "POST" });
  }

  bulkImportEncounters(rows: unknown[]) {
    return this.request<{ created: number; errors: unknown[] }>(
      "/v1/encounters/bulk",
      { method: "POST", body: JSON.stringify({ rows }) }
    );
  }

  // Claims
  getClaims(params?: Record<string, string | number>) {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return this.request<{ items: unknown[]; total: number; page: number; pageSize: number }>(
      `/v1/claims${qs}`
    );
  }

  getClaim(id: string) {
    return this.request<unknown>(`/v1/claims/${id}`);
  }

  updateClaim(id: string, data: unknown) {
    return this.request<unknown>(`/v1/claims/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  submitClaim(id: string) {
    return this.request<{ success: boolean; claimNumber: string }>(
      `/v1/claims/${id}/submit`,
      { method: "POST" }
    );
  }

  bulkSubmitClaims(claimIds: string[]) {
    return this.request<{ results: unknown[]; submitted: number }>(
      "/v1/claims/bulk-submit",
      { method: "POST", body: JSON.stringify({ claimIds }) }
    );
  }

  generateClaimFromEncounter(encounterId: string) {
    return this.request<unknown>(`/v1/claims/from-encounter/${encounterId}`, {
      method: "POST",
    });
  }

  resubmitClaim(id: string, changes: string) {
    return this.request<{ success: boolean; claimNumber: string }>(
      `/v1/claims/${id}/resubmit`,
      { method: "POST", body: JSON.stringify({ changes }) }
    );
  }

  // Denials
  getDenials(params?: Record<string, string | number>) {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return this.request<{ items: unknown[]; total: number }>(`/v1/denials${qs}`);
  }

  getDenial(claimId: string) {
    return this.request<unknown>(`/v1/denials/${claimId}`);
  }

  generateAppealLetter(claimId: string) {
    return this.request<{ appealLetter: string }>(
      `/v1/denials/${claimId}/appeal-letter`,
      { method: "POST" }
    );
  }

  // Dashboards
  getExecutiveDashboard() {
    return this.request<unknown>("/v1/dashboards/executive");
  }

  getOperationalDashboard() {
    return this.request<unknown>("/v1/dashboards/operational");
  }

  getDenialsDashboard() {
    return this.request<unknown>("/v1/dashboards/denials");
  }

  // Facility
  getFacility() {
    return this.request<unknown>("/v1/facilities/me");
  }

  getProviders() {
    return this.request<unknown[]>("/v1/facilities/providers");
  }

  getUsers() {
    return this.request<unknown[]>("/v1/facilities/users");
  }

  // Billing
  getBillingUsage() {
    return this.request<unknown>("/v1/billing/usage");
  }

  // Audit
  getAuditEvents(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<{ events: unknown[]; total: number }>(`/v1/audit${qs}`);
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = new ApiClient();
