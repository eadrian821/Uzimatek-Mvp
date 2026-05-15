"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileText, Stethoscope, XCircle,
  BarChart3, Building2, CreditCard, ShieldCheck,
  LogOut, Bell, Search, Activity, ChevronRight,
  Ambulance, Command, Zap, TrendingUp,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",       icon: LayoutDashboard },
  { href: "/claims",     label: "Claims",           icon: FileText,   badge: "12" },
  { href: "/encounters", label: "MyUzimaClinical",  icon: Stethoscope },
  { href: "/referrals",  label: "UzimaReferral",    icon: Ambulance,  badge: "2", badgeRed: true, badgePulse: true },
  { href: "/denials",    label: "Denials",          icon: XCircle,    badge: "8", badgeRed: true },
  { href: "/reports",    label: "Reports",          icon: BarChart3 },
  { href: "/facility",   label: "Facility",         icon: Building2 },
  { href: "/billing",    label: "Billing",          icon: CreditCard },
  { href: "/admin",      label: "Admin",            icon: ShieldCheck, roles: ["manager", "facility_admin", "super_admin"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router    = useRouter();
  const pathname  = usePathname();
  const { user, logout } = useAuthStore();
  const [ready, setReady]       = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [cmdOpen, setCmdOpen]   = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("uzimatek-auth");
    if (!stored) { router.push("/login"); return; }
    try {
      const { state } = JSON.parse(stored);
      if (!state?.accessToken) { router.push("/login"); return; }
    } catch { router.push("/login"); return; }
    setReady(true);
  }, [router]);

  // Cmd+K command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const openSidebar  = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setExpanded(true); };
  const closeSidebar = () => { closeTimer.current = setTimeout(() => setExpanded(false), 80); };

  if (!ready || !user) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: "linear-gradient(135deg,#2dd4bf,#0891b2)", boxShadow: "0 0 20px rgba(20,184,166,0.4)" }}>
            <span className="text-white font-black text-sm font-display">U</span>
          </div>
          <span className="text-slate-400 text-sm">Loading…</span>
        </motion.div>
      </div>
    );
  }

  const visibleNav = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user.role));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>

      {/* ── Hover-expand Sidebar ─────────────────────────────── */}
      <motion.aside
        animate={{ width: expanded ? 260 : 72 }}
        transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
        onMouseEnter={openSidebar}
        onMouseLeave={closeSidebar}
        className="flex flex-col flex-shrink-0 relative z-20 overflow-hidden"
        style={{
          background: "linear-gradient(180deg,#070d1e 0%,#060b18 100%)",
          borderRight: "1px solid rgba(255,255,255,0.055)",
          minWidth: 72,
        }}
      >
        {/* Logo mark */}
        <Link href="/dashboard" className="flex items-center px-4 py-5 gap-3 overflow-hidden flex-shrink-0">
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg,#2dd4bf 0%,#0891b2 100%)",
              boxShadow: "0 0 16px rgba(20,184,166,0.45), 0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            <span className="text-white font-black text-base font-display">U</span>
          </motion.div>
          <span
            className="whitespace-nowrap overflow-hidden font-display font-bold text-white text-base leading-none"
            style={{
              opacity: expanded ? 1 : 0,
              maxWidth: expanded ? 180 : 0,
              transition: "opacity 0.18s ease, max-width 0.22s cubic-bezier(0.4,0,0.2,1)",
              transitionDelay: expanded ? "0.06s" : "0s",
            }}
          >
            Uzimatek
            <span className="block text-xs font-normal mt-0.5 truncate max-w-[140px]"
                  style={{ color: "var(--accent-teal)", fontFamily: "var(--font-body)" }}>
              {user.facilityName}
            </span>
          </span>
        </Link>

        {/* Nav items */}
        <nav className="flex-1 px-2.5 py-1 space-y-0.5 overflow-y-auto scrollbar-none">
          {visibleNav.map((item, i) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.035, duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              >
                <Link
                  href={item.href}
                  title={!expanded ? item.label : undefined}
                  className={cn(
                    "relative flex items-center rounded-xl text-sm font-medium transition-colors group overflow-hidden",
                    isActive ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  )}
                  style={{
                    padding: expanded ? "10px 12px" : "10px",
                    justifyContent: expanded ? "flex-start" : "center",
                    background: isActive ? "linear-gradient(135deg,rgba(20,184,166,0.14),rgba(8,145,178,0.07))" : undefined,
                    border: isActive ? "1px solid rgba(20,184,166,0.18)" : "1px solid transparent",
                    transition: "padding 0.22s cubic-bezier(0.4,0,0.2,1), justify-content 0.2s, background 0.15s, border-color 0.15s",
                  }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ background: "var(--accent-teal)" }}
                    />
                  )}

                  <item.icon className={cn("w-4 h-4 flex-shrink-0 relative z-10", isActive ? "text-teal-400" : "")} />

                  {/* Label - CSS-driven, no per-item Framer */}
                  <span
                    className="whitespace-nowrap overflow-hidden font-medium relative z-10"
                    style={{
                      marginLeft: expanded ? 10 : 0,
                      maxWidth: expanded ? 150 : 0,
                      opacity: expanded ? 1 : 0,
                      transition: "max-width 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.16s ease, margin-left 0.22s",
                      transitionDelay: expanded ? "0.05s" : "0s",
                    }}
                  >
                    {item.label}
                  </span>

                  {/* Badge */}
                  {item.badge && (
                    <span
                      className={cn(
                        "ml-auto flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-semibold relative z-10",
                        item.badgeRed ? "bg-red-500/20 text-red-400" : "bg-teal-500/20 text-teal-400"
                      )}
                      style={{
                        opacity: expanded ? 1 : 0,
                        maxWidth: expanded ? 40 : 0,
                        overflow: "hidden",
                        transition: "opacity 0.15s, max-width 0.22s",
                        transitionDelay: expanded ? "0.08s" : "0s",
                      }}
                    >
                      {(item as { badgePulse?: boolean }).badgePulse && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 pulse-dot flex-shrink-0" />
                      )}
                      {item.badge}
                    </span>
                  )}

                  {/* Collapsed badge dot */}
                  {item.badge && !expanded && item.badgeRed && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* SHA Portal status */}
        <div
          className="mx-2.5 mb-2.5 rounded-xl overflow-hidden flex-shrink-0"
          style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.12)" }}
        >
          <div
            className="flex items-center overflow-hidden"
            style={{ padding: expanded ? "10px 12px" : "10px", justifyContent: expanded ? "flex-start" : "center" }}
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 pulse-dot flex-shrink-0" />
            <span
              className="text-teal-400 text-xs font-medium whitespace-nowrap overflow-hidden"
              style={{
                marginLeft: expanded ? 8 : 0,
                maxWidth: expanded ? 160 : 0,
                opacity: expanded ? 1 : 0,
                transition: "max-width 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.16s, margin-left 0.22s",
                transitionDelay: expanded ? "0.07s" : "0s",
              }}
            >
              SHA Portal Live · 95%
            </span>
          </div>
        </div>

        {/* User profile */}
        <div
          className="px-2.5 pb-3 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.055)" }}
        >
          <div
            className="flex items-center overflow-hidden pt-3"
            style={{ gap: expanded ? 10 : 0, justifyContent: expanded ? "flex-start" : "center" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
              style={{ background: "linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow: "0 0 10px rgba(20,184,166,0.28)" }}
            >
              {user.name.charAt(0)}
            </div>
            <div
              className="flex-1 min-w-0 overflow-hidden"
              style={{
                maxWidth: expanded ? 140 : 0,
                opacity: expanded ? 1 : 0,
                transition: "max-width 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.16s",
                transitionDelay: expanded ? "0.07s" : "0s",
              }}
            >
              <p className="text-white text-xs font-semibold truncate">{user.name}</p>
              <p className="text-xs capitalize truncate" style={{ color: "var(--accent-teal)" }}>
                {user.role.replace(/_/g, " ")}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => { logout(); router.push("/login"); }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
              style={{
                background: "rgba(255,255,255,0.04)",
                opacity: expanded ? 1 : 0,
                pointerEvents: expanded ? "auto" : "none",
                transition: "opacity 0.15s",
              }}
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* ── Main area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <motion.header
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.32, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
          style={{
            background: "rgba(6,11,24,0.85)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            borderBottom: "1px solid rgba(255,255,255,0.055)",
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <Activity className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
            {pathname.split("/").filter(Boolean).map((seg, i, arr) => (
              <span key={seg} className="flex items-center gap-1.5 min-w-0">
                {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
                <span className={cn(
                  "capitalize truncate",
                  i === arr.length - 1
                    ? "text-slate-200 font-semibold font-display"
                    : "text-slate-500"
                )}>
                  {seg.replace(/-/g, " ")}
                </span>
              </span>
            ))}
          </div>

          <div className="flex-1" />

          {/* Cmd+K trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#64748b",
            }}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs">Search…</span>
            <span className="flex items-center gap-0.5 text-xs ml-2" style={{ color: "#475569" }}>
              <Command className="w-3 h-3" />K
            </span>
          </button>

          {/* Bell */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="relative p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Bell className="w-4 h-4 text-slate-400" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </motion.button>

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow: "var(--shadow-teal-sm)" }}
          >
            {user.name.charAt(0)}
          </div>
        </motion.header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-none" style={{ background: "var(--bg-primary)" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Command palette overlay ──────────────────────────── */}
      <AnimatePresence>
        {cmdOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]"
            style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
            onClick={() => setCmdOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: -8, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(180deg,#0d1526,#060b18)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "var(--shadow-float)",
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <input
                  autoFocus
                  placeholder="Search patients, claims, encounters…"
                  className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
                />
                <kbd className="text-xs px-1.5 py-0.5 rounded text-slate-500" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Esc
                </kbd>
              </div>
              <div className="px-2 py-2">
                {[
                  { icon: TrendingUp, label: "Dashboard", sub: "Revenue overview", href: "/dashboard" },
                  { icon: FileText, label: "Claims Workbench", sub: "12 pending review", href: "/claims" },
                  { icon: Stethoscope, label: "MyUzimaClinical", sub: "Clinical encounters", href: "/encounters" },
                  { icon: Zap, label: "Denials Queue", sub: "8 active denials", href: "/denials" },
                ].map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    onClick={() => setCmdOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                         style={{ background: "rgba(20,184,166,0.1)" }}>
                      <item.icon className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.sub}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </Link>
                ))}
              </div>
              <div className="px-4 py-2.5 flex items-center gap-4 text-xs text-slate-600"
                   style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="flex items-center gap-1.5"><kbd className="px-1 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>↑↓</kbd>Navigate</span>
                <span className="flex items-center gap-1.5"><kbd className="px-1 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>↵</kbd>Open</span>
                <span className="flex items-center gap-1.5"><kbd className="px-1 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>Esc</kbd>Close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
