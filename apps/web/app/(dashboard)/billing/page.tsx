"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CreditCard, TrendingUp, CheckCircle2, Clock, FileText, Download,
} from "lucide-react";
import { formatKes, formatDate, cn } from "@/lib/utils";

const MOCK_BILLING = {
  period: "2026-05",
  claimsCount: 847,
  claimsBilled: 847,
  tier: "starter",
  perClaimRate: 50,
  monthlyMin: 25000,
  estimatedAmount: 42350,
  plan: "starter",
  subscriptionStatus: "active",
  invoices: [
    { id: "inv1", period: "2026-04", claimsCount: 712, amountKes: 35600, status: "paid", dueDate: "2026-05-14", paidAt: "2026-05-10", paymentMethod: "M-Pesa", subscription: { plan: "starter" } },
    { id: "inv2", period: "2026-03", claimsCount: 634, amountKes: 31700, status: "paid", dueDate: "2026-04-14", paidAt: "2026-04-09", paymentMethod: "Bank Transfer", subscription: { plan: "starter" } },
    { id: "inv3", period: "2026-02", claimsCount: 520, amountKes: 26000, status: "paid", dueDate: "2026-03-14", paidAt: "2026-03-08", paymentMethod: "M-Pesa", subscription: { plan: "starter" } },
  ],
};

const TIERS = [
  { key: "starter", label: "Starter", volume: "≤ 1,000 claims", rate: 50, min: 25000 },
  { key: "growth", label: "Growth", volume: "1,001–5,000", rate: 35, min: 70000 },
  { key: "scale", label: "Scale", volume: "5,000+", rate: 25, min: 200000 },
];

export default function BillingPage() {
  const { data = MOCK_BILLING } = useQuery({
    queryKey: ["billing-usage"],
    queryFn: () => import("@/lib/api").then(({ api }) => api.getBillingUsage()),
    select: (d) => d as typeof MOCK_BILLING,
  });

  const pctToNextTier =
    data.tier === "starter" ? (data.claimsCount / 1000) * 100 :
    data.tier === "growth" ? ((data.claimsCount - 1000) / 4000) * 100 : 100;

  const statusColor = {
    paid: "bg-emerald-100 text-emerald-700",
    pending: "bg-blue-100 text-blue-700",
    overdue: "bg-red-100 text-red-700",
    void: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Usage</h1>
        <p className="text-sm text-slate-500">Per-claim pricing · {data.period}</p>
      </div>

      {/* Current billing */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Claims This Month</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{data.claimsCount.toLocaleString()}</div>
          <div className="text-sm text-slate-400">
            {data.tier === "starter" && `${1000 - data.claimsCount} until Growth tier`}
            {data.tier === "growth" && `${5000 - data.claimsCount} until Scale tier`}
            {data.tier === "scale" && "Scale tier — lowest rate"}
          </div>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all"
              style={{ width: `${Math.min(pctToNextTier, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Estimated This Month</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{formatKes(data.estimatedAmount)}</div>
          <div className="text-sm text-slate-400">
            {data.claimsCount.toLocaleString()} × KES {data.perClaimRate}/claim
          </div>
          <div className="text-xs text-slate-300 mt-1">
            Min: {formatKes(data.monthlyMin)} · Invoice due 14th
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Current Plan</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mb-1 capitalize">{data.plan} Plan</div>
          <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", data.subscriptionStatus === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {data.subscriptionStatus}
          </div>
          <div className="mt-3">
            <button className="w-full text-center py-2 text-sm text-teal-600 hover:text-teal-700 font-medium border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      {/* Pricing tiers */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Pricing Tiers</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {TIERS.map((tier) => (
            <div
              key={tier.key}
              className={cn(
                "rounded-xl border-2 p-4",
                data.tier === tier.key ? "border-teal-500 bg-teal-50" : "border-slate-100"
              )}
            >
              {data.tier === tier.key && (
                <div className="text-xs font-bold text-teal-600 mb-1">CURRENT TIER</div>
              )}
              <div className="font-bold text-slate-900">{tier.label}</div>
              <div className="text-sm text-slate-500 mb-2">{tier.volume} claims/month</div>
              <div className="text-2xl font-bold text-teal-700">KES {tier.rate}</div>
              <div className="text-xs text-slate-400">per claim · min {formatKes(tier.min)}/mo</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Volume discounts applied automatically. Pilot partners: free 60 days, then KES 30/claim for months 3–6.
        </p>
      </div>

      {/* Invoice history */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Invoice History</h2>
          <button className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700">
            <Download className="w-4 h-4" />
            Export all
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Period</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Claims</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Due</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Paid Via</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{inv.period}</td>
                <td className="px-5 py-3 text-slate-600">{inv.claimsCount.toLocaleString()}</td>
                <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatKes(inv.amountKes)}</td>
                <td className="px-5 py-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColor[inv.status as keyof typeof statusColor])}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500 text-xs">{formatDate(inv.dueDate)}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{inv.paymentMethod || "—"}</td>
                <td className="px-5 py-3 text-right">
                  <button className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 ml-auto">
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
