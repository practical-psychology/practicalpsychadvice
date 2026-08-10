# Stripe Payment Integration Setup Guide

This guide covers setting up the Stripe payment system for the Practical Psychology Advice store.

## Prerequisites

- Node.js 18+ installed
- Stripe account (free tier available at <https://stripe.com>)
- Git repository initialized
- (Optional) Vercel account for deployment

## Step 1: Install Dependencies

```bash
npm install
```

This installs Next.js, React, Stripe SDKs, and TypeScript.

## Step 2: Set Up Stripe Account

1. **Create a Stripe account** at <https://stripe.com>
2. **Get API Keys:**
   - Go to Dashboard → Developers → API Keys
   - Copy your publishable key (starts with `pk_test_` or `pk_live_`)
   - Copy your secret key (starts with `sk_test_` or `sk_live_`)
3. **Create Price IDs for each book:**
   - Go to Products → Add Product
   - Create a product for each book (or use one product with multiple prices)
   - Create a Price with amount `699` (cents) and currency `usd`
   - Copy each Price ID (starts with `price_`)

## Step 3: Configure Local Environment

1. **Create `.env.local`** in the project root:

   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local`** and add your keys:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_temporary
```

> ⚠️ **Never commit `.env.local` to Git** - it's in `.gitignore` by default

## Step 4: Set Up Webhook Locally

### Install Stripe CLI

**macOS (using Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Or download:** <https://stripe.com/docs/stripe-cli>

### Authenticate Stripe CLI

```bash
stripe login
```

Follow the prompts to authenticate with your Stripe account.

### Forward Webhooks to Local Server

In a new terminal window, run:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret (starts with `whsec_`) from the output and update:

```env
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_KEY_HERE
```

## Step 5: Run Development Server

```bash
npm run dev
```

The app will be available at <http://localhost:3000>

### Test Payment Flow

1. Visit http://localhost:3000
2. Click a book's "Buy" button
3. You'll be redirected to Stripe Checkout
4. Use Stripe's test card numbers:
   - **Success:** `4242 4242 4242 4242`
   - **Requires authentication:** `4000 0025 0000 3155`
   - **Declined:** `4000 0000 0000 0002`
5. Enter any future date for expiry, any 3-digit number for CVC
6. After successful payment, you'll be redirected to `/checkout/success`

## Step 6: Integrate with Your HTML Pages

### Option A: Replace Current Setup (Recommended for Full Migration)

Convert this static site to a full Next.js app:

1. Move `/images` to `/public/images`
2. Create `app/page.tsx` with your current HTML as JSX
3. Update image paths from `./images/` to `/images/`

### Option B: Keep Static Site + Separate Next.js API

Keep the static HTML, but proxy API calls through Next.js:

1. Deploy the Next.js app separately
2. In your HTML buy buttons, call the remote checkout API
3. Update `initiateCheckout()` to use the full URL

## Step 7: Create Products in Stripe Dashboard

For each book, create a product:

```text
Book 1: The Secrets of Charisma
Price: $6.99 (ID: price_1234567890)

Book 2: Motivation and Setting Goals
Price: $6.99 (ID: price_abcdefghij)

... (repeat for all 10 books)
```

## Step 8: Deploy to Vercel

### Push to GitHub

```bash
git add .
git commit -m "Add Stripe payment integration"
git push origin main
```

### Deploy via Vercel

1. Go to <https://vercel.com/import>
2. Import your GitHub repository
3. Select your repository and click Import
4. **Environment Variables:** Add your production keys:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
5. Click Deploy

Your app will be live at `https://your-app.vercel.app`

## Step 9: Set Up Production Webhooks

1. **Get your production domain** from Vercel deployment
2. **Go to Stripe Dashboard → Developers → Webhooks**
3. **Click "Add endpoint"**
4. **Endpoint URL:** `https://your-app.vercel.app/api/webhooks/stripe`
5. **Select events to listen for:**
   - `checkout.session.completed` (required)
   - `charge.refunded` (optional)
   - `customer.subscription.updated` (if offering subscriptions)
6. **Copy the signing secret** and add to Vercel Environment Variables:
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...` (production webhook secret)
7. **Redeploy** your app for the new environment variable to take effect

## Step 10: Handle Orders in Webhook

Update the webhook handler at `app/api/webhooks/stripe/route.ts`:

Currently, the `checkout.session.completed` case has TODO comments. Implement:

- Database order logging
- Email confirmation sending
- Access provisioning (if selling digital products)

**Example implementation:**

```typescript
case 'checkout.session.completed':
  const session = event.data.object as Stripe.Checkout.Session;
  
  // Save order to database
  const order = await saveOrder({
    sessionId: session.id,
    customerEmail: session.customer_email,
    amount: session.amount_total,
    paymentStatus: session.payment_status,
    lineItems: session.line_items?.data || [],
  });
  
  // Send confirmation email
  await sendOrderConfirmation(session.customer_email, order);
  
  // Provision digital access if applicable
  if (order.type === 'ebook') {
    await sendDownloadLinks(session.customer_email, order.bookIds);
  }
  
  break;
```

## Important Notes

### Security

- ✅ **Never expose `STRIPE_SECRET_KEY`** in frontend code
- ✅ **Use environment variables** for all secrets
- ✅ **Verify webhook signatures** (already implemented)
- ✅ **Use HTTPS** in production

### Testing Webhook Handlers

To test webhook handlers without Stripe CLI:

```bash
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test_signature" \
  -d '{"type":"checkout.session.completed","data":{"object":{"id":"cs_test","payment_status":"paid"}}}'
```

### Monitoring

- Stripe Dashboard → Developers → Webhooks → Click endpoint to see logs
- Check application logs for errors
- Monitor payment success rate and failed transactions

### Going Live

When ready for production:

1. Switch to live Stripe API keys (start with `pk_live_` and `sk_live_`)
2. Update all environment variables in Vercel
3. Redeploy the application
4. Test a small transaction
5. Monitor Stripe dashboard for any issues

## Troubleshooting

### "Webhook signature verification failed"

- Ensure `STRIPE_WEBHOOK_SECRET` is correct
- Verify webhook is properly configured in Stripe Dashboard
- Check that `stripe listen` is running locally

### Checkout session returns null URL

- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Ensure Stripe API key has required permissions
- Check browser console for errors

### Test cards not working

- Use cards from https://stripe.com/docs/testing
- Ensure you're using test mode API keys
- Check for rate limiting (usually not an issue locally)

### Vercel deployment failing

- Ensure all environment variables are set in Vercel
- Check build logs at https://vercel.com/dashboard
- Verify `node_modules` is in `.gitignore`

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Vercel Documentation](https://vercel.com/docs)

## Support

For issues:
1. Check Stripe Dashboard logs
2. Check application error logs
3. Consult Stripe Documentation
4. Contact Stripe Support: https://support.stripe.com
