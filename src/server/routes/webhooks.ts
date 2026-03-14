import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { addRenderJob } from '../jobs/queue';
import { orders } from './orders';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });

router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.error('[Webhook] No orderId in session metadata');
      res.status(400).json({ error: 'Missing orderId' });
      return;
    }

    const order = orders.get(orderId);
    if (!order) {
      console.error(`[Webhook] Order ${orderId} not found`);
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Mark paid and queue for processing
    order.status = 'queued';
    order.updatedAt = new Date().toISOString();

    const jobId = await addRenderJob({
      orderId: order.id,
      assetType: order.assetType,
      description: order.description,
      referenceImages: order.referenceImages,
      dimensions: order.dimensions,
      outputFormats: order.outputFormats,
      renderEngine: order.renderEngine,
      blenderCommands: [],
      attempt: 0,
    });

    order.jobId = jobId;
    order.status = 'processing';

    console.log(`[Webhook] Order ${orderId} paid — queued as job ${jobId}`);
  }

  res.json({ received: true });
});

export { router as webhookRoutes };
