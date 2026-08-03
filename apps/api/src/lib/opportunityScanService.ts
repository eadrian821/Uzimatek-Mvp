import { prisma } from "./prisma";
import { runFullScan, type CategoryOpportunity } from "@uzimatek/ai";
import { scoreOpportunity } from "./opportunityScoring";
import { sendOpportunityDigest, type OpportunityForEmail } from "./opportunityEmail";

export interface ScanRunSummary {
  scanRunId: string;
  status: string;
  opportunitiesFound: number;
  categoriesRun: string[];
  categoryErrors: Array<{ category: string; message: string }>;
  emailSent: boolean;
  emailSkipReason?: string;
}

function toEmailShape(
  opp: CategoryOpportunity,
  compositeScore: number
): OpportunityForEmail {
  return {
    title: opp.title,
    organization: opp.organization ?? null,
    sourceUrl: opp.sourceUrl,
    category: opp.category,
    region: opp.region ?? null,
    deadline: opp.deadline ? new Date(opp.deadline) : null,
    fundingAmountText: opp.fundingAmountText ?? null,
    compositeScore,
  };
}

export async function runScanAndPersist(): Promise<ScanRunSummary> {
  const scanRun = await prisma.opportunityScanRun.create({
    data: { status: "running", categoriesRun: [] },
  });

  try {
    const result = await runFullScan();

    const emailItems: OpportunityForEmail[] = [];

    for (const opp of result.opportunities) {
      const { yieldScore, effortScore, compositeScore } = scoreOpportunity(opp);
      emailItems.push(toEmailShape(opp, compositeScore));

      await prisma.opportunity.upsert({
        where: { sourceUrl: opp.sourceUrl },
        create: {
          title: opp.title,
          organization: opp.organization ?? null,
          sourceUrl: opp.sourceUrl,
          category: opp.category,
          region: opp.region ?? null,
          deadline: opp.deadline ? new Date(opp.deadline) : null,
          fundingAmountText: opp.fundingAmountText ?? null,
          fundingAmountUsd: opp.fundingAmountUsd ?? null,
          description: opp.description,
          relevanceReason: opp.relevanceReason,
          yieldScore,
          effortScore,
          compositeScore,
          scanRunId: scanRun.id,
        },
        // Deliberately omit `status` and `discoveredAt` on update — a
        // returning opportunity keeps the user's triage state and original
        // discovery date; only its scoring/details refresh.
        update: {
          title: opp.title,
          organization: opp.organization ?? null,
          region: opp.region ?? null,
          deadline: opp.deadline ? new Date(opp.deadline) : null,
          fundingAmountText: opp.fundingAmountText ?? null,
          fundingAmountUsd: opp.fundingAmountUsd ?? null,
          description: opp.description,
          relevanceReason: opp.relevanceReason,
          yieldScore,
          effortScore,
          compositeScore,
          scanRunId: scanRun.id,
        },
      });
    }

    const status =
      result.categoryErrors.length === 0
        ? "completed"
        : result.categoriesRun.length > 0 || result.usedFallback
        ? "completed_with_errors"
        : "failed";

    await prisma.opportunityScanRun.update({
      where: { id: scanRun.id },
      data: {
        status,
        categoriesRun: result.categoriesRun,
        opportunitiesFound: result.opportunities.length,
        errorMessage:
          result.categoryErrors.length > 0
            ? result.categoryErrors.map((e) => `${e.category}: ${e.message}`).join(" | ")
            : null,
        completedAt: new Date(),
      },
    });

    const emailResult = await sendOpportunityDigest(emailItems);

    return {
      scanRunId: scanRun.id,
      status,
      opportunitiesFound: result.opportunities.length,
      categoriesRun: result.categoriesRun,
      categoryErrors: result.categoryErrors,
      emailSent: emailResult.sent,
      emailSkipReason: emailResult.reason,
    };
  } catch (err) {
    await prisma.opportunityScanRun.update({
      where: { id: scanRun.id },
      data: {
        status: "failed",
        errorMessage: (err as Error).message,
        completedAt: new Date(),
      },
    });
    throw err;
  }
}
