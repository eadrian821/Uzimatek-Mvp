"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Filter, Search, CheckSquare, Send, RefreshCw,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  Clock, XCircle, FileText, Loader2, Eye,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatKes, formatDate, getStatusColor, getConfidenceColor, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ClaimStatus = "all" | "draft" | "pending_review" | "approved" | "submitted" | "denied" | "paid";

interface ClaimItem {
  id: string;
  status: string;
  totalAmount: number;
  confidenceBand: string;
  hasFlags: boolean;
  claimNumber: string | null;
  createdAt: string;
  encounter: {
    patientName: string;
    patientShaNumber: string;
    visitDate: string;
    visitType: string;
    provider: { name: string };
  };
  lines: unknown[];
  _count: { denials: number };
}

// Mock claims for when API isn't available
const MOCK_CLAIMS: ClaimItem[] = [
  {
    id: "c1", status: "pending_review", totalAmount: 5800, confidenceBand: "medium", hasFlags: true,
    claimNumber: null, createdAt: new Date().toISOString(),
    encounter: { patientName: "Mary Achieng", patientShaNumber: "SHA2024001234", visitDate: new Date().toISOString(), visitType: "outpatient", provider: { name: "Dr. Grace Otieno" } },
    lines: [{}, {}], _count: { denials: 0 },
  },
  {
    id: "c2", status: "pending_review", totalAmount: 12400, confidenceBand: "high", hasFlags: false,
    claimNumber: null, createdAt: new Date(Date.now() - 3600000).toISOString(),
    encounter: { patientName: "John Kamau", patientShaNumber: "SHA2024005678", visitDate: new Date(Date.now() - 86400000).toISOString(), visitType: "inpatient", provider: { name: "Dr. Samuel Kipchoge" } },
    lines: [{}, {}, {}, {}], _count: { denials: 0 },
  },
  {
    id: "c3", status: "submitted", totalAmount: 3200, confidenceBand: "high", hasFlags: false,
    claimNumber: "SHA-1716234567-ABCD12", createdAt: new Date(Date.now() - 86400000).toISOString(),
    encounter: { patientName: "Fatuma Hassan", patientShaNumber: "SHA2024009012", visitDate: new Date(Date.now() - 2 * 86400000).toISOString(), visitType: "outpatient", provider: { name: "Dr. Grace Otieno" } },
    lines: [{}, {}], _count: { denials: 0 },
  },
  {
    id: "c4", status: "denied", totalAmount: 7600, confidenceBand: "low", hasFlags: true,
    claimNumber: "SHA-1716100000-XYZ789", createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    encounter: { patientName: "Peter Otieno", patientShaNumber: "SHA2024011111", visitDate: new Date(Date.now() - 3 * 86400000).toISOString(), visitType: "emergency", provider: { name: "Dr. Samuel Kipchoge" } },
    lines: [{}], _count: { denials: 1 },
  },
  {
    id: "c5", status: "paid", totalAmount: 4500, confidenceBand: "high", hasFlags: false,
    claimNumber: "SHA-1715900000-PQR456", createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    encounter: { patientName: "Grace Wanjiku", patientShaNumber: "SHA2024022222", visitDate: new Date(Date.now() - 6 * 86400000).toISOString(), visitType: "maternity", provider: { name: "Dr. Grace Otieno" } },
    lines: [{}, {}, {}], _count: { denials: 0 },
  },
  {
    id: "c6", status: "pending_review", totalAmount: 2100, confidenceBand: "medium", hasFlags: true,
    claimNumber: null, createdAt: new Date(Date.now() - 7200000).toISOString(),
    encounter: { patientName: "Samuel Mwangi", patientShaNumber: "SHA2024033333", visitDate: new Date(Date.now() - 86400000).toISOString(), visitType: "outpatient", provider: { name: "Dr. Grace Otieno" } },
    lines: [{}], _count: { denials: 0 },
  },
];

const STATUS_TABS = [
  { value: "all", label: "All Claims" },
  { value: "pending_review", label: "Pending Review", color: "text-blue-600" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted", color: "text-purple-600" },
  { value: "denied", label: "Denied", color: "text-red-600" },
  { value: "paid", label: "Paid", color: "text-emerald-600" },
] as const;

export default function ClaimsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<ClaimStatus>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["claims", { statusFilter, search, page }],
    queryFn: () =>
      api.getClaims({
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
        page,
        pageSize: 20,
      }),
    placeholderData: { items: MOCK_CLAIMS, total: MOCK_CLAIMS.length, page: 1, pageSize: 20 },
    select: (d) => d as { items: ClaimItem[]; total: number; page: number; pageSize: number },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => api.submitClaim(id),
    onSuccess: (result) => {
      toast({
        title: result.success ? "Claim submitted successfully" : "Submission failed",
        description: result.success
          ? `Claim number: ${result.claimNumber}`
          : "Please check the claim and try again",
        variant: result.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
  });

  const bulkSubmitMutation = useMutation({
    mutationFn: (ids: string[]) => api.bulkSubmitClaims(ids),
    onSuccess: (result) => {
      toast({ title: `Submitted ${result.submitted} claims to SHA` });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
  });

  const claims = data?.items || MOCK_CLAIMS;
  const total = data?.total || MOCK_CLAIMS.length;
  const totalPages = Math.ceil(total / 20);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === claims.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(claims.map((c) => c.id)));
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "denied": return <XCircle className="w-4 h-4 text-red-500" />;
      case "submitted": return <Send className="w-4 h-4 text-purple-500" />;
      case "pending_review": return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Claims Workbench</h1>
          <p className="text-sm text-slate-500">{total.toLocaleString()} claims · {MOCK_CLAIMS.filter(c => c.status === "pending_review").length} pending review</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={() => bulkSubmitMutation.mutate([...selectedIds])}
              disabled={bulkSubmitMutation.isPending}
              className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              {bulkSubmitMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit {selectedIds.size} selected
            </button>
          )}
          <Link
            href="/encounters"
            className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            New Encounter
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200">
        {/* Status tabs */}
        <div className="border-b border-slate-100 px-4">
          <div className="flex gap-0 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatusFilter(tab.value as ClaimStatus); setPage(1); }}
                className={cn(
                  "px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                  statusFilter === tab.value
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by patient, SHA number, claim…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-2 rounded-lg">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === claims.length && claims.length > 0}
                    onChange={toggleAll}
                    className="rounded border-slate-300 text-teal-600"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Visit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Confidence</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Claim #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Provider</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No claims found
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr
                    key={claim.id}
                    className={cn(
                      "hover:bg-slate-50 transition-colors",
                      selectedIds.has(claim.id) && "bg-teal-50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(claim.id)}
                        onChange={() => toggleSelect(claim.id)}
                        className="rounded border-slate-300 text-teal-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{claim.encounter.patientName}</div>
                      <div className="text-xs text-slate-400 font-mono">{claim.encounter.patientShaNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700">{formatDate(claim.encounter.visitDate)}</div>
                      <div className="text-xs text-slate-400 capitalize">{claim.encounter.visitType.replace("_", " ")}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(claim.status)}
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                            getStatusColor(claim.status)
                          )}
                        >
                          {claim.status.replace("_", " ")}
                        </span>
                      </div>
                      {claim.hasFlags && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-600">Has flags</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium border capitalize",
                          getConfidenceColor(claim.confidenceBand)
                        )}
                      >
                        {claim.confidenceBand}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatKes(claim.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      {claim.claimNumber ? (
                        <span className="font-mono text-xs text-slate-500">{claim.claimNumber.slice(-12)}</span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {claim.encounter.provider?.name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/claims/${claim.id}`}
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="View claim"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {["draft", "pending_review", "approved"].includes(claim.status) && (
                          <button
                            onClick={() => submitMutation.mutate(claim.id)}
                            disabled={submitMutation.isPending}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Submit to SHA"
                          >
                            {submitMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {claim.status === "denied" && (
                          <Link
                            href={`/denials?claimId=${claim.id}`}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Review denial"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
