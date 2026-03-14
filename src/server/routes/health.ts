import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      service: 'forge3d-api',
      status: 'healthy',
      version: process.env.npm_package_version || '0.1.0',
      timestamp: new Date().toISOString(),
    },
  });
});

export { router as healthRoutes };
