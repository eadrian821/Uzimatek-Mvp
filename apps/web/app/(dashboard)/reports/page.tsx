"use client";

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import { Download, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { formatKes } from "@/lib/utils";

const MONTHLY_DATA = [
  { month: "Oct", submitted: 520, paid: 390, denied: 130, value: 5200000 },
  { month: "Nov", submitted: 589, paid: 445, denied: 144, value: 5890000 },
  { month: "Dec", submitted: 612, paid: 479, denied: 133, value: 6120000 },
  { month: "Jan", submitted: 678, paid: 534, denied: 144, value: 6780000 },
  { month: "Feb", submitted: 702, paid: 568, denied: 134, value: 7020000 },
  { month: "Mar", submitted: 745, paid: 609, denied: 136, value: 7450000 },
  { month: "Apr", submitted: 782, paid: 641, denied: 141, value: 7820000 },
  { month: "May", submitted: 847, paid: 689, denied: 158, value: 8470000 },
];

const DENIAL_TREND = MONTHLY_DATA.map((m) => ({
  month: m.month,
  rate: Math.round((m.denied / m.submitted) * 1000) / 10,
}));

const PROVIDER_PERF = [
  { name: "Dr. Grace Otieno", submitted: 445, denied: 72, denialRate: 16.2, avgAmount: 4200 },
  { name: "Dr. Samuel Kipchoge", submitted: 289, denied: 52, denialRate: 18.0, avgAmount: 8900 },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">SHA performance since October 2024 transition</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm px-4 py-2 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Board PDF
          </button>
        </div>
      </div>

      {/* Monthly performance */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Monthly Claims Performance</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={MONTHLY_DATA} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <Tooltip formatter={(v: number) => v.toLocaleString()} />
            <Legend />
            <Bar dataKey="submitted" name="Submitted" fill="#0d9488" radius={[4, 4, 0, 0]} />
            <Bar dataKey="paid" name="Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="denied" name="Denied" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Denial rate trend */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Denial Rate Trend</h2>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
              <TrendingDown className="w-4 h-4" />
              -2.3pp since Oct
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={DENIAL_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip formatter={(v: number) => [`${v}%`, "Denial rate"]} />
              <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Provider performance */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Provider Performance</h2>
          <div className="space-y-4">
            {PROVIDER_PERF.map((p) => (
              <div key={p.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-900">{p.name}</span>
                  <span className={`font-semibold ${p.denialRate > 17 ? "text-red-600" : "text-emerald-600"}`}>
                    {p.denialRate}% denial rate
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs text-slate-400">
                  <div>
                    <div className="font-semibold text-slate-700">{p.submitted}</div>
                    <div>Claims submitted</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700">{p.denied}</div>
                    <div>Denied</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700">{formatKes(p.avgAmount)}</div>
                    <div>Avg claim value</div>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full">
                  <div
                    className={`h-full rounded-full ${p.denialRate > 17 ? "bg-red-400" : "bg-emerald-400"}`}
                    style={{ width: `${p.denialRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Revenue Summary (Oct 2024 – May 2026)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Submitted", value: formatKes(MONTHLY_DATA.reduce((s, m) => s + m.value, 0)), up: true },
            { label: "Total Paid", value: formatKes(MONTHLY_DATA.reduce((s, m) => s + (m.value * 0.78), 0)), up: true },
            { label: "Total Denied", value: formatKes(MONTHLY_DATA.reduce((s, m) => s + (m.value * 0.19), 0)), up: false },
            { label: "Collection Rate", value: "78.3%", up: true },
          ].map((s) => (
            <div key={s.label} className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-2xl font-bold text-slate-900 mb-1">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
