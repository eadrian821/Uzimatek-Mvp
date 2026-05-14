"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, RefreshCw, FileText, Loader2, ChevronDown,
  ChevronRight, CheckCircle2, Clock, Sparkles, Copy,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatKes, formatDate, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const MOCK_DENIALS = [
  {
    id: "d1", claimId: "c4", status: "denied", totalAmount: 7600, claimNumber: "SHA-1716100000-XYZ789",
    createdAt: new Date(Date.now() - 2*86400000).toISOString(),
    encounter: { patientName: "Peter Otieno", patientShaNumber: "SHA2024011111", visitDate: new Date(Date.now()-3*86400000).toISOString(), visitType: "emergency", provider: { name: "Dr. Samuel Kipchoge" } },
    denials: [{ id: "dn1", reasonCode: "ERR-002", reasonText: "Diagnosis-procedure mismatch: emergency consultation code does not match emergency procedure tariff", classifiedCategory: "coding_error", suggestedFix: "Review ICD-10 diagnosis codes against the clinical narrative. Verify procedure codes match documented services. Use AI coder to re-check mapping.", appealDeadline: new Date(Date.now()+28*86400000).toISOString(), resolvedAt: null }],
    _count: { denials: 1 },
  },
  {
    id: "d2", claimId: "c7", status: "denied", totalAmount: 4200, claimNumber: "SHA-1715800000-ABC123",
    createdAt: new Date(Date.now() - 5*86400000).toISOString(),
    encounter: { patientName: "Agnes Mutua", patientShaNumber: "SHA2024044444", visitDate: new Date(Date.now()-6*86400000).toISOString(), visitType: "inpatient", provider: { name: "Dr. Grace Otieno" } },
    denials: [{ id: "dn2", reasonCode: "ERR-001", reasonText: "Clinical documentation insufficient: discharge summary not attached", classifiedCategory: "missing_doc", suggestedFix: "Attach the discharge summary, lab reports, and any referral letters. Ensure all supporting documentation is uploaded before resubmission.", appealDeadline: new Date(Date.now()+25*86400000).toISOString(), resolvedAt: null }],
    _count: { denials: 1 },
  },
];

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  coding_error:      { label: "Coding Error",          color: "#f97316", bg: "rgba(249,115,22,0.12)"  },
  missing_doc:       { label: "Missing Documentation", color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  eligibility:       { label: "Eligibility Issue",     color: "#8b5cf6", bg: "rgba(139,92,246,0.12)"  },
  duplicate:         { label: "Duplicate Claim",       color: "#64748b", bg: "rgba(100,116,139,0.12)" },
  tariff_mismatch:   { label: "Tariff Mismatch",       color: "#eab308", bg: "rgba(234,179,8,0.12)"   },
  pre_auth_required: { label: "Pre-Auth Required",     color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  benefit_limit:     { label: "Benefit Limit",         color: "#ec4899", bg: "rgba(236,72,153,0.12)"  },
  other:             { label: "Other",                 color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

export default function DenialsPage() {
  const { toast }      = useToast();
  const queryClient    = useQueryClient();
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [changes, setChanges]             = useState<Record<string, string>>({});
  const [generatingLetter, setGenerating] = useState<string | null>(null);
  const [appealLetters, setLetters]       = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["denials"],
    queryFn: () => api.getDenials(),
    placeholderData: { items: MOCK_DENIALS, total: MOCK_DENIALS.length },
    select: (d) => d as { items: typeof MOCK_DENIALS; total: number },
  });

  const resubmitMutation = useMutation({
    mutationFn: ({ claimId, changes }: { claimId: string; changes: string }) => api.resubmitClaim(claimId, changes),
    onSuccess: () => {
      toast({ title: "Claim resubmitted to SHA successfully" });
      queryClient.invalidateQueries({ queryKey: ["denials"] });
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
    onError: () => toast({ title: "Resubmission failed", variant: "destructive" }),
  });

  const generateLetter = async (claimId: string) => {
    setGenerating(claimId);
    try {
      const result = await api.generateAppealLetter(claimId);
      setLetters(prev => ({ ...prev, [claimId]: result.appealLetter }));
    } catch {
      toast({ title: "Could not generate appeal letter", variant: "destructive" });
    } finally { setGenerating(null); }
  };

  const denials     = data?.items || MOCK_DENIALS;
  const total       = data?.total || MOCK_DENIALS.length;
  const totalValue  = denials.reduce((s, d) => s + d.totalAmount, 0);

  return (
    <div className="p-6 min-h-full" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Denial Management</h1>
          <p className="text-slate-400 text-sm mt-1">{total} denied claims · {formatKes(totalValue)} at risk</p>
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Open Denials", value: total.toString(), icon: AlertTriangle, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
          { label: "Value at Risk", value: formatKes(totalValue), icon: FileText, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
          { label: "Avg Days to Deadline", value: "28d", icon: Clock, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Denials list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl shimmer" style={{ border: "1px solid rgba(255,255,255,0.06)" }} />
          ))
        ) : denials.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">No open denials</h3>
            <p className="text-slate-500 text-sm">All claims are in good standing</p>
          </motion.div>
        ) : denials.map((denial, di) => {
          const denial0  = denial.denials[0];
          const isOpen   = expandedId === denial.id;
          const cc       = CATEGORY_CONFIG[denial0?.classifiedCategory || "other"] || CATEGORY_CONFIG.other;
          const daysLeft = Math.ceil((new Date(denial0?.appealDeadline || "").getTime() - Date.now()) / 86400000);
          const urgent   = daysLeft <= 7;

          return (
            <motion.div key={denial.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: di * 0.08 }}
              className="rounded-2xl overflow-hidden"
              style={{ border: isOpen ? "1px solid rgba(20,184,166,0.2)" : "1px solid rgba(255,255,255,0.07)" }}>

              {/* Header row */}
              <button onClick={() => setExpandedId(isOpen ? null : denial.id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left transition-colors"
                style={{ background: isOpen ? "rgba(20,184,166,0.04)" : "rgba(255,255,255,0.02)" }}
                onMouseEnter={e => !isOpen && (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={e => !isOpen && (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}>

                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{denial.encounter.patientName}</span>
                    <span className="font-mono text-xs text-slate-500">{denial.encounter.patientShaNumber}</span>
                    {denial0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: cc.bg, color: cc.color }}>
                        {cc.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 truncate">{denial0?.reasonText || "No denial reason recorded"}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-white">{formatKes(denial.totalAmount)}</div>
                  <div className={cn("text-xs font-medium mt-0.5", urgent ? "text-red-400" : daysLeft <= 14 ? "text-amber-400" : "text-slate-500")}>
                    {daysLeft}d to deadline
                    {urgent && <span className="ml-1">⚠</span>}
                  </div>
                </div>

                <div className="flex-shrink-0 ml-2">
                  {isOpen
                    ? <ChevronDown className="w-5 h-5 text-teal-400" />
                    : <ChevronRight className="w-5 h-5 text-slate-500" />}
                </div>
              </button>

              {/* Expanded */}
              <AnimatePresence>
                {isOpen && denial0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden">
                    <div className="p-5 space-y-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>

                      {/* Denial details grid */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Denial Reason</p>
                          <p className="text-sm text-slate-200">{denial0.reasonText}</p>
                          <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                            <span>Code: <span className="font-mono text-slate-400">{denial0.reasonCode}</span></span>
                            <span>·</span>
                            <span>Received: {formatDate(denial.createdAt)}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Claim: <span className="font-mono text-slate-400">{denial.claimNumber?.slice(-12)}</span>
                          </div>
                        </div>

                        <div className="rounded-xl p-4" style={{ background: "rgba(20,184,166,0.04)", border: "1px solid rgba(20,184,166,0.12)" }}>
                          <p className="text-xs font-semibold text-teal-500 uppercase tracking-wider mb-2">Suggested Fix</p>
                          <p className="text-sm text-slate-300">{denial0.suggestedFix}</p>
                        </div>
                      </div>

                      {/* Appeal letter */}
                      {appealLetters[denial.claimId] && (
                        <div className="rounded-xl p-4" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">AI-Drafted Appeal Letter</p>
                            <button onClick={() => { navigator.clipboard.writeText(appealLetters[denial.claimId]); toast({ title: "Copied to clipboard" }); }}
                              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                              <Copy className="w-3.5 h-3.5" />Copy
                            </button>
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{appealLetters[denial.claimId]}</p>
                        </div>
                      )}

                      {/* Changes textarea */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Changes Made Before Resubmission
                        </label>
                        <textarea
                          value={changes[denial.claimId] || ""}
                          onChange={e => setChanges(prev => ({ ...prev, [denial.claimId]: e.target.value }))}
                          placeholder="Describe what you corrected, e.g. 'Updated SHA-CONS-001 to SHA-CONS-003, attached discharge summary, corrected diagnosis from J18.9 to B50.9'"
                          rows={3}
                          className="w-full text-sm rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-1 transition-all"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#f0f4ff", lineHeight: 1.6 }} />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => resubmitMutation.mutate({ claimId: denial.claimId, changes: changes[denial.claimId] || "" })}
                          disabled={!changes[denial.claimId]?.trim() || resubmitMutation.isPending}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
                          style={{ background: "linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow: changes[denial.claimId]?.trim() ? "0 0 16px rgba(20,184,166,0.3)" : "none" }}>
                          {resubmitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          Resubmit to SHA
                        </motion.button>

                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => generateLetter(denial.claimId)} disabled={generatingLetter === denial.claimId}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                          style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa" }}>
                          {generatingLetter === denial.claimId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          Generate Appeal Letter
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
