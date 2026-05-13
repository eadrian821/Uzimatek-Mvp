export interface ArAgingBucket {
  label: string;
  days: string;
  amount: number;
  claimsCount: number;
}

export interface ExecutiveDashboard {
  period: string;
  totalClaimsMtd: number;
  totalValueSubmitted: number;
  totalValuePaid: number;
  denialRate: number;
  avgDaysToPayment: number;
  arAgingBuckets: ArAgingBucket[];
  claimsVolumeByDay: Array<{ date: string; submitted: number; paid: number }>;
  topDenialReasons: Array<{ category: string; count: number; amount: number }>;
}

export interface OperationalDashboard {
  queueDepth: number;
  claimsInDraft: number;
  claimsPendingReview: number;
  claimsSubmitted: number;
  claimsDenied: number;
  billerThroughput: Array<{ name: string; claimsToday: number; claimsWeek: number }>;
  avgCodingTime: number;
  slaBreaches: number;
}

export interface DenialDashboard {
  overallDenialRate: number;
  denialsByCategory: Array<{ category: string; label: string; count: number; amount: number; percentage: number }>;
  denialTrend: Array<{ date: string; rate: number; count: number }>;
  denialsByProvider: Array<{ providerName: string; denialRate: number; total: number }>;
  topDenialCodes: Array<{ code: string; description: string; count: number }>;
}
