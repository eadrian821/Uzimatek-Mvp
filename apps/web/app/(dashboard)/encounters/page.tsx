"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Plus, Sparkles, Loader2, FileUp, Check,
  Eye, FileText, Search, Stethoscope, UserRound,
  Brain, ClipboardList, ArrowRight, TrendingUp,
  Calendar, ChevronRight, Activity, X, Phone, User,
  Heart, Thermometer, Wind,
} from "lucide-react";
import Papa from "papaparse";
import { api } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

/* ── Register Patient Modal ──────────────────────────────────────── */
const EMPTY_PT = { shaNumber:"", name:"", dob:"", sex:"" as "M"|"F"|"", phone:"", county:"Nairobi", nokName:"", nokPhone:"", allergies:"", chronicConditions:"" };

function RegisterPatientModal({ onClose, onSave }: { onClose:()=>void; onSave:(p:typeof MOCK_PATIENTS[0])=>void }) {
  const [form, setForm] = useState(EMPTY_PT);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof EMPTY_PT, v: string) => setForm(f=>({...f,[k]:v}));
  const iS = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"#f0f4ff" };
  const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all";
  const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5";

  const submit = async () => {
    if (!form.name) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    onSave({
      shaNumber: form.shaNumber || `SHA${Date.now().toString().slice(-10)}`,
      name: form.name, dob: form.dob||"—", sex: form.sex||"M",
      phone: form.phone||"—", visits: 0,
      lastVisit: new Date().toISOString().slice(0,10),
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(8px)" }}>
      <motion.div initial={{ scale:0.95,opacity:0 }} animate={{ scale:1,opacity:1 }}
        className="w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl"
        style={{ background:"linear-gradient(180deg,#0d1526,#060b18)", border:"1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)" }}>
            <UserRound className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold">Register Patient</h2>
            <p className="text-slate-500 text-xs">Create a new patient record in MyUzimaClinical</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-white"
                  style={{ background:"rgba(255,255,255,0.04)" }}><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-none">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>SHA Number</label>
              <input className={inputCls} style={iS} placeholder="SHA2024XXXXXX"
                value={form.shaNumber} onChange={e=>set("shaNumber",e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Full Name *</label>
              <input className={inputCls} style={iS} placeholder="Full name"
                value={form.name} onChange={e=>set("name",e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Date of Birth</label>
              <input type="date" className={inputCls} style={iS}
                value={form.dob} onChange={e=>set("dob",e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Sex</label>
              <select className={inputCls} style={iS} value={form.sex} onChange={e=>set("sex",e.target.value as "M"|"F"|"")}>
                <option value="">Select…</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} style={iS} placeholder="+254 7XX XXX XXX"
                value={form.phone} onChange={e=>set("phone",e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>County</label>
              <input className={inputCls} style={iS} placeholder="Nairobi"
                value={form.county} onChange={e=>set("county",e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Next of Kin</label>
              <input className={inputCls} style={iS} placeholder="Name"
                value={form.nokName} onChange={e=>set("nokName",e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>NOK Phone</label>
              <input className={inputCls} style={iS} placeholder="+254…"
                value={form.nokPhone} onChange={e=>set("nokPhone",e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Known Allergies</label>
              <input className={inputCls} style={iS} placeholder="e.g. Penicillin, Sulfonamides — or None"
                value={form.allergies} onChange={e=>set("allergies",e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Chronic Conditions</label>
              <input className={inputCls} style={iS} placeholder="e.g. Diabetes Type 2, Hypertension"
                value={form.chronicConditions} onChange={e=>set("chronicConditions",e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-400"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>Cancel</button>
          <button onClick={submit} disabled={loading||!form.name}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow:"0 0 16px rgba(20,184,166,0.25)" }}>
            {loading?<><Loader2 className="w-4 h-4 animate-spin"/>Saving…</>:<><Check className="w-4 h-4"/>Register Patient</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── New Encounter Modal ─────────────────────────────────────────── */
const VISIT_TYPES = ["outpatient","inpatient","emergency","maternity","day_case"];
const EMPTY_ENC = { patientShaNumber:"", patientName:"", visitType:"outpatient", chiefComplaint:"", provider:"", referral:"no" };

function NewEncounterModal({ patients, onClose, onSave }: {
  patients: typeof MOCK_PATIENTS;
  onClose:()=>void;
  onSave:(e:typeof MOCK_ENCOUNTERS[0])=>void;
}) {
  const [form, setForm] = useState(EMPTY_ENC);
  const [loading, setLoading] = useState(false);
  const [lookup, setLookup] = useState(false);
  const set = (k: keyof typeof EMPTY_ENC, v: string) => setForm(f=>({...f,[k]:v}));
  const iS = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"#f0f4ff" };
  const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500";
  const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5";

  const lookupPatient = () => {
    setLookup(true);
    const found = patients.find(p=>p.shaNumber===form.patientShaNumber||p.name.toLowerCase()===form.patientShaNumber.toLowerCase());
    setTimeout(()=>{ setLookup(false); if(found) set("patientName",found.name); }, 800);
  };

  const submit = async () => {
    if (!form.chiefComplaint||!form.patientName) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    onSave({
      id:`e${Date.now()}`,
      patientShaNumber:form.patientShaNumber||`SHA${Date.now().toString().slice(-10)}`,
      patientName:form.patientName,
      visitDate:new Date().toISOString(),
      visitType:form.visitType,
      chiefComplaint:form.chiefComplaint,
      status:"ready_to_code",
      source:"manual",
      provider:{ name:form.provider||"Dr. Unknown", specialty:"General Medicine" },
      items:[],
      _count:{ claims:0 },
      confidence:null,
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(8px)" }}>
      <motion.div initial={{ scale:0.95,opacity:0 }} animate={{ scale:1,opacity:1 }}
        className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-2xl"
        style={{ background:"linear-gradient(180deg,#0d1526,#060b18)", border:"1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)" }}>
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold">New Encounter</h2>
            <p className="text-slate-500 text-xs">Record a new clinical visit</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-white"
                  style={{ background:"rgba(255,255,255,0.04)" }}><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-none">
          <div>
            <label className={labelCls}>SHA Number / Patient Name</label>
            <div className="flex gap-2">
              <input className={inputCls+" flex-1"} style={iS} placeholder="SHA number or search name"
                value={form.patientShaNumber} onChange={e=>set("patientShaNumber",e.target.value)} />
              <button onClick={lookupPatient}
                className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 flex-shrink-0"
                style={{ background:"rgba(20,184,166,0.1)", border:"1px solid rgba(20,184,166,0.2)", color:"#2dd4bf" }}>
                {lookup?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Search className="w-3.5 h-3.5"/>}Lookup
              </button>
            </div>
          </div>
          {form.patientName && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                 style={{ background:"rgba(20,184,166,0.08)", border:"1px solid rgba(20,184,166,0.2)" }}>
              <Check className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-sm text-teal-300 font-medium">{form.patientName}</span>
            </div>
          )}
          <div>
            <label className={labelCls}>Patient Name (if not found above)</label>
            <input className={inputCls} style={iS} placeholder="Full name"
              value={form.patientName} onChange={e=>set("patientName",e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Visit Type</label>
              <select className={inputCls} style={iS} value={form.visitType} onChange={e=>set("visitType",e.target.value)}>
                {VISIT_TYPES.map(v=><option key={v} value={v}>{v.replace("_"," ")}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Referring Doctor</label>
              <input className={inputCls} style={iS} placeholder="Dr. Name (KMPDC)"
                value={form.provider} onChange={e=>set("provider",e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Chief Complaint *</label>
            <textarea className={inputCls} style={{ ...iS, minHeight:80, resize:"none" as const }}
              placeholder="Primary presenting complaint…"
              value={form.chiefComplaint} onChange={e=>set("chiefComplaint",e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-400"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>Cancel</button>
          <button onClick={submit} disabled={loading||!form.patientName||!form.chiefComplaint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow:"0 0 16px rgba(20,184,166,0.25)" }}>
            {loading?<><Loader2 className="w-4 h-4 animate-spin"/>Creating…</>:<><Check className="w-4 h-4"/>Create Encounter</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const MOCK_ENCOUNTERS = [
  {
    id: "e1", patientShaNumber: "SHA2024001234", patientName: "Mary Achieng",
    visitDate: new Date(Date.now() - 86400000).toISOString(), visitType: "outpatient",
    chiefComplaint: "Fever and headache for 3 days", status: "claim_generated",
    source: "manual", provider: { name: "Dr. Grace Otieno", specialty: "General Medicine" },
    items: [{ type: "diagnosis" }, { type: "procedure" }, { type: "investigation" }, { type: "drug" }],
    _count: { claims: 1 }, confidence: "high",
  },
  {
    id: "e2", patientShaNumber: "SHA2024005678", patientName: "John Kamau",
    visitDate: new Date(Date.now() - 2 * 86400000).toISOString(), visitType: "inpatient",
    chiefComplaint: "Abdominal pain, appendicitis", status: "coded",
    source: "csv", provider: { name: "Dr. Samuel Kipchoge", specialty: "Surgery" },
    items: [{ type: "diagnosis" }, { type: "procedure" }],
    _count: { claims: 0 }, confidence: "high",
  },
  {
    id: "e3", patientShaNumber: "SHA2024009012", patientName: "Fatuma Hassan",
    visitDate: new Date(Date.now() - 3 * 86400000).toISOString(), visitType: "maternity",
    chiefComplaint: "In labour, 38 weeks gestation", status: "ready_to_code",
    source: "manual", provider: { name: "Dr. Grace Otieno", specialty: "General Medicine" },
    items: [], _count: { claims: 0 }, confidence: null,
  },
  {
    id: "e4", patientShaNumber: "SHA2024011111", patientName: "Peter Otieno",
    visitDate: new Date(Date.now() - 4 * 86400000).toISOString(), visitType: "emergency",
    chiefComplaint: "RTA, fracture right femur", status: "ready_to_code",
    source: "csv", provider: { name: "Dr. Samuel Kipchoge", specialty: "Surgery" },
    items: [], _count: { claims: 0 }, confidence: null,
  },
  {
    id: "e5", patientShaNumber: "SHA2024022222", patientName: "Grace Wanjiku",
    visitDate: new Date(Date.now() - 6 * 86400000).toISOString(), visitType: "maternity",
    chiefComplaint: "Caesarean section — elective", status: "claim_generated",
    source: "manual", provider: { name: "Dr. Grace Otieno", specialty: "General Medicine" },
    items: [{ type: "diagnosis" }, { type: "procedure" }, { type: "drug" }],
    _count: { claims: 1 }, confidence: "medium",
  },
];

const MOCK_PATIENTS = [
  { shaNumber: "SHA2024001234", name: "Mary Achieng", dob: "1985-03-12", sex: "F", phone: "+254722000001", visits: 3, lastVisit: "2025-05-13" },
  { shaNumber: "SHA2024005678", name: "John Kamau",   dob: "1990-07-22", sex: "M", phone: "+254733000002", visits: 1, lastVisit: "2025-05-12" },
  { shaNumber: "SHA2024009012", name: "Fatuma Hassan",dob: "1997-11-05", sex: "F", phone: "+254744000003", visits: 2, lastVisit: "2025-05-11" },
  { shaNumber: "SHA2024011111", name: "Peter Otieno", dob: "1989-01-30", sex: "M", phone: "+254755000004", visits: 1, lastVisit: "2025-05-10" },
  { shaNumber: "SHA2024022222", name: "Grace Wanjiku",dob: "1996-08-15", sex: "F", phone: "+254766000005", visits: 4, lastVisit: "2025-05-08" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:           { label: "Draft",          color: "#64748b", bg: "rgba(100,116,139,0.12)" },
  ready_to_code:   { label: "Ready to Code",  color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  coding:          { label: "Coding…",        color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  coded:           { label: "Coded",          color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  claim_generated: { label: "Claim Generated",color: "#14b8a6", bg: "rgba(20,184,166,0.12)" },
  error:           { label: "Error",          color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

const VISIT_TYPE_COLOR: Record<string, string> = {
  outpatient: "#14b8a6", inpatient: "#3b82f6", emergency: "#ef4444",
  maternity: "#ec4899", day_case: "#8b5cf6",
};

const TABS = [
  { id: "queue",    label: "Clinical Queue",  icon: ClipboardList },
  { id: "records",  label: "Patient Records", icon: UserRound },
  { id: "coding",   label: "SHA Coding",      icon: Brain },
];

export default function EncountersPage() {
  const { toast }      = useToast();
  const queryClient    = useQueryClient();
  const fileRef        = useRef<HTMLInputElement>(null);
  const [tab, setTab]  = useState<"queue" | "records" | "coding">("queue");
  const [csvPreview, setCsvPreview]   = useState<Record<string, string>[] | null>(null);
  const [search, setSearch]           = useState("");
  const [codingId, setCodingId]       = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [showRegisterPatient, setShowRegisterPatient] = useState(false);
  const [showNewEncounter, setShowNewEncounter] = useState(false);
  const [localPatients, setLocalPatients] = useState(MOCK_PATIENTS);
  const [localEncounters, setLocalEncounters] = useState<typeof MOCK_ENCOUNTERS>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["encounters"],
    queryFn: () => api.getEncounters(),
    placeholderData: { items: MOCK_ENCOUNTERS, total: MOCK_ENCOUNTERS.length, page: 1, pageSize: 20 },
    select: (d) => d as { items: typeof MOCK_ENCOUNTERS; total: number },
  });

  const codeMutation = useMutation({
    mutationFn: (encounterId: string) => { setCodingId(encounterId); return api.codeEncounter(encounterId); },
    onSuccess: (result) => {
      toast({ title: "AI coding complete", description: `${(result as { items: unknown[] }).items?.length || 0} codes extracted` });
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
    },
    onError: () => toast({ title: "Coding failed", variant: "destructive" }),
    onSettled: () => setCodingId(null),
  });

  const importMutation = useMutation({
    mutationFn: (rows: Record<string, string>[]) => api.bulkImportEncounters(rows),
    onSuccess: (result) => {
      toast({ title: `Imported ${result.created} encounters` });
      setCsvPreview(null);
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: (r) => setCsvPreview(r.data as Record<string, string>[]) });
  };

  const encounters = [...localEncounters, ...(data?.items || MOCK_ENCOUNTERS)];
  const filtered   = search
    ? encounters.filter(e => e.patientName.toLowerCase().includes(search.toLowerCase()) || e.patientShaNumber.includes(search))
    : encounters;

  const codingQueue = encounters.filter(e => ["ready_to_code", "draft"].includes(e.status));
  const allPatients = [...localPatients.filter(p => !MOCK_PATIENTS.find(m => m.shaNumber === p.shaNumber))];
  const mergedPatients = [...allPatients, ...MOCK_PATIENTS];
  const filteredPatients = patientSearch
    ? mergedPatients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.shaNumber.includes(patientSearch))
    : mergedPatients;

  return (
    <div className="p-6 min-h-full" style={{ background: "var(--bg-primary)" }}>
      {showRegisterPatient && (
        <RegisterPatientModal
          onClose={() => setShowRegisterPatient(false)}
          onSave={p => {
            setLocalPatients(prev => [p, ...prev]);
            setShowRegisterPatient(false);
            setTab("records");
            toast({ title: "Patient registered", description: `${p.name} added to records` });
          }}
        />
      )}
      {showNewEncounter && (
        <NewEncounterModal
          patients={mergedPatients}
          onClose={() => setShowNewEncounter(false)}
          onSave={e => {
            setLocalEncounters(prev => [e, ...prev]);
            setShowNewEncounter(false);
            setTab("queue");
            toast({ title: "Encounter created", description: `${e.patientName} — ready to code` });
          }}
        />
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Stethoscope className="w-5 h-5 text-teal-400" />
            <h1 className="text-2xl font-bold text-white">MyUzimaClinical</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {encounters.length} encounters · SHA clinical suite
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#94a3b8" }}>
            <Upload className="w-4 h-4" />Import CSV
          </motion.button>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowRegisterPatient(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#94a3b8" }}>
            <User className="w-4 h-4" />Register Patient
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowNewEncounter(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow: "0 0 20px rgba(20,184,166,0.3)" }}>
            <Plus className="w-4 h-4" />New Encounter
          </motion.button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl mb-5 w-fit"
           style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t.id ? "text-white" : "text-slate-500 hover:text-slate-300")}
            style={tab === t.id ? { background: "linear-gradient(135deg,rgba(20,184,166,0.2),rgba(8,145,178,0.1))", border: "1px solid rgba(20,184,166,0.25)" } : {}}>
            <t.icon className={cn("w-4 h-4", tab === t.id ? "text-teal-400" : "")} />
            {t.label}
            {t.id === "coding" && codingQueue.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold">
                {codingQueue.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── CLINICAL QUEUE ─────────────────────────────────────────── */}
        {tab === "queue" && (
          <motion.div key="queue" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* CSV preview */}
            {csvPreview && (
              <div className="rounded-2xl p-4 mb-4"
                   style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileUp className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-blue-300 text-sm">{csvPreview.length} rows ready to import</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCsvPreview(null)}
                      className="text-sm text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      Cancel
                    </button>
                    <button onClick={() => importMutation.mutate(csvPreview)} disabled={importMutation.isPending}
                      className="flex items-center gap-2 text-sm px-4 py-1.5 rounded-lg font-medium text-white"
                      style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}>
                      {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Import {csvPreview.length} rows
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CSV hint */}
            <div className="rounded-xl p-3 mb-4 flex items-center gap-3"
                 style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <FileText className="w-4 h-4 text-slate-600 flex-shrink-0" />
              <p className="text-xs text-slate-500">
                CSV headers: <span className="font-mono text-slate-400 text-xs bg-white/5 px-1.5 py-0.5 rounded">
                  patient_sha_number, patient_name, dob, sex, visit_date, visit_type, provider_kmpdc, chief_complaint, narrative
                </span>
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search patient or SHA number…"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1 transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f4ff" }} />
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Patient", "Visit", "Status", "Provider", "Codes", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-4">
                            <div className="h-4 rounded shimmer" style={{ background: "rgba(255,255,255,0.05)" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No encounters found</td></tr>
                  ) : filtered.map((enc, i) => {
                    const sc = STATUS_CONFIG[enc.status] || STATUS_CONFIG.draft;
                    const vtColor = VISIT_TYPE_COLOR[enc.visitType] || "#64748b";
                    return (
                      <motion.tr key={enc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        className="group transition-colors"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "transparent" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-white">{enc.patientName}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{enc.patientShaNumber}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-slate-300 text-sm">{formatDate(enc.visitDate)}</div>
                          <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full mt-1 inline-block"
                                style={{ background: `${vtColor}15`, color: vtColor, border: `1px solid ${vtColor}30` }}>
                            {enc.visitType.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                                style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}30` }}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 text-xs">{enc.provider?.name}</td>
                        <td className="px-4 py-3.5">
                          {enc.items.length > 0 ? (
                            <span className="text-emerald-400 text-xs font-semibold">{enc.items.length} codes</span>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            {["ready_to_code", "draft"].includes(enc.status) && (
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => codeMutation.mutate(enc.id)}
                                disabled={codingId === enc.id}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                                style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)", color: "#2dd4bf" }}>
                                {codingId === enc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                AI Code
                              </motion.button>
                            )}
                            {enc.status === "coded" && enc._count.claims === 0 && (
                              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => api.generateClaimFromEncounter(enc.id).then(() => queryClient.invalidateQueries({ queryKey: ["encounters"] }))}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#60a5fa" }}>
                                <FileText className="w-3.5 h-3.5" />Claim
                              </motion.button>
                            )}
                            {enc._count?.claims > 0 && (
                              <Link href="/claims"
                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-400 px-2 py-1.5 rounded-lg transition-colors">
                                <Eye className="w-3.5 h-3.5" />View
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
          </motion.div>
        )}

        {/* ── PATIENT RECORDS ─────────────────────────────────────────── */}
        {tab === "records" && (
          <motion.div key="records" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="relative mb-5 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
                placeholder="Search by name or SHA number…"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f4ff" }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((p, i) => (
                <motion.div key={p.shaNumber} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass-card p-5 cursor-pointer group"
                  style={{ transition: "border-color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(20,184,166,0.25)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
                         style={{ background: `linear-gradient(135deg,${p.sex === "F" ? "#ec4899,#db2777" : "#14b8a6,#0891b2"})` }}>
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm leading-tight">{p.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{p.shaNumber}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: p.sex === "F" ? "rgba(236,72,153,0.12)" : "rgba(20,184,166,0.12)",
                                   color: p.sex === "F" ? "#f472b6" : "#2dd4bf" }}>
                      {p.sex === "F" ? "Female" : "Male"}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5"><Calendar className="w-3 h-3" />Date of Birth</span>
                      <span className="text-slate-300">{p.dob}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5"><Activity className="w-3 h-3" />Visits</span>
                      <span className="text-teal-400 font-semibold">{p.visits} encounters</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Last Visit</span>
                      <span className="text-slate-300">{p.lastVisit}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 flex items-center justify-between"
                       style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-xs text-slate-600">{p.phone}</span>
                    <span className="flex items-center gap-1 text-xs text-teal-500 group-hover:text-teal-300 transition-colors">
                      View Record <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── SHA CODING QUEUE ────────────────────────────────────────── */}
        {tab === "coding" && (
          <motion.div key="coding" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            {/* AI coding stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Awaiting AI Coding", value: codingQueue.length.toString(), color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
                { label: "Coded This Month", value: "284", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
                { label: "Avg Confidence", value: "91%", color: "#14b8a6", bg: "rgba(20,184,166,0.1)" },
              ].map(s => (
                <div key={s.label} className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                       style={{ background: s.bg }}>
                    <TrendingUp className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white leading-none">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {codingQueue.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Brain className="w-10 h-10 text-teal-500/50 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">Coding queue is empty</p>
                <p className="text-slate-500 text-sm">All encounters have been coded</p>
              </div>
            ) : (
              <div className="space-y-3">
                {codingQueue.map((enc, i) => (
                  <motion.div key={enc.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass-card p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                           style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
                        <Stethoscope className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-semibold">{enc.patientName}</span>
                          <span className="text-xs text-slate-500 font-mono">{enc.patientShaNumber}</span>
                        </div>
                        <p className="text-slate-400 text-sm mb-1">{enc.chiefComplaint}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{formatDate(enc.visitDate)}</span>
                          <span>·</span>
                          <span className="capitalize">{enc.visitType.replace("_", " ")}</span>
                          <span>·</span>
                          <span>{enc.provider?.name}</span>
                        </div>
                      </div>
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => codeMutation.mutate(enc.id)} disabled={codingId === enc.id}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 0 16px rgba(124,58,237,0.3)" }}>
                        {codingId === enc.id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />Coding…</>
                        ) : (
                          <><Sparkles className="w-4 h-4" />Run AI Coder</>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Code history */}
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-teal-400" />
                Recently Coded
              </h3>
              {encounters.filter(e => e.status === "coded" || e.status === "claim_generated").map((enc, i) => (
                <div key={enc.id} className="flex items-center gap-4 py-3"
                     style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined }}>
                  <div className="flex-1 min-w-0">
                    <span className="text-slate-200 text-sm font-medium">{enc.patientName}</span>
                    <span className="text-slate-500 text-xs ml-2">{enc.chiefComplaint}</span>
                  </div>
                  <span className="text-emerald-400 text-xs font-semibold">{enc.items.length} codes</span>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(20,184,166,0.1)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.2)" }}>
                    {STATUS_CONFIG[enc.status]?.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
