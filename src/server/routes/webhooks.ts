import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { addRenderJob } from '../jobs/queue';
import { getOrder, updateOrderStatus } from '../lib/ordersStore';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });

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

    const order = await getOrder(orderId);
    if (!order) {
      console.error(`[Webhook] Order ${orderId} not found`);
      res.status(404).json({ error: 'Order not found' });
      return;
    }

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

    await updateOrderStatus(orderId, 'processing', { jobId });

    console.log(`[Webhook] Order ${orderId} paid — queued as job ${jobId}`);
  }

  if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
    const obj = event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent;
    const orderId = (obj as Stripe.Checkout.Session).metadata?.orderId
      ?? (obj as Stripe.PaymentIntent).metadata?.orderId;

    if (orderId) {
      const order = await getOrder(orderId);
      if (order && order.status === 'queued') {
        // Only reset if not yet processing (idempotent guard)
        await updateOrderStatus(orderId, 'pending_payment');
        console.log(`[Webhook] Order ${orderId} payment failed — reset to pending_payment`);
      }
    }
  }

  res.json({ received: true });
});

export { router as webhookRoutes };
