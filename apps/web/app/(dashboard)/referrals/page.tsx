"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ambulance, MapPin, Clock, Activity, Plus, Phone, MessageSquare,
  CheckCircle2, AlertTriangle, ArrowRight, Zap, Building2, Wifi,
  Navigation, ChevronRight, Radio, Shield, X, ChevronDown,
  Lock, Send, RefreshCw, Search, Filter, Star, TrendingUp,
  Heart, FileText, User, Calendar, Users, Layers, BarChart3,
  Share2, Loader2, Check, Info, Car, Plane,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { autoMatch, KENYA_FACILITIES, type Facility } from "@/components/referrals/KenyaReferralMap";

const KenyaReferralMap = dynamic(() => import("@/components/referrals/KenyaReferralMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center rounded-xl"
         style={{ background: "rgba(6,11,24,0.8)", border: "1px solid rgba(255,255,255,0.07)", minHeight: 400 }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Loading Kenya Map…</span>
      </div>
    </div>
  ),
});

/* ── Types ───────────────────────────────────────────────────────── */
interface ReferralVitals { hr: number; sbp: number; dbp: number; spo2: number; gcs: number; rr: number }
interface ReferralUpdate { time: string; text: string; type: "success"|"info"|"warning" }
interface Referral {
  id: string; priority: "emergency"|"urgent"|"routine"; status: string; condition: string;
  patient: { name: string; shaNumber: string; age: number; sex: string };
  sending: { id: string; name: string; county: string; lat: number; lon: number };
  receiving: { id: string; name: string; county: string };
  diagnosis: string; departedAt: string|null; etaMinutes: number|null;
  transportMode: string; vitals: ReferralVitals|null; updates: ReferralUpdate[]; progress: number;
}

/* ── Seed data ───────────────────────────────────────────────────── */
const SEED_REFERRALS: Referral[] = [
  {
    id: "r1", priority: "emergency", status: "in_transit", condition: "trauma",
    patient: { name: "Peter Otieno", shaNumber: "SHA2024011111", age: 34, sex: "M" },
    sending: { id: "litein", name: "AIC Litein Mission Hospital", county: "Kericho", lat: -0.5683, lon: 35.2167 },
    receiving: { id: "knh", name: "Kenyatta National Hospital", county: "Nairobi" },
    diagnosis: "RTA — Polytrauma, Fracture Right Femur",
    departedAt: new Date(Date.now() - 28 * 60000).toISOString(), etaMinutes: 14, transportMode: "ambulance",
    vitals: { hr: 104, sbp: 88, dbp: 60, spo2: 94, gcs: 13, rr: 22 },
    updates: [
      { time: "14:32", text: "Patient stabilised, departed AIC Litein", type: "success" },
      { time: "14:38", text: "En route via A104 — Kericho–Nakuru highway", type: "info" },
      { time: "14:41", text: "Vitals: HR 104, BP 88/60, SpO2 94%", type: "warning" },
      { time: "14:50", text: "Passed Nakuru junction, ETA KNH 14 min", type: "info" },
    ],
    progress: 65,
  },
  {
    id: "r2", priority: "urgent", status: "accepted", condition: "obstetric",
    patient: { name: "Grace Wanjiku", shaNumber: "SHA2024022222", age: 28, sex: "F" },
    sending: { id: "litein", name: "AIC Litein Mission Hospital", county: "Kericho", lat: -0.5683, lon: 35.2167 },
    receiving: { id: "nakuru", name: "Nakuru Level 5 Hospital", county: "Nakuru" },
    diagnosis: "Eclampsia — 36 weeks gestation, seizures",
    departedAt: null, etaMinutes: null, transportMode: "ambulance",
    vitals: { hr: 118, sbp: 165, dbp: 105, spo2: 97, gcs: 14, rr: 18 },
    updates: [
      { time: "15:10", text: "Referral accepted by Nakuru L5 OBG team", type: "success" },
      { time: "15:12", text: "Ambulance dispatched from Kericho garage", type: "info" },
    ],
    progress: 10,
  },
  {
    id: "r3", priority: "routine", status: "completed", condition: "renal",
    patient: { name: "James Mwangi", shaNumber: "SHA2024033333", age: 56, sex: "M" },
    sending: { id: "litein", name: "AIC Litein Mission Hospital", county: "Kericho", lat: -0.5683, lon: 35.2167 },
    receiving: { id: "mtrh", name: "Moi Teaching & Referral Hospital", county: "Uasin Gishu" },
    diagnosis: "CKD Stage 4 — Specialist review & dialysis access",
    departedAt: new Date(Date.now() - 4 * 3600000).toISOString(), etaMinutes: 0, transportMode: "private",
    vitals: null,
    updates: [
      { time: "10:15", text: "Patient transferred successfully to MTRH Nephrology", type: "success" },
      { time: "10:16", text: "Discharge summary sent via UzimaLink", type: "success" },
    ],
    progress: 100,
  },
  {
    id: "r4", priority: "urgent", status: "pending", condition: "obstetric",
    patient: { name: "Amina Hassan", shaNumber: "SHA2024044444", age: 19, sex: "F" },
    sending: { id: "litein", name: "AIC Litein Mission Hospital", county: "Kericho", lat: -0.5683, lon: 35.2167 },
    receiving: { id: "nakuru", name: "Nakuru Level 5 Hospital", county: "Nakuru" },
    diagnosis: "Post-partum haemorrhage — failed conservative management",
    departedAt: null, etaMinutes: null, transportMode: "ambulance",
    vitals: { hr: 132, sbp: 74, dbp: 48, spo2: 91, gcs: 12, rr: 28 },
    updates: [
      { time: "15:48", text: "URGENT referral initiated — PPH uncontrolled", type: "warning" },
      { time: "15:49", text: "Awaiting acceptance from Nakuru L5 OBG", type: "info" },
    ],
    progress: 5,
  },
];

const PRIORITY_CONFIG = {
  emergency: { label: "EMERGENCY", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", pulse: true },
  urgent:    { label: "URGENT",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", pulse: false },
  routine:   { label: "ROUTINE",   color: "#14b8a6", bg: "rgba(20,184,166,0.1)",  border: "rgba(20,184,166,0.2)", pulse: false },
};
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:    { label: "Awaiting Acceptance", color: "#94a3b8", icon: Clock },
  accepted:   { label: "Accepted — Preparing", color: "#3b82f6", icon: CheckCircle2 },
  in_transit: { label: "In Transit", color: "#14b8a6", icon: Ambulance },
  arrived:    { label: "Arrived", color: "#10b981", icon: MapPin },
  completed:  { label: "Completed", color: "#6b7280", icon: CheckCircle2 },
};
const COE_COLOR: Record<string, string> = {
  Cardiac:"#ef4444",Stroke:"#a855f7",Trauma:"#f97316",Burns:"#f59e0b",
  Renal:"#3b82f6",Oncology:"#ec4899",Neurosurgery:"#8b5cf6",Obstetric:"#10b981",
};
const CONDITION_OPTIONS = [
  { value:"trauma",     label:"Trauma / RTA" },
  { value:"cardiac",    label:"Cardiac" },
  { value:"stroke",     label:"Stroke / Neurological" },
  { value:"obstetric",  label:"Obstetric / Maternal" },
  { value:"renal",      label:"Renal / Dialysis" },
  { value:"burns",      label:"Burns" },
  { value:"oncology",   label:"Oncology" },
  { value:"icu",        label:"ICU / Critical Care" },
  { value:"dialysis",   label:"Dialysis" },
  { value:"other",      label:"Other" },
];
const CAPABILITY_OPTIONS = [
  "ICU","NICU","Cath Lab","MRI","CT","Trauma","Burns","Dialysis",
  "Oncology","Neurosurgery","Obstetrics","Surgery",
];
const KENYA_COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Thika","Machakos",
  "Nyeri","Meru","Embu","Kisii","Kericho","Kakamega","Garissa","Kwale",
  "Uasin Gishu","Kiambu","Muranga","Nyandarua","Laikipia","Samburu",
  "Trans Nzoia","West Pokot","Siaya","Homa Bay","Migori","Bungoma","Busia",
  "Vihiga","Nandi","Baringo","Bomet","Narok","Kajiado","Makueni",
  "Kitui","Taita Taveta","Kilifi","Tana River","Lamu","Mandera","Wajir","Marsabit","Isiolo","Tharaka-Nithi",
];

/* ── Analytics data ──────────────────────────────────────────────── */
const TREND_DATA = [
  { day: "Mon", emergency: 2, urgent: 3, routine: 1 },
  { day: "Tue", emergency: 1, urgent: 4, routine: 2 },
  { day: "Wed", emergency: 3, urgent: 2, routine: 1 },
  { day: "Thu", emergency: 1, urgent: 5, routine: 3 },
  { day: "Fri", emergency: 4, urgent: 3, routine: 1 },
  { day: "Sat", emergency: 2, urgent: 1, routine: 0 },
  { day: "Today", emergency: 2, urgent: 2, routine: 1 },
];
const CONDITION_DATA = [
  { name: "Obstetric", value: 38, color: "#10b981" },
  { name: "Trauma",    value: 28, color: "#f97316" },
  { name: "Cardiac",   value: 12, color: "#ef4444" },
  { name: "Renal",     value: 10, color: "#3b82f6" },
  { name: "Neuro",     value: 7,  color: "#8b5cf6" },
  { name: "Other",     value: 5,  color: "#64748b" },
];
const TOP_FACILITIES = [
  { name: "KNH", accepts: 94, color: "#2dd4bf" },
  { name: "MTRH", accepts: 97, color: "#2dd4bf" },
  { name: "Nakuru L5", accepts: 88, color: "#2dd4bf" },
  { name: "Kisii TR", accepts: 82, color: "#f59e0b" },
  { name: "Kakamega TR", accepts: 79, color: "#f59e0b" },
];

/* ── VitalChip ───────────────────────────────────────────────────── */
function VitalChip({ label, value, unit, warn }: { label:string; value:string|number; unit:string; warn?:boolean }) {
  return (
    <div className="flex-1 rounded-xl p-3 text-center"
         style={{ background: warn ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${warn ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.07)"}` }}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={cn("text-lg font-bold leading-none", warn ? "text-red-400" : "text-white")}>{value}</p>
      <p className="text-xs text-slate-600 mt-0.5">{unit}</p>
    </div>
  );
}

/* ── LiveTracker ─────────────────────────────────────────────────── */
function LiveTracker({ referral }: { referral: Referral }) {
  const [vitals, setVitals] = useState(referral.vitals);
  const [eta, setEta] = useState(referral.etaMinutes || 0);

  useEffect(() => { setVitals(referral.vitals); setEta(referral.etaMinutes || 0); }, [referral.id]);
  useEffect(() => {
    if (!referral.vitals) return;
    const t = setInterval(() => setVitals(v => v ? {
      hr:  Math.max(60,  Math.min(160, v.hr  + (Math.random()>.5?1:-1))),
      sbp: Math.max(60,  Math.min(200, v.sbp + (Math.random()>.5?1:-1))),
      dbp: Math.max(40,  Math.min(120, v.dbp + (Math.random()>.5?1:-1))),
      spo2:Math.max(85,  Math.min(100, v.spo2+ (Math.random()>.7?1:-1))),
      gcs: v.gcs,
      rr:  Math.max(12,  Math.min(40,  v.rr  + (Math.random()>.6?1:-1))),
    } : v), 2800);
    return () => clearInterval(t);
  }, [referral.id]);
  useEffect(() => {
    if (!eta) return;
    const t = setInterval(() => setEta(e => Math.max(0, e-1)), 60000);
    return () => clearInterval(t);
  }, [eta]);

  const pc = PRIORITY_CONFIG[referral.priority];
  const sc = STATUS_CONFIG[referral.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = sc.icon;
  const elapsed = referral.departedAt ? Math.floor((Date.now()-new Date(referral.departedAt).getTime())/60000) : null;

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="rounded-2xl p-4" style={{ background: pc.bg, border: `1px solid ${pc.border}` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {pc.pulse && <span className="w-2 h-2 rounded-full bg-red-400 pulse-dot" />}
              <span className="text-xs font-bold tracking-widest" style={{ color: pc.color }}>{pc.label}</span>
            </div>
            <h3 className="text-white font-bold text-lg leading-none">{referral.patient.name}</h3>
            <p className="text-slate-400 text-xs mt-1 font-mono">{referral.patient.shaNumber} · {referral.patient.age}y {referral.patient.sex}</p>
            <p className="text-slate-300 text-sm mt-2 leading-snug">{referral.diagnosis}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1.5 justify-end mb-1">
              <StatusIcon className="w-3.5 h-3.5" style={{ color: sc.color }} />
              <span className="text-xs font-medium" style={{ color: sc.color }}>{sc.label}</span>
            </div>
            {elapsed !== null && <p className="text-xs text-slate-500">{elapsed}m elapsed</p>}
            {eta > 0 && (
              <div className="mt-2 rounded-lg px-3 py-1.5 text-center"
                   style={{ background:"rgba(20,184,166,0.1)", border:"1px solid rgba(20,184,166,0.2)" }}>
                <p className="text-teal-400 font-bold text-xl leading-none">{eta}</p>
                <p className="text-teal-600 text-xs">min ETA</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor:"rgba(255,255,255,0.06)" }}>
          <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="text-xs text-slate-400 truncate">{referral.sending.name}</span>
          <ArrowRight className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
          <Building2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: pc.color }} />
          <span className="text-xs font-medium truncate" style={{ color: pc.color }}>{referral.receiving.name}</span>
        </div>
        <div className="mt-3">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
            <motion.div initial={{ width:0 }} animate={{ width:`${referral.progress}%` }}
              transition={{ duration:1.2, ease:"easeOut" }} className="h-full rounded-full"
              style={{ background:`linear-gradient(90deg,${pc.color},${pc.color}88)` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>{referral.sending.county}</span>
            <span>{referral.progress}%</span>
            <span>{referral.receiving.county}</span>
          </div>
        </div>
      </div>

      {vitals && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-teal-500" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Vitals</span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 pulse-dot" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <VitalChip label="Heart Rate" value={vitals.hr} unit="bpm" warn={vitals.hr>120||vitals.hr<50} />
            <VitalChip label="BP" value={`${vitals.sbp}/${vitals.dbp}`} unit="mmHg" warn={vitals.sbp<90} />
            <VitalChip label="SpO₂" value={`${vitals.spo2}%`} unit="sat" warn={vitals.spo2<92} />
            <VitalChip label="GCS" value={vitals.gcs} unit="/15" warn={vitals.gcs<13} />
            <VitalChip label="RR" value={vitals.rr} unit="br/min" warn={vitals.rr>25||vitals.rr<10} />
            <div className="flex-1 rounded-xl p-3 text-center"
                 style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs text-slate-500 mb-1">Transport</p>
              <Ambulance className="w-4 h-4 text-teal-400 mx-auto" />
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{referral.transportMode}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <div className="flex items-center gap-2 mb-2">
          <Radio className="w-3.5 h-3.5 text-teal-500" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Updates</span>
        </div>
        <div className="space-y-2">
          {[...referral.updates].reverse().map((u, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                u.type==="success"?"bg-emerald-400":u.type==="warning"?"bg-amber-400":"bg-teal-400")} />
              <p className="flex-1 text-xs text-slate-300 leading-relaxed">{u.text}</p>
              <span className="text-xs text-slate-600 font-mono flex-shrink-0">{u.time}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium"
                  style={{ background:"rgba(20,184,166,0.1)", border:"1px solid rgba(20,184,166,0.2)", color:"#2dd4bf" }}>
            <MessageSquare className="w-3.5 h-3.5" />SMS Update
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium"
                  style={{ background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.2)", color:"#60a5fa" }}>
            <Phone className="w-3.5 h-3.5" />Call Team
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── SHA Handover Packet ─────────────────────────────────────────── */
function SHAHandoverPacket({ referral }: { referral: Referral }) {
  const [expanded, setExpanded] = useState(false);
  const authCode = `UZL-2026-${referral.receiving.id.toUpperCase().slice(0,3)}-${referral.patient.shaNumber.slice(-4)}`;
  const items = [
    { label:"Patient Demographics", done:true, size:"4.2 KB" },
    { label:"Clinical Summary", done:true, size:"8.7 KB" },
    { label:`Vital Signs (${referral.vitals ? "Live" : "N/A"})`, done:!!referral.vitals, size:"1.1 KB" },
    { label:"Active Medications", done:true, size:"2.4 KB" },
    { label:"Allergies & Alerts", done:true, size:"0.8 KB" },
    { label:"ICD-10 Diagnosis Codes", done:referral.status!=="pending", size:"1.6 KB" },
    { label:"Lab Results (24h)", done:referral.status==="in_transit"||referral.status==="completed", size:"18.3 KB" },
    { label:"SHA Coverage Verified", done:true, size:"—" },
  ];
  const done = items.filter(i=>i.done).length;

  return (
    <div className="rounded-2xl overflow-hidden"
         style={{ background:"rgba(6,11,24,0.7)", border:"1px solid rgba(20,184,166,0.15)" }}>
      <button className="w-full flex items-center gap-3 px-4 py-3" onClick={() => setExpanded(e=>!e)}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{ background:"rgba(20,184,166,0.12)", border:"1px solid rgba(20,184,166,0.25)" }}>
          <Lock className="w-4 h-4 text-teal-400" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-white font-semibold text-sm">UzimaLink™ Data Packet</p>
          <p className="text-xs text-slate-500 font-mono truncate">{authCode}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background:"rgba(20,184,166,0.1)", color:"#2dd4bf", border:"1px solid rgba(20,184,166,0.2)" }}>
            {done}/{items.length} ready
          </span>
          <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", expanded && "rotate-180")} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height:0 }} animate={{ height:"auto" }} exit={{ height:0 }}
            style={{ overflow:"hidden" }}>
            <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor:"rgba(255,255,255,0.06)" }}>
              <div className="pt-3 space-y-1.5">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded-lg"
                       style={{ background:"rgba(255,255,255,0.02)" }}>
                    <div className={cn("w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                      item.done ? "bg-emerald-500/20" : "bg-slate-700/50")}>
                      {item.done
                        ? <Check className="w-2.5 h-2.5 text-emerald-400" />
                        : <Clock className="w-2.5 h-2.5 text-slate-500" />}
                    </div>
                    <span className="flex-1 text-xs text-slate-300">{item.label}</span>
                    <span className="text-xs text-slate-600 font-mono">{item.size}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor:"rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-teal-500" />
                  <span className="text-xs text-slate-500">AES-256 Encrypted · FHIR R4</span>
                </div>
                <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background:"rgba(20,184,166,0.1)", border:"1px solid rgba(20,184,166,0.2)", color:"#2dd4bf" }}>
                  <Send className="w-3 h-3" />Send to {referral.receiving.county}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── AutoMatch Panel ─────────────────────────────────────────────── */
function AutoMatchPanel({ referral, onSelect }: { referral: Referral; onSelect:(f:Facility)=>void }) {
  const matches = useMemo(() =>
    autoMatch(referral.sending.lat, referral.sending.lon, referral.condition, referral.sending.id) as (Facility & {_score:number;_dist:number})[]
  , [referral.id]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
             style={{ background:"rgba(168,85,247,0.15)", border:"1px solid rgba(168,85,247,0.3)" }}>
          <Zap className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm">AI Auto-Match</h3>
          <p className="text-slate-500 text-xs capitalize">{referral.condition} · {referral.sending.county}</p>
        </div>
        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={{ background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.2)", color:"#c084fc" }}>
          <span className="w-1 h-1 rounded-full bg-purple-400 pulse-dot" />Live
        </span>
      </div>
      <div className="space-y-2 flex-1 overflow-y-auto scrollbar-none">
        {matches.map((f, i) => {
          const score = Math.min(100, Math.round((f as any)._score));
          const dist  = Math.round((f as any)._dist);
          return (
            <motion.button key={f.id} initial={{ opacity:0,x:12 }} animate={{ opacity:1,x:0 }}
              transition={{ delay:i*0.06 }} onClick={() => onSelect(f)}
              className="w-full text-left rounded-xl p-3 transition-all"
              style={{ background:i===0?"rgba(168,85,247,0.08)":"rgba(255,255,255,0.02)",
                       border:i===0?"1px solid rgba(168,85,247,0.25)":"1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 font-bold text-xs"
                     style={{ background:i===0?"rgba(168,85,247,0.2)":"rgba(255,255,255,0.05)",
                              color:i===0?"#c084fc":"#64748b" }}>{i+1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-white font-semibold text-xs truncate">{f.short}</p>
                    {i===0 && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                      style={{ background:"rgba(168,85,247,0.2)", color:"#c084fc" }}>Best</span>}
                  </div>
                  <p className="text-slate-500 text-xs">{f.county} · L{f.level} · {dist} km</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 rounded-full" style={{ background:"rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full"
                           style={{ width:`${score}%`, background:i===0?"linear-gradient(90deg,#a855f7,#7c3aed)":"linear-gradient(90deg,#2dd4bf,#0891b2)" }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color:i===0?"#c084fc":"#2dd4bf" }}>{score}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn("text-xs", f.availBeds>10?"text-teal-400":f.availBeds>0?"text-amber-400":"text-red-400")}>
                      {f.availBeds} beds
                    </span>
                    <span className={cn("text-xs", f.inNetwork?"text-teal-400":"text-amber-400")}>
                      {f.inNetwork?"✓ Network":"⚠ OON"}
                    </span>
                    {f.coe.slice(0,2).map(c=>(
                      <span key={c} className="text-xs px-1 py-0.5 rounded font-semibold"
                            style={{ background:`${COE_COLOR[c]??"#6b7280"}22`, color:COE_COLOR[c]??"#94a3b8" }}>{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
      <p className="text-xs text-slate-600 text-center mt-2 pt-2 border-t" style={{ borderColor:"rgba(255,255,255,0.06)" }}>
        Ranked by capability · distance · beds · network
      </p>
    </div>
  );
}

/* ── Facility Card ───────────────────────────────────────────────── */
function FacilityCard({ facility: f, onSelect }: { facility: Facility; onSelect:()=>void }) {
  const lvlColor = f.level===6?"#ef4444":f.level===5?"#3b82f6":"#14b8a6";
  const usedPct = Math.round((1-f.availBeds/f.beds)*100);
  return (
    <motion.div whileHover={{ y:-2, borderColor:"rgba(20,184,166,0.25)" }}
      className="glass-card p-4 cursor-pointer transition-all"
      style={{ transition:"border-color 0.2s,box-shadow 0.2s" }}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">{f.name}</p>
          <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" />{f.county} County
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ background:`${lvlColor}22`, color:lvlColor, border:`1px solid ${lvlColor}44` }}>
            L{f.level}
          </span>
          <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded",
            f.inNetwork?"text-teal-400":"text-amber-400")}
            style={{ background:f.inNetwork?"rgba(45,212,191,0.1)":"rgba(245,158,11,0.1)" }}>
            {f.inNetwork?"In-Net":"OON"}
          </span>
        </div>
      </div>

      {/* Beds */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">Bed occupancy</span>
          <span className={f.availBeds>10?"text-teal-400":f.availBeds>0?"text-amber-400":"text-red-400"}>
            {f.availBeds} / {f.beds} available
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all"
               style={{ width:`${usedPct}%`, background:usedPct>80?"#ef4444":usedPct>60?"#f59e0b":"#14b8a6" }} />
        </div>
      </div>

      {/* CoE */}
      {f.coe.length>0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {f.coe.map(c=>(
            <span key={c} className="text-xs px-1.5 py-0.5 rounded font-semibold"
                  style={{ background:`${COE_COLOR[c]??"#6b7280"}18`, color:COE_COLOR[c]??"#94a3b8", border:`1px solid ${COE_COLOR[c]??"#6b7280"}33` }}>
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor:"rgba(255,255,255,0.06)" }}>
        <span className="text-xs text-slate-600">{f.phone}</span>
        <button onClick={onSelect}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ background:"rgba(20,184,166,0.1)", border:"1px solid rgba(20,184,166,0.2)", color:"#2dd4bf" }}>
          Select
        </button>
      </div>
    </motion.div>
  );
}

/* ── Analytics Tab ───────────────────────────────────────────────── */
function AnalyticsTab() {
  const toTip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl px-3 py-2 text-xs"
           style={{ background:"rgba(13,21,38,0.97)", border:"1px solid rgba(255,255,255,0.1)" }}>
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p:any)=>(
          <p key={p.name} style={{ color:p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Total This Month", value:"47", icon:BarChart3, color:"#14b8a6", bg:"rgba(20,184,166,0.1)" },
          { label:"Avg Response Time", value:"8.4 min", icon:Clock, color:"#3b82f6", bg:"rgba(59,130,246,0.1)" },
          { label:"Network Acceptance", value:"94.7%", icon:CheckCircle2, color:"#10b981", bg:"rgba(16,185,129,0.1)" },
          { label:"Est. Cost Saved", value:"KES 1.2M", icon:TrendingUp, color:"#f59e0b", bg:"rgba(245,158,11,0.1)" },
        ].map((s,i)=>(
          <motion.div key={s.label} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }}
            transition={{ delay:i*0.07 }} className="glass-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:s.bg }}>
              <s.icon className="w-4 h-4" style={{ color:s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Referral Volume (7 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={TREND_DATA}>
              <defs>
                <linearGradient id="gEmergency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gUrgent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gRoutine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill:"#475569", fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#475569", fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={toTip} />
              <Area type="monotone" dataKey="emergency" stroke="#ef4444" fill="url(#gEmergency)" strokeWidth={2} />
              <Area type="monotone" dataKey="urgent" stroke="#f59e0b" fill="url(#gUrgent)" strokeWidth={2} />
              <Area type="monotone" dataKey="routine" stroke="#14b8a6" fill="url(#gRoutine)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            {[["#ef4444","Emergency"],["#f59e0b","Urgent"],["#14b8a6","Routine"]].map(([c,l])=>(
              <div key={l} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background:c }} />
                <span className="text-xs text-slate-500">{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-white font-semibold text-sm mb-4">By Condition Type</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={CONDITION_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                     dataKey="value" paddingAngle={3}>
                  {CONDITION_DATA.map((d,i)=><Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={toTip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {CONDITION_DATA.map(d=>(
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:d.color }} />
                  <span className="text-xs text-slate-400 flex-1">{d.name}</span>
                  <span className="text-xs font-semibold text-white">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Top Receiving Facilities — Acceptance Rate</h3>
        <div className="space-y-3">
          {TOP_FACILITIES.map((f,i)=>(
            <div key={f.name} className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-500 w-4">{i+1}</span>
              <span className="text-sm text-slate-300 w-28 flex-shrink-0">{f.name}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
                <motion.div initial={{ width:0 }} animate={{ width:`${f.accepts}%` }}
                  transition={{ delay:0.3+i*0.1, duration:0.8 }}
                  className="h-full rounded-full" style={{ background:f.color }} />
              </div>
              <span className="text-sm font-bold w-12 text-right" style={{ color:f.color }}>{f.accepts}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── New Referral Wizard ─────────────────────────────────────────── */
const EMPTY_FORM = {
  shaNumber:"", patientName:"", dob:"", sex:"" as "M"|"F"|"",
  phone:"", nokName:"", nokPhone:"",
  chiefComplaint:"", diagnosis:"", condition:"trauma", priority:"urgent" as "emergency"|"urgent"|"routine",
  hr:"", sbp:"", dbp:"", spo2:"", gcs:"", rr:"",
  referringDoctor:"",
  selectedFacilityId:"", selectedFacilityName:"", selectedFacilityCounty:"",
  transportMode:"ambulance" as "ambulance"|"private"|"helicopter",
  shaPreAuth:"", notes:"",
};

function NewReferralWizard({ sendingFacility, onClose, onSubmit }: {
  sendingFacility: { id:string; name:string; county:string; lat:number; lon:number };
  onClose: ()=>void;
  onSubmit: (r: Referral)=>void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preAuthState, setPreAuthState] = useState<"idle"|"checking"|"approved">("idle");
  const [loading, setLoading] = useState(false);

  const setF = (key: keyof typeof EMPTY_FORM, val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  const matches = useMemo(() => {
    if (step < 3) return [];
    return autoMatch(sendingFacility.lat, sendingFacility.lon, form.condition, sendingFacility.id) as (Facility & {_score:number;_dist:number})[];
  }, [step, form.condition]);

  const runPreAuth = async () => {
    setPreAuthState("checking");
    await new Promise(r => setTimeout(r, 2200));
    const code = `SHA-AUTH-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    setF("shaPreAuth", code);
    setPreAuthState("approved");
  };

  const submit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1600));
    const fac = KENYA_FACILITIES.find(f => f.id === form.selectedFacilityId);
    const newRef: Referral = {
      id: `r${Date.now()}`,
      priority: form.priority,
      status: "pending",
      condition: form.condition,
      patient: {
        name: form.patientName || "Unknown Patient",
        shaNumber: form.shaNumber || "SHA000000000",
        age: form.dob ? new Date().getFullYear()-new Date(form.dob).getFullYear() : 0,
        sex: form.sex || "M",
      },
      sending: sendingFacility,
      receiving: {
        id: form.selectedFacilityId || "knh",
        name: fac?.name || form.selectedFacilityName || "Kenyatta National Hospital",
        county: fac?.county || form.selectedFacilityCounty || "Nairobi",
      },
      diagnosis: form.diagnosis || form.chiefComplaint,
      departedAt: null, etaMinutes: null,
      transportMode: form.transportMode,
      vitals: form.hr ? { hr:+form.hr, sbp:+form.sbp, dbp:+form.dbp, spo2:+form.spo2, gcs:+form.gcs||15, rr:+form.rr } : null,
      updates: [{ time: new Date().toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"}), text:`Referral initiated${form.referringDoctor?` by ${form.referringDoctor}`:""}`, type:"info" }],
      progress: 0,
    };
    onSubmit(newRef);
    setLoading(false);
  };

  const iS = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"#f0f4ff" };
  const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all";
  const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(8px)" }}>
      <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl"
        style={{ background:"linear-gradient(180deg,#0d1526,#060b18)", border:"1px solid rgba(255,255,255,0.1)" }}>

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow:"0 0 16px rgba(20,184,166,0.3)" }}>
            <Ambulance className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold">New Referral</h2>
            <p className="text-slate-500 text-xs">Step {step} of 4 — {["Patient Details","Clinical Info","Match Facility","Transport & Submit"][step-1]}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-white transition-colors"
                  style={{ background:"rgba(255,255,255,0.04)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step progress */}
        <div className="flex gap-0 px-6 pt-4">
          {[1,2,3,4].map(s=>(
            <div key={s} className="flex-1 flex items-center">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all",
                s<step?"bg-teal-500 text-white":s===step?"border-2 border-teal-500 text-teal-400":"border border-slate-600 text-slate-600")}
                style={s<step?{ boxShadow:"0 0 10px rgba(20,184,166,0.4)" }:{}}>
                {s<step?<Check className="w-3.5 h-3.5"/>:s}
              </div>
              {s<4 && <div className="flex-1 h-0.5 mx-1" style={{ background:s<step?"rgba(20,184,166,0.5)":"rgba(255,255,255,0.07)" }} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-none">
          <AnimatePresence mode="wait">
            {step===1 && (
              <motion.div key="s1" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>SHA Number *</label>
                    <input className={inputCls} style={iS} placeholder="SHA2024XXXXXX"
                      value={form.shaNumber} onChange={e=>setF("shaNumber",e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Full Name *</label>
                    <input className={inputCls} style={iS} placeholder="Patient full name"
                      value={form.patientName} onChange={e=>setF("patientName",e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Date of Birth</label>
                    <input type="date" className={inputCls} style={iS}
                      value={form.dob} onChange={e=>setF("dob",e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Sex</label>
                    <select className={inputCls} style={iS} value={form.sex} onChange={e=>setF("sex",e.target.value as "M"|"F"|"")}>
                      <option value="">Select…</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <input className={inputCls} style={iS} placeholder="+254 7XX XXX XXX"
                      value={form.phone} onChange={e=>setF("phone",e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Next of Kin</label>
                    <input className={inputCls} style={iS} placeholder="Name"
                      value={form.nokName} onChange={e=>setF("nokName",e.target.value)} />
                  </div>
                </div>
              </motion.div>
            )}
            {step===2 && (
              <motion.div key="s2" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="space-y-4">
                <div>
                  <label className={labelCls}>Chief Complaint *</label>
                  <input className={inputCls} style={iS} placeholder="Primary presenting complaint"
                    value={form.chiefComplaint} onChange={e=>setF("chiefComplaint",e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Working Diagnosis</label>
                  <input className={inputCls} style={iS} placeholder="Provisional diagnosis"
                    value={form.diagnosis} onChange={e=>setF("diagnosis",e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Condition Category</label>
                    <select className={inputCls} style={iS} value={form.condition} onChange={e=>setF("condition",e.target.value)}>
                      {CONDITION_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Priority</label>
                    <select className={inputCls} style={iS} value={form.priority} onChange={e=>setF("priority",e.target.value as "emergency"|"urgent"|"routine")}>
                      <option value="emergency">🔴 Emergency</option>
                      <option value="urgent">🟡 Urgent</option>
                      <option value="routine">🟢 Routine</option>
                    </select>
                  </div>
                </div>
                <div>
                  <p className={labelCls}>Vitals (optional)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[["hr","HR (bpm)"],["sbp","SBP"],["dbp","DBP"],["spo2","SpO₂ %"],["gcs","GCS /15"],["rr","RR"]].map(([k,l])=>(
                      <div key={k}>
                        <label className="block text-xs text-slate-500 mb-1">{l}</label>
                        <input type="number" className={inputCls} style={{ ...iS, padding:"8px 12px" }}
                          value={(form as any)[k]} onChange={e=>setF(k as keyof typeof EMPTY_FORM, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Referring Clinician</label>
                  <input className={inputCls} style={iS} placeholder="Dr. Name (KMPDC no.)"
                    value={form.referringDoctor} onChange={e=>setF("referringDoctor",e.target.value)} />
                </div>
              </motion.div>
            )}
            {step===3 && (
              <motion.div key="s3" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="space-y-3">
                <p className="text-slate-400 text-xs">AI matched {matches.length} facilities for <strong className="text-white capitalize">{form.condition}</strong> from {sendingFacility.county}. Select destination:</p>
                {matches.map((f,i)=>{
                  const sel = form.selectedFacilityId===f.id;
                  const dist = Math.round((f as any)._dist);
                  const eta = Math.round(dist/80*60);
                  return (
                    <motion.button key={f.id} initial={{ opacity:0,x:12 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.06 }}
                      onClick={()=>{ setF("selectedFacilityId",f.id); setF("selectedFacilityName",f.name); setF("selectedFacilityCounty",f.county); }}
                      className="w-full text-left rounded-xl p-4 transition-all"
                      style={{ background:sel?"rgba(20,184,166,0.08)":"rgba(255,255,255,0.02)", border:sel?"1px solid rgba(20,184,166,0.3)":"1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0",sel?"bg-teal-500/20 text-teal-400":"bg-white/5 text-slate-500")}>
                          {i===0?<Star className="w-4 h-4"/>:i+1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-semibold text-sm">{f.name}</p>
                            {i===0 && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                              style={{ background:"rgba(20,184,166,0.15)", color:"#2dd4bf" }}>Recommended</span>}
                          </div>
                          <p className="text-slate-500 text-xs">{f.county} · Level {f.level} · {dist} km · ~{eta} min ambulance</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={cn("text-xs",f.availBeds>10?"text-teal-400":f.availBeds>0?"text-amber-400":"text-red-400")}>
                              {f.availBeds} beds avail
                            </span>
                            <span className={cn("text-xs",f.inNetwork?"text-teal-400":"text-amber-400")}>
                              {f.inNetwork?"✓ SHA Network":"⚠ Out-of-Network"}
                            </span>
                            {f.coe.slice(0,3).map(c=><span key={c} className="text-xs px-1.5 rounded font-semibold"
                              style={{ background:`${COE_COLOR[c]??"#6b7280"}18`, color:COE_COLOR[c]??"#94a3b8" }}>{c}</span>)}
                          </div>
                        </div>
                        {sel && <Check className="w-5 h-5 text-teal-400 flex-shrink-0" />}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
            {step===4 && (
              <motion.div key="s4" initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="space-y-4">
                <div>
                  <label className={labelCls}>Transport Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v:"ambulance", l:"Ambulance", icon:Ambulance },
                      { v:"private", l:"Private Vehicle", icon:Car },
                      { v:"helicopter", l:"Air Ambulance", icon:Plane },
                    ].map(t=>{
                      const sel=form.transportMode===t.v;
                      return (
                        <button key={t.v} onClick={()=>setF("transportMode",t.v as "ambulance"|"private"|"helicopter")}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                          style={{ background:sel?"rgba(20,184,166,0.1)":"rgba(255,255,255,0.03)",
                                   border:sel?"1px solid rgba(20,184,166,0.3)":"1px solid rgba(255,255,255,0.07)" }}>
                          <t.icon className={cn("w-5 h-5",sel?"text-teal-400":"text-slate-500")} />
                          <span className={cn("text-xs font-medium",sel?"text-teal-400":"text-slate-500")}>{t.l}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SHA Pre-Auth */}
                <div className="rounded-xl p-4" style={{ background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.15)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-semibold text-white">SHA Pre-Authorization</span>
                    </div>
                    {preAuthState==="idle" && (
                      <button onClick={runPreAuth}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background:"rgba(59,130,246,0.15)", border:"1px solid rgba(59,130,246,0.3)", color:"#60a5fa" }}>
                        Run Check
                      </button>
                    )}
                    {preAuthState==="checking" && (
                      <div className="flex items-center gap-2 text-xs text-blue-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />Checking SHA portal…
                      </div>
                    )}
                    {preAuthState==="approved" && (
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <Check className="w-3.5 h-3.5" />Approved
                      </div>
                    )}
                  </div>
                  {preAuthState==="approved" && (
                    <div className="text-xs font-mono text-blue-300 bg-blue-500/10 rounded-lg px-3 py-2">
                      Auth Code: {form.shaPreAuth}
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelCls}>Additional Notes</label>
                  <textarea className={inputCls} style={{ ...iS, minHeight:80, resize:"none" as const }}
                    placeholder="Clinical notes for receiving team…"
                    value={form.notes} onChange={e=>setF("notes",e.target.value)} />
                </div>

                {/* Summary */}
                <div className="rounded-xl p-4 space-y-2" style={{ background:"rgba(20,184,166,0.05)", border:"1px solid rgba(20,184,166,0.15)" }}>
                  <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Referral Summary</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ["Patient", form.patientName||"—"],
                      ["SHA No.", form.shaNumber||"—"],
                      ["Diagnosis", form.diagnosis||form.chiefComplaint||"—"],
                      ["Priority", form.priority],
                      ["Destination", form.selectedFacilityName||"—"],
                      ["Transport", form.transportMode],
                    ].map(([k,v])=>(
                      <div key={k}>
                        <span className="text-slate-500">{k}: </span>
                        <span className="text-slate-200 font-medium capitalize">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={step===1?onClose:()=>setStep(s=>s-1 as 1|2|3|4)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
            {step===1?"Cancel":"← Back"}
          </button>
          {step<4 ? (
            <button onClick={()=>setStep(s=>s+1 as 1|2|3|4)}
              disabled={step===3&&!form.selectedFacilityId}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow:"0 0 16px rgba(20,184,166,0.25)" }}>
              Continue →
            </button>
          ) : (
            <button onClick={submit} disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow:"0 0 20px rgba(20,184,166,0.35)" }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Submitting…</> : <><Send className="w-4 h-4"/>Submit Referral</>}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Add Facility Modal ──────────────────────────────────────────── */
const EMPTY_FAC = {
  name:"", short:"", county:"Nairobi", level:"4" as "4"|"5"|"6",
  lat:"", lon:"", beds:"100", phone:"", inNetwork:true,
  capabilities:[] as string[], coe:[] as string[],
};

function AddFacilityModal({ onClose, onAdd }: { onClose:()=>void; onAdd:(f:Facility)=>void }) {
  const [form, setForm] = useState(EMPTY_FAC);
  const [loading, setLoading] = useState(false);

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x=>x!==val) : [...arr,val];

  const submit = async () => {
    if (!form.name||!form.lat||!form.lon) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    onAdd({
      id: `custom_${Date.now()}`,
      name: form.name, short: form.short||form.name.split(" ")[0],
      county: form.county, lat: +form.lat, lon: +form.lon,
      level: +form.level, inNetwork: form.inNetwork,
      beds: +form.beds||100, availBeds: Math.floor((+form.beds||100)*0.3),
      capabilities: form.capabilities, coe: form.coe as Facility["coe"],
      phone: form.phone,
    });
    setLoading(false);
  };

  const iS = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"#f0f4ff" };
  const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500";
  const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(8px)" }}>
      <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl"
        style={{ background:"linear-gradient(180deg,#0d1526,#060b18)", border:"1px solid rgba(255,255,255,0.1)" }}>

        <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)" }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold">Add Facility to Network</h2>
            <p className="text-slate-500 text-xs">Register a new facility in the SHA referral network</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-white"
                  style={{ background:"rgba(255,255,255,0.04)" }}><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-none">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Facility Name *</label>
              <input className={inputCls} style={iS} placeholder="e.g. Kisumu County Hospital"
                value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div>
              <label className={labelCls}>Short Name</label>
              <input className={inputCls} style={iS} placeholder="e.g. KCH"
                value={form.short} onChange={e=>setForm(f=>({...f,short:e.target.value}))} />
            </div>
            <div>
              <label className={labelCls}>County</label>
              <select className={inputCls} style={iS} value={form.county} onChange={e=>setForm(f=>({...f,county:e.target.value}))}>
                {KENYA_COUNTIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Latitude *</label>
              <input className={inputCls} style={iS} placeholder="-1.2921"
                value={form.lat} onChange={e=>setForm(f=>({...f,lat:e.target.value}))} />
            </div>
            <div>
              <label className={labelCls}>Longitude *</label>
              <input className={inputCls} style={iS} placeholder="36.8219"
                value={form.lon} onChange={e=>setForm(f=>({...f,lon:e.target.value}))} />
            </div>
            <div>
              <label className={labelCls}>Facility Level</label>
              <select className={inputCls} style={iS} value={form.level} onChange={e=>setForm(f=>({...f,level:e.target.value as "4"|"5"|"6"}))}>
                <option value="4">Level 4 — County Hospital</option>
                <option value="5">Level 5 — Regional Referral</option>
                <option value="6">Level 6 — National Referral</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Total Beds</label>
              <input type="number" className={inputCls} style={iS} value={form.beds}
                onChange={e=>setForm(f=>({...f,beds:e.target.value}))} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} style={iS} placeholder="+254 XX XXXXXXX"
                value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
            </div>
            <div className="flex items-center gap-3">
              <label className={labelCls+" mb-0"}>SHA Network</label>
              <button onClick={()=>setForm(f=>({...f,inNetwork:!f.inNetwork}))}
                className="relative w-10 h-5 rounded-full transition-colors"
                style={{ background:form.inNetwork?"#14b8a6":"rgba(255,255,255,0.1)" }}>
                <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ transform:form.inNetwork?"translateX(20px)":"translateX(0)" }} />
              </button>
              <span className="text-xs" style={{ color:form.inNetwork?"#2dd4bf":"#64748b" }}>
                {form.inNetwork?"In-Network":"Out-of-Network"}
              </span>
            </div>
          </div>

          <div>
            <label className={labelCls}>Capabilities</label>
            <div className="flex flex-wrap gap-2">
              {CAPABILITY_OPTIONS.map(c=>{
                const sel=form.capabilities.includes(c);
                return (
                  <button key={c} onClick={()=>setForm(f=>({...f,capabilities:toggle(f.capabilities,c)}))}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all"
                    style={{ background:sel?"rgba(20,184,166,0.15)":"rgba(255,255,255,0.04)",
                             border:sel?"1px solid rgba(20,184,166,0.3)":"1px solid rgba(255,255,255,0.07)",
                             color:sel?"#2dd4bf":"#64748b" }}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className={labelCls}>Centres of Excellence</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(COE_COLOR).map(c=>{
                const sel=form.coe.includes(c);
                return (
                  <button key={c} onClick={()=>setForm(f=>({...f,coe:toggle(f.coe,c)}))}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all"
                    style={{ background:sel?`${COE_COLOR[c]}22`:"rgba(255,255,255,0.04)",
                             border:sel?`1px solid ${COE_COLOR[c]}55`:"1px solid rgba(255,255,255,0.07)",
                             color:sel?COE_COLOR[c]:"#64748b" }}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-400"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
            Cancel
          </button>
          <button onClick={submit} disabled={loading||!form.name||!form.lat||!form.lon}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow:"0 0 16px rgba(20,184,166,0.25)" }}>
            {loading?<><Loader2 className="w-4 h-4 animate-spin"/>Adding…</>:<><Check className="w-4 h-4"/>Add Facility</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */
export default function ReferralsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"active"|"network"|"analytics">("active");
  const [referrals, setReferrals] = useState<Referral[]>(SEED_REFERRALS);
  const [facilities, setFacilities] = useState<Facility[]>(KENYA_FACILITIES);
  const [selectedId, setSelectedId] = useState<string>("r1");
  const [showNewReferral, setShowNewReferral] = useState(false);
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const [netFilter, setNetFilter] = useState<"all"|"in"|"out">("all");
  const [levelFilter, setLevelFilter] = useState<"all"|"4"|"5"|"6">("all");
  const [facilitySearch, setFacilitySearch] = useState("");

  const selected = referrals.find(r=>r.id===selectedId) ?? referrals[0];
  const active   = referrals.filter(r=>r.status==="in_transit");
  const pending  = referrals.filter(r=>r.status==="pending"||r.status==="accepted");

  const HOME_FACILITY = { id:"litein", name:"AIC Litein Mission Hospital", county:"Kericho", lat:-0.5683, lon:35.2167 };

  const filteredFacilities = useMemo(() => facilities.filter(f => {
    const s = facilitySearch.toLowerCase();
    const matchS = s ? f.name.toLowerCase().includes(s)||f.county.toLowerCase().includes(s) : true;
    const matchN = netFilter==="all" ? true : netFilter==="in" ? f.inNetwork : !f.inNetwork;
    const matchL = levelFilter==="all" ? true : f.level===+levelFilter;
    return matchS && matchN && matchL;
  }), [facilities, facilitySearch, netFilter, levelFilter]);

  const handleAddReferral = (r: Referral) => {
    setReferrals(prev => [r, ...prev]);
    setSelectedId(r.id);
    setShowNewReferral(false);
    toast({ title:"Referral submitted", description:`${r.patient.name} → ${r.receiving.name}` });
  };

  const handleAddFacility = (f: Facility) => {
    setFacilities(prev => [...prev, f]);
    setShowAddFacility(false);
    toast({ title:"Facility added", description:`${f.name} added to the network` });
  };

  const TABS = [
    { id:"active",    label:"Active Referrals", icon:Ambulance, badge:active.length+pending.length },
    { id:"network",   label:"Facility Network", icon:Share2,    badge:0 },
    { id:"analytics", label:"Analytics",        icon:BarChart3, badge:0 },
  ];

  return (
    <div className="p-6 space-y-5 min-h-full" style={{ background:"var(--bg-primary)" }}>
      {showNewReferral && (
        <NewReferralWizard sendingFacility={HOME_FACILITY} onClose={()=>setShowNewReferral(false)} onSubmit={handleAddReferral} />
      )}
      {showAddFacility && (
        <AddFacilityModal onClose={()=>setShowAddFacility(false)} onAdd={handleAddFacility} />
      )}

      {/* Header */}
      <motion.div initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">UzimaReferral</h1>
            {active.length>0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background:"rgba(239,68,68,0.12)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.3)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 pulse-dot" />{active.length} LIVE
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm">Real-time facility referral & emergency patient tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
               style={{ background:"rgba(20,184,166,0.08)", border:"1px solid rgba(20,184,166,0.15)", color:"#2dd4bf" }}>
            <Wifi className="w-3.5 h-3.5" /><span>SHA Network: Online</span>
          </div>
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
            onClick={()=>setShowAddFacility(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"#94a3b8" }}>
            <Building2 className="w-4 h-4" />Add Facility
          </motion.button>
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
            onClick={()=>setShowNewReferral(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow:"0 0 20px rgba(20,184,166,0.3)" }}>
            <Plus className="w-4 h-4" />New Referral
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:"In Transit",       value:active.length,   icon:Ambulance,    color:"#ef4444", bg:"rgba(239,68,68,0.1)" },
          { label:"Awaiting Response",value:pending.length,  icon:Clock,        color:"#f59e0b", bg:"rgba(245,158,11,0.1)" },
          { label:"Completed Today",  value:5,               icon:CheckCircle2, color:"#10b981", bg:"rgba(16,185,129,0.1)" },
          { label:"Acceptance Rate",  value:"98%",           icon:Shield,       color:"#14b8a6", bg:"rgba(20,184,166,0.1)" },
        ].map((s,i)=>(
          <motion.div key={s.label} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }}
            transition={{ delay:i*0.07 }} className="glass-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:s.bg }}>
              <s.icon className="w-4 h-4" style={{ color:s.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white leading-none">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit"
           style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as typeof tab)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab===t.id?"text-white":"text-slate-500 hover:text-slate-300")}
            style={tab===t.id?{ background:"linear-gradient(135deg,rgba(20,184,166,0.2),rgba(8,145,178,0.1))", border:"1px solid rgba(20,184,166,0.25)" }:{}}>
            <t.icon className={cn("w-4 h-4", tab===t.id?"text-teal-400":"")} />
            {t.label}
            {t.badge>0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background:"rgba(239,68,68,0.2)", color:"#f87171" }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── ACTIVE TAB ─────────────────────────────────────────────── */}
        {tab==="active" && (
          <motion.div key="active" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }} className="space-y-4">
            <div className="grid grid-cols-12 gap-4">
              {/* Referral list */}
              <div className="col-span-4 space-y-2">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  All Referrals ({referrals.length})
                </h2>
                <div className="space-y-2 max-h-[540px] overflow-y-auto scrollbar-none pr-1">
                  {referrals.map((r,i)=>{
                    const pc=PRIORITY_CONFIG[r.priority];
                    const sc=STATUS_CONFIG[r.status]??STATUS_CONFIG.pending;
                    const StatusIcon=sc.icon;
                    const isSel=r.id===selectedId;
                    return (
                      <motion.button key={r.id} initial={{ opacity:0,x:-12 }} animate={{ opacity:1,x:0 }}
                        transition={{ delay:i*0.05 }} onClick={()=>setSelectedId(r.id)}
                        className="w-full text-left rounded-2xl p-4 transition-all"
                        style={{ background:isSel?"rgba(20,184,166,0.08)":"rgba(255,255,255,0.02)",
                                 border:isSel?"1px solid rgba(20,184,166,0.25)":"1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {pc.pulse&&r.status==="in_transit"&&<span className="w-1.5 h-1.5 rounded-full bg-red-400 pulse-dot" />}
                            <span className="text-xs font-bold" style={{ color:pc.color }}>{pc.label}</span>
                          </div>
                          <StatusIcon className="w-3.5 h-3.5" style={{ color:sc.color }} />
                        </div>
                        <p className="text-white font-semibold text-sm leading-tight">{r.patient.name}</p>
                        <p className="text-slate-500 text-xs mt-0.5 truncate">{r.diagnosis}</p>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <span className="truncate">{r.receiving.name}</span>
                        </div>
                        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full" style={{ width:`${r.progress}%`, background:pc.color, opacity:0.7 }} />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Live tracker + SHA packet */}
              <div className="col-span-8 space-y-4">
                <motion.div key={selectedId} initial={{ opacity:0,x:12 }} animate={{ opacity:1,x:0 }}
                  transition={{ duration:0.3 }} className="glass-card p-5">
                  <LiveTracker referral={selected} />
                </motion.div>
                <SHAHandoverPacket referral={selected} />
              </div>
            </div>

            {/* Map + AutoMatch */}
            <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.3 }}
              className="grid grid-cols-12 gap-4" style={{ minHeight:480 }}>
              <div className="col-span-7 rounded-2xl overflow-hidden"
                   style={{ background:"rgba(6,11,24,0.8)", border:"1px solid rgba(255,255,255,0.07)", minHeight:480 }}>
                <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-teal-400" />Kenya SHA Facility Network
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {facilities.filter(f=>f.inNetwork).length} in-network · Click any marker for details
                    </p>
                  </div>
                  {active.length>0 && (
                    <span className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
                          style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#f87171" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 pulse-dot" />Live Route Active
                    </span>
                  )}
                </div>
                <div style={{ height:420 }}>
                  <KenyaReferralMap
                    activeReferralFromId={selected.sending.id}
                    activeReferralToId={selected.receiving.id}
                    highlightIds={highlightIds}
                  />
                </div>
              </div>
              <div className="col-span-5 glass-card p-5" style={{ minHeight:480 }}>
                <AutoMatchPanel referral={selected} onSelect={f=>{ setHighlightIds([f.id]); toast({ title:`${f.name} highlighted`, description:`${f.county} · Level ${f.level}` }); }} />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── NETWORK TAB ────────────────────────────────────────────── */}
        {tab==="network" && (
          <motion.div key="network" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }} className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input value={facilitySearch} onChange={e=>setFacilitySearch(e.target.value)}
                  placeholder="Search facilities…" className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl focus:outline-none"
                  style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"#f0f4ff" }} />
              </div>
              {(["all","in","out"] as const).map(v=>(
                <button key={v} onClick={()=>setNetFilter(v)}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{ background:netFilter===v?"rgba(20,184,166,0.15)":"rgba(255,255,255,0.04)",
                           border:netFilter===v?"1px solid rgba(20,184,166,0.3)":"1px solid rgba(255,255,255,0.07)",
                           color:netFilter===v?"#2dd4bf":"#64748b" }}>
                  {v==="all"?"All Network":v==="in"?"✓ In-Network":"⚠ Out-of-Network"}
                </button>
              ))}
              {(["all","6","5","4"] as const).map(v=>(
                <button key={v} onClick={()=>setLevelFilter(v)}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{ background:levelFilter===v?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.04)",
                           border:levelFilter===v?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(255,255,255,0.07)",
                           color:levelFilter===v?"#60a5fa":"#64748b" }}>
                  {v==="all"?"All Levels":`L${v}`}
                </button>
              ))}
              <span className="text-xs text-slate-500 ml-auto">{filteredFacilities.length} facilities</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredFacilities.map((f,i)=>(
                <motion.div key={f.id} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.03 }}>
                  <FacilityCard facility={f} onSelect={()=>{ setTab("active"); setHighlightIds([f.id]); }} />
                </motion.div>
              ))}
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(255,255,255,0.07)", minHeight:460 }}>
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-teal-400" />Full Kenya Network Map
                </h3>
                <button onClick={()=>setShowAddFacility(true)}
                  className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background:"rgba(20,184,166,0.1)", border:"1px solid rgba(20,184,166,0.2)", color:"#2dd4bf" }}>
                  <Plus className="w-3.5 h-3.5" />Add Facility
                </button>
              </div>
              <div style={{ height:420 }}>
                <KenyaReferralMap highlightIds={highlightIds} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── ANALYTICS TAB ──────────────────────────────────────────── */}
        {tab==="analytics" && (
          <motion.div key="analytics" initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}>
            <AnalyticsTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
