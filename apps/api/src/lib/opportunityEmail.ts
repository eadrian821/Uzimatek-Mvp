import { Resend } from "resend";
import type { OpportunityCategory } from "@uzimatek/shared-types";

export interface OpportunityForEmail {
  title: string;
  organization: string | null;
  sourceUrl: string;
  category: OpportunityCategory;
  region: string | null;
  deadline: Date | null;
  fundingAmountText: string | null;
  compositeScore: number;
}

const CATEGORY_LABELS: Record<OpportunityCategory, string> = {
  clinical_research: "Clinical & Medical Research Funding",
  digital_health: "Digital Health Innovation Challenges",
  startup_competition: "Startup Pitch Competitions",
  accelerator_fellowship: "Accelerators & Fellowships",
  investor_event: "Startup & Investor Events",
};

const TOP_N = 15;

function formatDeadline(deadline: Date | null): string {
  if (!deadline) return "No stated deadline";
  return deadline.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function buildDigestHtml(items: OpportunityForEmail[]): string {
  const top = [...items].sort((a, b) => b.compositeScore - a.compositeScore).slice(0, TOP_N);

  const grouped = top.reduce<Record<string, OpportunityForEmail[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const sections = Object.entries(grouped)
    .map(([category, opps]) => {
      const rows = opps
        .map(
          (o) => `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;">
            <a href="${o.sourceUrl}" style="color:#0891b2;font-weight:600;text-decoration:none;">${o.title}</a>
            ${o.organization ? `<div style="color:#64748b;font-size:12px;">${o.organization}</div>` : ""}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#334155;font-size:13px;">${o.region ?? "—"}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#334155;font-size:13px;">${formatDeadline(o.deadline)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#334155;font-size:13px;">${o.fundingAmountText ?? "—"}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#0891b2;font-weight:700;font-size:13px;">${Math.round(o.compositeScore)}</td>
        </tr>`
        )
        .join("");

      return `
        <h3 style="font-family:sans-serif;color:#0f172a;margin:24px 0 8px;">${CATEGORY_LABELS[category as OpportunityCategory] ?? category}</h3>
        <table style="width:100%;border-collapse:collapse;font-family:sans-serif;">
          <thead>
            <tr style="text-align:left;color:#64748b;font-size:12px;">
              <th style="padding:6px 8px;">Opportunity</th>
              <th style="padding:6px 8px;">Region</th>
              <th style="padding:6px 8px;">Deadline</th>
              <th style="padding:6px 8px;">Funding</th>
              <th style="padding:6px 8px;">Score</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
    })
    .join("");

  return `
    <div style="max-width:680px;margin:0 auto;">
      <h2 style="font-family:sans-serif;color:#0f172a;">Today's Opportunities — Uzimatek</h2>
      <p style="font-family:sans-serif;color:#64748b;font-size:14px;">
        Ranked by yield vs. effort. Top ${top.length} of ${items.length} found.
        <a href="${process.env.OPPORTUNITY_DASHBOARD_URL ?? "#"}" style="color:#0891b2;">View full list in the dashboard →</a>
      </p>
      ${sections || "<p style='font-family:sans-serif;color:#64748b;'>No opportunities found in this run.</p>"}
    </div>`;
}

export async function sendOpportunityDigest(
  items: OpportunityForEmail[]
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.OPPORTUNITY_DIGEST_EMAIL;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) {
    console.warn("[opportunityEmail] RESEND_API_KEY not set — skipping digest email");
    return { sent: false, reason: "RESEND_API_KEY not set" };
  }
  if (!to) {
    console.warn("[opportunityEmail] OPPORTUNITY_DIGEST_EMAIL not set — skipping digest email");
    return { sent: false, reason: "OPPORTUNITY_DIGEST_EMAIL not set" };
  }
  if (!from) {
    console.warn("[opportunityEmail] EMAIL_FROM not set — skipping digest email");
    return { sent: false, reason: "EMAIL_FROM not set" };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Uzimatek Opportunities Digest — ${items.length} found`,
    html: buildDigestHtml(items),
  });

  if (error) {
    console.error("[opportunityEmail] Resend send failed:", error);
    return { sent: false, reason: error.message };
  }

  return { sent: true };
}
