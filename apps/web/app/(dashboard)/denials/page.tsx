"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, RefreshCw, FileText, Loader2, ChevronDown,
  ChevronRight, CheckCircle2, Clock, Sparkles, Copy,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatKes, formatDate, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const MOCK_DENIALS = [
  {
    id: "d1", claimId: "c4", status: "denied",
    totalAmount: 7600, claimNumber: "SHA-1716100000-XYZ789",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    encounter: {
      patientName: "Peter Otieno", patientShaNumber: "SHA2024011111",
      visitDate: new Date(Date.now() - 3 * 86400000).toISOString(), visitType: "emergency",
      provider: { name: "Dr. Samuel Kipchoge" },
    },
    denials: [{
      id: "dn1", reasonCode: "ERR-002", reasonText: "Diagnosis-procedure mismatch: emergency consultation code does not match emergency procedure tariff",
      classifiedCategory: "coding_error",
      suggestedFix: "Review the ICD-10 diagnosis codes against the clinical narrative. Verify that procedure codes match the documented services. Use the AI coder to re-check the mapping.",
      appealDeadline: new Date(Date.now() + 28 * 86400000).toISOString(),
      resolvedAt: null,
    }],
    _count: { denials: 1 },
  },
  {
    id: "d2", claimId: "c7", status: "denied",
    totalAmount: 4200, claimNumber: "SHA-1715800000-ABC123",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    encounter: {
      patientName: "Agnes Mutua", patientShaNumber: "SHA2024044444",
      visitDate: new Date(Date.now() - 6 * 86400000).toISOString(), visitType: "inpatient",
      provider: { name: "Dr. Grace Otieno" },
    },
    denials: [{
      id: "dn2", reasonCode: "ERR-001", reasonText: "Clinical documentation insufficient: discharge summary not attached",
      classifiedCategory: "missing_doc",
      suggestedFix: "Attach the discharge summary, lab reports, and any referral letters. Ensure all supporting clinical documentation is uploaded before resubmission.",
      appealDeadline: new Date(Date.now() + 25 * 86400000).toISOString(),
      resolvedAt: null,
    }],
    _count: { denials: 1 },
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  coding_error: "bg-orange-100 text-orange-700",
  missing_doc: "bg-blue-100 text-blue-700",
  eligibility: "bg-purple-100 text-purple-700",
  duplicate: "bg-slate-100 text-slate-700",
  tariff_mismatch: "bg-yellow-100 text-yellow-700",
  pre_auth_required: "bg-red-100 text-red-700",
  benefit_limit: "bg-pink-100 text-pink-700",
  other: "bg-slate-100 text-slate-600",
};

const CATEGORY_LABELS: Record<string, string> = {
  coding_error: "Coding Error",
  missing_doc: "Missing Documentation",
  eligibility: "Eligibility Issue",
  duplicate: "Duplicate Claim",
  tariff_mismatch: "Tariff Mismatch",
  pre_auth_required: "Pre-Auth Required",
  benefit_limit: "Benefit Limit",
  other: "Other",
};

export default function DenialsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resubmitChanges, setResubmitChanges] = useState<Record<string, string>>({});
  const [generatingLetter, setGeneratingLetter] = useState<string | null>(null);
  const [appealLetters, setAppealLetters] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["denials"],
    queryFn: () => api.getDenials(),
    placeholderData: { items: MOCK_DENIALS, total: MOCK_DENIALS.length },
    select: (d) => d as { items: typeof MOCK_DENIALS; total: number },
  });

  const resubmitMutation = useMutation({
    mutationFn: ({ claimId, changes }: { claimId: string; changes: string }) =>
      api.resubmitClaim(claimId, changes),
    onSuccess: () => {
      toast({ title: "Claim resubmitted to SHA successfully" });
      queryClient.invalidateQueries({ queryKey: ["denials"] });
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
    onError: () => toast({ title: "Resubmission failed", variant: "destructive" }),
  });

  const generateLetter = async (claimId: string) => {
    setGeneratingLetter(claimId);
    try {
      const result = await api.generateAppealLetter(claimId);
      setAppealLetters((prev) => ({ ...prev, [claimId]: result.appealLetter }));
    } catch {
      toast({ title: "Could not generate appeal letter", variant: "destructive" });
    } finally {
      setGeneratingLetter(null);
    }
  };

  const denials = data?.items || MOCK_DENIALS;
  const total = data?.total || MOCK_DENIALS.length;
  const totalValue = denials.reduce((sum, d) => sum + d.totalAmount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Denial Management</h1>
          <p className="text-sm text-slate-500">
            {total} denied claims · {formatKes(totalValue)} at risk
          </p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open Denials", value: total.toString(), icon: AlertTriangle, color: "text-red-600 bg-red-50" },
          { label: "Value at Risk", value: formatKes(totalValue), icon: FileText, color: "text-orange-600 bg-orange-50" },
          { label: "Avg Days to Appeal Deadline", value: "28d", icon: Clock, color: "text-blue-600 bg-blue-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Denials list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))
        ) : denials.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No open denials</h3>
            <p className="text-slate-500 text-sm">All claims are in good standing</p>
          </div>
        ) : (
          denials.map((denial) => {
            const latestDenial = denial.denials[0];
            const isExpanded = expandedId === denial.id;
            const daysLeft = Math.ceil(
              (new Date(latestDenial?.appealDeadline || "").getTime() - Date.now()) / 86400000
            );

            return (
              <div key={denial.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : denial.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-slate-900">{denial.encounter.patientName}</span>
                      <span className="font-mono text-xs text-slate-400">{denial.encounter.patientShaNumber}</span>
                      {latestDenial && (
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", CATEGORY_COLORS[latestDenial.classifiedCategory])}>
                          {CATEGORY_LABELS[latestDenial.classifiedCategory]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">
                      {latestDenial?.reasonText || "No denial reason recorded"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-slate-900">{formatKes(denial.totalAmount)}</div>
                    <div className={cn("text-xs font-medium", daysLeft <= 7 ? "text-red-600" : daysLeft <= 14 ? "text-orange-500" : "text-slate-400")}>
                      {daysLeft}d to deadline
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                </button>

                {/* Expanded: resubmission wizard */}
                {isExpanded && latestDenial && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50 space-y-4">
                    {/* Denial details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Denial Reason</p>
                        <p className="text-sm text-slate-800">{latestDenial.reasonText}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                          <span>Code: <span className="font-mono">{latestDenial.reasonCode}</span></span>
                          <span>·</span>
                          <span>Received: {formatDate(denial.createdAt)}</span>
                          <span>·</span>
                          <span>Claim: <span className="font-mono">{denial.claimNumber?.slice(-12)}</span></span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Suggested Fix</p>
                        <p className="text-sm text-slate-700">{latestDenial.suggestedFix}</p>
                      </div>
                    </div>

                    {/* Resubmission form */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Changes made before resubmission (required)
                      </label>
                      <textarea
                        value={resubmitChanges[denial.claimId] || ""}
                        onChange={(e) =>
                          setResubmitChanges((prev) => ({ ...prev, [denial.claimId]: e.target.value }))
                        }
                        placeholder="Describe what you corrected: e.g., 'Updated SHA-CONS-001 to SHA-CONS-003 (emergency), attached discharge summary, corrected diagnosis code from J18.9 to B50.9'"
                        rows={3}
                        className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    {/* Appeal letter */}
                    {appealLetters[denial.claimId] && (
                      <div className="bg-white border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">AI-Drafted Appeal Letter</p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(appealLetters[denial.claimId]);
                              toast({ title: "Appeal letter copied to clipboard" });
                            }}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
                          {appealLetters[denial.claimId]}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() =>
                          resubmitMutation.mutate({
                            claimId: denial.claimId,
                            changes: resubmitChanges[denial.claimId] || "",
                          })
                        }
                        disabled={
                          !resubmitChanges[denial.claimId]?.trim() ||
                          resubmitMutation.isPending
                        }
                        className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-300 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                      >
                        {resubmitMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Resubmit to SHA
                      </button>
                      <button
                        onClick={() => generateLetter(denial.claimId)}
                        disabled={generatingLetter === denial.claimId}
                        className="flex items-center gap-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm px-4 py-2.5 rounded-xl transition-colors"
                      >
                        {generatingLetter === denial.claimId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        Generate Appeal Letter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
