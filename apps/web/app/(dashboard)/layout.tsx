"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileText, Stethoscope, XCircle,
  BarChart3, Building2, CreditCard, ShieldCheck,
  LogOut, Bell, Search, Activity, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/claims",     label: "Claims",      icon: FileText,    badge: "12" },
  { href: "/encounters", label: "Encounters",  icon: Stethoscope },
  { href: "/denials",    label: "Denials",     icon: XCircle,     badge: "8", badgeRed: true },
  { href: "/reports",    label: "Reports",     icon: BarChart3 },
  { href: "/facility",   label: "Facility",    icon: Building2 },
  { href: "/billing",    label: "Billing",     icon: CreditCard },
  { href: "/admin",      label: "Admin",       icon: ShieldCheck, roles: ["manager", "facility_admin", "super_admin"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("uzimatek-auth");
    if (!stored) { router.push("/login"); return; }
    try {
      const { state } = JSON.parse(stored);
      if (!state?.accessToken) { router.push("/login"); return; }
    } catch { router.push("/login"); return; }
    setReady(true);
  }, [router]);

  if (!ready || !user) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
               style={{ background: "linear-gradient(135deg,#2dd4bf,#0891b2)" }}>
            <span className="text-white font-black text-sm">U</span>
          </div>
          <span className="text-slate-400 text-sm font-medium">Loading…</span>
        </motion.div>
      </div>
    );
  }

  const visibleNav = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user.role));
  const pageTitle  = pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "dashboard";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-64 flex flex-col flex-shrink-0 relative z-10"
        style={{
          background: "linear-gradient(180deg,#060b18 0%,#081020 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 px-5 py-5 group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg,#2dd4bf 0%,#0891b2 100%)",
              boxShadow: "0 0 16px rgba(20,184,166,0.4)",
            }}
          >
            <span className="text-white font-black text-base">U</span>
          </motion.div>
          <div className="min-w-0">
            <p className="text-white font-bold text-base leading-none">Uzimatek</p>
            <p className="text-xs mt-0.5 truncate max-w-[140px]" style={{ color: "var(--accent-teal)" }}>
              {user.facilityName}
            </p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto scrollbar-none">
          {visibleNav.map((item, i) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                    isActive ? "text-white" : "text-slate-400 hover:text-white"
                  )}
                  style={isActive ? {
                    background: "linear-gradient(135deg,rgba(20,184,166,0.15),rgba(8,145,178,0.08))",
                    border: "1px solid rgba(20,184,166,0.2)",
                  } : {}}
                >
                  {!isActive && (
                    <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ background: "rgba(255,255,255,0.04)" }} />
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                      style={{ background: "var(--accent-teal)" }}
                    />
                  )}
                  <item.icon className={cn("w-4 h-4 flex-shrink-0 relative z-10", isActive && "text-teal-400")} />
                  <span className="flex-1 relative z-10">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full font-semibold relative z-10",
                      item.badgeRed ? "bg-red-500/20 text-red-400" : "bg-teal-500/20 text-teal-400"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* SHA Live status */}
        <div className="px-4 py-3 mx-3 mb-3 rounded-xl" style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.12)" }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 pulse-dot" />
            <span className="text-xs text-teal-400 font-medium">SHA Portal Live</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">95% submission success</p>
        </div>

        {/* User */}
        <div className="px-3 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3 px-3 pt-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                 style={{ background: "linear-gradient(135deg,#14b8a6,#0891b2)" }}>
              <span className="text-white text-sm font-bold">{user.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs capitalize" style={{ color: "var(--accent-teal)" }}>
                {user.role.replace(/_/g, " ")}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { logout(); router.push("/login"); }}
              className="p-1.5 rounded-lg transition-colors text-slate-500 hover:text-red-400"
              style={{ background: "rgba(255,255,255,0.04)" }}
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <motion.header
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center gap-4 px-6 py-3.5 flex-shrink-0"
          style={{
            background: "rgba(6,11,24,0.8)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm">
            <Activity className="w-3.5 h-3.5 text-teal-500" />
            {pathname.split("/").filter(Boolean).map((seg, i, arr) => (
              <span key={seg} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                <span className={i === arr.length - 1 ? "text-slate-200 font-medium capitalize" : "text-slate-500 capitalize"}>
                  {seg.replace(/-/g, " ")}
                </span>
              </span>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              placeholder="Search patients, claims…"
              className="pl-8 pr-4 py-2 text-sm rounded-lg w-52 focus:outline-none focus:ring-1 focus:w-64 transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Bell */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Bell className="w-4 h-4 text-slate-400" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </motion.button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
               style={{ background: "linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow: "0 0 10px rgba(20,184,166,0.3)" }}>
            <span className="text-white text-sm font-bold">{user.name.charAt(0)}</span>
          </div>
        </motion.header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-none" style={{ background: "var(--bg-primary)" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
