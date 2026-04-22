import { Router, Request, Response, NextFunction } from 'express';
import { getOrder } from '../lib/ordersStore';

const router = Router();

// GET /api/assets/:orderId/:assetId/download
router.get('/:orderId/:assetId/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, assetId } = req.params;
    const user = (req as any).user;
    const order = await getOrder(String(orderId));

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    if (order.userId !== user.uid && user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const asset = order.assets.find((a: any) => a.id === assetId);
    if (!asset) {
      res.status(404).json({ success: false, error: 'Asset not found' });
      return;
    }

    // Check expiry
    if (new Date(asset.expiresAt) < new Date()) {
      res.status(410).json({ success: false, error: 'Download link expired. Request a new one.' });
      return;
    }

    // In production: generate signed GCS URL and redirect
    res.redirect(asset.downloadUrl);
  } catch (err) {
    next(err);
  }
});

export { router as assetRoutes };
