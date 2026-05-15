"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Plus, Sparkles, Loader2, FileUp, Check,
  Eye, FileText, Search, Stethoscope, UserRound,
  Brain, ClipboardList, ArrowRight, TrendingUp,
  Calendar, ChevronRight, Activity, X, Phone, User,
  Heart, Thermometer, Wind, AlertTriangle, Shield,
  DollarSign, Pill, Zap,
} from "lucide-react";
import Papa from "papaparse";
import { api } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

/* ─── Types ───────────────────────────────────────────── */
const EMPTY_PT = { shaNumber:"", name:"", dob:"", sex:"" as "M"|"F"|"", phone:"", county:"Nairobi", nokName:"", nokPhone:"", allergies:"", chronicConditions:"" };

const VISIT_TYPES = ["outpatient","inpatient","emergency","maternity","day_case"];
const EMPTY_ENC = { patientShaNumber:"", patientName:"", visitType:"outpatient", chiefComplaint:"", provider:"", referral:"no" };

/* ─── Modals (unchanged logic, upgraded visuals) ─────── */
function RegisterPatientModal({ onClose, onSave }: { onClose:()=>void; onSave:(p:typeof MOCK_PATIENTS[0])=>void }) {
  const [form, setForm] = useState(EMPTY_PT);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof EMPTY_PT, v: string) => setForm(f=>({...f,[k]:v}));
  const iS = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"#f0f4ff" };
  const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all";
  const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5 font-display tracking-wide";

  const submit = async () => {
    if (!form.name) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    onSave({ shaNumber:form.shaNumber||`SHA${Date.now().toString().slice(-10)}`, name:form.name, dob:form.dob||"—", sex:form.sex||"M", phone:form.phone||"—", visits:0, lastVisit:new Date().toISOString().slice(0,10) });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.78)", backdropFilter:"blur(10px)" }}>
      <motion.div initial={{ scale:0.95,opacity:0,y:8 }} animate={{ scale:1,opacity:1,y:0 }} transition={{ type:"spring",stiffness:360,damping:28 }}
        className="w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl"
        style={{ background:"linear-gradient(180deg,#0d1526,#060b18)", border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 32px 80px rgba(0,0,0,0.7)" }}>
        <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow:"0 0 16px rgba(20,184,166,0.35)" }}>
            <UserRound className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-white">Register Patient</h2>
            <p className="text-slate-500 text-xs mt-0.5">Create a new patient record</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-white transition-colors" style={{ background:"rgba(255,255,255,0.04)" }}><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-none">
          <div className="grid grid-cols-2 gap-4">
            {[ ["SHA Number","shaNumber","SHA2024XXXXXX","text"],["Full Name *","name","Full name","text"],["Date of Birth","dob","","date"],["Phone","phone","+254 7XX XXX XXX","text"],["County","county","Nairobi","text"],["Next of Kin","nokName","Name","text"],["NOK Phone","nokPhone","+254…","text"] ].map(([label, key, ph, type]) => (
              <div key={key} className={key==="nokPhone"||key==="nokName" ? "" : ""}>
                <label className={labelCls}>{label}</label>
                <input type={type} className={inputCls} style={iS} placeholder={ph}
                  value={form[key as keyof typeof EMPTY_PT]} onChange={e=>set(key as keyof typeof EMPTY_PT,e.target.value)} />
              </div>
            ))}
            <div>
              <label className={labelCls}>Sex</label>
              <select className={inputCls} style={iS} value={form.sex} onChange={e=>set("sex",e.target.value as "M"|"F"|"")}>
                <option value="">Select…</option><option value="M">Male</option><option value="F">Female</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Known Allergies</label>
              <input className={inputCls} style={iS} placeholder="e.g. Penicillin, NSAIDs — or None" value={form.allergies} onChange={e=>set("allergies",e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Chronic Conditions</label>
              <input className={inputCls} style={iS} placeholder="e.g. Diabetes Type 2, Hypertension" value={form.chronicConditions} onChange={e=>set("chronicConditions",e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-400" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>Cancel</button>
          <button onClick={submit} disabled={loading||!form.name} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow:"0 0 16px rgba(20,184,166,0.3)" }}>
            {loading?<><Loader2 className="w-4 h-4 animate-spin"/>Saving…</>:<><Check className="w-4 h-4"/>Register Patient</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function NewEncounterModal({ patients, onClose, onSave }: { patients:typeof MOCK_PATIENTS; onClose:()=>void; onSave:(e:typeof MOCK_ENCOUNTERS[0])=>void }) {
  const [form, setForm] = useState(EMPTY_ENC);
  const [loading, setLoading] = useState(false);
  const [lookup, setLookup] = useState(false);
  const set = (k: keyof typeof EMPTY_ENC, v: string) => setForm(f=>({...f,[k]:v}));
  const iS = { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"#f0f4ff" };
  const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500";
  const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5 font-display tracking-wide";

  const lookupPatient = () => {
    setLookup(true);
    const found = patients.find(p=>p.shaNumber===form.patientShaNumber||p.name.toLowerCase()===form.patientShaNumber.toLowerCase());
    setTimeout(()=>{ setLookup(false); if(found) set("patientName",found.name); }, 800);
  };

  const submit = async () => {
    if (!form.chiefComplaint||!form.patientName) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    onSave({ id:`e${Date.now()}`, patientShaNumber:form.patientShaNumber||`SHA${Date.now().toString().slice(-10)}`, patientName:form.patientName, visitDate:new Date().toISOString(), visitType:form.visitType, chiefComplaint:form.chiefComplaint, status:"ready_to_code", source:"manual", provider:{name:form.provider||"Dr. Unknown", specialty:"General Medicine"}, items:[], _count:{claims:0}, confidence:null });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.78)", backdropFilter:"blur(10px)" }}>
      <motion.div initial={{ scale:0.95,opacity:0,y:8 }} animate={{ scale:1,opacity:1,y:0 }} transition={{ type:"spring",stiffness:360,damping:28 }}
        className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-2xl"
        style={{ background:"linear-gradient(180deg,#0d1526,#060b18)", border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 32px 80px rgba(0,0,0,0.7)" }}>
        <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow:"0 0 16px rgba(20,184,166,0.35)" }}>
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-white">New Encounter</h2>
            <p className="text-slate-500 text-xs mt-0.5">Record a new clinical visit</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-white" style={{ background:"rgba(255,255,255,0.04)" }}><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 scrollbar-none">
          <div>
            <label className={labelCls}>SHA Number / Patient Name</label>
            <div className="flex gap-2">
              <input className={inputCls+" flex-1"} style={iS} placeholder="SHA number or name" value={form.patientShaNumber} onChange={e=>set("patientShaNumber",e.target.value)} />
              <button onClick={lookupPatient} className="px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 flex-shrink-0"
                style={{ background:"rgba(20,184,166,0.1)", border:"1px solid rgba(20,184,166,0.2)", color:"#2dd4bf" }}>
                {lookup?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Search className="w-3.5 h-3.5"/>}Lookup
              </button>
            </div>
          </div>
          {form.patientName && (
            <motion.div initial={{scale:0.96,opacity:0}} animate={{scale:1,opacity:1}} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background:"rgba(20,184,166,0.08)", border:"1px solid rgba(20,184,166,0.2)" }}>
              <Check className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-sm text-teal-300 font-semibold">{form.patientName}</span>
            </motion.div>
          )}
          <div>
            <label className={labelCls}>Patient Name (if not found)</label>
            <input className={inputCls} style={iS} placeholder="Full name" value={form.patientName} onChange={e=>set("patientName",e.target.value)} />
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
              <input className={inputCls} style={iS} placeholder="Dr. Name (KMPDC)" value={form.provider} onChange={e=>set("provider",e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Chief Complaint *</label>
            <textarea className={inputCls} style={{ ...iS, minHeight:80, resize:"none" as const }}
              placeholder="Primary presenting complaint…" value={form.chiefComplaint} onChange={e=>set("chiefComplaint",e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-400" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>Cancel</button>
          <button onClick={submit} disabled={loading||!form.patientName||!form.chiefComplaint} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background:"linear-gradient(135deg,#14b8a6,#0891b2)", boxShadow:"0 0 16px rgba(20,184,166,0.3)" }}>
            {loading?<><Loader2 className="w-4 h-4 animate-spin"/>Creating…</>:<><Check className="w-4 h-4"/>Create Encounter</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Mock data ───────────────────────────────────────── */
const MOCK_ENCOUNTERS = [
  { id:"e1", patientShaNumber:"SHA2024001234", patientName:"Mary Achieng",  visitDate:new Date(Date.now()-86400000).toISOString(), visitType:"outpatient", chiefComplaint:"Fever and headache for 3 days",         status:"claim_generated", source:"manual", provider:{name:"Dr. Grace Otieno",   specialty:"General Medicine"}, items:[{type:"diagnosis"},{type:"procedure"},{type:"investigation"},{type:"drug"}], _count:{claims:1}, confidence:"high"  },
  { id:"e2", patientShaNumber:"SHA2024005678", patientName:"John Kamau",    visitDate:new Date(Date.now()-2*86400000).toISOString(), visitType:"inpatient",  chiefComplaint:"Abdominal pain, appendicitis",         status:"coded",           source:"csv",    provider:{name:"Dr. Samuel Kipchoge",specialty:"Surgery"},          items:[{type:"diagnosis"},{type:"procedure"}], _count:{claims:0}, confidence:"high"   },
  { id:"e3", patientShaNumber:"SHA2024009012", patientName:"Fatuma Hassan", visitDate:new Date(Date.now()-3*86400000).toISOString(), visitType:"maternity",  chiefComplaint:"In labour, 38 weeks gestation",       status:"ready_to_code",   source:"manual", provider:{name:"Dr. Grace Otieno",   specialty:"General Medicine"}, items:[], _count:{claims:0}, confidence:null    },
  { id:"e4", patientShaNumber:"SHA2024011111", patientName:"Peter Otieno",  visitDate:new Date(Date.now()-4*86400000).toISOString(), visitType:"emergency",  chiefComplaint:"RTA, fracture right femur",            status:"ready_to_code",   source:"csv",    provider:{name:"Dr. Samuel Kipchoge",specialty:"Surgery"},          items:[], _count:{claims:0}, confidence:null    },
  { id:"e5", patientShaNumber:"SHA2024022222", patientName:"Grace Wanjiku", visitDate:new Date(Date.now()-6*86400000).toISOString(), visitType:"maternity",  chiefComplaint:"Caesarean section — elective",        status:"claim_generated", source:"manual", provider:{name:"Dr. Grace Otieno",   specialty:"General Medicine"}, items:[{type:"diagnosis"},{type:"procedure"},{type:"drug"}], _count:{claims:1}, confidence:"medium"},
];

const MOCK_PATIENTS = [
  { shaNumber:"SHA2024001234", name:"Mary Achieng",  dob:"1985-03-12", sex:"F", phone:"+254722000001", visits:3, lastVisit:"2025-05-13" },
  { shaNumber:"SHA2024005678", name:"John Kamau",    dob:"1990-07-22", sex:"M", phone:"+254733000002", visits:1, lastVisit:"2025-05-12" },
  { shaNumber:"SHA2024009012", name:"Fatuma Hassan", dob:"1997-11-05", sex:"F", phone:"+254744000003", visits:2, lastVisit:"2025-05-11" },
  { shaNumber:"SHA2024011111", name:"Peter Otieno",  dob:"1989-01-30", sex:"M", phone:"+254755000004", visits:1, lastVisit:"2025-05-10" },
  { shaNumber:"SHA2024022222", name:"Grace Wanjiku", dob:"1996-08-15", sex:"F", phone:"+254766000005", visits:4, lastVisit:"2025-05-08" },
];

const PATIENT_DETAILS: Record<string, {
  bloodGroup:string; county:string; shaStatus:string; shaCoverage:string; shaBalance:string;
  conditions:{code:string;name:string;active:boolean}[];
  allergies:{substance:string;reaction:string;severity:"mild"|"moderate"|"severe"}[];
  medications:{name:string;dose:string;frequency:string}[];
  vitals:{bp:string;hr:number;temp:string;weight:string;height:string;bmi:string};
}> = {
  "SHA2024001234":{ bloodGroup:"A+", county:"Nairobi",  shaStatus:"Active", shaCoverage:"Enhanced Benefit Package", shaBalance:"KES 48,200", conditions:[{code:"I10",name:"Essential Hypertension",active:true},{code:"E11.9",name:"Type 2 Diabetes Mellitus",active:true},{code:"J06.9",name:"Acute URI (Resolved)",active:false}], allergies:[{substance:"Penicillin",reaction:"Anaphylaxis",severity:"severe"},{substance:"NSAIDs",reaction:"GI Bleed",severity:"moderate"}], medications:[{name:"Metformin",dose:"500 mg",frequency:"BD"},{name:"Amlodipine",dose:"5 mg",frequency:"OD"},{name:"Lisinopril",dose:"10 mg",frequency:"OD"}], vitals:{bp:"138/86",hr:78,temp:"36.8°C",weight:"72 kg",height:"163 cm",bmi:"27.1"} },
  "SHA2024005678":{ bloodGroup:"O+", county:"Kiambu",   shaStatus:"Active", shaCoverage:"Basic Benefit Package",    shaBalance:"KES 22,500", conditions:[{code:"K37",name:"Unspecified Appendicitis",active:true}], allergies:[], medications:[], vitals:{bp:"122/78",hr:88,temp:"38.2°C",weight:"82 kg",height:"178 cm",bmi:"25.9"} },
  "SHA2024009012":{ bloodGroup:"B+", county:"Mombasa",  shaStatus:"Active", shaCoverage:"Maternity Package",         shaBalance:"KES 65,000", conditions:[{code:"O14.1",name:"Severe Pre-eclampsia",active:true},{code:"Z34.3",name:"Supervision 3rd Trimester",active:true}], allergies:[{substance:"Latex",reaction:"Contact Dermatitis",severity:"mild"}], medications:[{name:"Labetalol",dose:"200 mg",frequency:"BD"},{name:"Folic Acid",dose:"5 mg",frequency:"OD"}], vitals:{bp:"162/105",hr:98,temp:"37.1°C",weight:"68 kg",height:"158 cm",bmi:"27.2"} },
  "SHA2024011111":{ bloodGroup:"AB+",county:"Kericho",  shaStatus:"Active", shaCoverage:"Basic Benefit Package",     shaBalance:"KES 18,750", conditions:[{code:"S72.0",name:"Fracture of Femur",active:true},{code:"S09.90",name:"Polytrauma",active:true}], allergies:[], medications:[{name:"Morphine",dose:"10 mg",frequency:"PRN"},{name:"Cefazolin",dose:"1g IV",frequency:"8-hourly"}], vitals:{bp:"88/60",hr:104,temp:"37.4°C",weight:"75 kg",height:"172 cm",bmi:"25.3"} },
  "SHA2024022222":{ bloodGroup:"O-", county:"Nakuru",   shaStatus:"Active", shaCoverage:"Enhanced Benefit Package",  shaBalance:"KES 55,000", conditions:[{code:"Z38.01",name:"Singleton Born in Hospital",active:true}], allergies:[{substance:"Codeine",reaction:"Nausea/Vomiting",severity:"mild"}], medications:[{name:"Oxytocin",dose:"10 IU IM",frequency:"Post-delivery"},{name:"Ferrous Sulphate",dose:"200 mg",frequency:"BD"}], vitals:{bp:"118/72",hr:92,temp:"37.0°C",weight:"64 kg",height:"162 cm",bmi:"24.4"} },
};

const CODING_RESULTS: Record<string,{code:string;desc:string;type:"primary"|"secondary"|"procedure"|"drug";confidence:number;tariff:number}[]> = {
  "e2":[{code:"K37",desc:"Unspecified appendicitis",type:"primary",confidence:97,tariff:18500},{code:"K65.0",desc:"Generalised acute peritonitis",type:"secondary",confidence:82,tariff:12000},{code:"47.09",desc:"Other appendectomy (laparoscopic)",type:"procedure",confidence:94,tariff:55000},{code:"Z87.39",desc:"Personal hx of gastrointestinal dis.",type:"secondary",confidence:60,tariff:0}],
  "e4":[{code:"S72.001",desc:"Fracture of unspecified part of neck of right femur",type:"primary",confidence:97,tariff:45000},{code:"S09.90",desc:"Unspecified injury of head — polytrauma",type:"secondary",confidence:89,tariff:8500},{code:"T14.90",desc:"Injury unspecified",type:"secondary",confidence:72,tariff:3200},{code:"79.05",desc:"Open reduction of fracture — femur, with fixation",type:"procedure",confidence:94,tariff:85000}],
  "e3":[{code:"O14.10",desc:"Severe pre-eclampsia, unspecified trimester",type:"primary",confidence:95,tariff:14500},{code:"O15.0",desc:"Eclampsia in pregnancy",type:"secondary",confidence:88,tariff:18000},{code:"Z34.38",desc:"Encounter supervision 3rd trimester",type:"secondary",confidence:99,tariff:2500},{code:"74.1",desc:"Low cervical caesarean section",type:"procedure",confidence:91,tariff:65000}],
};

const NARRATIVES: Record<string,string> = {
  "e1":"Patient presented with 3-day history of high-grade fever (39.2°C), severe headache, myalgia and chills. Malaria RDT positive. Full blood count shows Hb 10.2, WBC 3.8. Started on artemether-lumefantrine with supportive care. Patient is conscious and oriented.",
  "e2":"Patient presented with 2-day history of right iliac fossa pain, anorexia and low-grade fever. Examination revealed guarding and rebound tenderness at McBurney's point. WBC 16.8 × 10⁹/L. CT abdomen confirms acute appendicitis without perforation. Consented for laparoscopic appendectomy.",
  "e3":"G2P1 at 38+2 weeks presented in early labour. BP on admission 162/105 mmHg with 3+ proteinuria. Diagnosis of severe pre-eclampsia made. Magnesium sulphate loading dose given. Decision for emergency lower segment caesarean section. Baby boy born, Apgar 8/9.",
  "e4":"34-year-old male brought in following road traffic accident on Kericho-Nakuru highway. GCS 13/15. Right femur fracture confirmed on X-ray. Haemodynamically unstable — BP 88/60, HR 104. IV access × 2, 2 units pRBC transfused. Referred to KNH for definitive fixation.",
  "e5":"G3P2 at 37+4 weeks for elective lower segment caesarean section. Previous 2 caesarean sections. Pre-op bloods normal. Spinal anaesthesia administered. Baby girl born in good condition, Apgar 9/10. Blood loss estimated at 450 ml.",
};

const STATUS_CFG: Record<string,{label:string;color:string;bg:string}> = {
  draft:           {label:"Draft",           color:"#64748b",bg:"rgba(100,116,139,0.12)"},
  ready_to_code:   {label:"Ready to Code",   color:"#3b82f6",bg:"rgba(59,130,246,0.12)"},
  coding:          {label:"Coding…",         color:"#8b5cf6",bg:"rgba(139,92,246,0.12)"},
  coded:           {label:"Coded",           color:"#10b981",bg:"rgba(16,185,129,0.12)"},
  claim_generated: {label:"Claim Generated", color:"#14b8a6",bg:"rgba(20,184,166,0.12)"},
  error:           {label:"Error",           color:"#ef4444",bg:"rgba(239,68,68,0.12)"},
};

const VISIT_COLOR: Record<string,string> = {
  outpatient:"#14b8a6", inpatient:"#3b82f6", emergency:"#ef4444", maternity:"#ec4899", day_case:"#8b5cf6",
};

const CODE_TYPE_CFG = {
  primary:   {color:"#ef4444", bg:"rgba(239,68,68,0.12)",   label:"Primary Dx"},
  secondary: {color:"#f59e0b", bg:"rgba(245,158,11,0.12)",  label:"Secondary Dx"},
  procedure: {color:"#3b82f6", bg:"rgba(59,130,246,0.12)",  label:"Procedure"},
  drug:      {color:"#10b981", bg:"rgba(16,185,129,0.12)",  label:"Drug"},
};

const TABS = [
  {id:"queue",   label:"Clinical Queue",  icon:ClipboardList},
  {id:"records", label:"Patient Records", icon:UserRound},
  {id:"coding",  label:"SHA Coding",      icon:Brain},
];

/* ─── Main Page ───────────────────────────────────────── */
export default function EncountersPage() {
  const { toast }  = useToast();
  const qc         = useQueryClient();
  const fileRef    = useRef<HTMLInputElement>(null);
  const [tab, setTab]     = useState<"queue"|"records"|"coding">("queue");
  const [csvPreview, setCsvPreview] = useState<Record<string,string>[]|null>(null);
  const [search, setSearch]         = useState("");
  const [codingId, setCodingId]     = useState<string|null>(null);
  const [patientSearch, setPatientSearch]   = useState("");
  const [showRegPt, setShowRegPt]           = useState(false);
  const [showNewEnc, setShowNewEnc]         = useState(false);
  const [localPatients, setLocalPatients]   = useState(MOCK_PATIENTS);
  const [localEncs, setLocalEncs]           = useState<typeof MOCK_ENCOUNTERS>([]);
  const [selectedEncId, setSelectedEncId]   = useState<string>("e2");
  const [selectedPatId, setSelectedPatId]   = useState<string>("SHA2024001234");
  const [patDetailTab, setPatDetailTab]     = useState<"overview"|"conditions"|"meds">("overview");
  const [localResults, setLocalResults]     = useState(CODING_RESULTS);
  const [icdSearch, setIcdSearch]           = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");

  const { data, isLoading } = useQuery({
    queryKey:["encounters"],
    queryFn:()=>api.getEncounters(),
    placeholderData:{items:MOCK_ENCOUNTERS,total:MOCK_ENCOUNTERS.length,page:1,pageSize:20},
    staleTime: Infinity,
    retry: false,
    select:(d)=>d as {items:typeof MOCK_ENCOUNTERS;total:number},
  });

  const codeMutation = useMutation({
    mutationFn:(encounterId:string)=>{ setCodingId(encounterId); return api.codeEncounter(encounterId); },
    onSuccess:(result)=>{ toast({title:"AI coding complete",description:`${(result as {items:unknown[]}).items?.length||0} codes extracted`}); qc.invalidateQueries({queryKey:["encounters"]}); },
    onError:()=>toast({title:"Coding failed",variant:"destructive"}),
    onSettled:()=>setCodingId(null),
  });

  const importMutation = useMutation({
    mutationFn:(rows:Record<string,string>[])=>api.bulkImportEncounters(rows),
    onSuccess:(result)=>{ toast({title:`Imported ${result.created} encounters`}); setCsvPreview(null); qc.invalidateQueries({queryKey:["encounters"]}); },
  });

  const handleFile = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(!file) return;
    Papa.parse(file,{header:true,skipEmptyLines:true,complete:(r)=>setCsvPreview(r.data as Record<string,string>[])});
  };

  const encounters      = [...localEncs, ...(data?.items||MOCK_ENCOUNTERS)];
  const filtered        = search ? encounters.filter(e=>e.patientName.toLowerCase().includes(search.toLowerCase())||e.patientShaNumber.includes(search)) : encounters;
  const statusFiltered  = statusFilter==="all" ? filtered : filtered.filter(e=>e.status===statusFilter);
  const codingQueue     = encounters.filter(e=>["ready_to_code","draft"].includes(e.status));
  const mergedPatients  = [...localPatients.filter(p=>!MOCK_PATIENTS.find(m=>m.shaNumber===p.shaNumber)), ...MOCK_PATIENTS];
  const filteredPats    = patientSearch ? mergedPatients.filter(p=>p.name.toLowerCase().includes(patientSearch.toLowerCase())||p.shaNumber.includes(patientSearch)) : mergedPatients;

  const selectedEnc     = encounters.find(e=>e.id===selectedEncId)||encounters[0];
  const selectedPat     = mergedPatients.find(p=>p.shaNumber===selectedPatId)||mergedPatients[0];
  const selectedDetails = selectedPat ? PATIENT_DETAILS[selectedPat.shaNumber] : null;
  const selectedCodes   = selectedEnc ? localResults[selectedEnc.id] : undefined;

  const icdSuggestions = [
    {code:"A09",  desc:"Other and unspecified gastroenteritis"},
    {code:"B54",  desc:"Unspecified malaria"},
    {code:"I10",  desc:"Essential (primary) hypertension"},
    {code:"J06.9",desc:"Acute upper respiratory infection, unspecified"},
    {code:"K30",  desc:"Functional dyspepsia"},
    {code:"N39.0",desc:"Urinary tract infection, site not specified"},
    {code:"O80",  desc:"Single spontaneous delivery"},
    {code:"Z00.0",desc:"General adult medical examination"},
  ].filter(s=>!icdSearch||s.desc.toLowerCase().includes(icdSearch.toLowerCase())||s.code.toLowerCase().includes(icdSearch.toLowerCase()));

  return (
    <div className="p-5 min-h-full" style={{background:"var(--bg-primary)"}}>
      {showRegPt && (
        <RegisterPatientModal onClose={()=>setShowRegPt(false)} onSave={p=>{ setLocalPatients(prev=>[p,...prev]); setShowRegPt(false); setTab("records"); toast({title:"Patient registered",description:`${p.name} added`}); }} />
      )}
      {showNewEnc && (
        <NewEncounterModal patients={mergedPatients} onClose={()=>setShowNewEnc(false)} onSave={e=>{ setLocalEncs(prev=>[e,...prev]); setShowNewEnc(false); setTab("queue"); toast({title:"Encounter created",description:`${e.patientName} — ready to code`}); }} />
      )}

      {/* Header */}
      <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-3">
            <Stethoscope className="w-5 h-5 text-teal-400" />
            <h1 className="font-display text-2xl font-bold text-white">MyUzimaClinical</h1>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">{encounters.length} encounters · SHA clinical suite</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",color:"#94a3b8"}}>
            <Upload className="w-4 h-4"/>Import CSV
          </motion.button>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden"/>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>setShowRegPt(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",color:"#94a3b8"}}>
            <User className="w-4 h-4"/>Register Patient
          </motion.button>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>setShowNewEnc(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{background:"linear-gradient(135deg,#14b8a6,#0891b2)",boxShadow:"0 0 20px rgba(20,184,166,0.3)"}}>
            <Plus className="w-4 h-4"/>New Encounter
          </motion.button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl mb-5 w-fit"
           style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as typeof tab)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab===t.id?"text-white":"text-slate-500 hover:text-slate-300")}
            style={tab===t.id?{background:"linear-gradient(135deg,rgba(20,184,166,0.2),rgba(8,145,178,0.1))",border:"1px solid rgba(20,184,166,0.25)"}:{}}>
            <t.icon className={cn("w-4 h-4",tab===t.id?"text-teal-400":"")}/>
            {t.label}
            {t.id==="coding"&&codingQueue.length>0&&(
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold">{codingQueue.length}</span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── CLINICAL QUEUE ─────────────────────────────── */}
        {tab==="queue" && (
          <motion.div key="queue" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">

            {/* Stats */}
            <div className="grid grid-cols-5 gap-3">
              {([
                {label:"Total",         value:encounters.length,                                         color:"#94a3b8",bg:"rgba(148,163,184,0.08)"},
                {label:"Ready to Code", value:encounters.filter(e=>e.status==="ready_to_code").length,   color:"#3b82f6",bg:"rgba(59,130,246,0.08)"},
                {label:"Coding",        value:encounters.filter(e=>e.status==="coding").length,          color:"#8b5cf6",bg:"rgba(139,92,246,0.08)"},
                {label:"Coded",         value:encounters.filter(e=>e.status==="coded").length,           color:"#10b981",bg:"rgba(16,185,129,0.08)"},
                {label:"Claimed",       value:encounters.filter(e=>e.status==="claim_generated").length, color:"#14b8a6",bg:"rgba(20,184,166,0.08)"},
              ] as {label:string;value:number;color:string;bg:string}[]).map(s=>(
                <div key={s.label} className="glass-card p-3.5 flex items-center gap-3">
                  <div className="w-1.5 h-8 rounded-full flex-shrink-0 overflow-hidden" style={{background:"rgba(255,255,255,0.06)"}}>
                    <motion.div initial={{height:0}} animate={{height:`${Math.min(100,(s.value/encounters.length||0)*100)}%`}}
                      transition={{delay:0.2,duration:0.6,ease:[0.4,0,0.2,1]}}
                      className="w-full rounded-full" style={{background:s.color,minHeight:3}} />
                  </div>
                  <div>
                    <p className="font-display text-xl font-bold text-white leading-none tabular-nums">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CSV preview */}
            {csvPreview && (
              <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} className="rounded-2xl p-4"
                style={{background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)"}}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileUp className="w-4 h-4 text-blue-400"/>
                    <span className="font-semibold text-blue-300 text-sm">{csvPreview.length} rows ready to import</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>setCsvPreview(null)} className="text-sm text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg"
                      style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}}>Cancel</button>
                    <button onClick={()=>importMutation.mutate(csvPreview)} disabled={importMutation.isPending}
                      className="flex items-center gap-2 text-sm px-4 py-1.5 rounded-lg font-medium text-white"
                      style={{background:"linear-gradient(135deg,#3b82f6,#2563eb)"}}>
                      {importMutation.isPending?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>}Import {csvPreview.length} rows
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Search + status filter */}
            <div className="flex items-center gap-3">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patient or SHA number…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500/40"
                  style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"#f0f4ff"}}/>
              </div>
              {["all","ready_to_code","coded","claim_generated"].map(f=>(
                <button key={f} onClick={()=>setStatusFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                  style={statusFilter===f?{background:"rgba(20,184,166,0.12)",color:"#2dd4bf",border:"1px solid rgba(20,184,166,0.25)"}:{background:"rgba(255,255,255,0.04)",color:"#64748b",border:"1px solid rgba(255,255,255,0.07)"}}>
                  {f.replace("_"," ")}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{border:"1px solid rgba(255,255,255,0.06)"}}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{background:"rgba(255,255,255,0.025)",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                    {["Patient","Visit","Status","Provider","Codes","Actions"].map(h=>(
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider font-display">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? Array.from({length:4}).map((_,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      {Array.from({length:6}).map((_,j)=><td key={j} className="px-4 py-4"><div className="h-3.5 rounded shimmer" style={{width:`${60+Math.random()*40}%`}}/></td>)}
                    </tr>
                  )) : statusFiltered.length===0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No encounters found</td></tr>
                  ) : statusFiltered.map((enc,i)=>{
                    const sc = STATUS_CFG[enc.status]||STATUS_CFG.draft;
                    const vtColor = VISIT_COLOR[enc.visitType]||"#64748b";
                    return (
                      <motion.tr key={enc.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.035}}
                        className="group transition-colors cursor-default"
                        style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}
                        onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.025)")}
                        onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                                 style={{background:enc.patientShaNumber.includes("9012")||enc.patientShaNumber.includes("1234")||enc.patientShaNumber.includes("22222")?"linear-gradient(135deg,#ec4899,#db2777)":"linear-gradient(135deg,#14b8a6,#0891b2)"}}>
                              {enc.patientName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-white text-sm">{enc.patientName}</div>
                              <div className="text-xs text-slate-500 font-mono">{enc.patientShaNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-slate-300 text-xs">{formatDate(enc.visitDate)}</div>
                          <span className="text-xs font-medium capitalize px-1.5 py-0.5 rounded-full mt-1 inline-block"
                                style={{background:`${vtColor}15`,color:vtColor,border:`1px solid ${vtColor}28`,fontSize:10}}>
                            {enc.visitType.replace("_"," ")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                                style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.color}30`}}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 text-xs">{enc.provider?.name}</td>
                        <td className="px-4 py-3.5">
                          {enc.items.length>0
                            ?<span className="text-emerald-400 text-xs font-semibold">{enc.items.length} codes</span>
                            :<span className="text-slate-600 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            {["ready_to_code","draft"].includes(enc.status) && (
                              <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                                onClick={()=>{codeMutation.mutate(enc.id);setSelectedEncId(enc.id);setTab("coding");}}
                                disabled={codingId===enc.id}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                                style={{background:"rgba(20,184,166,0.1)",border:"1px solid rgba(20,184,166,0.25)",color:"#2dd4bf"}}>
                                {codingId===enc.id?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Sparkles className="w-3.5 h-3.5"/>}
                                AI Code
                              </motion.button>
                            )}
                            {enc.status==="coded"&&enc._count.claims===0&&(
                              <button onClick={()=>api.generateClaimFromEncounter(enc.id).then(()=>qc.invalidateQueries({queryKey:["encounters"]}))}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                                style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.25)",color:"#60a5fa"}}>
                                <FileText className="w-3.5 h-3.5"/>Claim
                              </button>
                            )}
                            {enc._count?.claims>0&&(
                              <Link href="/claims" className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-400 px-2 py-1.5 rounded-lg transition-colors">
                                <Eye className="w-3.5 h-3.5"/>View
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

            {/* CSV hint */}
            <div className="rounded-xl p-3 flex items-center gap-3" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)"}}>
              <FileText className="w-4 h-4 text-slate-600 flex-shrink-0"/>
              <p className="text-xs text-slate-500">
                CSV headers: <span className="font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded text-xs">patient_sha_number, patient_name, dob, sex, visit_date, visit_type, provider_kmpdc, chief_complaint, narrative</span>
              </p>
            </div>
          </motion.div>
        )}

        {/* ── PATIENT RECORDS ─────────────────────────────── */}
        {tab==="records" && (
          <motion.div key="records" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
            <div className="flex items-center gap-3 mb-5">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"/>
                <input value={patientSearch} onChange={e=>setPatientSearch(e.target.value)} placeholder="Search by name or SHA number…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500/40"
                  style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"#f0f4ff"}}/>
              </div>
              <p className="text-xs text-slate-500">{filteredPats.length} patients</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredPats.map((p,i)=>{
                const det = PATIENT_DETAILS[p.shaNumber];
                return (
                  <motion.div key={p.shaNumber} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                    className="glass-card p-5 cursor-pointer group"
                    onClick={()=>{setSelectedPatId(p.shaNumber);}}
                    style={{borderColor:selectedPatId===p.shaNumber?"rgba(20,184,166,0.35)":"rgba(255,255,255,0.07)",transition:"border-color 0.2s"}}>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
                           style={{background:p.sex==="F"?"linear-gradient(135deg,#ec4899,#db2777)":"linear-gradient(135deg,#14b8a6,#0891b2)"}}>
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-white text-sm">{p.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{p.shaNumber}</p>
                      </div>
                      {det && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                              style={{background:"rgba(16,185,129,0.12)",color:"#4ade80"}}>
                          {det.shaStatus}
                        </span>
                      )}
                    </div>

                    {/* Vitals mini */}
                    {det && (
                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                        {[
                          {icon:Heart,     label:"BP",   value:det.vitals.bp,         color:"#ef4444"},
                          {icon:Activity,  label:"HR",   value:`${det.vitals.hr}bpm`,  color:"#f59e0b"},
                          {icon:Thermometer,label:"Temp",value:det.vitals.temp,        color:"#3b82f6"},
                        ].map(v=>(
                          <div key={v.label} className="rounded-lg p-1.5 text-center" style={{background:`${v.color}10`,border:`1px solid ${v.color}20`}}>
                            <v.icon className="w-3 h-3 mx-auto mb-0.5" style={{color:v.color}}/>
                            <p className="text-xs font-bold tabular-nums" style={{color:v.color,fontSize:10}}>{v.value}</p>
                            <p style={{fontSize:9,color:"#475569"}}>{v.label}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5"><Calendar className="w-3 h-3"/>DOB</span>
                        <span className="text-slate-300">{p.dob}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5"><Activity className="w-3 h-3"/>Visits</span>
                        <span className="text-teal-400 font-semibold">{p.visits}</span>
                      </div>
                      {det && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">SHA Balance</span>
                          <span className="text-emerald-400 font-semibold">{det.shaBalance}</span>
                        </div>
                      )}
                    </div>

                    {det && det.allergies.length>0 && (
                      <div className="mt-3 pt-3 flex items-center gap-1.5 flex-wrap" style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                        <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0"/>
                        {det.allergies.map(a=>(
                          <span key={a.substance} className="text-xs px-1.5 py-0.5 rounded-full"
                                style={{background:"rgba(239,68,68,0.1)",color:"#fca5a5",fontSize:10}}>
                            {a.substance}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── SHA CODING WORKBENCH ─────────────────────────── */}
        {tab==="coding" && (
          <motion.div key="coding" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3.5 mb-5">
              {[
                {label:"Awaiting AI Coding", value:codingQueue.length.toString(), color:"#3b82f6", bg:"rgba(59,130,246,0.09)", icon:Brain},
                {label:"Coded This Month",   value:"284",                         color:"#10b981", bg:"rgba(16,185,129,0.09)", icon:CheckCircle2},
                {label:"Avg Confidence",     value:"91%",                         color:"#14b8a6", bg:"rgba(20,184,166,0.09)", icon:Sparkles},
              ].map(s=>(
                <div key={s.label} className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:s.bg}}>
                    <s.icon className="w-5 h-5" style={{color:s.color}}/>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-white leading-none tabular-nums">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Two-panel coding workbench */}
            <div className="grid grid-cols-5 gap-4 min-h-[600px]">

              {/* Left: encounter queue */}
              <div className="col-span-2 space-y-2.5">
                <p className="text-xs font-semibold text-slate-400 font-display uppercase tracking-wider mb-3">Encounters</p>

                {encounters.map((enc)=>{
                  const sc = STATUS_CFG[enc.status]||STATUS_CFG.draft;
                  const vtColor = VISIT_COLOR[enc.visitType]||"#64748b";
                  const isActive = selectedEncId===enc.id;
                  return (
                    <motion.div key={enc.id} whileHover={{x:2}} onClick={()=>setSelectedEncId(enc.id)}
                      className="glass-card p-3.5 cursor-pointer"
                      style={{borderColor:isActive?"rgba(20,184,166,0.35)":"rgba(255,255,255,0.07)",borderLeft:isActive?"3px solid #14b8a6":"3px solid transparent",transition:"border-color 0.2s"}}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-200 text-sm font-medium">{enc.patientName}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                              style={{background:sc.bg,color:sc.color,fontSize:10}}>{sc.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1.5 leading-relaxed">{enc.chiefComplaint}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="px-1.5 py-0.5 rounded-full capitalize" style={{background:`${vtColor}15`,color:vtColor,fontSize:10}}>
                          {enc.visitType.replace("_"," ")}
                        </span>
                        <span>{formatDate(enc.visitDate)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Right: coding panel */}
              <div className="col-span-3 space-y-4">
                {selectedEnc && (
                  <>
                    {/* Encounter header */}
                    <div className="glass-card p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display font-bold text-white">{selectedEnc.patientName}</h3>
                            <span className="text-xs font-mono text-slate-500">{selectedEnc.patientShaNumber}</span>
                          </div>
                          <p className="text-slate-400 text-sm">{selectedEnc.chiefComplaint}</p>
                        </div>
                        {["ready_to_code","draft"].includes(selectedEnc.status) && (
                          <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                            onClick={()=>codeMutation.mutate(selectedEnc.id)} disabled={codingId===selectedEnc.id}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
                            style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",boxShadow:"0 0 16px rgba(124,58,237,0.3)"}}>
                            {codingId===selectedEnc.id?<><Loader2 className="w-4 h-4 animate-spin"/>Coding…</>:<><Sparkles className="w-4 h-4"/>Run AI Coder</>}
                          </motion.button>
                        )}
                      </div>

                      {/* Narrative */}
                      {NARRATIVES[selectedEnc.id] && (
                        <div className="p-3 rounded-xl text-xs text-slate-400 leading-relaxed"
                             style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)"}}>
                          <p className="text-slate-600 text-xs font-semibold mb-1.5 font-display uppercase tracking-wider">Clinical Narrative</p>
                          {NARRATIVES[selectedEnc.id]}
                        </div>
                      )}

                      {/* Patient vitals */}
                      {PATIENT_DETAILS[selectedEnc.patientShaNumber] && (
                        <div className="grid grid-cols-6 gap-2 mt-3">
                          {Object.entries(PATIENT_DETAILS[selectedEnc.patientShaNumber].vitals).map(([k,v])=>(
                            <div key={k} className="rounded-lg p-2 text-center" style={{background:"rgba(255,255,255,0.025)"}}>
                              <p className="font-bold text-white tabular-nums leading-none" style={{fontSize:11}}>{v}</p>
                              <p className="text-slate-600 uppercase mt-0.5" style={{fontSize:9}}>{k}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ICD code results + search */}
                    <div className="glass-card overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-violet-400"/>
                          <span className="font-display font-semibold text-white text-sm">AI Code Results</span>
                          {selectedCodes && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{background:"rgba(139,92,246,0.12)",color:"#c4b5fd"}}>
                              {selectedCodes.length} codes · KES {selectedCodes.reduce((s,c)=>s+c.tariff,0).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500"/>
                          <input value={icdSearch} onChange={e=>setIcdSearch(e.target.value)}
                            placeholder="Search ICD-11…"
                            className="pl-7 pr-3 py-1.5 text-xs rounded-lg focus:outline-none"
                            style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.09)",color:"#f0f4ff",width:160}}/>
                        </div>
                      </div>

                      {selectedCodes ? (
                        <>
                          <table className="w-full text-xs">
                            <thead>
                              <tr style={{background:"rgba(255,255,255,0.02)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                                {["Type","Code","Description","Conf.","Tariff (KES)"].map(h=>(
                                  <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider font-display" style={{fontSize:10}}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {selectedCodes.map((code,i)=>{
                                const tc = CODE_TYPE_CFG[code.type];
                                return (
                                  <tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                                    <td className="px-3 py-2.5">
                                      <span className="px-1.5 py-0.5 rounded-full font-semibold" style={{background:tc.bg,color:tc.color,fontSize:9}}>{tc.label}</span>
                                    </td>
                                    <td className="px-3 py-2.5 font-mono text-teal-300 font-semibold">{code.code}</td>
                                    <td className="px-3 py-2.5 text-slate-300 max-w-[180px] truncate">{code.desc}</td>
                                    <td className="px-3 py-2.5">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-12 h-1 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.08)"}}>
                                          <div className="h-full rounded-full" style={{width:`${code.confidence}%`,background:code.confidence>=90?"#10b981":code.confidence>=75?"#f59e0b":"#ef4444"}}/>
                                        </div>
                                        <span className="tabular-nums" style={{color:code.confidence>=90?"#10b981":code.confidence>=75?"#f59e0b":"#ef4444"}}>{code.confidence}%</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums" style={{color:code.tariff>0?"#f0f4ff":"#334155"}}>
                                      {code.tariff>0?code.tariff.toLocaleString():"—"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          {/* Generate claim */}
                          {selectedEnc.status==="coded" && selectedEnc._count.claims===0 && (
                            <div className="px-4 py-3 flex items-center justify-between" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                              <div>
                                <p className="text-xs text-slate-400">Total tariff:</p>
                                <p className="font-display font-bold text-white tabular-nums">KES {selectedCodes.reduce((s,c)=>s+c.tariff,0).toLocaleString()}</p>
                              </div>
                              <button onClick={()=>api.generateClaimFromEncounter(selectedEnc.id).then(()=>qc.invalidateQueries({queryKey:["encounters"]}))}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                                style={{background:"linear-gradient(135deg,#14b8a6,#0891b2)",boxShadow:"0 0 16px rgba(20,184,166,0.25)"}}>
                                <FileText className="w-4 h-4"/>Generate Claim
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-8">
                          {/* ICD suggestions when no codes yet */}
                          <div className="text-center mb-5">
                            <Brain className="w-8 h-8 text-violet-400/40 mx-auto mb-2"/>
                            <p className="text-slate-400 text-sm font-medium">No codes yet</p>
                            <p className="text-slate-600 text-xs mt-0.5">Run AI Coder or search ICD-11 manually</p>
                          </div>
                          {icdSearch && (
                            <div className="space-y-1.5">
                              <p className="text-xs text-slate-500 mb-2 font-display uppercase tracking-wider">ICD-11 Suggestions</p>
                              {icdSuggestions.map(s=>(
                                <div key={s.code} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-white/[0.04]"
                                     style={{border:"1px solid rgba(255,255,255,0.06)"}}>
                                  <span className="font-mono text-teal-300 text-xs font-semibold">{s.code}</span>
                                  <span className="text-xs text-slate-300 flex-1">{s.desc}</span>
                                  <button className="text-xs px-2 py-1 rounded-lg text-teal-400 hover:text-white transition-colors"
                                          style={{background:"rgba(20,184,166,0.08)"}}>Add</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// needed for import
const CheckCircle2 = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
