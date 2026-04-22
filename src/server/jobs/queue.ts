import { Queue, Worker, Job } from 'bullmq';
import { RenderJob } from '../types';
import { processRenderJob } from './renderWorker';
import { logger } from '../lib/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = {
  url: REDIS_URL,
};

// --- Queue ---
const renderQueue = new Queue<RenderJob>('forge3d-render', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

// --- Worker ---
let worker: Worker<RenderJob> | null = null;

export async function initializeQueue(): Promise<void> {
  // Verify Redis connection
  await renderQueue.waitUntilReady();
  logger.info('Connected to Redis');

  // Start worker
  worker = new Worker<RenderJob>(
    'forge3d-render',
    async (job: Job<RenderJob>) => {
      logger.info({ jobId: job.id, orderId: job.data.orderId }, 'Processing job');
      return processRenderJob(job);
    },
    {
      connection,
      concurrency: 2,          // Process 2 jobs simultaneously
      limiter: { max: 10, duration: 60000 }, // Max 10 jobs per minute
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, orderId: job.data.orderId }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, orderId: job?.data.orderId, error: err.message }, 'Job failed');
    // TODO: Send Slack alert on final failure (attempt 3)
    if (job && job.attemptsMade >= 3) {
      logger.error({ jobId: job.id, orderId: job.data.orderId }, 'Job moved to dead letter queue after 3 attempts');
      notifySlack(job.data.orderId, err.message);
    }
  });

  logger.info('Render worker started (concurrency: 2)');
}

// --- Add job to queue ---
export async function addRenderJob(data: RenderJob): Promise<string> {
  const priority = data.attempt > 0 ? 3 : 1; // Retries get lower priority
  const job = await renderQueue.add('render', data, { priority });
  return job.id!;
}

// --- Slack notification stub ---
async function notifySlack(orderId: string, error: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 *FORGE3D Job Failed* (3 attempts exhausted)\nOrder: \`${orderId}\`\nError: ${error}`,
      }),
    });
  } catch (err) {
    logger.error({ error: err }, 'Slack notification failed');
  }
}
