"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Filter, Search, Send, RefreshCw,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  Clock, XCircle, FileText, Loader2, Eye,
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
  { id: "c1", status: "pending_review", totalAmount: 5800, confidenceBand: "medium", hasFlags: true,  claimNumber: null, createdAt: new Date().toISOString(), encounter: { patientName: "Mary Achieng",  patientShaNumber: "SHA2024001234", visitDate: new Date().toISOString(),                         visitType: "outpatient", provider: { name: "Dr. Grace Otieno"   } }, lines: [{},{}],     _count: { denials: 0 } },
  { id: "c2", status: "pending_review", totalAmount: 12400, confidenceBand: "high",  hasFlags: false, claimNumber: null, createdAt: new Date(Date.now()-3600000).toISOString(), encounter: { patientName: "John Kamau",    patientShaNumber: "SHA2024005678", visitDate: new Date(Date.now()-86400000).toISOString(),  visitType: "inpatient", provider: { name: "Dr. Samuel Kipchoge" } }, lines: [{},{},{},{}], _count: { denials: 0 } },
  { id: "c3", status: "submitted",      totalAmount: 3200,  confidenceBand: "high",  hasFlags: false, claimNumber: "SHA-1716234567-ABCD12", createdAt: new Date(Date.now()-86400000).toISOString(), encounter: { patientName: "Fatuma Hassan", patientShaNumber: "SHA2024009012", visitDate: new Date(Date.now()-2*86400000).toISOString(), visitType: "outpatient", provider: { name: "Dr. Grace Otieno"   } }, lines: [{},{}],     _count: { denials: 0 } },
  { id: "c4", status: "denied",         totalAmount: 7600,  confidenceBand: "low",   hasFlags: true,  claimNumber: "SHA-1716100000-XYZ789", createdAt: new Date(Date.now()-2*86400000).toISOString(), encounter: { patientName: "Peter Otieno",  patientShaNumber: "SHA2024011111", visitDate: new Date(Date.now()-3*86400000).toISOString(), visitType: "emergency", provider: { name: "Dr. Samuel Kipchoge" } }, lines: [{}],        _count: { denials: 1 } },
  { id: "c5", status: "paid",           totalAmount: 4500,  confidenceBand: "high",  hasFlags: false, claimNumber: "SHA-1715900000-PQR456", createdAt: new Date(Date.now()-5*86400000).toISOString(), encounter: { patientName: "Grace Wanjiku", patientShaNumber: "SHA2024022222", visitDate: new Date(Date.now()-6*86400000).toISOString(), visitType: "maternity", provider: { name: "Dr. Grace Otieno"   } }, lines: [{},{},{}],   _count: { denials: 0 } },
  { id: "c6", status: "pending_review", totalAmount: 2100,  confidenceBand: "medium",hasFlags: true,  claimNumber: null, createdAt: new Date(Date.now()-7200000).toISOString(), encounter: { patientName: "Samuel Mwangi", patientShaNumber: "SHA2024033333", visitDate: new Date(Date.now()-86400000).toISOString(),  visitType: "outpatient", provider: { name: "Dr. Grace Otieno"   } }, lines: [{}],        _count: { denials: 0 } },
];

const STATUS_TABS: { value: ClaimStatus; label: string }[] = [
  { value: "all",            label: "All Claims"      },
  { value: "pending_review", label: "Pending Review"  },
  { value: "draft",          label: "Draft"           },
  { value: "submitted",      label: "Submitted"       },
  { value: "denied",         label: "Denied"          },
  { value: "paid",           label: "Paid"            },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  paid:           { color: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: CheckCircle2 },
  denied:         { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: XCircle      },
  submitted:      { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  icon: Send         },
  pending_review: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  icon: Clock        },
  approved:       { color: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: CheckCircle2 },
  draft:          { color: "#64748b", bg: "rgba(100,116,139,0.12)", icon: FileText     },
};

const CONFIDENCE_STYLE: Record<string, { color: string; bg: string }> = {
  high:   { color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  low:    { color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
};

export default function ClaimsPage() {
  const { toast }      = useToast();
  const queryClient    = useQueryClient();
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [statusFilter, setStatus] = useState<ClaimStatus>("all");
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["claims", { statusFilter, search, page }],
    queryFn: () => api.getClaims({ ...(statusFilter !== "all" ? { status: statusFilter } : {}), ...(search ? { search } : {}), page, pageSize: 20 }),
    placeholderData: { items: MOCK_CLAIMS, total: MOCK_CLAIMS.length, page: 1, pageSize: 20 },
    select: (d) => d as { items: ClaimItem[]; total: number; page: number; pageSize: number },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => api.submitClaim(id),
    onSuccess: (result) => {
      toast({ title: result.success ? "Claim submitted to SHA" : "Submission failed", variant: result.success ? "default" : "destructive" });
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
  });

  const bulkSubmitMutation = useMutation({
    mutationFn: (ids: string[]) => api.bulkSubmitClaims(ids),
    onSuccess: (result) => {
      toast({ title: `Submitted ${result.submitted} claims to SHA` });
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
  });

  const claims    = data?.items || MOCK_CLAIMS;
  const total     = data?.total || MOCK_CLAIMS.length;
  const totalPages = Math.ceil(total / 20);
  const toggleSelect = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  const toggleAll    = () => setSelected(selected.size === claims.length ? new Set() : new Set(claims.map(c => c.id)));

  return (
    <div className="p-6 min-h-full" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Claims Workbench</h1>
          <p className="text-slate-400 text-sm mt-1">{total.toLocaleString()} claims · {MOCK_CLAIMS.filter(c => c.status === "pending_review").length} pending review</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <motion.button initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              onClick={() => bulkSubmitMutation.mutate([...selected])} disabled={bulkSubmitMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow: "0 0 20px rgba(20,184,166,0.3)" }}>
              {bulkSubmitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit {selected.size} selected
            </motion.button>
          )}
          <Link href="/encounters"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#94a3b8" }}>
            <FileText className="w-4 h-4" />New Encounter
          </Link>
        </div>
      </motion.div>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Status tabs */}
        <div className="flex overflow-x-auto px-2 pt-2 gap-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          {STATUS_TABS.map(tab => (
            <button key={tab.value} onClick={() => { setStatus(tab.value); setPage(1); }}
              className={cn("px-4 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-all mb-[-1px]",
                statusFilter === tab.value ? "text-teal-300 border-b-2 border-teal-400" : "text-slate-500 hover:text-slate-300")}
              style={statusFilter === tab.value ? { background: "rgba(20,184,166,0.07)" } : {}}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by patient, SHA number, claim…"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl focus:outline-none focus:ring-1"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f4ff" }} />
          </div>
          <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 px-3 py-2 rounded-xl transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
            <Filter className="w-4 h-4" />Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={selected.size === claims.length && claims.length > 0} onChange={toggleAll}
                    className="rounded" style={{ accentColor: "#14b8a6" }} />
                </th>
                {["Patient", "Visit", "Status", "AI Confidence", "Amount", "Claim #", "Provider", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : claims.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">No claims found</td></tr>
              ) : claims.map((claim, i) => {
                const ss = STATUS_STYLE[claim.status] || STATUS_STYLE.draft;
                const cs = CONFIDENCE_STYLE[claim.confidenceBand] || CONFIDENCE_STYLE.medium;
                const StatusIcon = ss.icon;
                const isSelected = selected.has(claim.id);
                return (
                  <motion.tr key={claim.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: isSelected ? "rgba(20,184,166,0.05)" : "transparent", transition: "background 0.15s" }}
                    onMouseEnter={e => !isSelected && (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                    onMouseLeave={e => !isSelected && (e.currentTarget.style.background = "transparent")}>
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(claim.id)} style={{ accentColor: "#14b8a6" }} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-white">{claim.encounter.patientName}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{claim.encounter.patientShaNumber}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-300 text-sm">{formatDate(claim.encounter.visitDate)}</div>
                      <div className="text-xs text-slate-500 capitalize mt-0.5">{claim.encounter.visitType.replace("_", " ")}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className="w-3.5 h-3.5" style={{ color: ss.color }} />
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                              style={{ background: ss.bg, color: ss.color }}>
                          {claim.status.replace("_", " ")}
                        </span>
                      </div>
                      {claim.hasFlags && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-500">Has flags</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                            style={{ background: cs.bg, color: cs.color }}>
                        {claim.confidenceBand}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-white">
                      {formatKes(claim.totalAmount)}
                    </td>
                    <td className="px-4 py-3.5">
                      {claim.claimNumber ? (
                        <span className="font-mono text-xs text-slate-400">{claim.claimNumber.slice(-12)}</span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">{claim.encounter.provider?.name}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <Link href={`/claims/${claim.id}`}
                          className="p-1.5 rounded-lg transition-colors text-slate-500 hover:text-teal-400"
                          style={{ background: "rgba(255,255,255,0.04)" }}>
                          <Eye className="w-4 h-4" />
                        </Link>
                        {["draft", "pending_review", "approved"].includes(claim.status) && (
                          <button onClick={() => submitMutation.mutate(claim.id)} disabled={submitMutation.isPending}
                            className="p-1.5 rounded-lg transition-colors text-slate-500 hover:text-teal-400"
                            style={{ background: "rgba(255,255,255,0.04)" }}>
                            {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        )}
                        {claim.status === "denied" && (
                          <Link href={`/denials?claimId=${claim.id}`}
                            className="p-1.5 rounded-lg transition-colors text-red-500 hover:text-red-400"
                            style={{ background: "rgba(239,68,68,0.08)" }}>
                            <RefreshCw className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between"
               style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
            <p className="text-sm text-slate-500">
              Showing {(page-1)*20+1}–{Math.min(page*20,total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                className="p-1.5 rounded-lg disabled:opacity-40 transition-colors text-slate-400 hover:text-white"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-400 px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                className="p-1.5 rounded-lg disabled:opacity-40 transition-colors text-slate-400 hover:text-white"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
