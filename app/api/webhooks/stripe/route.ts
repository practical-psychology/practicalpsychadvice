import { headers } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new NextResponse(
      `Webhook Error: ${err.message}`,
      { status: 400 }
    );
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // Delivery happens on /checkout/success (verified paid session + download link).
      // This log is the order record; search Cloud Run logs for "ORDER_COMPLETED".
      console.log(
        'ORDER_COMPLETED',
        JSON.stringify({
          session: session.id,
          slug: session.metadata?.slug,
          email: session.customer_details?.email,
          amount: session.amount_total,
        })
      );
      break;
    }

    case 'charge.refunded':
      const charge = event.data.object as Stripe.Charge;

      // TODO: Handle refunds
      // - Update database to mark order as refunded
      // - Send refund confirmation email

      console.log(`Refund processed for charge ${charge.id}`);
      break;

    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;

      // TODO: Handle subscription updates
      console.log(`Subscription updated for customer ${subscription.customer}`);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
