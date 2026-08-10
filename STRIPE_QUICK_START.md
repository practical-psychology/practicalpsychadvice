# Stripe Integration - Quick Start

## 5-Minute Setup

### 1. Install and Start

```bash
npm install
npm run dev
```

Visit <http://localhost:3000>

### 2. Get Stripe Keys

1. Go to <https://dashboard.stripe.com>
2. Dashboard → Developers → API Keys
3. Copy your **test keys**

### 3. Configure Local Environment

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_test_temporary
EOF
```

Replace `YOUR_KEY` with your actual keys from step 2.

### 4. Test Checkout

1. Click any "Buy" button on the site
2. Use test card: **4242 4242 4242 4242**
3. Any future expiry date, any 3-digit CVC
4. Success! You'll see the success page

## Production Deployment

### Via Vercel (Recommended)

```bash
git add .
git commit -m "Add Stripe payment"
git push origin main
```

1. Go to <https://vercel.com>
2. Import your GitHub repository
3. Add environment variables (from Stripe Dashboard):
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_...)
   - `STRIPE_SECRET_KEY` (sk_live_...)
   - `STRIPE_WEBHOOK_SECRET` (from webhook setup below)
4. Deploy

### Set Up Production Webhooks

1. Deploy your app to get the URL (e.g., `https://myapp.vercel.app`)
2. Go to Stripe Dashboard → Developers → Webhooks
3. Click "Add endpoint"
4. Endpoint URL: `https://myapp.vercel.app/api/webhooks/stripe`
5. Select events: `checkout.session.completed`
6. Copy the webhook secret and update Vercel environment variables
7. Redeploy

## File Structure

```text
app/
├── api/
│   ├── checkout/          # Create checkout session
│   └── webhooks/stripe/   # Handle webhook events
├── checkout/
│   ├── success/           # Success page
│   └── cancel/            # Cancellation page
└── layout.tsx             # Root layout

lib/
└── stripe.ts              # Stripe helper functions

components/
└── CheckoutButton.tsx     # Reusable checkout button

.env.local.example         # Environment template
STRIPE_SETUP.md           # Full setup guide
```

## Next Steps

1. **Create Products** in Stripe Dashboard with Price IDs
2. **Update Buy Buttons** with your Price IDs
3. **Implement Order Fulfillment** in webhook handler
4. **Test Thoroughly** before going live
5. **Monitor Dashboard** for payment issues

## Common Price ID Format

Stripe Price IDs look like:

- Test: `price_1234567890abcdefghij`
- Live: Same format, just from live API keys

Get them from: Stripe Dashboard → Products → [Product] → Prices

## Support

See [STRIPE_SETUP.md](./STRIPE_SETUP.md) for detailed setup, troubleshooting, and advanced configuration.
