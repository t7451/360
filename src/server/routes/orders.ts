import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import Stripe from 'stripe';
import { addRenderJob } from '../jobs/queue';
import { ApiResponse, Order, OrderRequest, PRICING } from '../types';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });

// In-memory store — swap for Firestore/Postgres in production
const orders = new Map<string, Order>();

// POST /api/orders — Create order + Stripe checkout
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as OrderRequest;
    const user = (req as any).user;

    // Validate
    if (!body.assetType || !body.description || !body.outputFormats?.length) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: assetType, description, outputFormats',
      } satisfies ApiResponse);
      return;
    }

    const pricing = PRICING[body.assetType];
    if (!pricing) {
      res.status(400).json({ success: false, error: `Invalid asset type: ${body.assetType}` });
      return;
    }

    const priceUsd = body.priority === 'rush' ? pricing.rush : pricing.base;
    const orderId = uuid();

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      client_reference_id: orderId,
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `FORGE3D: ${body.assetType.replace(/_/g, ' ')}`,
            description: body.description.slice(0, 200),
          },
          unit_amount: priceUsd * 100, // cents
        },
        quantity: 1,
      }],
      success_url: `${process.env.CLIENT_URL}/orders/${orderId}?status=success`,
      cancel_url: `${process.env.CLIENT_URL}/orders/${orderId}?status=cancelled`,
      metadata: { orderId },
    });

    // Persist order
    const order: Order = {
      id: orderId,
      userId: user.uid,
      status: 'pending_payment',
      assetType: body.assetType,
      description: body.description,
      referenceImages: body.referenceImages || [],
      dimensions: body.dimensions || null,
      outputFormats: body.outputFormats,
      renderEngine: body.renderEngine || 'cycles',
      priority: body.priority || 'standard',
      notes: body.notes || '',
      priceUsd,
      stripePaymentId: session.id,
      jobId: null,
      assets: [],
      revisions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.set(orderId, order);

    res.status(201).json({
      success: true,
      data: { orderId, checkoutUrl: session.url, priceUsd },
    } satisfies ApiResponse);
  } catch (err: any) {
    console.error('[Orders] Create error:', err);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// GET /api/orders/:id — Order status
router.get('/:id', (req: Request, res: Response) => {
  const order = orders.get(req.params.id);
  const user = (req as any).user;

  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }
  if (order.userId !== user.uid && user.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Unauthorized' });
    return;
  }

  res.json({ success: true, data: order } satisfies ApiResponse<Order>);
});

// GET /api/orders — List user orders
router.get('/', (req: Request, res: Response) => {
  const user = (req as any).user;
  const userOrders = Array.from(orders.values())
    .filter(o => o.userId === user.uid || user.role === 'admin')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, data: userOrders } satisfies ApiResponse<Order[]>);
});

// POST /api/orders/:id/revisions — Request revision
router.post('/:id/revisions', async (req: Request, res: Response) => {
  const order = orders.get(req.params.id);
  const user = (req as any).user;

  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }
  if (order.userId !== user.uid) {
    res.status(403).json({ success: false, error: 'Unauthorized' });
    return;
  }
  if (order.status !== 'completed') {
    res.status(400).json({ success: false, error: 'Can only revise completed orders' });
    return;
  }

  const revision = {
    id: uuid(),
    orderId: order.id,
    description: req.body.description,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };

  order.revisions.push(revision);
  order.status = 'queued';
  order.updatedAt = new Date().toISOString();

  // Re-queue for processing
  const jobId = await addRenderJob({
    orderId: order.id,
    assetType: order.assetType,
    description: `REVISION: ${revision.description}\n\nORIGINAL: ${order.description}`,
    referenceImages: order.referenceImages,
    dimensions: order.dimensions,
    outputFormats: order.outputFormats,
    renderEngine: order.renderEngine,
    blenderCommands: [],
    attempt: 0,
  });

  order.jobId = jobId;

  res.json({ success: true, data: revision });
});

export { router as orderRoutes, orders };
