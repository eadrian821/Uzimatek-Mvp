"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Filter, Search, Send, RefreshCw, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, Clock, XCircle, FileText, Loader2,
  Eye, X, Sparkles, Shield, Phone, MapPin, Activity,
  TrendingUp, TrendingDown, Calendar, ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatKes, formatDate, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ClaimStatus = "all" | "draft" | "pending_review" | "approved" | "submitted" | "denied" | "paid";

interface ClaimItem {
  id: string; status: string; totalAmount: number; confidenceBand: string;
  hasFlags: boolean; claimNumber: string | null; createdAt: string;
  encounter: { patientName: string; patientShaNumber: string; visitDate: string; visitType: string; provider: { name: string } };
  lines: unknown[]; _count: { denials: number };
}

const MOCK_CLAIMS: ClaimItem[] = [
  { id:"c1", status:"pending_review", totalAmount:5800,  confidenceBand:"medium", hasFlags:true,  claimNumber:null,                     createdAt:new Date().toISOString(),                       encounter:{patientName:"Mary Achieng",   patientShaNumber:"SHA2024001234", visitDate:new Date().toISOString(),                        visitType:"outpatient", provider:{name:"Dr. Grace Otieno"}  }, lines:[{},{}],     _count:{denials:0} },
  { id:"c2", status:"pending_review", totalAmount:12400, confidenceBand:"high",   hasFlags:false, claimNumber:null,                     createdAt:new Date(Date.now()-3600000).toISOString(),     encounter:{patientName:"John Kamau",     patientShaNumber:"SHA2024005678", visitDate:new Date(Date.now()-86400000).toISOString(),    visitType:"inpatient", provider:{name:"Dr. Samuel Kipchoge"}}, lines:[{},{},{},{}], _count:{denials:0} },
  { id:"c3", status:"submitted",      totalAmount:3200,  confidenceBand:"high",   hasFlags:false, claimNumber:"SHA-1716234567-ABCD12",  createdAt:new Date(Date.now()-86400000).toISOString(),    encounter:{patientName:"Fatuma Hassan",  patientShaNumber:"SHA2024009012", visitDate:new Date(Date.now()-2*86400000).toISOString(), visitType:"maternity", provider:{name:"Dr. Grace Otieno"}  }, lines:[{},{}],     _count:{denials:0} },
  { id:"c4", status:"denied",         totalAmount:7600,  confidenceBand:"low",    hasFlags:true,  claimNumber:"SHA-1716100000-XYZ789",  createdAt:new Date(Date.now()-2*86400000).toISOString(),  encounter:{patientName:"Peter Otieno",   patientShaNumber:"SHA2024011111", visitDate:new Date(Date.now()-3*86400000).toISOString(), visitType:"emergency", provider:{name:"Dr. Samuel Kipchoge"}}, lines:[{}],        _count:{denials:1} },
  { id:"c5", status:"paid",           totalAmount:4500,  confidenceBand:"high",   hasFlags:false, claimNumber:"SHA-1715900000-PQR456",  createdAt:new Date(Date.now()-5*86400000).toISOString(),  encounter:{patientName:"Grace Wanjiku",  patientShaNumber:"SHA2024022222", visitDate:new Date(Date.now()-6*86400000).toISOString(), visitType:"maternity", provider:{name:"Dr. Grace Otieno"}  }, lines:[{},{},{}],   _count:{denials:0} },
  { id:"c6", status:"pending_review", totalAmount:2100,  confidenceBand:"medium", hasFlags:true,  claimNumber:null,                     createdAt:new Date(Date.now()-7200000).toISOString(),     encounter:{patientName:"Samuel Mwangi", patientShaNumber:"SHA2024033333", visitDate:new Date(Date.now()-86400000).toISOString(),   visitType:"outpatient", provider:{name:"Dr. Grace Otieno"}  }, lines:[{}],        _count:{denials:0} },
];

const PATIENT_CONTEXT: Record<string, {
  shaStatus: string; coverage: string; balance: string; county: string;
  phone: string; sex: string; bloodGroup: string;
  conditions: string[]; allergies: string[];
  claimHistory: { status: string; amount: number; date: string }[];
}> = {
  SHA2024001234: { shaStatus:"Active", coverage:"Enhanced Benefit Package", balance:"KES 48,200", county:"Nairobi",  phone:"+254722000001", sex:"F", bloodGroup:"A+",  conditions:["Hypertension","Type 2 Diabetes"],  allergies:["Penicillin","NSAIDs"],   claimHistory:[{status:"paid",amount:3200,date:"2025-04-12"},{status:"submitted",amount:5800,date:"2025-05-15"}] },
  SHA2024005678: { shaStatus:"Active", coverage:"Basic Benefit Package",    balance:"KES 22,500", county:"Kiambu",   phone:"+254733000002", sex:"M", bloodGroup:"O+",  conditions:["Appendicitis"],                    allergies:[],                        claimHistory:[{status:"pending_review",amount:12400,date:"2025-05-14"}] },
  SHA2024009012: { shaStatus:"Active", coverage:"Maternity Package",         balance:"KES 65,000", county:"Mombasa",  phone:"+254744000003", sex:"F", bloodGroup:"B+",  conditions:["Severe Pre-eclampsia","38w Gestation"], allergies:["Latex"],            claimHistory:[{status:"submitted",amount:3200,date:"2025-05-13"}] },
  SHA2024011111: { shaStatus:"Active", coverage:"Basic Benefit Package",     balance:"KES 18,750", county:"Kericho",  phone:"+254755000004", sex:"M", bloodGroup:"AB+", conditions:["Fracture of Femur","Polytrauma"], allergies:[],                        claimHistory:[{status:"denied",amount:7600,date:"2025-05-12"}] },
  SHA2024022222: { shaStatus:"Active", coverage:"Enhanced Benefit Package",  balance:"KES 55,000", county:"Nakuru",   phone:"+254766000005", sex:"F", bloodGroup:"O-",  conditions:["LSCS — Elective"],                allergies:["Codeine"],               claimHistory:[{status:"paid",amount:4500,date:"2025-05-08"}] },
  SHA2024033333: { shaStatus:"Active", coverage:"Basic Benefit Package",     balance:"KES 12,300", county:"Kisumu",   phone:"+254777000006", sex:"M", bloodGroup:"A-",  conditions:["URI","Malaria (treated)"],         allergies:[],                        claimHistory:[{status:"pending_review",amount:2100,date:"2025-05-15"}] },
};

const WORKFLOW_STEPS = ["Draft","Coded","Pending Review","Submitted","SHA Review","Paid"];
const WORKFLOW_MAP: Record<string, number> = {
  draft:0, pending_review:2, approved:2, submitted:3, denied:3, paid:5,
};

const STATUS_TABS: { value: ClaimStatus; label: string }[] = [
  { value:"all",            label:"All"           },
  { value:"pending_review", label:"Pending"       },
  { value:"draft",          label:"Draft"         },
  { value:"submitted",      label:"Submitted"     },
  { value:"denied",         label:"Denied"        },
  { value:"paid",           label:"Paid"          },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  paid:           { color:"#10b981", bg:"rgba(16,185,129,0.12)",  icon:CheckCircle2 },
  denied:         { color:"#ef4444", bg:"rgba(239,68,68,0.12)",   icon:XCircle      },
  submitted:      { color:"#8b5cf6", bg:"rgba(139,92,246,0.12)",  icon:Send         },
  pending_review: { color:"#3b82f6", bg:"rgba(59,130,246,0.12)",  icon:Clock        },
  approved:       { color:"#10b981", bg:"rgba(16,185,129,0.12)",  icon:CheckCircle2 },
  draft:          { color:"#64748b", bg:"rgba(100,116,139,0.12)", icon:FileText     },
};

const CONFIDENCE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  high:   { color:"#10b981", bg:"rgba(16,185,129,0.12)", label:"High"   },
  medium: { color:"#f59e0b", bg:"rgba(245,158,11,0.12)", label:"Medium" },
  low:    { color:"#ef4444", bg:"rgba(239,68,68,0.12)",  label:"Low"    },
};

const VISIT_COLOR: Record<string,string> = {
  outpatient:"#14b8a6", inpatient:"#3b82f6", emergency:"#ef4444",
  maternity:"#ec4899",  day_case:"#8b5cf6",
};

/* ── Keyboard navigation hook ─────────────────────────── */
function useTableKeyboard(claims: ClaimItem[], activeId: string | null, setActiveId: (id: string | null) => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!claims.length) return;
      const idx = activeId ? claims.findIndex(c => c.id === activeId) : -1;
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveId(claims[Math.min(idx + 1, claims.length - 1)].id); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActiveId(claims[Math.max(idx - 1, 0)].id); }
      if (e.key === "Escape")    setActiveId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [claims, activeId, setActiveId]);
}

/* ── Patient Context Panel ────────────────────────────── */
function ContextPanel({ claim, onClose }: { claim: ClaimItem; onClose: () => void }) {
  const ctx = PATIENT_CONTEXT[claim.encounter.patientShaNumber];
  const step = WORKFLOW_MAP[claim.status] ?? 0;

  return (
    <motion.div
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="context-panel scrollbar-none"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 px-5 py-4 flex items-start justify-between"
           style={{ background: "rgba(12,22,40,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base flex-shrink-0"
               style={{ background: ctx?.sex === "F" ? "linear-gradient(135deg,#ec4899,#db2777)" : "linear-gradient(135deg,#14b8a6,#0891b2)" }}>
            {claim.encounter.patientName.charAt(0)}
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-tight">{claim.encounter.patientName}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{claim.encounter.patientShaNumber}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-5">

        {/* SHA status */}
        {ctx && (
          <div className="rounded-xl p-3.5"
               style={{ background: "rgba(20,184,166,0.07)", border: "1px solid rgba(20,184,166,0.15)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-semibold text-teal-300 font-display">SHA Coverage</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "rgba(16,185,129,0.15)", color: "#4ade80" }}>
                {ctx.shaStatus}
              </span>
            </div>
            <p className="text-sm font-semibold text-white mb-0.5">{ctx.coverage}</p>
            <p className="text-xs text-slate-400">Available balance: <span className="text-emerald-400 font-semibold">{ctx.balance}</span></p>
          </div>
        )}

        {/* Workflow bar */}
        <div>
          <p className="text-xs font-semibold text-slate-400 mb-3 font-display uppercase tracking-wider">Claim Workflow</p>
          <div className="relative">
            {/* Track */}
            <div className="flex items-center gap-0">
              {WORKFLOW_STEPS.map((s, i) => {
                const done   = i < step;
                const active = i === step;
                const color  = done || active ? "#14b8a6" : "rgba(255,255,255,0.1)";
                return (
                  <div key={s} className="flex flex-col items-center flex-1">
                    <div className="flex items-center w-full">
                      {i > 0 && (
                        <div className="flex-1 h-0.5" style={{ background: done ? "#14b8a6" : "rgba(255,255,255,0.08)" }} />
                      )}
                      <motion.div
                        animate={{ scale: active ? [1, 1.15, 1] : 1 }}
                        transition={{ duration: 1.5, repeat: active ? Infinity : 0, ease: "easeInOut" }}
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: color, boxShadow: active ? "0 0 8px rgba(20,184,166,0.6)" : "none" }}
                      />
                      {i < WORKFLOW_STEPS.length - 1 && (
                        <div className="flex-1 h-0.5" style={{ background: done ? "#14b8a6" : "rgba(255,255,255,0.08)" }} />
                      )}
                    </div>
                    <p className="text-center mt-1.5 leading-tight"
                       style={{ fontSize: 9, color: active ? "#2dd4bf" : done ? "#64748b" : "#334155" }}>
                      {s}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Claim details */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-slate-400 font-display uppercase tracking-wider">Claim Details</p>
          {[
            { label: "Amount", value: formatKes(claim.totalAmount), mono: false },
            { label: "Visit Type", value: claim.encounter.visitType.replace("_"," "), mono: false },
            { label: "Visit Date", value: formatDate(claim.encounter.visitDate), mono: false },
            { label: "Provider", value: claim.encounter.provider?.name, mono: false },
            ...(claim.claimNumber ? [{ label: "Claim #", value: claim.claimNumber.slice(-12), mono: true }] : []),
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{item.label}</span>
              <span className={cn("text-xs text-slate-300 font-medium", item.mono && "font-mono")}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* AI confidence */}
        <div className="rounded-xl p-3.5"
             style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-slate-300 font-display">AI Confidence</span>
            </div>
            {(() => {
              const cs = CONFIDENCE_STYLE[claim.confidenceBand] || CONFIDENCE_STYLE.medium;
              return (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: cs.bg, color: cs.color }}>
                  {cs.label}
                </span>
              );
            })()}
          </div>
          {claim.hasFlags && (
            <div className="flex items-start gap-2 mt-2 p-2 rounded-lg"
                 style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80 leading-relaxed">
                Flags detected — review before submission. Check ICD codes and documentation completeness.
              </p>
            </div>
          )}
        </div>

        {/* Patient info */}
        {ctx && (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-slate-400 font-display uppercase tracking-wider">Patient Info</p>
            {[
              { icon: Phone,   value: ctx.phone   },
              { icon: MapPin,  value: ctx.county   },
              { icon: Activity,value: `${ctx.bloodGroup} · ${ctx.sex === "F" ? "Female" : "Male"}` },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-slate-400">
                <item.icon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                {item.value}
              </div>
            ))}

            {ctx.conditions.length > 0 && (
              <div>
                <p className="text-xs text-slate-600 mb-1.5">Active Conditions</p>
                <div className="flex flex-wrap gap-1.5">
                  {ctx.conditions.map(c => (
                    <span key={c} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(59,130,246,0.1)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.15)" }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {ctx.allergies.length > 0 && (
              <div>
                <p className="text-xs text-slate-600 mb-1.5">Allergies</p>
                <div className="flex flex-wrap gap-1.5">
                  {ctx.allergies.map(a => (
                    <span key={a} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.15)" }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Claim history */}
        {ctx && ctx.claimHistory.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 font-display uppercase tracking-wider mb-2.5">Claim History</p>
            <div className="space-y-2">
              {ctx.claimHistory.map((h, i) => {
                const ss = STATUS_STYLE[h.status] || STATUS_STYLE.draft;
                const StatusIcon = ss.icon;
                return (
                  <div key={i} className="flex items-center gap-3 py-2"
                       style={{ borderBottom: i < ctx.claimHistory.length - 1 ? "1px solid rgba(255,255,255,0.05)" : undefined }}>
                    <StatusIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: ss.color }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                              style={{ background: ss.bg, color: ss.color, fontSize: 10 }}>
                          {h.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{h.date}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-300 tabular-nums">{formatKes(h.amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1">
          {["draft","pending_review","approved"].includes(claim.status) && (
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow: "0 0 16px rgba(20,184,166,0.25)" }}>
              <Send className="w-4 h-4" />Submit to SHA
            </button>
          )}
          {claim.status === "denied" && (
            <Link href={`/denials?claimId=${claim.id}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-300"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <RefreshCw className="w-4 h-4" />Appeal Denial
            </Link>
          )}
          <Link href={`/claims/${claim.id}`}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <Eye className="w-4 h-4" />View Full Claim
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main page ────────────────────────────────────────── */
export default function ClaimsPage() {
  const { toast }   = useToast();
  const qc          = useQueryClient();
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [statusFilter, setStatus]   = useState<ClaimStatus>("all");
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [activeClaim, setActiveClaim] = useState<ClaimItem | null>(null);
  const [sortCol, setSortCol]       = useState<"date" | "amount" | "status">("date");
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // initialData (not placeholderData) so status is immediately 'success',
  // isLoading is always false, and the skeleton never flashes over real rows.
  const { data } = useQuery({
    queryKey: ["claims"],
    queryFn: () => api.getClaims({ pageSize: 100 }),
    initialData: { items: MOCK_CLAIMS, total: MOCK_CLAIMS.length, page: 1, pageSize: 100 },
    initialDataUpdatedAt: 0,
    staleTime: Infinity,
    retry: false,
    select: (d) => d as { items: ClaimItem[]; total: number; page: number; pageSize: number },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => { setSubmittingId(id); return api.submitClaim(id); },
    onSuccess: (result, id) => {
      setSubmittingId(null);
      if (result.success) {
        // Update cache in-place — never triggers a refetch/flicker cycle.
        qc.setQueryData(["claims"], (old: { items: ClaimItem[] } | undefined) => {
          if (!old) return old;
          return { ...old, items: old.items.map(c => c.id === id ? { ...c, status: "submitted", claimNumber: `SHA-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}` } : c) };
        });
        toast({ title: "Claim submitted to SHA", description: "Status updated to Submitted." });
      } else {
        toast({ title: "Submission failed", variant: "destructive" });
      }
    },
    onError: () => { setSubmittingId(null); toast({ title: "Submission failed", variant: "destructive" }); },
  });

  const bulkSubmitMutation = useMutation({
    mutationFn: (ids: string[]) => api.bulkSubmitClaims(ids),
    onSuccess: (result, ids) => {
      qc.setQueryData(["claims"], (old: { items: ClaimItem[] } | undefined) => {
        if (!old) return old;
        const idSet = new Set(ids);
        return { ...old, items: old.items.map(c => idSet.has(c.id) ? { ...c, status: "submitted" } : c) };
      });
      toast({ title: `${result.submitted} claims submitted to SHA` });
      setSelected(new Set());
    },
  });

  // Stable data anchor — reference only changes when the server returns new items.
  const allClaims = useMemo(() => data?.items ?? MOCK_CLAIMS, [data]);

  // Keep activeClaim pointer fresh when allClaims reference changes.
  useEffect(() => {
    if (!activeClaim) return;
    const fresh = allClaims.find(c => c.id === activeClaim.id);
    if (!fresh) { setActiveClaim(null); return; }
    if (fresh !== activeClaim) setActiveClaim(fresh);
  }, [allClaims]); // eslint-disable-line react-hooks/exhaustive-deps

  // All filtering, sorting, pagination — pure client-side, no network involved.
  const displayClaims = useMemo(() => {
    let result = allClaims;

    // Status filter
    if (statusFilter !== "all") result = result.filter(c => c.status === statusFilter);

    // Search (uses debounced value so every keystroke doesn't re-sort a large list)
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(c =>
        c.encounter.patientName.toLowerCase().includes(q) ||
        c.encounter.patientShaNumber.includes(q) ||
        (c.claimNumber && c.claimNumber.toLowerCase().includes(q))
      );
    }

    // Sort — actually applied
    result = [...result].sort((a, b) => {
      let av = 0, bv = 0;
      if (sortCol === "amount") { av = a.totalAmount; bv = b.totalAmount; }
      else if (sortCol === "date") { av = new Date(a.encounter.visitDate).getTime(); bv = new Date(b.encounter.visitDate).getTime(); }
      else if (sortCol === "status") { av = a.status.charCodeAt(0); bv = b.status.charCodeAt(0); }
      return sortDir === "asc" ? av - bv : bv - av;
    });

    return result;
  }, [allClaims, statusFilter, debouncedSearch, sortCol, sortDir]);

  // Client-side pagination
  const PAGE_SIZE = 20;
  const total      = displayClaims.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const searchedClaims = displayClaims.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  const toggleAll    = () => setSelected(selected.size === searchedClaims.length ? new Set() : new Set(searchedClaims.map(c => c.id)));

  const setActiveId = useCallback((id: string | null) => {
    setActiveClaim(id ? (searchedClaims.find(c => c.id === id) ?? null) : null);
  }, [searchedClaims]);

  useTableKeyboard(searchedClaims, activeClaim?.id ?? null, setActiveId);

  const sortHeader = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
    setPage(1);
  };

  const summaryStats = useMemo(() => ({
    pending:    allClaims.filter(c => c.status === "pending_review").length,
    submitted:  allClaims.filter(c => c.status === "submitted").length,
    denied:     allClaims.filter(c => c.status === "denied").length,
    totalValue: allClaims.reduce((s, c) => s + c.totalAmount, 0),
  }), [allClaims]);

  return (
    <div className="flex h-full" style={{ background: "var(--bg-primary)" }}>
      {/* ── Main claims area ── */}
      <div className={cn("flex flex-col flex-1 min-w-0 p-5 transition-all duration-300", activeClaim ? "pr-[376px]" : "")}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Claims Workbench</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {total.toLocaleString()} claims ·{" "}
              <span className="text-blue-400">{summaryStats.pending} pending</span>{" · "}
              <span className="text-red-400">{summaryStats.denied} denied</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <AnimatePresence>
              {selected.size > 0 && (
                <motion.button initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  onClick={() => bulkSubmitMutation.mutate([...selected])} disabled={bulkSubmitMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow: "0 0 20px rgba(20,184,166,0.3)" }}>
                  {bulkSubmitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit {selected.size}
                </motion.button>
              )}
            </AnimatePresence>
            <Link href="/encounters"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#94a3b8" }}>
              <FileText className="w-4 h-4" />New Encounter
            </Link>
          </div>
        </motion.div>

        {/* Summary bar */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label:"Pending Review", value: summaryStats.pending,    color:"#3b82f6", bg:"rgba(59,130,246,0.08)", click: () => { setStatus("pending_review"); setPage(1); } },
            { label:"Submitted",      value: summaryStats.submitted, color:"#8b5cf6", bg:"rgba(139,92,246,0.08)", click: () => { setStatus("submitted");       setPage(1); } },
            { label:"Denied",         value: summaryStats.denied,    color:"#ef4444", bg:"rgba(239,68,68,0.08)",  click: () => { setStatus("denied");           setPage(1); } },
            { label:"Total Value",    value: `KES ${(summaryStats.totalValue/1000).toFixed(0)}K`, color:"#14b8a6", bg:"rgba(20,184,166,0.08)", click: () => { setStatus("all"); setPage(1); } },
          ].map(s => (
            <motion.button key={s.label} whileHover={{ y: -1 }} onClick={s.click}
              className="rounded-xl px-3 py-2.5 text-left transition-all"
              style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
              <p className="font-display text-xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </motion.button>
          ))}
        </div>

        {/* Table card */}
        <div className="rounded-2xl flex-1 overflow-hidden flex flex-col" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>

          {/* Tabs */}
          <div className="flex overflow-x-auto px-2 pt-2 gap-0.5 scrollbar-none"
               style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
            {STATUS_TABS.map(tab => {
              const cnt = tab.value === "all" ? allClaims.length : allClaims.filter(c => c.status === tab.value).length;
              return (
                <button key={tab.value} onClick={() => { setStatus(tab.value); setPage(1); setActiveClaim(null); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-all mb-[-1px]",
                    statusFilter === tab.value ? "text-teal-300 border-b-2 border-teal-400" : "text-slate-500 hover:text-slate-300"
                  )}
                  style={statusFilter === tab.value ? { background: "rgba(20,184,166,0.07)" } : {}}>
                  {tab.label}
                  {cnt > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full tabular-nums"
                    style={{ background: statusFilter === tab.value ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.07)", color: statusFilter === tab.value ? "#2dd4bf" : "#64748b" }}>
                    {cnt}
                  </span>}
                </button>
              );
            })}
          </div>

          {/* Search + filter */}
          <div className="px-4 py-2.5 flex items-center gap-3"
               style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input value={search}
                onChange={e => {
                  const val = e.target.value;
                  setSearch(val);
                  setPage(1);
                  if (searchDebounce.current) clearTimeout(searchDebounce.current);
                  searchDebounce.current = setTimeout(() => setDebouncedSearch(val), 150);
                }}
                placeholder="Patient, SHA number, claim #…"
                className="w-full pl-8 pr-8 py-2 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500/40"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f4ff" }} />
              {search && (
                <button onClick={() => { setSearch(""); setDebouncedSearch(""); setPage(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 px-3 py-2 rounded-xl transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
              <Filter className="w-3.5 h-3.5" />Filters
            </button>
            <p className="text-xs text-slate-600 ml-auto">↑↓ navigate · click to inspect</p>
          </div>

          {/* Table */}
          <div className="overflow-auto flex-1 scrollbar-none">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr style={{ background: "rgba(6,11,24,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="px-4 py-3 text-left w-10">
                    <input type="checkbox" checked={selected.size === searchedClaims.length && searchedClaims.length > 0}
                           onChange={toggleAll} style={{ accentColor: "#14b8a6" }} />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-display">Patient</th>
                  {/* Sort-able header helper */}
                  {(["date","status"] as const).map((col, hi) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider font-display cursor-pointer select-none"
                        style={{ color: sortCol === col ? "#2dd4bf" : "#64748b" }}
                        onClick={() => sortHeader(col)}>
                      <span className="flex items-center gap-1">
                        {hi === 0 ? "Visit" : "Status"}
                        <ChevronDown className={cn("w-3 h-3 transition-transform", sortCol === col && sortDir === "asc" ? "rotate-180" : "")}
                                     style={{ opacity: sortCol === col ? 1 : 0.4 }} />
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-display">AI Score</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider font-display cursor-pointer select-none"
                      style={{ color: sortCol === "amount" ? "#2dd4bf" : "#64748b" }}
                      onClick={() => sortHeader("amount")}>
                    <span className="flex items-center justify-end gap-1">
                      Amount
                      <ChevronDown className={cn("w-3 h-3 transition-transform", sortCol === "amount" && sortDir === "asc" ? "rotate-180" : "")}
                                   style={{ opacity: sortCol === "amount" ? 1 : 0.4 }} />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-display">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-display">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchedClaims.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-slate-700" />
                        <p className="text-slate-500 text-sm font-medium">
                          {debouncedSearch ? `No claims match "${debouncedSearch}"` : "No claims in this category"}
                        </p>
                        {(debouncedSearch || statusFilter !== "all") && (
                          <button onClick={() => { setSearch(""); setDebouncedSearch(""); setStatus("all"); setPage(1); }}
                            className="text-xs text-teal-400 hover:text-teal-300 transition-colors mt-1">
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : searchedClaims.map((claim) => {
                  const ss = STATUS_STYLE[claim.status] || STATUS_STYLE.draft;
                  const cs = CONFIDENCE_STYLE[claim.confidenceBand] || CONFIDENCE_STYLE.medium;
                  const StatusIcon = ss.icon;
                  const vtColor = VISIT_COLOR[claim.encounter.visitType] || "#64748b";
                  const isSelected = selected.has(claim.id);
                  const isActive = activeClaim?.id === claim.id;

                  // Row bg: active (context panel open) > selected (checkbox) > hover
                  const rowBg = isActive
                    ? "rgba(20,184,166,0.08)"
                    : isSelected
                    ? "rgba(20,184,166,0.04)"
                    : "transparent";

                  return (
                    <tr key={claim.id}
                      onClick={() => setActiveClaim(isActive ? null : claim)}
                      className="cursor-pointer"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: rowBg,
                        borderLeft: isActive ? "2px solid #14b8a6" : "2px solid transparent",
                        transition: "background 0.12s, border-color 0.12s",
                      }}
                      onMouseEnter={e => { if (!isActive && !isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
                    >
                      <td className="px-4 py-3.5" onClick={e => { e.stopPropagation(); toggleSelect(claim.id); }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(claim.id)}
                               style={{ accentColor: "#14b8a6" }} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white text-sm">{claim.encounter.patientName}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{claim.encounter.patientShaNumber}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-300 text-xs">{formatDate(claim.encounter.visitDate)}</div>
                        <span className="text-xs font-medium capitalize px-1.5 py-0.5 rounded-full mt-1 inline-block"
                              style={{ background: `${vtColor}15`, color: vtColor, border: `1px solid ${vtColor}25`, fontSize: 10 }}>
                          {claim.encounter.visitType.replace("_"," ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon className="w-3.5 h-3.5" style={{ color: ss.color }} />
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                                style={{ background: ss.bg, color: ss.color }}>
                            {claim.status.replace("_"," ")}
                          </span>
                        </div>
                        {claim.hasFlags && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            <span className="text-xs text-amber-500">Flagged</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: cs.bg, color: cs.color }}>{cs.label}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-display font-bold text-white tabular-nums text-sm">
                          {formatKes(claim.totalAmount)}
                        </span>
                        <div className="text-xs text-slate-600 mt-0.5">{claim.lines.length} lines</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs truncate max-w-[120px]">{claim.encounter.provider?.name}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setActiveClaim(isActive ? null : claim)}
                            className="p-1.5 rounded-lg transition-colors text-slate-500 hover:text-teal-400"
                            style={{ background: "rgba(255,255,255,0.04)" }} title="Inspect">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {["draft","pending_review","approved"].includes(claim.status) && (
                            <button onClick={() => submitMutation.mutate(claim.id)} disabled={submittingId === claim.id}
                              className="p-1.5 rounded-lg transition-colors text-slate-500 hover:text-teal-400"
                              style={{ background: "rgba(255,255,255,0.04)" }} title="Submit to SHA">
                              {submittingId === claim.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" /> : <Send className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          {claim.status === "denied" && (
                            <Link href={`/denials?claimId=${claim.id}`}
                              className="p-1.5 rounded-lg transition-colors text-red-500 hover:text-red-400"
                              style={{ background: "rgba(239,68,68,0.08)" }} title="Appeal">
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
                 style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
              <p className="text-xs text-slate-500">
                {(page-1)*20+1}–{Math.min(page*20,total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                  className="p-1.5 rounded-lg disabled:opacity-40 text-slate-400 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-400 tabular-nums px-1">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                  className="p-1.5 rounded-lg disabled:opacity-40 text-slate-400 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Context panel ──────────────────────────────── */}
      <AnimatePresence>
        {activeClaim && <ContextPanel claim={activeClaim} onClose={() => setActiveClaim(null)} />}
      </AnimatePresence>
    </div>
  );
}
