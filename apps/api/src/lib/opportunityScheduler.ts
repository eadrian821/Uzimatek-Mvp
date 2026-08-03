import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { runScanAndPersist } from "./opportunityScanService";

const QUEUE_NAME = "opportunity-scan";
const DEFAULT_CRON = "0 6 * * *";
const DEFAULT_TZ = "Africa/Nairobi";

// Feature flag + Redis are both optional — if either is missing/unreachable,
// the app boots normally without the scheduler rather than crashing.
export async function registerOpportunityScheduler(): Promise<void> {
  if (process.env.ENABLE_OPPORTUNITY_SCAN !== "true") {
    console.log("[opportunityScheduler] ENABLE_OPPORTUNITY_SCAN not set to \"true\" — scheduler disabled");
    return;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn("[opportunityScheduler] REDIS_URL not set — scheduler disabled");
    return;
  }

  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
  connection.on("error", (err) => {
    console.warn("[opportunityScheduler] Redis connection error:", err.message);
  });

  try {
    await connection.connect();
    await connection.ping();
  } catch (err) {
    console.warn(
      "[opportunityScheduler] Redis unreachable — scheduler disabled:",
      (err as Error).message
    );
    await connection.quit().catch(() => undefined);
    return;
  }

  const queue = new Queue(QUEUE_NAME, { connection });
  await queue.add(
    "daily-scan",
    {},
    {
      repeat: {
        pattern: process.env.OPPORTUNITY_SCAN_CRON || DEFAULT_CRON,
        tz: process.env.OPPORTUNITY_SCAN_TIMEZONE || DEFAULT_TZ,
      },
      jobId: "opportunity-daily-scan",
    }
  );

  const worker = new Worker(
    QUEUE_NAME,
    async () => {
      console.log("[opportunityScheduler] Running scheduled opportunity scan...");
      const summary = await runScanAndPersist();
      console.log("[opportunityScheduler] Scan complete:", summary);
    },
    { connection }
  );

  worker.on("failed", (_job, err) => {
    console.error("[opportunityScheduler] Scan job failed:", err.message);
  });

  console.log(
    `[opportunityScheduler] Registered — cron "${process.env.OPPORTUNITY_SCAN_CRON || DEFAULT_CRON}" (${
      process.env.OPPORTUNITY_SCAN_TIMEZONE || DEFAULT_TZ
    })`
  );
}
