import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV,
      firebase: !!process.env.FIREBASE_PROJECT_ID,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      redis: !!process.env.REDIS_URL,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      timestamp: new Date().toISOString(),
    },
  });
});

export { router as healthRoutes };

