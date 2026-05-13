"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowRight, Shield, Zap, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const STATS = [
  { icon: TrendingUp, label: "Claims recovered",  value: "KES 2.4B+" },
  { icon: Zap,        label: "Avg processing",    value: "< 25 min"  },
  { icon: Shield,     label: "Denial reduction",  value: "up to 40%" },
];

const DEMO_USERS = [
  { email: "wanjiku@aiclitein.or.ke",  role: "Biller",   color: "#14b8a6" },
  { email: "manager@aiclitein.or.ke",  role: "Manager",  color: "#3b82f6" },
  { email: "admin@uzimatek.co.ke",     role: "Admin",    color: "#8b5cf6" },
];

export default function LoginPage() {
  const router   = useRouter();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.login(email, password);
      setAuth(res.user, res.accessToken, res.refreshToken);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>

      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden flex-col justify-between p-12"
           style={{ background: "linear-gradient(135deg,#060b18 0%,#081428 60%,#0a1a2e 100%)" }}>
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-3xl"
               style={{ background: "radial-gradient(circle,rgba(20,184,166,0.12),transparent 70%)" }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full blur-3xl"
               style={{ background: "radial-gradient(circle,rgba(8,145,178,0.1),transparent 70%)" }} />
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
               style={{ background: "linear-gradient(135deg,#2dd4bf,#0891b2)", boxShadow: "0 0 20px rgba(20,184,166,0.4)" }}>
            <span className="text-white font-black text-lg">U</span>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">Uzimatek</p>
            <p className="text-xs" style={{ color: "var(--accent-teal)" }}>Health Kenya</p>
          </div>
        </motion.div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}>
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--accent-teal)" }}>
              SHA Claims Management
            </p>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Stop leaving money<br />
              <span className="gradient-text">on the table.</span>
            </h1>
            <p className="text-slate-400 mt-4 text-lg leading-relaxed max-w-md">
              AI-powered revenue cycle management built for Kenya&apos;s SHA/SHIF transition. 
              Reduce denials, accelerate payments.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-3 gap-4">
            {STATS.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="rounded-2xl p-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <s.icon className="w-5 h-5 text-teal-400 mb-2" />
                <p className="text-white font-bold text-lg leading-none">{s.value}</p>
                <p className="text-slate-500 text-xs mt-1">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonial */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="rounded-2xl p-5"
            style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.15)" }}>
            <p className="text-slate-300 text-sm italic leading-relaxed">
              &quot;Uzimatek cut our SHA claim rejection rate from 34% to 9% in three months. 
              The AI coding is remarkably accurate for Kenyan protocols.&quot;
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                   style={{ background: "linear-gradient(135deg,#14b8a6,#0891b2)" }}>G</div>
              <div>
                <p className="text-white text-sm font-medium">Dr. Grace Otieno</p>
                <p className="text-slate-500 text-xs">Medical Director, AIC Litein</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-slate-600 text-xs relative z-10">
          © 2026 Uzimatek Health Kenya. Secure · HIPAA-aligned · SHA-compliant
        </motion.p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8"
           style={{ background: "var(--bg-secondary)" }}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg,#2dd4bf,#0891b2)" }}>
              <span className="text-white font-black">U</span>
            </div>
            <p className="text-white font-bold text-lg">Uzimatek</p>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-8">Sign in to your SHA claims dashboard</p>

          {/* Demo credentials */}
          <div className="rounded-xl p-4 mb-6" style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.15)" }}>
            <p className="text-xs font-semibold text-teal-400 mb-3 uppercase tracking-wider">Demo Accounts</p>
            <div className="space-y-2">
              {DEMO_USERS.map((u) => (
                <button key={u.email} type="button"
                  onClick={() => { setEmail(u.email); setPassword("Demo@2026!"); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all hover:scale-[1.01]"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-slate-300 truncate">{u.email}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2"
                        style={{ background: `${u.color}20`, color: u.color, border: `1px solid ${u.color}40` }}>
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-2">Password: <span className="text-slate-400">Demo@2026!</span></p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@hospital.co.ke"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--text-primary)",
                  ["--tw-ring-color" as string]: "rgba(20,184,166,0.5)",
                }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--text-primary)",
                  }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 px-4 py-3 rounded-xl"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </motion.div>
            )}

            <motion.button type="submit" disabled={loading}
              whileHover={loading ? {} : { scale: 1.01 }}
              whileTap={loading ? {} : { scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              style={{
                background: loading ? "rgba(20,184,166,0.5)" : "linear-gradient(135deg,#14b8a6,#0891b2)",
                color: "white",
                boxShadow: loading ? "none" : "0 0 20px rgba(20,184,166,0.3)",
              }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <><span>Sign in to Dashboard</span><ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-6">
            New facility?{" "}
            <Link href="/register" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
              Register here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
