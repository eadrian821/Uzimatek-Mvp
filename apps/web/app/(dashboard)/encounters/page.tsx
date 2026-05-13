"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload, Plus, Sparkles, Loader2, FileUp, Check,
  AlertCircle, Eye, Clock, FileText, Search,
} from "lucide-react";
import Papa from "papaparse";
import { api } from "@/lib/api";
import { formatDate, getStatusColor, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const MOCK_ENCOUNTERS = [
  {
    id: "e1", patientShaNumber: "SHA2024001234", patientName: "Mary Achieng",
    visitDate: new Date(Date.now() - 86400000).toISOString(), visitType: "outpatient",
    chiefComplaint: "Fever and headache for 3 days", status: "claim_generated",
    source: "manual", provider: { name: "Dr. Grace Otieno", specialty: "General Medicine" },
    items: [{ type: "diagnosis" }, { type: "procedure" }, { type: "investigation" }, { type: "drug" }],
    _count: { claims: 1 },
  },
  {
    id: "e2", patientShaNumber: "SHA2024005678", patientName: "John Kamau",
    visitDate: new Date(Date.now() - 2 * 86400000).toISOString(), visitType: "inpatient",
    chiefComplaint: "Abdominal pain, appendicitis", status: "coded",
    source: "csv", provider: { name: "Dr. Samuel Kipchoge", specialty: "Surgery" },
    items: [{ type: "diagnosis" }, { type: "procedure" }],
    _count: { claims: 0 },
  },
  {
    id: "e3", patientShaNumber: "SHA2024009012", patientName: "Fatuma Hassan",
    visitDate: new Date(Date.now() - 3 * 86400000).toISOString(), visitType: "maternity",
    chiefComplaint: "In labour, 38 weeks", status: "ready_to_code",
    source: "manual", provider: { name: "Dr. Grace Otieno", specialty: "General Medicine" },
    items: [],
    _count: { claims: 0 },
  },
  {
    id: "e4", patientShaNumber: "SHA2024011111", patientName: "Peter Otieno",
    visitDate: new Date(Date.now() - 4 * 86400000).toISOString(), visitType: "emergency",
    chiefComplaint: "RTA, fracture right femur", status: "ready_to_code",
    source: "csv", provider: { name: "Dr. Samuel Kipchoge", specialty: "Surgery" },
    items: [],
    _count: { claims: 0 },
  },
];

export default function EncountersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [codingId, setCodingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["encounters"],
    queryFn: () => api.getEncounters(),
    placeholderData: { items: MOCK_ENCOUNTERS, total: MOCK_ENCOUNTERS.length, page: 1, pageSize: 20 },
    select: (d) => d as { items: typeof MOCK_ENCOUNTERS; total: number },
  });

  const codeMutation = useMutation({
    mutationFn: (encounterId: string) => {
      setCodingId(encounterId);
      return api.codeEncounter(encounterId);
    },
    onSuccess: (result) => {
      toast({
        title: "AI coding complete",
        description: `${(result as { items: unknown[] }).items?.length || 0} codes extracted`,
      });
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
    },
    onError: () => toast({ title: "Coding failed", variant: "destructive" }),
    onSettled: () => setCodingId(null),
  });

  const importMutation = useMutation({
    mutationFn: (rows: Record<string, string>[]) => api.bulkImportEncounters(rows),
    onSuccess: (result) => {
      toast({ title: `Imported ${result.created} encounters`, description: result.errors.length > 0 ? `${result.errors.length} rows had errors` : undefined });
      setCsvPreview(null);
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => setCsvPreview(results.data as Record<string, string>[]),
    });
  };

  const encounters = data?.items || MOCK_ENCOUNTERS;
  const filtered = search
    ? encounters.filter(
        (e) =>
          e.patientName.toLowerCase().includes(search.toLowerCase()) ||
          e.patientShaNumber.includes(search)
      )
    : encounters;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Encounters</h1>
          <p className="text-sm text-slate-500">{data?.total || encounters.length} total · ingest clinical data for AI coding</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Encounter
          </button>
        </div>
      </div>

      {/* CSV Upload Preview */}
      {csvPreview && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileUp className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">{csvPreview.length} rows ready to import</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCsvPreview(null)}
                className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
              >
                Cancel
              </button>
              <button
                onClick={() => importMutation.mutate(csvPreview)}
                disabled={importMutation.isPending}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
              >
                {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Import {csvPreview.length} rows
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-40">
            <table className="text-xs w-full">
              <thead>
                <tr className="border-b border-blue-200">
                  {Object.keys(csvPreview[0] || {}).map((k) => (
                    <th key={k} className="px-3 py-1.5 text-left text-blue-700 font-semibold">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvPreview.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-blue-100">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-3 py-1 text-blue-800 truncate max-w-[120px]">
                        {v as string}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvPreview.length > 5 && (
              <p className="text-xs text-blue-500 px-3 py-1">… and {csvPreview.length - 5} more rows</p>
            )}
          </div>
        </div>
      )}

      {/* CSV template download hint */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
        <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <p className="text-sm text-slate-600">
          CSV headers: <span className="font-mono text-xs bg-slate-200 px-1 py-0.5 rounded">patient_sha_number, patient_name, patient_dob, patient_sex, visit_date, visit_type, provider_kmpdc, chief_complaint, narrative</span>
        </p>
      </div>

      {/* Search + table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient or SHA number…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Visit</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Provider</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Codes</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  No encounters found
                </td>
              </tr>
            ) : (
              filtered.map((enc) => (
                <tr key={enc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{enc.patientName}</div>
                    <div className="text-xs text-slate-400 font-mono">{enc.patientShaNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{formatDate(enc.visitDate)}</div>
                    <div className="text-xs text-slate-400 capitalize">{enc.visitType.replace("_", " ")}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", getStatusColor(enc.status))}>
                      {enc.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{enc.provider?.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {enc.items.length > 0 ? (
                        <span className="text-xs text-emerald-600 font-medium">{enc.items.length} codes</span>
                      ) : (
                        <span className="text-xs text-slate-400">Not coded</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {["ready_to_code", "draft"].includes(enc.status) && (
                        <button
                          onClick={() => codeMutation.mutate(enc.id)}
                          disabled={codingId === enc.id}
                          className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {codingId === enc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          AI Code
                        </button>
                      )}
                      {enc.status === "coded" && enc._count.claims === 0 && (
                        <button
                          onClick={() => api.generateClaimFromEncounter(enc.id).then(() => queryClient.invalidateQueries({ queryKey: ["encounters"] }))}
                          className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Generate Claim
                        </button>
                      )}
                      {enc._count?.claims > 0 && (
                        <Link
                          href="/claims"
                          className="flex items-center gap-1.5 text-slate-500 hover:text-teal-600 text-xs px-2 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View claim
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
    </div>
  );
}
