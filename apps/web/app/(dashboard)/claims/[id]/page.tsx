"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft, Send, RefreshCw, AlertCircle, CheckCircle2,
  Info, Sparkles, FileText, User, Calendar, Stethoscope,
  Edit3, ChevronDown, ChevronUp, Loader2, Shield,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatKes, formatDate, formatDateTime, getStatusColor, getConfidenceColor, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Mock claim detail for demo
const MOCK_CLAIM = {
  id: "c1",
  status: "pending_review",
  totalAmount: 5800,
  confidenceBand: "medium",
  hasFlags: true,
  claimNumber: null,
  notes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  payer: "SHA",
  encounter: {
    id: "e1",
    patientName: "Mary Achieng",
    patientShaNumber: "SHA2024001234",
    visitDate: new Date(Date.now() - 86400000).toISOString(),
    visitType: "outpatient",
    chiefComplaint: "Fever and headache for 3 days",
    narrative: "35-year-old female presenting with 3-day history of high-grade fever (38.9°C), severe headache, rigors, and general malaise. No recent travel. Blood smear positive for Plasmodium falciparum. BP 118/76, PR 96bpm. Lungs clear. Started on artemether-lumefantrine.",
    status: "claim_generated",
    provider: {
      id: "p1",
      name: "Dr. Grace Otieno",
      specialty: "General Medicine",
      kmpdcNo: "M12345",
    },
    patient: {
      shaNumber: "SHA2024001234",
      dob: "1989-03-15",
      sex: "F",
    },
    items: [
      {
        id: "i1", type: "diagnosis", rawText: "Plasmodium falciparum malaria",
        code: "B50.9", codeSystem: "ICD-10", description: "Plasmodium falciparum malaria, unspecified",
        confidence: 0.96, confidenceBand: "high",
        rationale: "Blood smear positive for P. falciparum explicitly documented", source: "ai",
      },
      {
        id: "i2", type: "diagnosis", rawText: "Fever",
        code: "R50.9", codeSystem: "ICD-10", description: "Fever, unspecified",
        confidence: 0.72, confidenceBand: "medium",
        rationale: "Secondary diagnosis — fever as symptom of malaria; may be omitted if bundled", source: "ai",
      },
      {
        id: "i3", type: "procedure", rawText: "Outpatient consultation",
        code: "SHA-CONS-001", codeSystem: "SHA-Tariff", description: "Outpatient General Consultation",
        confidence: 0.99, confidenceBand: "high",
        rationale: "Outpatient visit clearly documented", source: "ai",
        unitPrice: 500, quantity: 1,
      },
      {
        id: "i4", type: "investigation", rawText: "Malaria RDT",
        code: "SHA-LAB-003", codeSystem: "SHA-Tariff", description: "Malaria Rapid Test",
        confidence: 0.94, confidenceBand: "high",
        rationale: "Blood smear / RDT documented as performed", source: "ai",
        unitPrice: 250, quantity: 1,
      },
      {
        id: "i5", type: "drug", rawText: "Artemether-lumefantrine 80/480mg",
        code: "SHA-DRUG-001", codeSystem: "SHA-Tariff", description: "Artemether-Lumefantrine (ALu) 80/480mg tabs x6",
        confidence: 0.58, confidenceBand: "low",
        rationale: "Artemether-lumefantrine mentioned; dose/formulation partially matches SHA drug code — verify quantity",
        source: "ai",
        unitPrice: 450, quantity: 1,
      },
    ],
  },
  lines: [
    { id: "l1", shaTariffCode: "SHA-CONS-001", description: "Outpatient General Consultation", quantity: 1, unitPrice: 500, lineTotal: 500 },
    { id: "l2", shaTariffCode: "SHA-LAB-003", description: "Malaria Rapid Test", quantity: 1, unitPrice: 250, lineTotal: 250 },
    { id: "l3", shaTariffCode: "SHA-DRUG-001", description: "Artemether-Lumefantrine (ALu) 80/480mg x6", quantity: 2, unitPrice: 450, lineTotal: 900 },
    { id: "l4", shaTariffCode: "SHA-ADM-001", description: "Observation (4 hours)", quantity: 1, unitPrice: 800, lineTotal: 800 },
  ],
  denials: [],
  submissions: [],
  codingNotes: "Primary malaria diagnosis is high-confidence. Secondary fever diagnosis may be omitted to avoid bundling issues. Artemether-lumefantrine quantity needs biller verification against prescription.",
  validationFlags: [
    "LOW_CONFIDENCE: SHA-DRUG-001 — verify drug quantity against prescription (0.58 confidence)",
    "REVIEW_RECOMMENDED: R50.9 — secondary fever diagnosis; consider omitting to avoid SHA bundling rejection",
  ],
};

type EncounterItem = typeof MOCK_CLAIM.encounter.items[0];

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNarrative, setShowNarrative] = useState(false);
  const [notes, setNotes] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const { data: claim = MOCK_CLAIM, isLoading } = useQuery({
    queryKey: ["claim", id],
    queryFn: () => api.getClaim(id),
    select: (d) => d as typeof MOCK_CLAIM,
  });

  const submitMutation = useMutation({
    mutationFn: () => api.submitClaim(id),
    onSuccess: (result) => {
      toast({
        title: result.success ? "Claim submitted to SHA" : "Submission failed",
        description: result.success ? `SHA Claim Number: ${result.claimNumber}` : "Please check and retry",
        variant: result.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["claim", id] });
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      if (result.success) router.push("/claims");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const diagnosisItems = claim.encounter.items.filter((i) => i.type === "diagnosis");
  const procedureItems = claim.encounter.items.filter((i) => i.type === "procedure");
  const drugItems = claim.encounter.items.filter((i) => i.type === "drug");
  const investigationItems = claim.encounter.items.filter((i) => i.type === "investigation");
  const totalAmount = claim.lines.reduce((sum, l) => sum + l.lineTotal, 0);

  const canSubmit = ["draft", "pending_review", "approved"].includes(claim.status);
  const hasLowConfidence = claim.encounter.items.some((i) => i.confidenceBand === "low");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/claims")}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {claim.encounter.patientName}
              </h1>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize",
                  getStatusColor(claim.status)
                )}
              >
                {claim.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              SHA {claim.encounter.patientShaNumber} ·{" "}
              {formatDate(claim.encounter.visitDate)} ·{" "}
              {claim.encounter.visitType.replace("_", " ")} ·{" "}
              {claim.encounter.provider.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canSubmit && (
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              {submitMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit to SHA
            </button>
          )}
          {claim.status === "denied" && (
            <Link
              href={`/denials?claimId=${id}`}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Resubmission Wizard
            </Link>
          )}
        </div>
      </div>

      {/* Validation flags */}
      {claim.validationFlags?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
            <AlertCircle className="w-4 h-4" />
            {claim.validationFlags.length} validation flag{claim.validationFlags.length > 1 ? "s" : ""} — review before submitting
          </div>
          {claim.validationFlags.map((flag, i) => (
            <p key={i} className="text-xs text-amber-700 pl-6">{flag}</p>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {/* Left: AI coding panel */}
        <div className="md:col-span-2 space-y-4">
          {/* Narrative */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <button
              onClick={() => setShowNarrative(!showNarrative)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <span className="font-semibold text-slate-900">Clinical Narrative</span>
              </div>
              {showNarrative ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
            {showNarrative && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-500 mb-1">Chief complaint</p>
                <p className="text-sm text-slate-800 mb-3">{claim.encounter.chiefComplaint}</p>
                <p className="text-sm font-medium text-slate-500 mb-1">Clinical notes</p>
                <p className="text-sm text-slate-700 leading-relaxed">{claim.encounter.narrative}</p>
              </div>
            )}
          </div>

          {/* AI Codes */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <span className="font-semibold text-slate-900">AI Code Review</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  {claim.encounter.items.filter((i) => i.confidenceBand === "high").length} High
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                  {claim.encounter.items.filter((i) => i.confidenceBand === "medium").length} Medium
                </span>
                {hasLowConfidence && (
                  <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium">
                    {claim.encounter.items.filter((i) => i.confidenceBand === "low").length} Low
                  </span>
                )}
              </div>
            </div>

            {claim.codingNotes && (
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">{claim.codingNotes}</p>
              </div>
            )}

            {/* Diagnoses */}
            <CodeSection
              title="Diagnoses"
              items={diagnosisItems}
              expandedItem={expandedItem}
              onExpand={setExpandedItem}
            />

            {/* Procedures */}
            {procedureItems.length > 0 && (
              <CodeSection
                title="Procedures"
                items={procedureItems}
                expandedItem={expandedItem}
                onExpand={setExpandedItem}
              />
            )}

            {/* Investigations */}
            {investigationItems.length > 0 && (
              <CodeSection
                title="Investigations"
                items={investigationItems}
                expandedItem={expandedItem}
                onExpand={setExpandedItem}
              />
            )}

            {/* Drugs */}
            {drugItems.length > 0 && (
              <CodeSection
                title="Drugs"
                items={drugItems}
                expandedItem={expandedItem}
                onExpand={setExpandedItem}
              />
            )}
          </div>
        </div>

        {/* Right: Claim summary */}
        <div className="space-y-4">
          {/* Patient info */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              Patient
            </h3>
            <div className="space-y-2 text-sm">
              <InfoRow label="Name" value={claim.encounter.patientName} />
              <InfoRow label="SHA No." value={<span className="font-mono">{claim.encounter.patientShaNumber}</span>} />
              <InfoRow label="DOB" value={claim.encounter.patient?.dob ? formatDate(claim.encounter.patient.dob) : "—"} />
              <InfoRow label="Sex" value={claim.encounter.patient?.sex === "M" ? "Male" : "Female"} />
            </div>
          </div>

          {/* Visit info */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              Visit
            </h3>
            <div className="space-y-2 text-sm">
              <InfoRow label="Date" value={formatDate(claim.encounter.visitDate)} />
              <InfoRow label="Type" value={<span className="capitalize">{claim.encounter.visitType.replace("_", " ")}</span>} />
              <InfoRow label="Provider" value={claim.encounter.provider.name} />
              <InfoRow label="KMPDC" value={<span className="font-mono">{claim.encounter.provider.kmpdcNo}</span>} />
              <InfoRow label="Payer" value={claim.payer} />
            </div>
          </div>

          {/* Billing lines */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-teal-600" />
              Billing Lines
            </h3>
            <div className="space-y-2">
              {claim.lines.map((line) => (
                <div key={line.id} className="flex items-start justify-between gap-2 text-xs">
                  <div>
                    <div className="font-mono text-slate-500">{line.shaTariffCode}</div>
                    <div className="text-slate-700">{line.description}</div>
                    <div className="text-slate-400">Qty: {line.quantity} × {formatKes(line.unitPrice)}</div>
                  </div>
                  <div className="font-semibold text-slate-900 whitespace-nowrap">
                    {formatKes(line.lineTotal)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700">Total</span>
              <span className="text-lg font-bold text-teal-700">{formatKes(totalAmount)}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2 mb-2">
              <Edit3 className="w-4 h-4 text-teal-600" />
              Notes
            </h3>
            <textarea
              value={notes || claim.notes || ""}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add coding notes, override justification…"
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Audit trail */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-teal-600" />
              Audit Trail
            </h3>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Encounter created</span>
                <span>{formatDateTime(claim.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>AI coding completed</span>
                <span>{formatDateTime(claim.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Claim generated</span>
                <span>{formatDateTime(claim.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeSection({
  title,
  items,
  expandedItem,
  onExpand,
}: {
  title: string;
  items: EncounterItem[];
  expandedItem: string | null;
  onExpand: (id: string | null) => void;
}) {
  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="px-4 py-2 bg-slate-50">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</span>
      </div>
      {items.map((item) => {
        const isExpanded = expandedItem === item.id;
        return (
          <div key={item.id} className="border-b border-slate-50 last:border-0">
            <button
              onClick={() => onExpand(isExpanded ? null : item.id)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0 mt-0.5",
                  item.confidenceBand === "high" ? "bg-emerald-500" :
                  item.confidenceBand === "medium" ? "bg-amber-500" : "bg-red-500"
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-semibold text-slate-800">
                    {item.code}
                  </span>
                  <span className="text-sm text-slate-600 truncate">{item.description}</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 truncate">{item.rawText}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium border",
                    getConfidenceColor(item.confidenceBand || "")
                  )}
                >
                  {Math.round((item.confidence || 0) * 100)}%
                </span>
                {item.source === "ai" ? (
                  <span title="AI coded"><Sparkles className="w-3.5 h-3.5 text-teal-500" /></span>
                ) : (
                  <span title="Biller edited"><Edit3 className="w-3.5 h-3.5 text-slate-400" /></span>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>
            {isExpanded && (
              <div className="px-4 pb-4 bg-slate-50 space-y-3">
                {item.rationale && (
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-0.5">AI Rationale</p>
                      <p className="text-xs text-slate-700">{item.rationale}</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Code system</span>
                    <div className="font-medium text-slate-700">{item.codeSystem}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Confidence</span>
                    <div className={cn("font-medium capitalize", item.confidenceBand === "high" ? "text-emerald-600" : item.confidenceBand === "medium" ? "text-amber-600" : "text-red-600")}>
                      {item.confidenceBand} ({Math.round((item.confidence || 0) * 100)}%)
                    </div>
                  </div>
                  {item.unitPrice && (
                    <>
                      <div>
                        <span className="text-slate-400">Unit price (KES)</span>
                        <div className="font-medium text-slate-700">{item.unitPrice?.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Quantity</span>
                        <div className="font-medium text-slate-700">{item.quantity}</div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Accept
                  </button>
                  <span className="text-slate-200">|</span>
                  <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium">
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit code
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-800 font-medium text-right">{value}</span>
    </div>
  );
}
