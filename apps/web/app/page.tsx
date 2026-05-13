import Link from "next/link";
import {
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  FileCheck,
  Brain,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="font-bold text-slate-900 text-xl">Uzimatek</span>
            <span className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full">
              Health Kenya
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-teal-700 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-teal-700 transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-teal-700 transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-teal-700 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-teal-700/40 border border-teal-600/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-teal-100">
                Built for Kenya&apos;s SHA/SHIF transition
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Stop losing revenue to
              <span className="text-teal-300"> SHA denials</span>
            </h1>
            <p className="text-xl text-teal-100 max-w-2xl mb-8 leading-relaxed">
              AI-powered claims workbench that auto-codes encounters, validates
              against SHA tariffs, predicts denials, and submits in one click.
              Cut claim prep from 25 minutes to under 5.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-teal-400 hover:bg-teal-300 text-teal-900 font-semibold px-8 py-4 rounded-xl transition-colors text-lg"
              >
                Start Free Pilot
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 border border-teal-600 hover:border-teal-400 text-teal-100 px-8 py-4 rounded-xl transition-colors text-lg"
              >
                Sign In
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-teal-200">
              {[
                "60% fewer denials",
                "5× faster claim prep",
                "SHA tariff auto-coding",
                "Zero manual portal entry",
              ].map((stat) => (
                <div key={stat} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                  <span>{stat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "25–40%", label: "SHA denial rates at launch" },
              { value: "~25 min", label: "Average claim prep today" },
              { value: "60–120d", label: "Reimbursement turnaround" },
              { value: "KES 30B+", label: "Provider receivables frozen" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-teal-400">{s.value}</div>
                <div className="text-sm text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything your billing team needs
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              From encounter ingestion to payment reconciliation — one platform
              built specifically for SHA/SHIF workflows.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
                  <f.icon className="w-6 h-6 text-teal-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              From encounter to payment in minutes
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Ingest",
                desc: "Upload encounter CSV or enter manually. 1,000 rows in under 15 seconds.",
              },
              {
                step: "02",
                title: "AI Codes",
                desc: "Claude AI extracts diagnoses, maps ICD-10 and SHA tariff codes with confidence scores.",
              },
              {
                step: "03",
                title: "Review",
                desc: "Biller reviews flagged items. One-click approve high-confidence codes.",
              },
              {
                step: "04",
                title: "Submit",
                desc: "Claims pushed to SHA Provider Portal API automatically with idempotency protection.",
              },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="text-6xl font-bold text-teal-100 mb-3">{s.step}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Simple per-claim pricing
            </h2>
            <p className="text-slate-500 text-lg">
              No setup fees. No annual lock-in. Pay as you submit.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                volume: "Up to 1,000 claims/mo",
                price: "KES 50",
                min: "KES 25,000/mo min",
                highlight: false,
              },
              {
                name: "Growth",
                volume: "1,001–5,000 claims/mo",
                price: "KES 35",
                min: "KES 70,000/mo min",
                highlight: true,
              },
              {
                name: "Scale",
                volume: "5,000+ claims/mo",
                price: "KES 25",
                min: "KES 200,000/mo min",
                highlight: false,
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-8 border-2 ${
                  tier.highlight
                    ? "border-teal-500 shadow-xl shadow-teal-100"
                    : "border-slate-200"
                }`}
              >
                {tier.highlight && (
                  <div className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full inline-block mb-3">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-1">{tier.name}</h3>
                <p className="text-slate-500 text-sm mb-4">{tier.volume}</p>
                <div className="text-4xl font-bold text-teal-700 mb-1">{tier.price}</div>
                <div className="text-sm text-slate-400 mb-6">per claim submitted</div>
                <div className="text-xs text-slate-500 mb-6">{tier.min}</div>
                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-xl font-medium transition-colors ${
                    tier.highlight
                      ? "bg-teal-700 text-white hover:bg-teal-800"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-400 mt-8">
            Pilot partners get 60 days free, then KES 30/claim for months 3–6.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-teal-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">U</span>
              </div>
              <span className="font-semibold text-white">Uzimatek Health Kenya</span>
            </div>
            <p className="text-sm">
              © 2026 Uzimatek Health Kenya Ltd. Aligned with Data Protection Act 2019.
            </p>
            <div className="flex gap-4 text-sm">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: Brain,
    title: "AI Auto-Coding",
    description:
      "Claude AI extracts ICD-10 diagnoses and SHA tariff codes from clinical narratives in under 3 seconds. Confidence scoring flags items needing review.",
  },
  {
    icon: FileCheck,
    title: "Pre-submission Validation",
    description:
      "Real-time checks against SHA payer rules, tariff conflicts, and missing documentation before you hit submit.",
  },
  {
    icon: Zap,
    title: "One-Click Submission",
    description:
      "Claims pushed directly to SHA Provider Portal API. RPA browser fallback for facilities where API isn't yet available.",
  },
  {
    icon: TrendingUp,
    title: "Denial Management",
    description:
      "AI classifies denial reasons, suggests fixes, and generates appeal letters. Resubmit in under 10 minutes.",
  },
  {
    icon: Clock,
    title: "A/R Dashboard",
    description:
      "Real-time ageing buckets, denial rate trends, biller throughput, and cash flow projections in one view.",
  },
  {
    icon: Shield,
    title: "Audit Trail",
    description:
      "Immutable, tamper-evident log of every claim action. 7-year retention for SHA compliance. Hash chain verified.",
  },
];
