"use client";

import { useState } from "react";
import { Building2, Users, Settings, Plus, MapPin, Phone, Mail, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_FACILITY = {
  name: "AIC Litein Mission Hospital",
  shaCode: "0004KER001",
  kmpdcLicense: "KMPDC/FH/0001234",
  kraPin: "P051234567A",
  level: "4",
  county: "Kericho",
  subCounty: "Kericho",
  ward: "Litein",
  phone: "+254720000001",
  email: "billing@aiclitein.or.ke",
  address: "P.O. Box 1, Litein, Kericho County",
};

const MOCK_PROVIDERS = [
  { id: "p1", name: "Dr. Grace Otieno", kmpdcNo: "M12345", specialty: "General Medicine", role: "doctor", isActive: true },
  { id: "p2", name: "Dr. Samuel Kipchoge", kmpdcNo: "M54321", specialty: "Surgery", role: "doctor", isActive: true },
  { id: "p3", name: "Sr. Jane Nafula", kmpdcNo: "N99876", specialty: "Midwifery", role: "nurse", isActive: true },
];

export default function FacilityPage() {
  const [tab, setTab] = useState<"profile" | "providers" | "tariffs">("profile");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Facility Settings</h1>
        <p className="text-sm text-slate-500">Manage your SHA facility profile and providers</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl">
        {/* Tabs */}
        <div className="border-b border-slate-100 px-4 flex gap-0">
          {[
            { key: "profile", label: "Facility Profile", icon: Building2 },
            { key: "providers", label: "Providers", icon: Users },
            { key: "tariffs", label: "SHA Tariffs", icon: FileText },
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

        {tab === "profile" && (
          <div className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-teal-700 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-black text-2xl">A</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{MOCK_FACILITY.name}</h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span>Level {MOCK_FACILITY.level} Hospital</span>
                    <span>·</span>
                    <span className="font-mono">SHA: {MOCK_FACILITY.shaCode}</span>
                    <span>·</span>
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      SHA Registered
                    </div>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm px-4 py-2 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
                Edit Profile
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Registration Details</h3>
                {[
                  { label: "SHA Facility Code", value: MOCK_FACILITY.shaCode, mono: true },
                  { label: "KMPDC License", value: MOCK_FACILITY.kmpdcLicense, mono: true },
                  { label: "KRA PIN", value: MOCK_FACILITY.kraPin, mono: true },
                  { label: "Facility Level", value: `Level ${MOCK_FACILITY.level}` },
                ].map((f) => (
                  <div key={f.label}>
                    <p className="text-xs text-slate-400 mb-0.5">{f.label}</p>
                    <p className={cn("text-sm font-medium text-slate-800", f.mono && "font-mono")}>{f.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Location & Contact</h3>
                {[
                  { label: "Address", value: MOCK_FACILITY.address, icon: MapPin },
                  { label: "County / Sub-county", value: `${MOCK_FACILITY.county} / ${MOCK_FACILITY.subCounty}`, icon: MapPin },
                  { label: "Phone", value: MOCK_FACILITY.phone, icon: Phone },
                  { label: "Email", value: MOCK_FACILITY.email, icon: Mail },
                ].map((f) => (
                  <div key={f.label} className="flex items-start gap-2">
                    <f.icon className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">{f.label}</p>
                      <p className="text-sm text-slate-800">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "providers" && (
          <div>
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm text-slate-500">{MOCK_PROVIDERS.length} registered providers</p>
              <button className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                Add Provider
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Provider</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">KMPDC No.</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Specialty</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_PROVIDERS.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                          <span className="text-teal-700 text-sm font-semibold">{p.name.charAt(3)}</span>
                        </div>
                        <span className="font-medium text-slate-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-600 text-xs">{p.kmpdcNo}</td>
                    <td className="px-5 py-3 text-slate-600">{p.specialty}</td>
                    <td className="px-5 py-3 text-slate-600 capitalize">{p.role}</td>
                    <td className="px-5 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "tariffs" && (
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-800">
                SHA tariff schedule for <strong>Level 4</strong> facilities · Effective 1 October 2024.
                Uzimatek automatically keeps tariff codes updated. Last sync: {new Date().toLocaleDateString("en-KE")}.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              {[
                { category: "Consultations", count: 3, range: "KES 500–1,200" },
                { category: "Laboratory", count: 7, range: "KES 150–1,200" },
                { category: "Imaging", count: 3, range: "KES 600–8,000" },
                { category: "Procedures", count: 5, range: "KES 200–500" },
                { category: "Surgery", count: 3, range: "KES 35,000–55,000" },
                { category: "Drugs", count: 5, range: "KES 120–450" },
                { category: "Maternity", count: 2, range: "KES 600–15,000" },
                { category: "Admission", count: 2, range: "KES 3,000–15,000" },
              ].map((t) => (
                <div key={t.category} className="border border-slate-200 rounded-xl p-4 hover:border-teal-200 transition-colors">
                  <div className="font-semibold text-slate-900 mb-1">{t.category}</div>
                  <div className="text-xs text-slate-400">{t.count} tariff codes</div>
                  <div className="text-xs text-teal-600 font-medium mt-1">{t.range}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
