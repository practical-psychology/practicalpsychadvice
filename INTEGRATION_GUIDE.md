# Stripe Integration Guide for Practical Psychology Advice

## Overview

### 1. API Routes

#### `/api/checkout` (POST)

Creates a Stripe checkout session.

**Request:**

```json
{
  "priceId": "price_1234567890",
  "bookTitle": "The Secrets of Charisma",
  "quantity": 1
}
```

**Response:**

```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

#### `/api/webhooks/stripe` (POST)

Handles Stripe webhook events. Supports:

- `checkout.session.completed` - Order fulfillment
- `charge.refunded` - Refund processing
- `customer.subscription.updated` - Subscription updates

### 2. Client-Side Utilities

#### `lib/stripe.ts`

Helper functions for Stripe integration:

- `getStripe()` - Initialize Stripe.js
- `initiateCheckout(priceId, bookTitle, quantity)` - Start checkout

#### `components/CheckoutButton.tsx`

Reusable checkout button component:

```jsx
<CheckoutButton
  priceId="price_1234567890"
  bookTitle="The Secrets of Charisma"
/>
```

### 3. Pages

- `/checkout/success` - Displays after successful payment
- `/checkout/cancel` - Shown if user cancels payment

## Getting Started

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Stripe

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your Stripe API keys
# Get keys from: https://dashboard.stripe.com/apikeys
```

### Step 3: Create Products in Stripe

For each book, create a Product and Price in Stripe Dashboard:

1. Dashboard → Products → Add Product
2. Name: "The Secrets of Charisma" (or book title)
3. Create a Price with amount `699` (cents) and currency `usd`
4. Copy the Price ID (e.g., `price_1234567890`)

### Step 4: Run Development Server

```bash
npm run dev
```

### Step 5: Test Locally

1. Visit http://localhost:3000
2. Click a "Buy" button (you'll need to implement this - see Integration below)
3. Use Stripe test card: `4242 4242 4242 4242`
4. Success! Check the success page

## Integration with Existing HTML (already wired)

Every book's primary "Buy" CTA (`public/index.html` and all `public/audiences/*/book-N.html`) now has a sibling Stripe button next to the existing books2read retailer link, driven by `public/js/checkout.js`:

```html
<a class="btn theme-button w-fit" href="https://books2read.com/u/booygA">Buy The Secrets of Charisma</a>
<button type="button" class="btn stripe-btn w-fit" data-stripe-checkout
  data-price-id="price_..." data-book-title="The Secrets of Charisma">
  Buy Instantly — Secure Checkout
</button>
```

`checkout.js` listens for clicks on any `[data-stripe-checkout]` element, posts `{priceId, bookTitle, quantity}` to `/api/checkout`, and redirects to the returned Stripe Checkout URL — the same flow `lib/stripe.ts`'s `initiateCheckout()` uses, just callable from plain HTML instead of a React tree. `CheckoutButton.tsx`/`lib/stripe.ts` remain available if a future page is built with React instead of static HTML.

To regenerate the buttons after editing `lib/book-catalog.json` (e.g. new price IDs, a book title change):

```bash
node scripts/insert-stripe-buttons.mjs
```

It's idempotent — safe to re-run any time.

## Environment Variables

Required for production:

```env
# Publishable key (safe for frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Secret key (server-side only)
STRIPE_SECRET_KEY=sk_live_...

# Webhook signing secret
STRIPE_WEBHOOK_SECRET=whsec_...
```

⚠️ **Never commit these to Git** - they're in `.gitignore`

## Deployment

### Local Testing with Stripe CLI

```bash
# Install CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Update `.env.local` with the webhook secret from the output.

### Deploy to Google Cloud Run

```bash
gcloud run deploy practicalpsychadvice \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets=STRIPE_SECRET_KEY=stripe-secret-key:latest,\
STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest,\
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=stripe-publishable-key:latest
```

`--source .` builds the repo's `Dockerfile` via Cloud Build and deploys it in one step. See `STRIPE_SETUP.md` for the one-time Secret Manager setup.

### Production Webhooks

1. Get your Cloud Run URL from the deploy output (e.g., `https://practicalpsychadvice-xxxxx.us-central1.run.app`)
2. Stripe Dashboard → Developers → Webhooks → Add endpoint
3. URL: `https://<your-cloud-run-url>/api/webhooks/stripe`
4. Select events: `checkout.session.completed`
5. Copy the webhook secret into Secret Manager: `printf '%s' "whsec_..." | gcloud secrets versions add stripe-webhook-secret --data-file=-`
6. Redeploy

## Webhook Handling

Currently, the webhook handler accepts events but doesn't implement fulfillment logic. Update `app/api/webhooks/stripe/route.ts` to:

- Save orders to your database
- Send confirmation emails
- Provision digital access
- Update inventory

Example:

```typescript
case 'checkout.session.completed':
  const session = event.data.object as Stripe.Checkout.Session;

  // 1. Save order
  const order = await db.orders.create({
    stripeSessionId: session.id,
    customerEmail: session.customer_email,
    amount: session.amount_total,
    bookIds: getBookIdsFromLineItems(session.line_items),
  });

  // 2. Send confirmation email
  await email.sendOrderConfirmation(session.customer_email, order);

  // 3. Provision access (if selling digital products)
  await provisionDigitalAccess(session.customer_email, order.bookIds);

  break;
```

## Testing

### Test Cards

- **Success:** `4242 4242 4242 4242`
- **Requires Auth:** `4000 0025 0000 3155`
- **Declined:** `4000 0000 0000 0002`

Full list: <https://stripe.com/docs/testing>

### Testing Webhooks Without CLI

```bash
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test_signature" \
  -d '{"type":"checkout.session.completed","data":{"object":{"id":"cs_test","payment_status":"paid"}}}'
```

## File Structure

```text
.
├── app/
│   ├── api/
│   │   ├── checkout/route.ts          # Create checkout session
│   │   └── webhooks/stripe/route.ts   # Handle events
│   ├── checkout/
│   │   ├── success/page.tsx           # After payment
│   │   └── cancel/page.tsx            # User cancelled
│   └── layout.tsx                     # Root layout
├── components/
│   └── CheckoutButton.tsx             # Reusable checkout button (React; unused by the static pages)
├── lib/
│   ├── stripe.ts                      # Stripe.js helpers
│   └── book-catalog.json              # slug/title/priceId/books2read-code for all 10 books
├── scripts/
│   ├── create-stripe-products.mjs     # Idempotent: creates Stripe products/prices
│   └── insert-stripe-buttons.mjs      # Idempotent: wires buy buttons into public/*.html
├── public/                            # Static site + images/, css/, js/checkout.js
├── Dockerfile                         # Cloud Run build
├── .env.local                         # YOUR secrets (not in Git)
├── .env.local.example                 # Template
├── package.json                       # Dependencies
├── next.config.js                     # Next.js config
├── tsconfig.json                      # TypeScript config
├── STRIPE_SETUP.md                    # Full setup guide
├── STRIPE_QUICK_START.md              # Quick start
└── INTEGRATION_GUIDE.md              # This file
```

## Next Steps

1. ~~**Create Products** - Add each book as a Stripe product with prices~~ done (test mode) — re-run `scripts/create-stripe-products.mjs` with live keys before going live
2. **Test Locally** - Follow Quick Start guide
3. ~~**Integrate Buttons** - Update your buy buttons with Price IDs~~ done — see `scripts/insert-stripe-buttons.mjs`
4. **Deploy** - `gcloud run deploy` (see above)
5. **Configure Webhooks** - Set up production webhook in Stripe
6. **Implement Fulfillment** - Handle orders in webhook handler
7. **Monitor** - Check Stripe Dashboard for issues

## Support

- **Setup Issues:** See [STRIPE_SETUP.md](./STRIPE_SETUP.md)
- **Quick Help:** See [STRIPE_QUICK_START.md](./STRIPE_QUICK_START.md)
- **Stripe Docs:** <https://stripe.com/docs>
- **Next.js Docs:** <https://nextjs.org/docs>

## Summary

✅ **Complete:** API infrastructure, environment setup, documentation  
⏳ **Next:** Create Stripe products, integrate buttons, test, deploy  
🚀 **Ready:** Full production deployment support
