import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import catalog from '@/lib/book-catalog.json';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Only prices from our own catalog may be sold through this endpoint.
const ALLOWED_PRICES = new Map(catalog.map((b) => [b.priceId, b]));

// Canonical origin for redirect URLs; never trust the request's Origin header.
const SITE_URL = (process.env.SITE_URL || 'https://practicalpsychadvice.com').replace(/\/$/, '');

export async function POST(req: NextRequest) {
  let priceId: unknown;
  try {
    ({ priceId } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const book = typeof priceId === 'string' ? ALLOWED_PRICES.get(priceId) : undefined;
  if (!book) {
    return NextResponse.json({ error: 'Unknown product' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: book.priceId, quantity: 1 }],
      mode: 'payment',
      metadata: { slug: book.slug },
      success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/checkout/cancel`,
      // This Stripe account has Managed Payments on by default, which requires
      // a tax_code on every product unless disabled per-session.
      // (Not yet in the pinned SDK's TS types, hence the cast.)
      ...({ managed_payments: { enabled: false } } as object),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { error: 'Unable to start checkout. Please try again.' },
      { status: 500 }
    );
  }
}
