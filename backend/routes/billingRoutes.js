import express from 'express';
import Stripe from 'stripe';
import Organization from '../models/Organization.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

let stripeInstance;
const getStripe = () => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
  }
  return stripeInstance;
};

export const webhookRouter = express.Router();
export const apiRouter = express.Router();

// ─── POST /api/billing/webhook ───────────────────────────────────────────────
webhookRouter.post('/', async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';

  let event;
  try {
    // For local dev without a real Stripe secret, just parse the JSON manually
    if (endpointSecret === 'whsec_mock' || !sig) {
        event = JSON.parse(req.body.toString());
    } else {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Find organization by clientReferenceId
    if (session.client_reference_id) {
        await Organization.findByIdAndUpdate(session.client_reference_id, {
            subscriptionStatus: 'active',
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription
        });
        console.log(`Organization ${session.client_reference_id} subscribed successfully via Webhook.`);
    }
  } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      await Organization.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          { subscriptionStatus: 'canceled' }
      );
  }

  res.json({received: true});
});

// ─── POST /api/billing/create-checkout-session ──────────────────────────────
apiRouter.post('/create-checkout-session', requireAuth, allowRoles(['organization_admin']), async (req, res) => {
  try {
    const stripe = getStripe();
    const orgId = req.user.orgId;
    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      client_reference_id: orgId.toString(),
      customer_email: org.adminEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Premium AI Services (Call Transcription & Summarization)',
            },
            unit_amount: 9900, // $99.00 / month
            recurring: { interval: 'month' }
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/org-admin?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/org-admin?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating checkout session' });
  }
});

// ─── GET /api/billing/status ────────────────────────────────────────────────
apiRouter.get('/status', requireAuth, allowRoles(['organization_admin']), async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId);
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    
    res.json({
      subscriptionStatus: org.subscriptionStatus || 'none',
      premiumServices: org.premiumServices || { callTranscription: false, callSummarization: false }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching billing status' });
  }
});
