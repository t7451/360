import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import fs from 'fs';
import pinoHttp from 'pino-http';
import { orderRoutes } from './routes/orders';
import { webhookRoutes } from './routes/webhooks';
import { assetRoutes } from './routes/assets';
import { healthRoutes } from './routes/health';
import { inkVaultRoutes } from './routes/inkvault';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { initializeQueue } from './jobs/queue';
import { logger } from './lib/logger';
import { requestIdMiddleware } from './middleware/requestId';
import dotenv from 'dotenv';
import { validateEnv } from './lib/validateEnv.js';

dotenv.config();
validateEnv(); // exits with clear error if required vars missing

// Bootstrap Firebase service account from env var (Railway/production)
// Set GOOGLE_APPLICATION_CREDENTIALS_JSON to the full service account JSON string
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const tmpPath = '/tmp/firebase-sa.json';
  try {
    fs.writeFileSync(tmpPath, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON, { mode: 0o600 });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
    logger.info('Firebase service account loaded from env');
  } catch (err) {
    logger.error({ error: err }, 'Failed to write Firebase service account');
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// --- Request ID & HTTP logging ---
app.use(requestIdMiddleware);
app.use(pinoHttp({
  logger,
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
  customAttributeKeys: { reqId: 'requestId' },
  serializers: {
    req: (req) => ({ method: req.method, url: req.url, id: req.id }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
}));

// --- Security ---
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));

// Rate limiting — 100 requests per 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Try again later.' },
});
app.use('/api/', limiter);

// --- Webhooks (raw body needed for Stripe signature verification) ---
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// --- JSON parsing for all other routes ---
app.use(express.json({ limit: '10mb' }));

// --- Routes ---
app.use('/api/health', healthRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/assets', authMiddleware, assetRoutes);
app.use('/api/inkvault', inkVaultRoutes);

// --- Error handling ---
app.use(errorHandler);

// --- Boot ---
async function start() {
  try {
    await initializeQueue();
    app.listen(PORT, () => {
      logger.info({ port: PORT, env: process.env.NODE_ENV }, 'FORGE3D API server started');
    });
  } catch (err) {
    logger.error({ error: err }, 'Failed to start server');
    process.exit(1);
  }
}

start();

export default app;
