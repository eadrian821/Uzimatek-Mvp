"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass, ExternalLink, RefreshCw, Loader2, Star, CheckCircle2,
  XCircle, Clock, TrendingUp, Sparkles, Calendar, DollarSign, MapPin,
} from "lucide-react";
import { api, type Opportunity } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type StatusFilter = "all" | "new" | "shortlisted" | "applied" | "dismissed";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "applied", label: "Applied" },
  { value: "dismissed", label: "Dismissed" },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  new: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: Sparkles },
  shortlisted: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: Star },
  applied: { color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: CheckCircle2 },
  dismissed: { color: "#64748b", bg: "rgba(100,116,139,0.12)", icon: XCircle },
  expired: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: Clock },
};

const CATEGORY_LABELS: Record<string, string> = {
  clinical_research: "Clinical Research Funding",
  digital_health: "Digital Health Challenge",
  startup_competition: "Startup Competition",
  accelerator_fellowship: "Accelerator / Fellowship",
  investor_event: "Investor Event",
};

const CATEGORY_COLOR: Record<string, string> = {
  clinical_research: "#14b8a6",
  digital_health: "#0891b2",
  startup_competition: "#8b5cf6",
  accelerator_fellowship: "#ec4899",
  investor_event: "#f59e0b",
};

export default function OpportunitiesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["opportunities", statusFilter],
    queryFn: () =>
      api.getOpportunities(statusFilter === "all" ? undefined : { status: statusFilter }),
  });

  const { data: scanRuns } = useQuery({
    queryKey: ["opportunity-scan-runs"],
    queryFn: () => api.getOpportunityScanRuns(1),
  });

  const scanMutation = useMutation({
    mutationFn: () => api.runOpportunityScan(),
    onSuccess: (summary) => {
      toast({
        title: `Scan complete — ${summary.opportunitiesFound} opportunities found`,
        description: summary.categoryErrors.length
          ? `${summary.categoryErrors.length} categor${summary.categoryErrors.length === 1 ? "y" : "ies"} had errors — check scan history for details.`
          : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["opportunity-scan-runs"] });
    },
    onError: (err: unknown) => {
      toast({ title: "Scan failed", description: (err as Error).message, variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateOpportunityStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["opportunities"] }),
    onError: () => toast({ title: "Could not update status", variant: "destructive" }),
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const shortlisted = items.filter((o) => o.status === "shortlisted").length;
  const bestScore = items.length ? Math.round(Math.max(...items.map((o) => o.compositeScore))) : 0;
  const lastScan = scanRuns?.items?.[0];

  return (
    <div className="p-5 min-h-full" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-5 flex-wrap gap-3"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-teal-400" />
            Opportunities
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {total} tracked · {shortlisted} shortlisted
            {lastScan && (
              <>
                {" "}
                · last scan{" "}
                {lastScan.completedAt ? formatDate(lastScan.completedAt) : "in progress"}
              </>
            )}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={scanMutation.isPending}
          onClick={() => scanMutation.mutate()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg,#2dd4bf,#0891b2)",
            boxShadow: "0 0 16px rgba(20,184,166,0.3)",
          }}
        >
          {scanMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {scanMutation.isPending ? "Scanning…" : "Run Scan Now"}
        </motion.button>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        {[
          { label: "Tracked Opportunities", value: total.toString(), icon: Compass, color: "#14b8a6", bg: "rgba(20,184,166,0.1)" },
          { label: "Shortlisted", value: shortlisted.toString(), icon: Star, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
          { label: "Best Score", value: bestScore.toString(), icon: TrendingUp, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-white leading-none tabular-nums">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              statusFilter === tab.value ? "text-white" : "text-slate-500 hover:text-slate-300"
            )}
            style={{
              background: statusFilter === tab.value ? "rgba(20,184,166,0.16)" : "rgba(255,255,255,0.03)",
              border: statusFilter === tab.value ? "1px solid rgba(20,184,166,0.3)" : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Opportunity cards */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl shimmer" style={{ border: "1px solid rgba(255,255,255,0.06)" }} />
          ))
        ) : items.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-14 text-center">
            <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold text-white mb-1">No opportunities yet</h3>
            <p className="text-slate-500 text-sm">Run a scan to find grants, competitions, and events.</p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((opp: Opportunity, i: number) => {
              const style = STATUS_STYLE[opp.status] || STATUS_STYLE.new;
              const daysLeft = opp.deadline
                ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400000)
                : null;

              return (
                <motion.div
                  key={opp.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card p-4"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            color: CATEGORY_COLOR[opp.category] || "#64748b",
                            background: `${CATEGORY_COLOR[opp.category] || "#64748b"}1f`,
                          }}
                        >
                          {CATEGORY_LABELS[opp.category] || opp.category}
                        </span>
                        <span
                          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: style.color, background: style.bg }}
                        >
                          <style.icon className="w-3 h-3" />
                          {opp.status}
                        </span>
                        {daysLeft !== null && daysLeft >= 0 && daysLeft <= 14 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-red-400" style={{ background: "rgba(239,68,68,0.12)" }}>
                            {daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
                          </span>
                        )}
                      </div>

                      <a
                        href={opp.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-display font-semibold text-white hover:text-teal-300 transition-colors inline-flex items-center gap-1.5"
                      >
                        {opp.title}
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </a>
                      {opp.organization && (
                        <p className="text-xs text-slate-500 mt-0.5">{opp.organization}</p>
                      )}

                      <p className="text-sm text-slate-400 mt-2 line-clamp-2">{opp.description}</p>
                      {opp.relevanceReason && (
                        <p className="text-xs text-teal-400/80 mt-1.5 italic">{opp.relevanceReason}</p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
                        {opp.region && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{opp.region}</span>
                        )}
                        {opp.deadline && (
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(opp.deadline)}</span>
                        )}
                        {opp.fundingAmountText && (
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{opp.fundingAmountText}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-display text-lg font-bold text-teal-400 leading-none tabular-nums">
                          {Math.round(opp.compositeScore)}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">score</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {opp.status !== "shortlisted" && opp.status !== "applied" && (
                          <button
                            onClick={() => statusMutation.mutate({ id: opp.id, status: "shortlisted" })}
                            title="Shortlist"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                            style={{ background: "rgba(255,255,255,0.04)" }}
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {opp.status !== "applied" && (
                          <button
                            onClick={() => statusMutation.mutate({ id: opp.id, status: "applied" })}
                            title="Mark applied"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                            style={{ background: "rgba(255,255,255,0.04)" }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {opp.status !== "dismissed" && (
                          <button
                            onClick={() => statusMutation.mutate({ id: opp.id, status: "dismissed" })}
                            title="Dismiss"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                            style={{ background: "rgba(255,255,255,0.04)" }}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
