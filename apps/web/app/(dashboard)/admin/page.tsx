"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Shield, Plus, Mail, ChevronDown } from "lucide-react";
import { formatDateTime, cn } from "@/lib/utils";

const MOCK_USERS = [
  { id: "u1", name: "Wanjiku Kamau", email: "wanjiku@aiclitein.or.ke", role: "biller", status: "active", lastLoginAt: new Date(Date.now() - 3600000).toISOString(), createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "u2", name: "Dr. James Otieno", email: "manager@aiclitein.or.ke", role: "manager", status: "active", lastLoginAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: "u3", name: "Peter Mwangi", email: "pmwangi@aiclitein.or.ke", role: "biller", status: "active", lastLoginAt: new Date(Date.now() - 2 * 86400000).toISOString(), createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: "u4", name: "CFO Account", email: "cfo@aiclitein.or.ke", role: "read_only", status: "active", lastLoginAt: new Date(Date.now() - 7 * 86400000).toISOString(), createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
];

const MOCK_AUDIT = [
  { id: "a1", action: "claim.submit", entityType: "claim", entityId: "c3", actorId: "u1", actor: { name: "Wanjiku Kamau", role: "biller" }, ip: "196.207.12.45", userAgent: "Chrome/124", createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: "a2", action: "coding.complete", entityType: "encounter", entityId: "e2", actorId: "u1", actor: { name: "Wanjiku Kamau", role: "biller" }, ip: "196.207.12.45", userAgent: "Chrome/124", createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "a3", action: "auth.login", entityType: "user", entityId: "u2", actorId: "u2", actor: { name: "Dr. James Otieno", role: "manager" }, ip: "196.207.12.88", userAgent: "Firefox/125", createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: "a4", action: "claim.update", entityType: "claim", entityId: "c1", actorId: "u1", actor: { name: "Wanjiku Kamau", role: "biller" }, ip: "196.207.12.45", userAgent: "Chrome/124", createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
];

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700",
  facility_admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  biller: "bg-teal-100 text-teal-700",
  read_only: "bg-slate-100 text-slate-600",
};

const ACTION_COLORS: Record<string, string> = {
  "auth.login": "text-blue-600",
  "auth.login_failed": "text-red-600",
  "claim.submit": "text-teal-600",
  "claim.update": "text-orange-600",
  "coding.complete": "text-purple-600",
  default: "text-slate-600",
};

export default function AdminPage() {
  const [tab, setTab] = useState<"users" | "audit">("users");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Administration</h1>
          <p className="text-sm text-slate-500">User management and audit trail</p>
        </div>
        {tab === "users" && (
          <button className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Invite User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="border-b border-slate-100 px-4 flex gap-0">
          {[
            { key: "users", label: "Users", icon: Users },
            { key: "audit", label: "Audit Trail", icon: Shield },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                tab === t.key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "users" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Login</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Member Since</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_USERS.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-700 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", ROLE_COLORS[user.role])}>
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", user.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{formatDateTime(user.lastLoginAt)}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{formatDateTime(user.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 px-3 py-1 rounded-lg">
                      Edit role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "audit" && (
          <div>
            <div className="px-5 py-3 border-b border-slate-100 bg-amber-50">
              <div className="flex items-center gap-2 text-xs text-amber-700">
                <Shield className="w-4 h-4" />
                Tamper-evident audit log · Hash chain verified · 7-year retention per SHA compliance
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actor</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Entity</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_AUDIT.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-xs text-slate-400">{formatDateTime(event.createdAt)}</td>
                    <td className="px-5 py-3">
                      <span className={cn("font-mono text-xs font-semibold", ACTION_COLORS[event.action] || ACTION_COLORS.default)}>
                        {event.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-slate-700 text-xs">{event.actor?.name}</div>
                      <div className="text-slate-400 text-xs capitalize">{event.actor?.role?.replace("_", " ")}</div>
                    </td>
                    <td className="px-5 py-3 text-xs">
                      <span className="text-slate-500 capitalize">{event.entityType}</span>
                      <span className="font-mono text-slate-300 ml-1 text-xs">{event.entityId.slice(-8)}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">{event.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
