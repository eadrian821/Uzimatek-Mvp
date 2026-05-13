"use client";

import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, DollarSign, FileCheck,
  Clock, AlertTriangle, Activity, ArrowUpRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { AnimatedNumber, StaggerChildren, StaggerItem, FadeIn } from "@/components/ui/motion";
import { useAuthStore } from "@/lib/auth-store";

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
  { bucket: "0-30d",   amount: 1240000 }, { bucket: "31-60d",  amount: 890000  },
  { bucket: "61-90d",  amount: 560000  }, { bucket: "91-120d", amount: 320000  },
  { bucket: "120d+",   amount: 180000  },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const kpis = [
    { label: "Claims This Month", value: 284, change: 12.4, prefix: "", suffix: "", icon: FileCheck, accent: "#14b8a6", iconBg: "rgba(20,184,166,0.1)", iconClass: "text-teal-400" },
    { label: "Value Submitted",   value: 4.82, change: 8.7, prefix: "KES ", suffix: "M", decimals: 2, icon: DollarSign, accent: "#3b82f6", iconBg: "rgba(59,130,246,0.1)", iconClass: "text-blue-400" },
    { label: "Value Paid",        value: 3.61, change: 5.2, prefix: "KES ", suffix: "M", decimals: 2, icon: TrendingUp, accent: "#10b981", iconBg: "rgba(16,185,129,0.1)", iconClass: "text-emerald-400" },
    { label: "Denial Rate",       value: 18.4, change: -3.1, prefix: "", suffix: "%", decimals: 1, icon: AlertTriangle, accent: "#f59e0b", iconBg: "rgba(245,158,11,0.1)", iconClass: "text-amber-400", invertTrend: true },
    { label: "Avg Days to Pay",   value: 42, change: -6, prefix: "", suffix: "d", icon: Clock, accent: "#8b5cf6", iconBg: "rgba(139,92,246,0.1)", iconClass: "text-violet-400", invertTrend: true },
    { label: "Queue Depth",       value: 37, change: -4, prefix: "", suffix: "", icon: Activity, accent: "#06b6d4", iconBg: "rgba(6,182,212,0.1)", iconClass: "text-cyan-400", invertTrend: true },
  ];

  return (
    <div className="p-6 space-y-6 min-h-full mesh-gradient">
      {/* Greeting */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {greeting()}, <span className="gradient-text">{user?.name.split(" ")[0]}</span> 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              {" · "}<span className="text-teal-400">{user?.facilityName}</span>
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "#2dd4bf" }}>
            <span className="w-2 h-2 rounded-full bg-teal-400 pulse-dot" />
            SHA Portal: Live
          </motion.div>
        </div>
      </FadeIn>

      {/* KPI Cards */}
      <StaggerChildren className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k) => {
          const positive = k.invertTrend ? k.change < 0 : k.change > 0;
          return (
            <StaggerItem key={k.label}>
              <motion.div
                whileHover={{ y: -3, boxShadow: `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${k.accent}33` }}
                transition={{ duration: 0.2 }}
                className="glass-card p-5 relative overflow-hidden cursor-default"
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-10 pointer-events-none"
                     style={{ background: k.accent, transform: "translate(40%,-40%)" }} />
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: k.iconBg }}>
                    <k.icon className={`w-4 h-4 ${k.iconClass}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                    {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(k.change)}%
                  </div>
                </div>
                <div className="relative z-10">
                  <p className="text-slate-400 text-xs font-medium mb-1">{k.label}</p>
                  <p className="text-2xl font-bold text-white leading-none">
                    {k.prefix}<AnimatedNumber value={k.value} decimals={k.decimals ?? 0} />{k.suffix}
                  </p>
                </div>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerChildren>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-white font-semibold">Claims Volume</h3>
              <p className="text-slate-500 text-xs mt-0.5">14-day — submitted vs paid</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-teal-500" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "12px" }} />
              <Area type="monotone" dataKey="submitted" stroke="#14b8a6" strokeWidth={2} fill="url(#gs)" name="Submitted" dot={false} animationDuration={1200} />
              <Area type="monotone" dataKey="paid"      stroke="#3b82f6" strokeWidth={2} fill="url(#gp)" name="Paid"      dot={false} animationDuration={1400} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="glass-card p-5">
          <h3 className="text-white font-semibold mb-1">Denial Reasons</h3>
          <p className="text-slate-500 text-xs mb-3">This month</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={denialData} cx="50%" cy="50%" innerRadius={38} outerRadius={60}
                   paddingAngle={3} dataKey="value" animationBegin={400} animationDuration={1000}>
                {denialData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {denialData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="text-slate-300 font-medium">{d.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* A/R Aging */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="glass-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-semibold">A/R Aging</h3>
            <p className="text-slate-500 text-xs mt-0.5">Outstanding receivables by age bucket</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
            Total: KES 3.19M
          </span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={agingData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#14b8a6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#0891b2" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="bucket" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false}
                   tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
            <Tooltip
              formatter={(v: number | string) => [`KES ${Number(v).toLocaleString()}`, "Amount"]}
              contentStyle={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "12px" }}
            />
            <Bar dataKey="amount" fill="url(#bg)" radius={[4, 4, 0, 0]} animationDuration={1200} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
