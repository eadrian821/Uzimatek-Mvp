"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const COUNTIES = ["Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans-Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"];

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [facilityData, setFacilityData] = useState({
    name: "", shaCode: "", kmpdcLicense: "", kraPin: "",
    level: "4", county: "Kericho", subCounty: "", ward: "",
    phone: "", email: "", address: "",
  });

  const [adminData, setAdminData] = useState({
    name: "", email: "", password: "", confirmPassword: "",
  });

  const steps = [
    { num: 1, label: "Facility Details" },
    { num: 2, label: "Administrator Account" },
    { num: 3, label: "Review & Submit" },
  ];

  async function handleSubmit() {
    if (adminData.password !== adminData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/v1/facilities/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facility: facilityData,
          adminUser: { name: adminData.name, email: adminData.email, password: adminData.password },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Registration failed");
      }

      const data = await res.json();
      setAuth(
        { id: "", email: adminData.email, name: adminData.name, role: "facility_admin", facilityId: data.facility.id, facilityName: data.facility.name, shaCode: data.facility.shaCode },
        data.accessToken,
        data.refreshToken
      );
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const updateFacility = (field: string, value: string) =>
    setFacilityData((p) => ({ ...p, [field]: value }));
  const updateAdmin = (field: string, value: string) =>
    setAdminData((p) => ({ ...p, [field]: value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-teal-400 rounded-2xl flex items-center justify-center">
              <span className="text-teal-900 font-black text-xl">U</span>
            </div>
            <div className="text-left">
              <div className="text-white font-bold text-2xl leading-none">Uzimatek</div>
              <div className="text-teal-300 text-sm">Register Your Facility</div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${step === s.num ? "text-teal-300" : step > s.num ? "text-emerald-300" : "text-teal-600"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step === s.num ? "border-teal-300 text-teal-300 bg-transparent" : step > s.num ? "border-emerald-300 bg-emerald-300 text-teal-900" : "border-teal-700 text-teal-700"}`}>
                  {s.num}
                </div>
                <span className="text-xs hidden sm:block">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className="w-8 h-px bg-teal-700" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Facility Details</h2>
              <Field label="Facility Name *" value={facilityData.name} onChange={(v) => updateFacility("name", v)} placeholder="AIC Litein Mission Hospital" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="SHA Facility Code *" value={facilityData.shaCode} onChange={(v) => updateFacility("shaCode", v.toUpperCase())} placeholder="0004KER001" mono />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Facility Level *</label>
                  <select
                    value={facilityData.level}
                    onChange={(e) => updateFacility("level", e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {["3", "4", "5", "6"].map((l) => <option key={l} value={l}>Level {l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="KMPDC License *" value={facilityData.kmpdcLicense} onChange={(v) => updateFacility("kmpdcLicense", v)} placeholder="KMPDC/FH/0001234" mono />
                <Field label="KRA PIN *" value={facilityData.kraPin} onChange={(v) => updateFacility("kraPin", v.toUpperCase())} placeholder="P051234567A" mono />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">County *</label>
                  <select
                    value={facilityData.county}
                    onChange={(e) => updateFacility("county", e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {COUNTIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <Field label="Sub-county *" value={facilityData.subCounty} onChange={(v) => updateFacility("subCounty", v)} placeholder="Kericho" />
              </div>
              <Field label="Phone *" value={facilityData.phone} onChange={(v) => updateFacility("phone", v)} placeholder="+254720000001" />
              <Field label="Email *" value={facilityData.email} onChange={(v) => updateFacility("email", v)} placeholder="billing@hospital.or.ke" type="email" />
              <Field label="Address" value={facilityData.address} onChange={(v) => updateFacility("address", v)} placeholder="P.O. Box 1, Litein, Kericho County" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Administrator Account</h2>
              <p className="text-sm text-slate-500 -mt-2 mb-4">This will be the facility admin account. Additional users can be invited later.</p>
              <Field label="Full Name *" value={adminData.name} onChange={(v) => updateAdmin("name", v)} placeholder="Dr. James Otieno" />
              <Field label="Email *" value={adminData.email} onChange={(v) => updateAdmin("email", v)} placeholder="admin@hospital.or.ke" type="email" />
              <Field label="Password *" value={adminData.password} onChange={(v) => updateAdmin("password", v)} placeholder="••••••••" type="password" />
              <Field label="Confirm Password *" value={adminData.confirmPassword} onChange={(v) => updateAdmin("confirmPassword", v)} placeholder="••••••••" type="password" />
              <p className="text-xs text-slate-400">Password must be at least 8 characters</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Review & Submit</h2>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="font-semibold text-slate-700 mb-3">Facility Summary</div>
                {[
                  ["Facility Name", facilityData.name],
                  ["SHA Code", facilityData.shaCode],
                  ["Level", `Level ${facilityData.level}`],
                  ["County", facilityData.county],
                  ["KMPDC License", facilityData.kmpdcLicense],
                  ["KRA PIN", facilityData.kraPin],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-400">{k}</span>
                    <span className="font-medium text-slate-800">{v}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="font-semibold text-slate-700 mb-2">Admin Account</div>
                  {[
                    ["Name", adminData.name],
                    ["Email", adminData.email],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-400">{k}</span>
                      <span className="font-medium text-slate-800">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400">
                By registering, you confirm this facility is SHA-registered and you are authorised to set up billing operations.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {step > 1 ? (
              <button onClick={() => setStep((s) => s - 1)} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm">
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <Link href="/login" className="text-sm text-slate-400 hover:text-slate-600">
                Already registered?
              </Link>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Registering…" : "Register Facility"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}
