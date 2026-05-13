"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, FileText, DollarSign,
  Clock, AlertTriangle, CheckCircle2, ArrowUpRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatKes, formatDate, getStatusColor } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import Link from "next/link";

// Mock data for demo when API isn't connected
const MOCK_EXEC = {
  period: "May 2026",
  totalClaimsMtd: 847,
  totalValueSubmitted: 12480000,
  totalValuePaid: 8940000,
  denialRate: 22.4,
  avgDaysToPayment: 34,
  arAgingBuckets: [
    { label: "Current (0–30d)", amount: 1250000, claimsCount: 142 },
    { label: "31–60 days", amount: 780000, claimsCount: 88 },
    { label: "61–90 days", amount: 420000, claimsCount: 51 },
    { label: "90+ days", amount: 210000, claimsCount: 24 },
  ],
  claimsVolumeByDay: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10),
    submitted: Math.floor(30 + Math.random() * 40),
    paid: Math.floor(15 + Math.random() * 25),
  })),
  topDenialReasons: [
    { category: "coding_error", count: 42, amount: 380000 },
    { category: "missing_doc", count: 31, amount: 245000 },
    { category: "eligibility", count: 18, amount: 162000 },
    { category: "tariff_mismatch", count: 12, amount: 98000 },
    { category: "pre_auth_required", count: 8, amount: 72000 },
  ],
};

const MOCK_OPS = {
  queueDepth: 28,
  claimsInDraft: 15,
  claimsPendingReview: 28,
  claimsSubmitted: 142,
  claimsDenied: 34,
};

const DENIAL_COLORS = ["#ef4444", "#f97316", "#eab308", "#8b5cf6", "#06b6d4", "#ec4899", "#6366f1", "#84cc16"];

const DENIAL_LABELS: Record<string, string> = {
  coding_error: "Coding Error",
  missing_doc: "Missing Docs",
  eligibility: "Eligibility",
  tariff_mismatch: "Tariff Mismatch",
  pre_auth_required: "Pre-Auth",
  duplicate: "Duplicate",
  benefit_limit: "Benefit Limit",
  other: "Other",
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: exec = MOCK_EXEC } = useQuery({
    queryKey: ["dashboard-executive"],
    queryFn: () => api.getExecutiveDashboard(),
    select: (d) => d as typeof MOCK_EXEC,
  });

  const { data: ops = MOCK_OPS } = useQuery({
    queryKey: ["dashboard-operational"],
    queryFn: () => api.getOperationalDashboard(),
    select: (d) => d as typeof MOCK_OPS,
  });

  const kpiCards = [
    {
      title: "Claims Submitted (MTD)",
      value: exec.totalClaimsMtd.toLocaleString(),
      sub: `${exec.period}`,
      icon: FileText,
      color: "text-blue-600 bg-blue-50",
      trend: "+12% vs last month",
      trendUp: true,
    },
    {
      title: "Value Submitted",
      value: formatKes(exec.totalValueSubmitted),
      sub: "SHA claims pipeline",
      icon: DollarSign,
      color: "text-teal-600 bg-teal-50",
      trend: "+18% vs last month",
      trendUp: true,
    },
    {
      title: "Value Paid",
      value: formatKes(exec.totalValuePaid),
      sub: `${Math.round((exec.totalValuePaid / exec.totalValueSubmitted) * 100)}% collection rate`,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
      trend: "+5% vs last month",
      trendUp: true,
    },
    {
      title: "Denial Rate",
      value: `${exec.denialRate}%`,
      sub: "SHA claims this period",
      icon: AlertTriangle,
      color: "text-red-600 bg-red-50",
      trend: "-3.2pp vs last month",
      trendUp: false,
    },
    {
      title: "Avg Days to Payment",
      value: `${exec.avgDaysToPayment}d`,
      sub: "DSO (days sales outstanding)",
      icon: Clock,
      color: "text-orange-600 bg-orange-50",
      trend: "-4d vs last month",
      trendUp: false,
    },
    {
      title: "Review Queue",
      value: ops.queueDepth.toString(),
      sub: "encounters pending coding",
      icon: FileText,
      color: "text-purple-600 bg-purple-50",
      trend: `${ops.claimsPendingReview} claims pending review`,
      trendUp: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good morning, {user?.name.split(" ")[0]}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {user?.facilityName} · {exec.period} Overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/claims"
            className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Claims Workbench
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpiCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-slate-500 font-medium">{card.title}</p>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{card.value}</div>
            <p className="text-xs text-slate-400 mb-2">{card.sub}</p>
            {card.trend && (
              <div
                className={`flex items-center gap-1 text-xs font-medium ${
                  card.trendUp === null
                    ? "text-slate-500"
                    : card.trendUp
                    ? "text-emerald-600"
                    : "text-red-500"
                }`}
              >
                {card.trendUp !== null && (
                  card.trendUp ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )
                )}
                {card.trend}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Volume chart */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Claims Volume (14 days)</h2>
            <Link href="/reports" className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700">
              Full reports <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={exec.claimsVolumeByDay}>
              <defs>
                <linearGradient id="submitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="paid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => v.slice(5)}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip
                formatter={(v: number, name: string) => [v, name === "submitted" ? "Submitted" : "Paid"]}
                labelFormatter={(l) => formatDate(l)}
              />
              <Area type="monotone" dataKey="submitted" stroke="#0d9488" fill="url(#submitted)" strokeWidth={2} />
              <Area type="monotone" dataKey="paid" stroke="#10b981" fill="url(#paid)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Denial breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Top Denial Reasons</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={exec.topDenialReasons}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={65}
                innerRadius={35}
              >
                {exec.topDenialReasons.map((_, i) => (
                  <Cell key={i} fill={DENIAL_COLORS[i % DENIAL_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, _: string, props: { payload?: { category: string } }) => [
                  v,
                  DENIAL_LABELS[props.payload?.category || ""] || "Other",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {exec.topDenialReasons.slice(0, 4).map((r, i) => (
              <div key={r.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: DENIAL_COLORS[i] }}
                  />
                  <span className="text-slate-600">{DENIAL_LABELS[r.category] || r.category}</span>
                </div>
                <span className="font-semibold text-slate-900">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* A/R Aging + Status breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* A/R Aging */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">A/R Ageing</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={exec.arAgingBuckets} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis tickFormatter={(v) => `${v / 1000}K`} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip
                formatter={(v: number) => [formatKes(v), "Amount"]}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {exec.arAgingBuckets.map((_, i) => (
                  <Cell key={i} fill={["#0d9488", "#f59e0b", "#f97316", "#ef4444"][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {exec.arAgingBuckets.map((b) => (
              <div key={b.label} className="text-xs">
                <span className="text-slate-400">{b.label}</span>
                <div className="font-semibold text-slate-900">{formatKes(b.amount)}</div>
                <div className="text-slate-400">{b.claimsCount} claims</div>
              </div>
            ))}
          </div>
        </div>

        {/* Claims status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Claims Status</h2>
            <Link href="/claims" className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { label: "Draft", count: ops.claimsInDraft, color: "bg-slate-400" },
              { label: "Pending Review", count: ops.claimsPendingReview, color: "bg-blue-500", highlight: true },
              { label: "Submitted to SHA", count: ops.claimsSubmitted, color: "bg-purple-500" },
              { label: "Denied", count: ops.claimsDenied, color: "bg-red-500", alert: true },
            ].map((s) => {
              const total = ops.claimsInDraft + ops.claimsPendingReview + ops.claimsSubmitted + ops.claimsDenied;
              const pct = total > 0 ? (s.count / total) * 100 : 0;
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={`font-medium ${s.alert ? "text-red-600" : s.highlight ? "text-blue-700" : "text-slate-600"}`}>
                      {s.label}
                    </span>
                    <span className="font-bold text-slate-900">{s.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${s.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {ops.claimsDenied > 0 && (
            <Link
              href="/denials"
              className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-sm text-red-700 font-medium transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Review {ops.claimsDenied} denied claims
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
