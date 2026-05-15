"use client";

import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, DollarSign, FileCheck,
  Clock, AlertTriangle, Activity, ArrowUpRight,
  Sparkles, ChevronRight, Zap,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { AnimatedNumber, StaggerChildren, StaggerItem, FadeIn } from "@/components/ui/motion";
import { useAuthStore } from "@/lib/auth-store";
import Link from "next/link";

const areaData = [
  { day: "Mon", submitted: 24, paid: 18 }, { day: "Tue", submitted: 31, paid: 22 },
  { day: "Wed", submitted: 28, paid: 25 }, { day: "Thu", submitted: 42, paid: 31 },
  { day: "Fri", submitted: 38, paid: 29 }, { day: "Sat", submitted: 15, paid: 12 },
  { day: "Sun", submitted: 11, paid: 9  }, { day: "Mon", submitted: 35, paid: 28 },
  { day: "Tue", submitted: 44, paid: 35 }, { day: "Wed", submitted: 39, paid: 30 },
  { day: "Thu", submitted: 51, paid: 42 }, { day: "Fri", submitted: 47, paid: 38 },
  { day: "Sat", submitted: 19, paid: 16 }, { day: "Today", submitted: 22, paid: 17 },
];

const denialData = [
  { name: "Missing info", value: 35, color: "#ef4444" },
  { name: "Wrong code",   value: 28, color: "#f59e0b" },
  { name: "Eligibility",  value: 20, color: "#8b5cf6" },
  { name: "Duplicate",    value: 10, color: "#3b82f6" },
  { name: "Other",        value: 7,  color: "#6b7280" },
];

const agingData = [
  { bucket: "0–30d",  amount: 1240000 },
  { bucket: "31–60d", amount: 890000  },
  { bucket: "61–90d", amount: 560000  },
  { bucket: "91–120d",amount: 320000  },
  { bucket: "120d+",  amount: 180000  },
];

const pipelineData = [
  { stage: "Encounters", value: 47, color: "#64748b" },
  { stage: "Coded",      value: 38, color: "#8b5cf6" },
  { stage: "Submitted",  value: 31, color: "#3b82f6" },
  { stage: "In Review",  value: 19, color: "#f59e0b" },
  { stage: "Paid",       value: 14, color: "#10b981" },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const tooltipStyle = {
  contentStyle: {
    background: "#0c1628",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    fontSize: "12px",
    color: "#f0f4ff",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  cursor: { stroke: "rgba(20,184,166,0.3)", strokeWidth: 1 },
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  const kpis = [
    {
      label: "Claims This Month", value: 284, change: 12.4,
      prefix: "", suffix: "", icon: FileCheck,
      accent: "#14b8a6", iconBg: "rgba(20,184,166,0.1)", iconClass: "text-teal-400",
      sparkline: [18,24,21,28,32,29,35,31,38,42,37,44],
    },
    {
      label: "Value Submitted", value: 4.82, change: 8.7,
      prefix: "KES ", suffix: "M", decimals: 2, icon: DollarSign,
      accent: "#3b82f6", iconBg: "rgba(59,130,246,0.1)", iconClass: "text-blue-400",
      sparkline: [2.1,2.8,3.0,2.9,3.5,3.2,3.8,4.0,4.2,4.5,4.7,4.82],
    },
    {
      label: "Value Paid", value: 3.61, change: 5.2,
      prefix: "KES ", suffix: "M", decimals: 2, icon: TrendingUp,
      accent: "#10b981", iconBg: "rgba(16,185,129,0.1)", iconClass: "text-emerald-400",
      sparkline: [1.4,1.9,2.1,2.0,2.5,2.3,2.7,2.9,3.0,3.2,3.4,3.61],
    },
    {
      label: "Denial Rate", value: 18.4, change: -3.1,
      prefix: "", suffix: "%", decimals: 1, icon: AlertTriangle,
      accent: "#f59e0b", iconBg: "rgba(245,158,11,0.1)", iconClass: "text-amber-400",
      invertTrend: true,
      sparkline: [24,23,22,21,21,20,19,20,19,18.9,18.6,18.4],
    },
    {
      label: "Avg Days to Pay", value: 42, change: -6,
      prefix: "", suffix: "d", icon: Clock,
      accent: "#8b5cf6", iconBg: "rgba(139,92,246,0.1)", iconClass: "text-violet-400",
      invertTrend: true,
      sparkline: [52,50,49,48,47,46,48,45,44,43,42,42],
    },
    {
      label: "Queue Depth", value: 37, change: -4,
      prefix: "", suffix: "", icon: Activity,
      accent: "#06b6d4", iconBg: "rgba(6,182,212,0.1)", iconClass: "text-cyan-400",
      invertTrend: true,
      sparkline: [44,42,40,41,39,40,38,40,39,38,37,37],
    },
  ];

  return (
    <div className="p-5 space-y-5 min-h-full mesh-gradient">

      {/* ── Greeting + SHA status ── */}
      <FadeIn>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-500 text-xs font-medium mb-1 tracking-wider uppercase">
              {new Date().toLocaleDateString("en-KE", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="font-display text-2xl font-bold text-white leading-tight">
              {greeting()},{" "}
              <span className="gradient-text">{user?.name.split(" ")[0]}</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              <span style={{ color: "var(--accent-teal)" }}>{user?.facilityName}</span>
              {" · "}Revenue Cycle Dashboard
            </p>
          </div>

          <div className="hidden md:flex flex-col items-end gap-2">
            <motion.div whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium"
              style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.18)", color: "#2dd4bf" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 pulse-dot" />
              SHA Portal Live
            </motion.div>
            <motion.div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)", color: "#4ade80" }}>
              <Sparkles className="w-3 h-3" />
              AI Coder Active
            </motion.div>
          </div>
        </div>
      </FadeIn>

      {/* ── SHA Claim Pipeline ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-xs font-semibold text-slate-300 font-display tracking-wide uppercase">Today's Pipeline</span>
          </div>
          <Link href="/claims" className="text-xs text-teal-500 hover:text-teal-300 flex items-center gap-1 transition-colors">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex items-center gap-1.5">
          {pipelineData.map((stage, i) => (
            <div key={stage.stage} className="flex-1 group cursor-default">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500 truncate">{stage.stage}</span>
                <span className="text-xs font-bold tabular-nums" style={{ color: stage.color }}>{stage.value}</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stage.value / pipelineData[0].value) * 100}%` }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                  className="h-full rounded-full"
                  style={{ background: stage.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <StaggerChildren className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
        {kpis.map((k) => {
          const positive = k.invertTrend ? k.change < 0 : k.change > 0;
          return (
            <StaggerItem key={k.label}>
              <motion.div
                whileHover={{ y: -2, boxShadow: `0 12px 40px rgba(0,0,0,0.45), 0 0 0 1px ${k.accent}28` }}
                transition={{ duration: 0.18 }}
                className="glass-card p-4 relative overflow-hidden cursor-default"
              >
                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-[0.07] pointer-events-none"
                     style={{ background: k.accent, transform: "translate(35%,-35%)" }} />

                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: k.iconBg }}>
                    <k.icon className={`w-4 h-4 ${k.iconClass}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full
                    ${positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(k.change)}{k.suffix === "%" ? "pp" : "%"}
                  </div>
                </div>

                <div className="relative z-10">
                  <p className="text-slate-500 text-xs font-medium mb-1 leading-tight">{k.label}</p>
                  <p className="font-display text-2xl font-bold text-white leading-none tabular-nums">
                    {k.prefix}<AnimatedNumber value={k.value} decimals={(k as { decimals?: number }).decimals ?? 0} />{k.suffix}
                  </p>
                </div>

                {/* Mini sparkline */}
                <div className="mt-3 relative z-10" style={{ height: 28 }}>
                  <ResponsiveContainer width="100%" height={28}>
                    <AreaChart data={k.sparkline.map((v, i) => ({ v, i }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`spark-${k.label.replace(/\s/g,'')}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={k.accent} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={k.accent} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone" dataKey="v"
                        stroke={k.accent} strokeWidth={1.5}
                        fill={`url(#spark-${k.label.replace(/\s/g,'')})`}
                        dot={false} animationDuration={1200}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerChildren>

      {/* ── Revenue River + Denial Ring ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
          className="glass-card p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-semibold text-white text-base">Revenue River</h3>
              <p className="text-slate-500 text-xs mt-0.5">14-day — submitted vs paid</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-0.5 rounded-full" style={{ background: "#14b8a6" }} />Submitted
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-0.5 rounded-full" style={{ background: "#3b82f6" }} />Paid
              </span>
              <ArrowUpRight className="w-4 h-4 text-teal-500" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={188}>
            <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.035)" />
              <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 10, fontFamily: "var(--font-body)" }}
                     axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 10, fontFamily: "var(--font-body)" }}
                     axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="submitted" stroke="#14b8a6" strokeWidth={1.8}
                    fill="url(#gs)" name="Submitted" dot={false} animationDuration={1200} />
              <Area type="monotone" dataKey="paid" stroke="#3b82f6" strokeWidth={1.8}
                    fill="url(#gp)" name="Paid" dot={false} animationDuration={1400} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
          className="glass-card p-5"
        >
          <h3 className="font-display font-semibold text-white text-base mb-0.5">Denial Reasons</h3>
          <p className="text-slate-500 text-xs mb-3">This month · 18.4% overall</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={denialData} cx="50%" cy="50%" innerRadius={36} outerRadius={56}
                   paddingAngle={3} dataKey="value" animationBegin={400} animationDuration={900}>
                {denialData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {denialData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="text-slate-300 font-semibold tabular-nums">{d.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── A/R Aging ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-semibold text-white text-base">A/R Aging</h3>
            <p className="text-slate-500 text-xs mt-0.5">Outstanding receivables by age bucket</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.18)" }}>
              KES 3.19M total
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.18)" }}>
              KES 500K at risk
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={148}>
          <BarChart data={agingData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="bg-aging" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#14b8a6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#0891b2" stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="bg-aging-risk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.035)" />
            <XAxis dataKey="bucket" tick={{ fill: "#475569", fontSize: 10, fontFamily: "var(--font-body)" }}
                   axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#475569", fontSize: 10, fontFamily: "var(--font-body)" }}
                   axisLine={false} tickLine={false}
                   tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
            <Tooltip
              formatter={(v: number | string) => [`KES ${Number(v).toLocaleString()}`, "Amount"]}
              {...tooltipStyle}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} animationDuration={1100}
                 fill="url(#bg-aging)"
                 label={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── AI insights strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        {[
          { icon: Sparkles, color: "#14b8a6", bg: "rgba(20,184,166,0.08)", border: "rgba(20,184,166,0.2)", label: "AI Recommendation", text: "3 claims flagged for missing lab reports — attach before submission to improve acceptance rate." },
          { icon: TrendingUp, color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", label: "Revenue Opportunity", text: "KES 284,000 in coded encounters awaiting claim generation. Run AI coder on 4 pending encounters." },
          { icon: AlertTriangle, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", label: "Action Required", text: "2 SHA denials with appeal deadline in 7 days. Access Denials queue to generate appeal letters." },
        ].map((insight, i) => (
          <motion.div key={i} whileHover={{ y: -1 }} transition={{ duration: 0.15 }}
            className="rounded-xl p-4 cursor-default"
            style={{ background: insight.bg, border: `1px solid ${insight.border}` }}>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ background: `${insight.color}15` }}>
                <insight.icon className="w-3.5 h-3.5" style={{ color: insight.color }} />
              </div>
              <div>
                <p className="text-xs font-semibold mb-1 font-display" style={{ color: insight.color }}>{insight.label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{insight.text}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
