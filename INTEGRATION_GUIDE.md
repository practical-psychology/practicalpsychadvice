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

## Integration with Existing HTML

Your current `index.html` has buy button links to books2read. You can:

### Option A: Add Stripe as Primary Payment (Recommended)

Update buy buttons in `index.html` to use the new CheckoutButton component. Since you're using static HTML, you'd need to:

1. Convert the HTML file to a Next.js page (`app/page.tsx`)
2. Replace `<a>` tags with `<CheckoutButton>` components
3. Update image paths to use `/images/` (public directory)

Example transformation:

```jsx
// OLD (HTML)
<a class="btn theme-button w-fit" href="https://books2read.com/u/booygA">
  Buy The Secrets of Charisma
</a>

// NEW (JSX with Stripe)
<CheckoutButton
  priceId="price_1234567890"
  bookTitle="The Secrets of Charisma"
  className="btn theme-button w-fit"
/>
```

### Option B: Keep Static HTML + API Routing

Keep your current `index.html` and add JavaScript to handle checkout:

```html
<script>
async function buyBook(priceId, bookTitle) {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, bookTitle, quantity: 1 })
  });
  const { url } = await response.json();
  window.location.href = url;
}
</script>

<!-- In your buy button -->
<button class="btn theme-button w-fit"
  onclick="buyBook('price_1234567890', 'The Secrets of Charisma')">
  Buy The Secrets of Charisma
</button>
```

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

### Deploy to Vercel

```bash
git push origin main
```

1. Go to https://vercel.com
2. Import your repository
3. Add environment variables (from Stripe Dashboard)
4. Deploy

### Production Webhooks

1. Get your Vercel deployment URL (e.g., `https://myapp.vercel.app`)
2. Stripe Dashboard → Developers → Webhooks → Add endpoint
3. URL: `https://myapp.vercel.app/api/webhooks/stripe`
4. Select events: `checkout.session.completed`
5. Copy webhook secret to Vercel environment variables
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
│   └── CheckoutButton.tsx             # Reusable checkout button
├── lib/
│   └── stripe.ts                      # Stripe helpers
├── public/
│   └── images/                        # All images (move from root)
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

1. **Create Products** - Add each book as a Stripe product with prices
2. **Test Locally** - Follow Quick Start guide
3. **Integrate Buttons** - Update your buy buttons with Price IDs
4. **Deploy** - Push to Vercel
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
