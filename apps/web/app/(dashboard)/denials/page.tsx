"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, RefreshCw, FileText, Loader2, ChevronDown,
  ChevronRight, CheckCircle2, Clock, Sparkles, Copy, Shield,
  TrendingDown, Calendar, Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatKes, formatDate, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const MOCK_DENIALS = [
  {
    id:"d1", claimId:"c4", status:"denied", totalAmount:7600, claimNumber:"SHA-1716100000-XYZ789",
    createdAt:new Date(Date.now()-2*86400000).toISOString(),
    encounter:{patientName:"Peter Otieno", patientShaNumber:"SHA2024011111", visitDate:new Date(Date.now()-3*86400000).toISOString(), visitType:"emergency", provider:{name:"Dr. Samuel Kipchoge"}},
    denials:[{id:"dn1", reasonCode:"ERR-002", reasonText:"Diagnosis-procedure mismatch: emergency consultation code does not match emergency procedure tariff", classifiedCategory:"coding_error", suggestedFix:"Review ICD-10 diagnosis codes against the clinical narrative. Verify procedure codes match documented services. Use AI coder to re-check mapping.", appealDeadline:new Date(Date.now()+28*86400000).toISOString(), resolvedAt:null}],
    _count:{denials:1},
  },
  {
    id:"d2", claimId:"c7", status:"denied", totalAmount:4200, claimNumber:"SHA-1715800000-ABC123",
    createdAt:new Date(Date.now()-5*86400000).toISOString(),
    encounter:{patientName:"Agnes Mutua", patientShaNumber:"SHA2024044444", visitDate:new Date(Date.now()-6*86400000).toISOString(), visitType:"inpatient", provider:{name:"Dr. Grace Otieno"}},
    denials:[{id:"dn2", reasonCode:"ERR-001", reasonText:"Clinical documentation insufficient: discharge summary not attached", classifiedCategory:"missing_doc", suggestedFix:"Attach the discharge summary, lab reports, and any referral letters. Ensure all supporting documentation is uploaded before resubmission.", appealDeadline:new Date(Date.now()+25*86400000).toISOString(), resolvedAt:null}],
    _count:{denials:1},
  },
];

const CATEGORY_CONFIG: Record<string,{label:string;color:string;bg:string;border:string}> = {
  coding_error:      {label:"Coding Error",          color:"#f97316",bg:"rgba(249,115,22,0.10)", border:"rgba(249,115,22,0.2)"},
  missing_doc:       {label:"Missing Documentation", color:"#3b82f6",bg:"rgba(59,130,246,0.10)",  border:"rgba(59,130,246,0.2)"},
  eligibility:       {label:"Eligibility Issue",     color:"#8b5cf6",bg:"rgba(139,92,246,0.10)",  border:"rgba(139,92,246,0.2)"},
  duplicate:         {label:"Duplicate Claim",       color:"#64748b",bg:"rgba(100,116,139,0.10)", border:"rgba(100,116,139,0.2)"},
  tariff_mismatch:   {label:"Tariff Mismatch",       color:"#eab308",bg:"rgba(234,179,8,0.10)",   border:"rgba(234,179,8,0.2)"},
  pre_auth_required: {label:"Pre-Auth Required",     color:"#ef4444",bg:"rgba(239,68,68,0.10)",   border:"rgba(239,68,68,0.2)"},
  benefit_limit:     {label:"Benefit Limit",         color:"#ec4899",bg:"rgba(236,72,153,0.10)",  border:"rgba(236,72,153,0.2)"},
  other:             {label:"Other",                 color:"#64748b",bg:"rgba(100,116,139,0.10)", border:"rgba(100,116,139,0.2)"},
};

const VISIT_COLOR: Record<string,string> = {
  outpatient:"#14b8a6", inpatient:"#3b82f6", emergency:"#ef4444", maternity:"#ec4899", day_case:"#8b5cf6",
};

export default function DenialsPage() {
  const { toast }   = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId]       = useState<string|null>("d1");
  const [changes, setChanges]             = useState<Record<string,string>>({});
  const [generatingLetter, setGenerating] = useState<string|null>(null);
  const [appealLetters, setLetters]       = useState<Record<string,string>>({});

  const { data, isLoading } = useQuery({
    queryKey:["denials"],
    queryFn:()=>api.getDenials(),
    placeholderData:{items:MOCK_DENIALS,total:MOCK_DENIALS.length},
    staleTime: Infinity,
    retry: false,
    select:(d)=>d as {items:typeof MOCK_DENIALS;total:number},
  });

  const resubmitMutation = useMutation({
    mutationFn:({claimId,changes}:{claimId:string;changes:string})=>api.resubmitClaim(claimId,changes),
    onSuccess:()=>{ toast({title:"Claim resubmitted to SHA successfully"}); queryClient.invalidateQueries({queryKey:["denials"]}); queryClient.invalidateQueries({queryKey:["claims"]}); },
    onError:()=>toast({title:"Resubmission failed",variant:"destructive"}),
  });

  const generateLetter = async (claimId: string) => {
    setGenerating(claimId);
    try {
      const result = await api.generateAppealLetter(claimId);
      setLetters(prev=>({...prev,[claimId]:result.appealLetter}));
    } catch { toast({title:"Could not generate appeal letter",variant:"destructive"}); }
    finally { setGenerating(null); }
  };

  const denials    = data?.items || MOCK_DENIALS;
  const total      = data?.total || MOCK_DENIALS.length;
  const totalValue = denials.reduce((s,d)=>s+d.totalAmount,0);

  return (
    <div className="p-5 min-h-full" style={{background:"var(--bg-primary)"}}>

      {/* Header */}
      <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Denial Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} denied claims · {formatKes(totalValue)} at risk</p>
        </div>
        <motion.div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium"
          style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.18)",color:"#f87171"}}>
          <AlertTriangle className="w-3.5 h-3.5"/>
          {total} requiring action
        </motion.div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        {[
          {label:"Open Denials",           value:total.toString(),       icon:AlertTriangle, color:"#ef4444", bg:"rgba(239,68,68,0.1)"},
          {label:"Value at Risk",          value:formatKes(totalValue),  icon:TrendingDown,  color:"#f59e0b", bg:"rgba(245,158,11,0.1)"},
          {label:"Avg Days to Deadline",   value:"27d",                  icon:Clock,         color:"#3b82f6", bg:"rgba(59,130,246,0.1)"},
        ].map((s,i)=>(
          <motion.div key={s.label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}
            className="glass-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:s.bg}}>
              <s.icon className="w-5 h-5" style={{color:s.color}}/>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-white leading-none tabular-nums">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Denial cards */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({length:3}).map((_,i)=>(
            <div key={i} className="h-20 rounded-2xl shimmer" style={{border:"1px solid rgba(255,255,255,0.06)"}}/>
          ))
        ) : denials.length===0 ? (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="glass-card p-14 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-3"/>
            <h3 className="font-display text-lg font-bold text-white mb-1">No open denials</h3>
            <p className="text-slate-500 text-sm">All claims are in good standing</p>
          </motion.div>
        ) : denials.map((denial,di)=>{
          const denial0 = denial.denials[0];
          const isOpen  = expandedId===denial.id;
          const cc      = CATEGORY_CONFIG[denial0?.classifiedCategory||"other"]||CATEGORY_CONFIG.other;
          const daysLeft = Math.ceil((new Date(denial0?.appealDeadline||"").getTime()-Date.now())/86400000);
          const urgent  = daysLeft<=7;
          const vtColor = VISIT_COLOR[denial.encounter.visitType]||"#64748b";

          return (
            <motion.div key={denial.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:di*0.08}}
              className="rounded-2xl overflow-hidden"
              style={{border:isOpen?"1px solid rgba(20,184,166,0.22)":"1px solid rgba(255,255,255,0.07)",transition:"border-color 0.2s"}}>

              {/* Accordion header */}
              <button onClick={()=>setExpandedId(isOpen?null:denial.id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left transition-colors"
                style={{background:isOpen?"rgba(20,184,166,0.04)":"rgba(255,255,255,0.02)"}}
                onMouseEnter={e=>!isOpen&&(e.currentTarget.style.background="rgba(255,255,255,0.035)")}
                onMouseLeave={e=>!isOpen&&(e.currentTarget.style.background="rgba(255,255,255,0.02)")}>

                {/* Alert icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.22)"}}>
                  <AlertTriangle className="w-5 h-5 text-red-400"/>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-display font-semibold text-white">{denial.encounter.patientName}</span>
                    <span className="font-mono text-xs text-slate-500">{denial.encounter.patientShaNumber}</span>
                    {denial0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{background:cc.bg,color:cc.color,border:`1px solid ${cc.border}`}}>
                        {cc.label}
                      </span>
                    )}
                    <span className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                          style={{background:`${vtColor}15`,color:vtColor,fontSize:10,border:`1px solid ${vtColor}25`}}>
                      {denial.encounter.visitType}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 truncate">{denial0?.reasonText||"No denial reason recorded"}</p>
                </div>

                <div className="text-right flex-shrink-0 mr-2">
                  <p className="font-display font-bold text-white tabular-nums">{formatKes(denial.totalAmount)}</p>
                  <div className={cn("text-xs font-medium mt-0.5 flex items-center justify-end gap-1",
                    urgent?"text-red-400":daysLeft<=14?"text-amber-400":"text-slate-500")}>
                    {urgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-dot"/>}
                    {daysLeft}d to appeal deadline
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <motion.div animate={{rotate:isOpen?180:0}} transition={{duration:0.2}}>
                    <ChevronDown className="w-5 h-5 text-slate-500"/>
                  </motion.div>
                </div>
              </button>

              {/* Expanded detail */}
              <AnimatePresence>
                {isOpen && denial0 && (
                  <motion.div
                    initial={{height:0,opacity:0}}
                    animate={{height:"auto",opacity:1}}
                    exit={{height:0,opacity:0}}
                    transition={{duration:0.28,ease:[0.4,0,0.2,1]}}
                    className="overflow-hidden">
                    <div className="p-5 space-y-5" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>

                      {/* Two-column detail */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Denial reason */}
                        <div className="rounded-xl p-4" style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)"}}>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-display">Denial Reason</p>
                          <p className="text-sm text-slate-200 leading-relaxed">{denial0.reasonText}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
                            <span>Code: <span className="font-mono text-slate-400">{denial0.reasonCode}</span></span>
                            <span>Received: {formatDate(denial.createdAt)}</span>
                            <span>Claim: <span className="font-mono text-slate-400">{denial.claimNumber?.slice(-12)}</span></span>
                          </div>
                        </div>

                        {/* Suggested fix */}
                        <div className="rounded-xl p-4"
                             style={{background:"rgba(20,184,166,0.045)",border:"1px solid rgba(20,184,166,0.15)"}}>
                          <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2 font-display flex items-center gap-1.5">
                            <Zap className="w-3 h-3"/>Suggested Fix
                          </p>
                          <p className="text-sm text-slate-300 leading-relaxed">{denial0.suggestedFix}</p>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex items-center gap-3 text-xs">
                        {[
                          {label:"Denied",        date:formatDate(denial.createdAt),                               color:"#ef4444", done:true},
                          {label:"Appeal Window", date:`${daysLeft}d remaining`,                                   color:urgent?"#ef4444":daysLeft<=14?"#f59e0b":"#3b82f6", done:false},
                          {label:"Deadline",      date:formatDate(denial0.appealDeadline||""),                     color:"#64748b", done:false},
                        ].map((step,i)=>(
                          <div key={step.label} className="flex items-center gap-2">
                            {i>0 && <div className="w-8 h-px" style={{background:"rgba(255,255,255,0.1)"}}/>}
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                                 style={{background:`${step.color}0f`,border:`1px solid ${step.color}25`}}>
                              <Calendar className="w-3 h-3" style={{color:step.color}}/>
                              <div>
                                <p className="font-semibold leading-none" style={{color:step.color}}>{step.label}</p>
                                <p className="text-slate-500 mt-0.5" style={{fontSize:10}}>{step.date}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Appeal letter */}
                      {appealLetters[denial.claimId] && (
                        <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
                          className="rounded-xl p-4"
                          style={{background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.2)"}}>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider font-display">AI-Drafted Appeal Letter</p>
                            <button onClick={()=>{navigator.clipboard.writeText(appealLetters[denial.claimId]);toast({title:"Copied to clipboard"});}}
                              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded-lg"
                              style={{background:"rgba(59,130,246,0.1)"}}>
                              <Copy className="w-3.5 h-3.5"/>Copy
                            </button>
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{appealLetters[denial.claimId]}</p>
                        </motion.div>
                      )}

                      {/* Changes textarea */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-display">
                          Changes Made Before Resubmission
                        </label>
                        <textarea
                          value={changes[denial.claimId]||""}
                          onChange={e=>setChanges(prev=>({...prev,[denial.claimId]:e.target.value}))}
                          placeholder="Describe what you corrected — e.g. 'Updated SHA-CONS-001 to SHA-CONS-003, attached discharge summary, corrected diagnosis from J18.9 to B50.9'"
                          rows={3}
                          className="w-full text-sm rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-teal-500/40 transition-all"
                          style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",color:"#f0f4ff",lineHeight:1.6}}/>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                          onClick={()=>resubmitMutation.mutate({claimId:denial.claimId,changes:changes[denial.claimId]||""})}
                          disabled={!changes[denial.claimId]?.trim()||resubmitMutation.isPending}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
                          style={{background:"linear-gradient(135deg,#14b8a6,#0891b2)",boxShadow:changes[denial.claimId]?.trim()?"0 0 16px rgba(20,184,166,0.3)":"none"}}>
                          {resubmitMutation.isPending?<Loader2 className="w-4 h-4 animate-spin"/>:<RefreshCw className="w-4 h-4"/>}
                          Resubmit to SHA
                        </motion.button>

                        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                          onClick={()=>generateLetter(denial.claimId)} disabled={generatingLetter===denial.claimId}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                          style={{background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.25)",color:"#a78bfa"}}>
                          {generatingLetter===denial.claimId?<Loader2 className="w-4 h-4 animate-spin"/>:<Sparkles className="w-4 h-4"/>}
                          Generate Appeal Letter
                        </motion.button>

                        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
                          <Shield className="w-3.5 h-3.5"/>
                          SHA appeal window: {daysLeft} days remaining
                        </div>
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
