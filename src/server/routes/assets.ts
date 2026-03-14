import { Router, Request, Response } from 'express';
import { orders } from './orders';

const router = Router();

// GET /api/assets/:orderId/:assetId/download
router.get('/:orderId/:assetId/download', (req: Request, res: Response) => {
  const { orderId, assetId } = req.params;
  const user = (req as any).user;
  const order = orders.get(orderId);

  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }
  if (order.userId !== user.uid && user.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const asset = order.assets.find(a => a.id === assetId);
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
});

export { router as assetRoutes };
