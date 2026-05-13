import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKes(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getConfidenceColor(band: string) {
  switch (band) {
    case "high":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "medium":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "low":
      return "text-red-700 bg-red-50 border-red-200";
    default:
      return "text-slate-600 bg-slate-50 border-slate-200";
  }
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    pending_review: "bg-blue-100 text-blue-700",
    approved: "bg-indigo-100 text-indigo-700",
    submitted: "bg-purple-100 text-purple-700",
    acknowledged: "bg-cyan-100 text-cyan-700",
    paid: "bg-emerald-100 text-emerald-700",
    partially_paid: "bg-teal-100 text-teal-700",
    denied: "bg-red-100 text-red-700",
    appealed: "bg-orange-100 text-orange-700",
    void: "bg-slate-100 text-slate-500",
    ready_to_code: "bg-blue-100 text-blue-700",
    coding: "bg-yellow-100 text-yellow-700",
    coded: "bg-indigo-100 text-indigo-700",
    claim_generated: "bg-emerald-100 text-emerald-700",
    error: "bg-red-100 text-red-700",
  };
  return map[status] || "bg-slate-100 text-slate-600";
}

export function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}
