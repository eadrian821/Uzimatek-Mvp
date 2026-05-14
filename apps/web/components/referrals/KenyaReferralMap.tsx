"use client";

import { useEffect, useRef, useState } from "react";

/* ── Haversine distance (km) ─────────────────────────────────────── */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Facility database ───────────────────────────────────────────── */
export interface Facility {
  id: string;
  name: string;
  short: string;
  county: string;
  lat: number;
  lon: number;
  level: number;
  inNetwork: boolean;
  beds: number;
  availBeds: number;
  capabilities: string[];
  coe: string[];
  phone: string;
}

export const KENYA_FACILITIES: Facility[] = [
  /* L6 National */
  {
    id: "knh",
    name: "Kenyatta National Hospital",
    short: "KNH",
    county: "Nairobi",
    lat: -1.3013,
    lon: 36.8073,
    level: 6,
    inNetwork: true,
    beds: 1800,
    availBeds: 42,
    capabilities: ["ICU", "NICU", "Cath Lab", "MRI", "CT", "Trauma", "Burns", "Dialysis", "Oncology", "Neurosurgery"],
    coe: ["Cardiac", "Stroke", "Trauma", "Burns"],
    phone: "+254 20 2726300",
  },
  {
    id: "mtrh",
    name: "Moi Teaching & Referral Hospital",
    short: "MTRH",
    county: "Uasin Gishu",
    lat: 0.5143,
    lon: 35.2698,
    level: 6,
    inNetwork: true,
    beds: 900,
    availBeds: 18,
    capabilities: ["ICU", "NICU", "Cath Lab", "MRI", "CT", "Trauma", "Dialysis", "Oncology", "Neurosurgery"],
    coe: ["Cardiac", "Renal", "Oncology"],
    phone: "+254 53 2033471",
  },
  /* L5 Teaching/Referral */
  {
    id: "nakuru",
    name: "Nakuru Level 5 Hospital",
    short: "Nakuru L5",
    county: "Nakuru",
    lat: -0.2845,
    lon: 36.0696,
    level: 5,
    inNetwork: true,
    beds: 360,
    availBeds: 22,
    capabilities: ["ICU", "CT", "Trauma", "Dialysis", "Obstetrics"],
    coe: ["Trauma", "Renal"],
    phone: "+254 51 2210456",
  },
  {
    id: "kisii",
    name: "Kisii Teaching & Referral Hospital",
    short: "Kisii TR",
    county: "Kisii",
    lat: -0.6817,
    lon: 34.7667,
    level: 5,
    inNetwork: true,
    beds: 340,
    availBeds: 14,
    capabilities: ["ICU", "CT", "Trauma", "Obstetrics", "Dialysis"],
    coe: ["Obstetric"],
    phone: "+254 58 30277",
  },
  {
    id: "coastpgh",
    name: "Coast General Teaching & Referral",
    short: "Coast General",
    county: "Mombasa",
    lat: -4.0435,
    lon: 39.6682,
    level: 5,
    inNetwork: true,
    beds: 700,
    availBeds: 31,
    capabilities: ["ICU", "CT", "MRI", "Trauma", "Dialysis", "Oncology"],
    coe: ["Renal", "Oncology"],
    phone: "+254 41 2314201",
  },
  {
    id: "nyeri",
    name: "Nyeri County Referral Hospital",
    short: "Nyeri CR",
    county: "Nyeri",
    lat: -0.4222,
    lon: 36.9511,
    level: 4,
    inNetwork: true,
    beds: 280,
    availBeds: 19,
    capabilities: ["CT", "Obstetrics", "Surgery"],
    coe: [],
    phone: "+254 61 2030360",
  },
  {
    id: "kisumu",
    name: "Kisumu County Hospital",
    short: "Kisumu CH",
    county: "Kisumu",
    lat: -0.0917,
    lon: 34.7679,
    level: 4,
    inNetwork: true,
    beds: 320,
    availBeds: 25,
    capabilities: ["ICU", "Obstetrics", "Surgery", "Dialysis"],
    coe: ["Renal"],
    phone: "+254 57 202 3041",
  },
  {
    id: "litein",
    name: "AIC Litein Mission Hospital",
    short: "AIC Litein",
    county: "Kericho",
    lat: -0.5683,
    lon: 35.2167,
    level: 4,
    inNetwork: true,
    beds: 200,
    availBeds: 12,
    capabilities: ["Obstetrics", "Surgery", "Trauma"],
    coe: [],
    phone: "+254 52 20254",
  },
  {
    id: "kericho",
    name: "Kericho County Hospital",
    short: "Kericho CH",
    county: "Kericho",
    lat: -0.3689,
    lon: 35.2855,
    level: 4,
    inNetwork: true,
    beds: 210,
    availBeds: 8,
    capabilities: ["Obstetrics", "Surgery"],
    coe: [],
    phone: "+254 52 20211",
  },
  {
    id: "akh",
    name: "Aga Khan Hospital Nairobi",
    short: "AKH Nairobi",
    county: "Nairobi",
    lat: -1.2611,
    lon: 36.8125,
    level: 5,
    inNetwork: false,
    beds: 254,
    availBeds: 11,
    capabilities: ["ICU", "NICU", "Cath Lab", "MRI", "CT", "Dialysis", "Oncology"],
    coe: ["Cardiac", "Oncology"],
    phone: "+254 20 3662000",
  },
  {
    id: "nairobi_hosp",
    name: "The Nairobi Hospital",
    short: "Nairobi Hosp",
    county: "Nairobi",
    lat: -1.2912,
    lon: 36.7892,
    level: 5,
    inNetwork: false,
    beds: 350,
    availBeds: 9,
    capabilities: ["ICU", "NICU", "Cath Lab", "MRI", "CT", "Dialysis", "Neurosurgery"],
    coe: ["Cardiac", "Stroke", "Neurosurgery"],
    phone: "+254 20 2845000",
  },
  {
    id: "eldoret",
    name: "Eldoret Referral Hospital",
    short: "Eldoret CR",
    county: "Uasin Gishu",
    lat: 0.5200,
    lon: 35.2698,
    level: 4,
    inNetwork: true,
    beds: 180,
    availBeds: 14,
    capabilities: ["Obstetrics", "Surgery", "Trauma"],
    coe: [],
    phone: "+254 53 2062012",
  },
  {
    id: "machakos",
    name: "Machakos Level 5 Hospital",
    short: "Machakos L5",
    county: "Machakos",
    lat: -1.5177,
    lon: 37.2634,
    level: 5,
    inNetwork: true,
    beds: 300,
    availBeds: 17,
    capabilities: ["ICU", "CT", "Trauma", "Obstetrics"],
    coe: ["Trauma"],
    phone: "+254 44 21406",
  },
  {
    id: "embu",
    name: "Embu Level 5 Hospital",
    short: "Embu L5",
    county: "Embu",
    lat: -0.5304,
    lon: 37.4577,
    level: 5,
    inNetwork: true,
    beds: 290,
    availBeds: 20,
    capabilities: ["ICU", "CT", "Obstetrics", "Surgery"],
    coe: [],
    phone: "+254 68 31321",
  },
  {
    id: "garissa",
    name: "Garissa County Referral Hospital",
    short: "Garissa CR",
    county: "Garissa",
    lat: -0.4569,
    lon: 42.4789,
    level: 4,
    inNetwork: false,
    beds: 160,
    availBeds: 22,
    capabilities: ["Obstetrics", "Surgery"],
    coe: [],
    phone: "+254 46 2120124",
  },
  {
    id: "kakamega",
    name: "Kakamega County Teaching & Referral",
    short: "Kakamega TR",
    county: "Kakamega",
    lat: 0.2827,
    lon: 34.7519,
    level: 5,
    inNetwork: true,
    beds: 440,
    availBeds: 28,
    capabilities: ["ICU", "CT", "Obstetrics", "Surgery", "Dialysis"],
    coe: ["Renal"],
    phone: "+254 56 20248",
  },
  {
    id: "meru",
    name: "Meru Level 5 Hospital",
    short: "Meru L5",
    county: "Meru",
    lat: 0.0469,
    lon: 37.6488,
    level: 5,
    inNetwork: true,
    beds: 270,
    availBeds: 16,
    capabilities: ["CT", "Obstetrics", "Surgery", "Trauma"],
    coe: [],
    phone: "+254 64 31116",
  },
  {
    id: "thika",
    name: "Thika Level 5 Hospital",
    short: "Thika L5",
    county: "Kiambu",
    lat: -1.0396,
    lon: 37.0900,
    level: 5,
    inNetwork: true,
    beds: 400,
    availBeds: 23,
    capabilities: ["ICU", "CT", "Obstetrics", "Surgery", "Dialysis"],
    coe: [],
    phone: "+254 67 22013",
  },
  {
    id: "kijabe",
    name: "AIC Kijabe Hospital",
    short: "Kijabe AIC",
    county: "Kiambu",
    lat: -0.9369,
    lon: 36.5697,
    level: 4,
    inNetwork: false,
    beds: 280,
    availBeds: 15,
    capabilities: ["ICU", "CT", "Neurosurgery", "Obstetrics", "Surgery"],
    coe: ["Neurosurgery"],
    phone: "+254 66 32000",
  },
  {
    id: "msambweni",
    name: "Msambweni County Referral Hospital",
    short: "Msambweni CR",
    county: "Kwale",
    lat: -4.4717,
    lon: 39.4814,
    level: 4,
    inNetwork: true,
    beds: 160,
    availBeds: 18,
    capabilities: ["Obstetrics", "Surgery"],
    coe: [],
    phone: "+254 40 4520071",
  },
];

/* ── Condition → required capabilities mapping ───────────────────── */
const CONDITION_CAPS: Record<string, string[]> = {
  cardiac: ["Cath Lab", "ICU"],
  stroke: ["MRI", "CT", "ICU", "Neurosurgery"],
  trauma: ["Trauma", "ICU", "CT"],
  renal: ["Dialysis", "ICU"],
  obstetric: ["Obstetrics", "ICU"],
  burns: ["Burns", "ICU"],
  oncology: ["Oncology"],
  neurosurgery: ["Neurosurgery", "ICU", "MRI"],
  icu: ["ICU"],
  dialysis: ["Dialysis"],
};

/* ── Auto-match algorithm ────────────────────────────────────────── */
export function autoMatch(
  fromLat: number,
  fromLon: number,
  condition: string,
  currentFacilityId?: string
): Facility[] {
  const required = CONDITION_CAPS[condition.toLowerCase()] ?? [];

  return KENYA_FACILITIES
    .filter((f) => f.id !== currentFacilityId && f.availBeds > 0)
    .map((f) => {
      const distKm = haversine(fromLat, fromLon, f.lat, f.lon);
      const capScore = required.length
        ? required.filter((c) => f.capabilities.includes(c)).length / required.length
        : 1;
      const levelBonus = f.level * 3;
      const netBonus = f.inNetwork ? 20 : 0;
      const bedBonus = Math.min(f.availBeds / 2, 10);
      const distPenalty = Math.min(distKm / 20, 30);
      const score = capScore * 40 + levelBonus + netBonus + bedBonus - distPenalty;
      return { ...f, _score: score, _dist: distKm, _capScore: capScore };
    })
    .sort((a, b) => (b as any)._score - (a as any)._score)
    .slice(0, 5) as Facility[];
}

/* ── COE badge colours ───────────────────────────────────────────── */
const COE_COLOR: Record<string, string> = {
  Cardiac: "#ef4444",
  Stroke: "#a855f7",
  Trauma: "#f97316",
  Burns: "#f59e0b",
  Renal: "#3b82f6",
  Oncology: "#ec4899",
  Neurosurgery: "#8b5cf6",
  Obstetric: "#10b981",
};

const COE_ICON: Record<string, string> = {
  Cardiac: "♥",
  Stroke: "⚡",
  Trauma: "🩹",
  Burns: "🔥",
  Renal: "💧",
  Oncology: "⊕",
  Neurosurgery: "🧠",
  Obstetric: "♀",
};

/* ── Map component (Leaflet – client only) ───────────────────────── */
interface Props {
  activeReferralFromId?: string;
  activeReferralToId?: string;
  highlightIds?: string[];
  onFacilitySelect?: (f: Facility) => void;
}

export default function KenyaReferralMap({
  activeReferralFromId,
  activeReferralToId,
  highlightIds = [],
  onFacilitySelect,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    let L: any;
    let map: any;

    (async () => {
      L = (await import("leaflet")).default;

      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      map = L.map(mapRef.current, {
        center: [-0.5, 37.5],
        zoom: 6,
        zoomControl: false,
        attributionControl: true,
      });

      leafletMapRef.current = map;

      // CartoDB Dark Matter
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 16,
        }
      ).addTo(map);

      // Custom zoom control
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Draw active route polyline
      if (activeReferralFromId && activeReferralToId) {
        const from = KENYA_FACILITIES.find((f) => f.id === activeReferralFromId);
        const to = KENYA_FACILITIES.find((f) => f.id === activeReferralToId);
        if (from && to) {
          L.polyline([[from.lat, from.lon], [to.lat, to.lon]], {
            color: "#ef4444",
            weight: 3,
            opacity: 0.9,
            dashArray: "8 6",
          }).addTo(map);

          // Midpoint ambulance pulse
          const midLat = (from.lat + to.lat) / 2;
          const midLon = (from.lon + to.lon) / 2;
          const ambulanceIcon = L.divIcon({
            className: "",
            html: `<div style="
              width:28px;height:28px;border-radius:50%;
              background:linear-gradient(135deg,#ef4444,#b91c1c);
              border:2px solid #fca5a5;
              display:flex;align-items:center;justify-content:center;
              font-size:13px;
              box-shadow:0 0 12px rgba(239,68,68,0.7);
              animation:facility-pulse 1.4s ease-in-out infinite;
            ">🚑</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          L.marker([midLat, midLon], { icon: ambulanceIcon }).addTo(map);
        }
      }

      // Draw facility markers
      KENYA_FACILITIES.forEach((f) => {
        const isFrom = f.id === activeReferralFromId;
        const isTo = f.id === activeReferralToId;
        const isHighlighted = highlightIds.includes(f.id);

        const radius = f.level === 6 ? 14 : f.level === 5 ? 10 : 7;
        let color = f.inNetwork ? "#2dd4bf" : "#f59e0b";
        let fillOpacity = f.inNetwork ? 0.85 : 0.65;
        let weight = 2;

        if (isTo) { color = "#ef4444"; fillOpacity = 1; weight = 3; }
        if (isFrom) { color = "#2dd4bf"; fillOpacity = 1; weight = 3; }
        if (isHighlighted && !isTo && !isFrom) { color = "#a855f7"; fillOpacity = 0.9; weight = 2; }

        const marker = L.circleMarker([f.lat, f.lon], {
          radius,
          color: isTo ? "#fca5a5" : isFrom ? "#5eead4" : isHighlighted ? "#c4b5fd" : f.inNetwork ? "#0d9488" : "#d97706",
          fillColor: color,
          fillOpacity,
          weight,
        });

        // CoE badge as div icon overlay
        if (f.coe.length > 0) {
          const badgeHtml = f.coe
            .slice(0, 2)
            .map(
              (c) =>
                `<span style="
                  background:${COE_COLOR[c] ?? "#6b7280"}22;
                  border:1px solid ${COE_COLOR[c] ?? "#6b7280"}66;
                  color:${COE_COLOR[c] ?? "#9ca3af"};
                  font-size:9px;font-weight:700;
                  padding:1px 4px;border-radius:4px;
                  display:inline-block;margin:1px;
                ">${COE_ICON[c] ?? "★"} ${c}</span>`
            )
            .join("");

          const divIcon = L.divIcon({
            className: "",
            html: `<div style="
              position:absolute;
              left:${radius + 4}px;top:${-radius}px;
              white-space:nowrap;pointer-events:none;
            ">${badgeHtml}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });
          L.marker([f.lat, f.lon], { icon: divIcon }).addTo(map);
        }

        // Tooltip (always visible for L5+)
        if (f.level >= 5) {
          marker.bindTooltip(f.short, {
            permanent: true,
            direction: "right",
            offset: [radius + 6, 0],
            className: "facility-label-tooltip",
          });
        }

        // Popup
        const coeBadges = f.coe
          .map(
            (c) =>
              `<span style="
                background:${COE_COLOR[c] ?? "#6b7280"}22;
                border:1px solid ${COE_COLOR[c] ?? "#6b7280"}55;
                color:${COE_COLOR[c] ?? "#9ca3af"};
                font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;
                display:inline-block;margin:2px;
              ">${COE_ICON[c] ?? "★"} ${c}</span>`
          )
          .join("");

        const capList = f.capabilities
          .map(
            (c) =>
              `<span style="
                background:rgba(255,255,255,0.05);
                border:1px solid rgba(255,255,255,0.1);
                color:#94a3b8;font-size:10px;padding:2px 6px;
                border-radius:4px;display:inline-block;margin:2px;
              ">${c}</span>`
          )
          .join("");

        const networkBadge = f.inNetwork
          ? `<span style="color:#2dd4bf;font-size:10px;font-weight:700;background:rgba(45,212,191,0.1);border:1px solid rgba(45,212,191,0.3);padding:2px 8px;border-radius:20px;">✓ In Network</span>`
          : `<span style="color:#f59e0b;font-size:10px;font-weight:700;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);padding:2px 8px;border-radius:20px;">⚠ Out of Network</span>`;

        marker.bindPopup(`
          <div style="min-width:220px;font-family:'Inter',system-ui,sans-serif;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;">
              <div>
                <div style="font-weight:700;font-size:13px;color:#f0f4ff;line-height:1.3;">${f.name}</div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">📍 ${f.county} County · Level ${f.level}</div>
              </div>
              ${networkBadge}
            </div>
            <div style="display:flex;gap:12px;margin-bottom:8px;">
              <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:6px 10px;flex:1;text-align:center;">
                <div style="font-size:18px;font-weight:800;color:${f.availBeds > 10 ? "#2dd4bf" : f.availBeds > 0 ? "#f59e0b" : "#ef4444"};">${f.availBeds}</div>
                <div style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Avail Beds</div>
              </div>
              <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:6px 10px;flex:1;text-align:center;">
                <div style="font-size:18px;font-weight:800;color:#94a3b8;">${f.beds}</div>
                <div style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Total Beds</div>
              </div>
            </div>
            ${f.coe.length ? `<div style="margin-bottom:6px;">${coeBadges}</div>` : ""}
            <div style="margin-bottom:8px;">${capList}</div>
            <div style="display:flex;align-items:center;gap:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.06);">
              <span style="font-size:11px;color:#475569;">📞</span>
              <span style="font-size:11px;color:#94a3b8;">${f.phone}</span>
            </div>
          </div>
        `, {
          maxWidth: 280,
        });

        marker.on("click", () => onFacilitySelect?.(f));
        marker.addTo(map);
      });

      // Custom CSS for permanent labels (injected once)
      if (!document.getElementById("leaflet-label-style")) {
        const style = document.createElement("style");
        style.id = "leaflet-label-style";
        style.textContent = `
          .facility-label-tooltip {
            background: rgba(6,11,24,0.92) !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
            border-radius: 5px !important;
            color: #cbd5e1 !important;
            font-size: 10px !important;
            font-weight: 600 !important;
            padding: 2px 6px !important;
            box-shadow: none !important;
            white-space: nowrap !important;
          }
          .facility-label-tooltip::before { display: none !important; }
        `;
        document.head.appendChild(style);
      }

      setReady(true);
    })();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update active route when props change (re-mount is simplest for now)
  // Production would use separate layers; for MVP this is fine.

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden" style={{ minHeight: 420 }}>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center z-10"
             style={{ background: "rgba(6,11,24,0.9)" }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-400 text-sm">Loading Kenya Map…</span>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: 420 }} />

      {/* Legend */}
      <div className="absolute bottom-10 left-3 z-[1000] rounded-xl p-3 text-xs"
           style={{ background: "rgba(6,11,24,0.88)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
        <div className="font-semibold text-slate-300 mb-2 text-[11px] uppercase tracking-wider">Legend</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: "#2dd4bf" }} />
            <span className="text-slate-400">In-Network Facility</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: "#f59e0b" }} />
            <span className="text-slate-400">Out-of-Network</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: "#ef4444" }} />
            <span className="text-slate-400">Active Destination</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: "#a855f7" }} />
            <span className="text-slate-400">Recommended Match</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Size = Level</div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-teal-700" style={{ background: "#2dd4bf33" }} />
              <span className="text-slate-400">L6 National</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-teal-700" style={{ background: "#2dd4bf33" }} />
              <span className="text-slate-400">L5 Regional</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0 border border-teal-700" style={{ background: "#2dd4bf33" }} />
              <span className="text-slate-400">L4 County</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
