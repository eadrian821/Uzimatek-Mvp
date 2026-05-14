"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ambulance, MapPin, Clock, Heart, Activity, Plus, Phone,
  MessageSquare, CheckCircle2, AlertTriangle, ArrowRight,
  Zap, Building2, Wifi, Navigation, ChevronRight,
  Radio, Shield, Thermometer, Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FACILITIES = [
  { id: "f1", name: "AIC Litein Mission Hospital", short: "Litein", county: "Kericho", level: "4", inNetwork: true, x: 218, y: 212, home: true },
  { id: "f2", name: "Kenyatta National Hospital", short: "KNH", county: "Nairobi", level: "6", inNetwork: true, x: 385, y: 278 },
  { id: "f3", name: "Nakuru Level 5 Hospital", short: "Nakuru L5", county: "Nakuru", level: "5", inNetwork: true, x: 308, y: 172 },
  { id: "f4", name: "Moi Teaching & Referral", short: "MTRH", county: "Uasin Gishu", level: "6", inNetwork: true, x: 228, y: 108 },
  { id: "f5", name: "Kisumu County Hospital", short: "Kisumu CH", county: "Kisumu", level: "4", inNetwork: true, x: 152, y: 192 },
  { id: "f6", name: "Kericho County Hospital", short: "Kericho CH", county: "Kericho", level: "4", inNetwork: true, x: 240, y: 238 },
  { id: "f7", name: "Aga Khan Hospital Nairobi", short: "AKH NBI", county: "Nairobi", level: "5", inNetwork: false, x: 405, y: 295 },
  { id: "f8", name: "Nyeri County Referral", short: "Nyeri CR", county: "Nyeri", level: "4", inNetwork: true, x: 455, y: 162 },
  { id: "f9", name: "Kisii Teaching & Referral", short: "Kisii TR", county: "Kisii", level: "5", inNetwork: true, x: 182, y: 245 },
  { id: "f10", name: "Mombasa County Hospital", short: "Mombasa CH", county: "Mombasa", level: "5", inNetwork: false, x: 518, y: 318 },
];

const ROUTES = [
  { from: "f1", to: "f3" }, { from: "f1", to: "f2" }, { from: "f1", to: "f4" },
  { from: "f1", to: "f6" }, { from: "f3", to: "f2" }, { from: "f3", to: "f4" },
  { from: "f5", to: "f1" }, { from: "f5", to: "f4" }, { from: "f2", to: "f8" },
  { from: "f9", to: "f1" }, { from: "f6", to: "f3" }, { from: "f8", to: "f2" },
];

const MOCK_REFERRALS = [
  {
    id: "r1", priority: "emergency", status: "in_transit",
    patient: { name: "Peter Otieno", shaNumber: "SHA2024011111", age: 34, sex: "M" },
    sending: { id: "f1", name: "AIC Litein Mission Hospital", county: "Kericho" },
    receiving: { id: "f2", name: "Kenyatta National Hospital", county: "Nairobi" },
    diagnosis: "RTA — Polytrauma, Fracture Right Femur",
    departedAt: new Date(Date.now() - 28 * 60000).toISOString(),
    etaMinutes: 14,
    transportMode: "ambulance",
    vitals: { hr: 104, sbp: 88, dbp: 60, spo2: 94, gcs: 13, rr: 22 },
    updates: [
      { time: "14:32", text: "Patient stabilised, departed AIC Litein", type: "success" },
      { time: "14:38", text: "En route via A104 — Kericho–Nakuru highway", type: "info" },
      { time: "14:41", text: "Vitals: HR 104, BP 88/60, SpO2 94%", type: "warning" },
      { time: "14:50", text: "Passed Nakuru junction, ETA KNH 14 min", type: "info" },
    ],
    progress: 65, routeFrom: "f1", routeTo: "f2",
  },
  {
    id: "r2", priority: "urgent", status: "accepted",
    patient: { name: "Grace Wanjiku", shaNumber: "SHA2024022222", age: 28, sex: "F" },
    sending: { id: "f1", name: "AIC Litein Mission Hospital", county: "Kericho" },
    receiving: { id: "f3", name: "Nakuru Level 5 Hospital", county: "Nakuru" },
    diagnosis: "Eclampsia — 36 weeks gestation, seizures",
    departedAt: null, etaMinutes: null, transportMode: "ambulance",
    vitals: { hr: 118, sbp: 165, dbp: 105, spo2: 97, gcs: 14, rr: 18 },
    updates: [
      { time: "15:10", text: "Referral accepted by Nakuru L5 OBG team", type: "success" },
      { time: "15:12", text: "Ambulance dispatched from Kericho garage", type: "info" },
    ],
    progress: 10, routeFrom: "f1", routeTo: "f3",
  },
  {
    id: "r3", priority: "routine", status: "completed",
    patient: { name: "James Mwangi", shaNumber: "SHA2024033333", age: 56, sex: "M" },
    sending: { id: "f1", name: "AIC Litein Mission Hospital", county: "Kericho" },
    receiving: { id: "f4", name: "Moi Teaching & Referral Hospital", county: "Uasin Gishu" },
    diagnosis: "CKD Stage 4 — Specialist review & dialysis access",
    departedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    etaMinutes: 0, transportMode: "private",
    vitals: null,
    updates: [
      { time: "10:15", text: "Patient transferred successfully to MTRH Nephrology", type: "success" },
      { time: "10:16", text: "Discharge summary sent via UzimaLink", type: "success" },
    ],
    progress: 100, routeFrom: "f1", routeTo: "f4",
  },
  {
    id: "r4", priority: "urgent", status: "pending",
    patient: { name: "Amina Hassan", shaNumber: "SHA2024044444", age: 19, sex: "F" },
    sending: { id: "f1", name: "AIC Litein Mission Hospital", county: "Kericho" },
    receiving: { id: "f3", name: "Nakuru Level 5 Hospital", county: "Nakuru" },
    diagnosis: "Post-partum haemorrhage — failed conservative management",
    departedAt: null, etaMinutes: null, transportMode: "ambulance",
    vitals: { hr: 132, sbp: 74, dbp: 48, spo2: 91, gcs: 12, rr: 28 },
    updates: [
      { time: "15:48", text: "URGENT referral initiated — PPH uncontrolled", type: "warning" },
      { time: "15:49", text: "Awaiting acceptance from Nakuru L5 OBG", type: "info" },
    ],
    progress: 5, routeFrom: "f1", routeTo: "f3",
  },
];

const PRIORITY_CONFIG = {
  emergency: { label: "EMERGENCY", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", pulse: true },
  urgent:    { label: "URGENT",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", pulse: false },
  routine:   { label: "ROUTINE",   color: "#14b8a6", bg: "rgba(20,184,166,0.1)",  border: "rgba(20,184,166,0.2)", pulse: false },
};

const STATUS_CONFIG = {
  pending:    { label: "Awaiting Acceptance", color: "#94a3b8", icon: Clock },
  accepted:   { label: "Accepted — Preparing", color: "#3b82f6", icon: CheckCircle2 },
  in_transit: { label: "In Transit", color: "#14b8a6", icon: Ambulance },
  arrived:    { label: "Arrived", color: "#10b981", icon: MapPin },
  completed:  { label: "Completed", color: "#6b7280", icon: CheckCircle2 },
};

function VitalChip({ label, value, unit, warn }: { label: string; value: string | number; unit: string; warn?: boolean }) {
  return (
    <div className="flex-1 rounded-xl p-3 text-center"
         style={{ background: warn ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${warn ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.07)"}` }}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={cn("text-lg font-bold leading-none", warn ? "text-red-400" : "text-white")}>{value}</p>
      <p className="text-xs text-slate-600 mt-0.5">{unit}</p>
    </div>
  );
}

function FacilityMap({ activeRouteFrom, activeRouteTo }: { activeRouteFrom?: string; activeRouteTo?: string }) {
  const [progress, setProgress] = useState(0.65);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress(p => p >= 0.98 ? 0.3 : p + 0.004);
    }, 120);
    return () => clearInterval(t);
  }, []);

  const getFacility = (id: string) => FACILITIES.find(f => f.id === id);
  const fromF = activeRouteFrom ? getFacility(activeRouteFrom) : null;
  const toF   = activeRouteTo   ? getFacility(activeRouteTo)   : null;

  const ambX = fromF && toF ? fromF.x + (toF.x - fromF.x) * progress : 0;
  const ambY = fromF && toF ? fromF.y + (toF.y - fromF.y) * progress : 0;

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: "rgba(6,11,24,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">SHA Facility Network</h3>
          <p className="text-slate-500 text-xs mt-0.5">Kericho · Nakuru · Rift Valley corridor</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />In-network</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Out-of-network</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-teal-400/50 inline-block" />Active transfer</div>
        </div>
      </div>
      <svg viewBox="0 80 600 260" className="w-full" style={{ height: 240 }}>
        <defs>
          <radialGradient id="mapBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(20,184,166,0.03)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect x="0" y="80" width="600" height="260" fill="url(#mapBg)" />

        {/* Grid */}
        {[100,140,180,220,260,300].map(y => (
          <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
        ))}
        {[80,160,240,320,400,480,560].map(x => (
          <line key={x} x1={x} y1="80" x2={x} y2="340" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
        ))}

        {/* Static routes */}
        {ROUTES.map((r, i) => {
          const f = getFacility(r.from);
          const t = getFacility(r.to);
          if (!f || !t) return null;
          const isActive = (r.from === activeRouteFrom && r.to === activeRouteTo) ||
                           (r.from === activeRouteTo && r.to === activeRouteFrom);
          return (
            <line key={i}
              x1={f.x} y1={f.y} x2={t.x} y2={t.y}
              stroke={isActive ? "rgba(20,184,166,0.6)" : "rgba(255,255,255,0.06)"}
              strokeWidth={isActive ? 1.5 : 1}
              strokeDasharray={isActive ? "4 3" : undefined}
            />
          );
        })}

        {/* Active route highlight */}
        {fromF && toF && (
          <line
            x1={fromF.x} y1={fromF.y} x2={toF.x} y2={toF.y}
            stroke="rgba(20,184,166,0.35)"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        )}

        {/* Facility nodes */}
        {FACILITIES.map(f => {
          const isActive = f.id === activeRouteFrom || f.id === activeRouteTo;
          const color = f.inNetwork ? "#14b8a6" : "#f59e0b";
          const r = f.home ? 10 : isActive ? 8 : 6;
          return (
            <g key={f.id}>
              {isActive && (
                <circle cx={f.x} cy={f.y} r={r + 8} fill={`${color}15`} stroke={`${color}30`} strokeWidth={1} />
              )}
              <circle cx={f.x} cy={f.y} r={r}
                fill={f.home ? "rgba(20,184,166,0.2)" : isActive ? `${color}20` : "rgba(6,11,24,0.8)"}
                stroke={color} strokeWidth={f.home ? 2 : 1.5} />
              {f.home && <circle cx={f.x} cy={f.y} r={4} fill="#2dd4bf" />}
              <text x={f.x} y={f.y + r + 11} textAnchor="middle"
                fill={isActive ? color : "#64748b"} fontSize={f.home ? 8 : 7.5} fontWeight={isActive ? "600" : "400"}>
                {f.short}
              </text>
            </g>
          );
        })}

        {/* Ambulance dot */}
        {fromF && toF && (
          <g filter="url(#glow)">
            <circle cx={ambX} cy={ambY} r={7} fill="rgba(20,184,166,0.2)" stroke="#2dd4bf" strokeWidth={1.5} />
            <circle cx={ambX} cy={ambY} r={3} fill="#2dd4bf" />
          </g>
        )}
      </svg>
    </div>
  );
}

function LiveTracker({ referral }: { referral: typeof MOCK_REFERRALS[0] }) {
  const [vitals, setVitals] = useState(referral.vitals);
  const [eta, setEta] = useState(referral.etaMinutes || 0);

  useEffect(() => {
    if (!referral.vitals) return;
    const t = setInterval(() => {
      setVitals(v => v ? {
        hr:  Math.max(60,  Math.min(160, v.hr  + (Math.random() > 0.5 ? 1 : -1))),
        sbp: Math.max(60,  Math.min(200, v.sbp + (Math.random() > 0.5 ? 1 : -1))),
        dbp: Math.max(40,  Math.min(120, v.dbp + (Math.random() > 0.5 ? 1 : -1))),
        spo2:Math.max(85,  Math.min(100, v.spo2 + (Math.random() > 0.7 ? 1 : -1))),
        gcs: v.gcs,
        rr:  Math.max(12,  Math.min(40,  v.rr  + (Math.random() > 0.6 ? 1 : -1))),
      } : v);
    }, 2800);
    return () => clearInterval(t);
  }, [referral.vitals]);

  useEffect(() => {
    if (!eta) return;
    const t = setInterval(() => setEta(e => Math.max(0, e - 1)), 60000);
    return () => clearInterval(t);
  }, [eta]);

  const pc   = PRIORITY_CONFIG[referral.priority as keyof typeof PRIORITY_CONFIG];
  const sc   = STATUS_CONFIG[referral.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = sc.icon;

  const elapsedMin = referral.departedAt
    ? Math.floor((Date.now() - new Date(referral.departedAt).getTime()) / 60000)
    : null;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Patient banner */}
      <div className="rounded-2xl p-4" style={{ background: pc.bg, border: `1px solid ${pc.border}` }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {pc.pulse && <span className="w-2 h-2 rounded-full bg-red-400 pulse-dot" />}
              <span className="text-xs font-bold tracking-widest" style={{ color: pc.color }}>{pc.label}</span>
            </div>
            <h3 className="text-white font-bold text-lg leading-none">{referral.patient.name}</h3>
            <p className="text-slate-400 text-xs mt-1 font-mono">{referral.patient.shaNumber} · {referral.patient.age}y {referral.patient.sex}</p>
            <p className="text-slate-300 text-sm mt-2">{referral.diagnosis}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1.5 justify-end mb-1">
              <StatusIcon className="w-3.5 h-3.5" style={{ color: sc.color }} />
              <span className="text-xs font-medium" style={{ color: sc.color }}>{sc.label}</span>
            </div>
            {elapsedMin !== null && (
              <p className="text-xs text-slate-500">{elapsedMin}m elapsed</p>
            )}
            {eta > 0 && (
              <div className="mt-2 rounded-lg px-3 py-1.5 text-center"
                   style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)" }}>
                <p className="text-teal-400 font-bold text-xl leading-none">{eta}</p>
                <p className="text-teal-600 text-xs">min ETA</p>
              </div>
            )}
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="text-xs text-slate-400 truncate">{referral.sending.name}</span>
          <ArrowRight className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
          <Building2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: pc.color }} />
          <span className="text-xs font-medium truncate" style={{ color: pc.color }}>{referral.receiving.name}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${referral.progress}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${pc.color}, ${pc.color}88)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>{referral.sending.county}</span>
            <span>{referral.progress}% complete</span>
            <span>{referral.receiving.county}</span>
          </div>
        </div>
      </div>

      {/* Vitals */}
      {vitals && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-teal-500" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Vitals</span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 pulse-dot" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <VitalChip label="Heart Rate" value={vitals.hr} unit="bpm" warn={vitals.hr > 120 || vitals.hr < 50} />
            <VitalChip label="Blood Pressure" value={`${vitals.sbp}/${vitals.dbp}`} unit="mmHg" warn={vitals.sbp < 90} />
            <VitalChip label="SpO₂" value={`${vitals.spo2}%`} unit="oxygen sat" warn={vitals.spo2 < 92} />
            <VitalChip label="GCS" value={vitals.gcs} unit="/15" warn={vitals.gcs < 13} />
            <VitalChip label="Resp Rate" value={vitals.rr} unit="br/min" warn={vitals.rr > 25 || vitals.rr < 10} />
            <div className="flex-1 rounded-xl p-3 text-center"
                 style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs text-slate-500 mb-1">Transport</p>
              <Ambulance className="w-4 h-4 text-teal-400 mx-auto" />
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{referral.transportMode}</p>
            </div>
          </div>
        </div>
      )}

      {/* Updates */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Radio className="w-3.5 h-3.5 text-teal-500" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Updates</span>
        </div>
        <div className="space-y-2">
          {[...referral.updates].reverse().map((u, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                u.type === "success" ? "bg-emerald-400" :
                u.type === "warning" ? "bg-amber-400" : "bg-teal-400"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300 leading-relaxed">{u.text}</p>
              </div>
              <span className="text-xs text-slate-600 font-mono flex-shrink-0">{u.time}</span>
            </div>
          ))}
        </div>
        {/* SMS quick actions */}
        <div className="flex gap-2 mt-3">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors"
                  style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "#2dd4bf" }}>
            <MessageSquare className="w-3.5 h-3.5" />SMS Update
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors"
                  style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa" }}>
            <Phone className="w-3.5 h-3.5" />Call Team
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReferralsPage() {
  const [selectedId, setSelectedId] = useState<string>("r1");
  const [showNewForm, setShowNewForm] = useState(false);

  const selected = MOCK_REFERRALS.find(r => r.id === selectedId) ?? MOCK_REFERRALS[0];
  const active   = MOCK_REFERRALS.filter(r => r.status === "in_transit");
  const pending  = MOCK_REFERRALS.filter(r => r.status === "pending" || r.status === "accepted");

  return (
    <div className="p-6 space-y-5 min-h-full" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">UzimaReferral</h1>
            {active.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 pulse-dot" />
                {active.length} LIVE
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm">Real-time facility referral & emergency patient tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
               style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.15)", color: "#2dd4bf" }}>
            <Wifi className="w-3.5 h-3.5" />
            <span>SHA Network: Online</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow: "0 0 20px rgba(20,184,166,0.3)" }}>
            <Plus className="w-4 h-4" />
            New Referral
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "In Transit", value: active.length.toString(), icon: Ambulance, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
          { label: "Awaiting Response", value: pending.length.toString(), icon: Clock, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
          { label: "Completed Today", value: "5", icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
          { label: "Acceptance Rate", value: "98%", icon: Shield, color: "#14b8a6", bg: "rgba(20,184,166,0.1)" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white leading-none">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main panel */}
      <div className="grid grid-cols-12 gap-4">
        {/* Referral list */}
        <div className="col-span-4 space-y-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Active Referrals</h2>
          {MOCK_REFERRALS.map((r, i) => {
            const pc = PRIORITY_CONFIG[r.priority as keyof typeof PRIORITY_CONFIG];
            const sc = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = sc.icon;
            const isSelected = r.id === selectedId;
            return (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setSelectedId(r.id)}
                className="w-full text-left rounded-2xl p-4 transition-all"
                style={{
                  background: isSelected ? "rgba(20,184,166,0.08)" : "rgba(255,255,255,0.02)",
                  border: isSelected ? "1px solid rgba(20,184,166,0.25)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {pc.pulse && r.status === "in_transit" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 pulse-dot flex-shrink-0" />
                    )}
                    <span className="text-xs font-bold" style={{ color: pc.color }}>{pc.label}</span>
                  </div>
                  <StatusIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: sc.color }} />
                </div>
                <p className="text-white font-semibold text-sm leading-tight">{r.patient.name}</p>
                <p className="text-slate-500 text-xs mt-0.5 truncate">{r.diagnosis}</p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span className="truncate">{r.receiving.name}</span>
                </div>
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${r.progress}%`, background: pc.color, opacity: 0.7 }} />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Live tracker */}
        <motion.div
          key={selectedId}
          initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="col-span-8 glass-card p-5"
          style={{ minHeight: 480 }}>
          <LiveTracker referral={selected} />
        </motion.div>
      </div>

      {/* Facility network map */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <FacilityMap
          activeRouteFrom={selected.routeFrom}
          activeRouteTo={selected.routeTo}
        />
      </motion.div>
    </div>
  );
}
