# practicalpsychadvice.com

## Practical Psychology Advice - Book Series Store

The official website and store for the "Practical Psychology" series by Andy Horowitz. This is a Next.js application featuring the complete 10-book catalog with integrated Stripe payment processing for seamless book purchases.

### Features

- ✅ **10-Book Series Catalog** - Complete showcase of all books with individual product pages
- ✅ **Stripe Payment Integration** - Secure checkout and payment processing
- ✅ **Responsive Design** - Mobile-first design using TailwindCSS
- ✅ **Order Management** - Webhook handling for payment events
- ✅ **Production-Ready** - Configured for Google Cloud Run deployment
- ✅ **TypeScript** - Full type safety for API routes and components
- ✅ **Multiple Book Retailers** - Direct links to Apple Books, Kobo, and other platforms

### Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Payment:** Stripe API
- **Deployment:** Google Cloud Run (Docker, `output: 'standalone'`)
- **Database-Ready:** Hooks for order fulfillment (implement as needed)

### File Structure

```text
.
├── app/
│   ├── api/
│   │   ├── checkout/route.ts          # Stripe checkout session creation
│   │   └── webhooks/stripe/route.ts   # Webhook event handler
│   ├── checkout/
│   │   ├── success/page.tsx           # Post-payment success page
│   │   └── cancel/page.tsx            # Payment cancellation page
│   └── layout.tsx                     # Root layout
├── components/
│   └── CheckoutButton.tsx             # Reusable checkout button (unused by the static pages; kept for any future React page)
├── lib/
│   ├── stripe.ts                      # Stripe.js helpers
│   └── book-catalog.json              # slug/title/priceId/books2read-code for all 10 books
├── scripts/
│   ├── create-stripe-products.mjs     # Idempotent: creates the 10 Stripe products/prices
│   └── insert-stripe-buttons.mjs      # Idempotent: wires "Buy Instantly" buttons into public/*.html
├── public/                            # Static site: index.html, audiences/, images/, css/, js/checkout.js
├── Dockerfile                         # Multi-stage build for Cloud Run
├── .env.local                         # Environment secrets (git-ignored)
├── .env.local.example                 # Template for environment variables
├── package.json                       # Dependencies
├── next.config.js                     # Next.js configuration (standalone output + "/" rewrite)
├── tsconfig.json                      # TypeScript configuration
├── STRIPE_SETUP.md                    # Complete setup guide
├── STRIPE_QUICK_START.md              # Quick start guide
└── INTEGRATION_GUIDE.md               # Integration documentation
```

### Prerequisites

- **Node.js 18+** - Required for Next.js development
- **npm or yarn** - Package manager
- **Stripe Account** - Create free at <https://stripe.com>
- **Git** - For version control

### Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**

   ```bash
   # .env.local is already configured with test keys
   # For production, update with live Stripe keys
   ```

3. **Run development server:**

   ```bash
   npm run dev
   ```

4. **Open in browser:**

   Navigate to <http://localhost:3000>

5. **Test Stripe checkout:**
   - Click any book's buy button
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3-digit number

### Key Sections

- **Series Overview** - Introduction to the 10-book Practical Psychology series
- **Book Catalog** - Complete listing with covers, descriptions, and retailer links
- **Key Insights** - Core themes across all books (Mindful Living, Decision-Making, etc.)
- **Features & Benefits** - What readers can expect from the series
- **Reader Testimonials** - Reviews from educators, social workers, and entrepreneurs
- **FAQ** - Answers to common questions about books and purchase process
- **Newsletter Signup** - Subscribe for psychology tips and series updates

### Payment Integration

#### Stripe API Endpoints

**POST /api/checkout**
Creates a Stripe checkout session and returns the checkout URL.

Request body:

```json
{
  "priceId": "price_1234567890",
  "bookTitle": "The Secrets of Charisma",
  "quantity": 1
}
```

**POST /api/webhooks/stripe**

Handles Stripe webhook events for:

- `checkout.session.completed` - Order fulfillment
- `charge.refunded` - Refund processing
- `customer.subscription.updated` - Subscription management

#### Environment Variables

Required for operation:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

⚠️ **Never commit `.env.local` to Git** - it's protected by `.gitignore`

### Deployment

#### Local Development

```bash
npm run dev
```

Server runs at <http://localhost:3000>

#### Production Deployment (Google Cloud Run)

```bash
gcloud run deploy practicalpsychadvice \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets=STRIPE_SECRET_KEY=stripe-secret-key:latest,\
STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest,\
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=stripe-publishable-key:latest
```

`--source .` builds the `Dockerfile` in this repo via Cloud Build and deploys it — no separate build step needed. Secrets live in Secret Manager (see below), never in the image or in committed files.

1. Enable APIs once per project: `gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com`
2. Create the three secrets in Secret Manager (`gcloud secrets create stripe-secret-key --data-file=-`, etc.)
3. Run the `gcloud run deploy` command above
4. Grant the Cloud Run service account `roles/secretmanager.secretAccessor` on each secret if deploy doesn't do it automatically

#### Webhook Configuration for Production

1. Deploy to Cloud Run to get the production URL (`https://<service>-<hash>.<region>.run.app`)
2. In Stripe Dashboard: Developers → Webhooks → Add Endpoint
3. Endpoint URL: `https://<your-cloud-run-url>/api/webhooks/stripe`
4. Select events: `checkout.session.completed`
5. Copy the signing secret and update the `stripe-webhook-secret` value in Secret Manager (`gcloud secrets versions add stripe-webhook-secret --data-file=-`)
6. Redeploy so the new secret version is picked up

### Testing

#### Stripe Test Cards

- **Success:** `4242 4242 4242 4242`
- **Authentication Required:** `4000 0025 0000 3155`
- **Declined:** `4000 0000 0000 0002`

Full list: <https://stripe.com/docs/testing>

#### Local Webhook Testing

With Stripe CLI installed:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Documentation

- **[STRIPE_QUICK_START.md](./STRIPE_QUICK_START.md)** - 5-minute setup guide
- **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** - Comprehensive setup and deployment
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Integration options and implementation

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Image Assets

All book cover images are located in `/images`:
- `book-1-charisma.png`
- `book-2-motivation.png`
- `book-3-self-awareness.png`
- `book-4-social-skills.png`
- `book-5-nonverbal.png`
- `book-6-emotional-intelligence.png`
- `book-7-changing-behavior.png`
- `book-8-stress-emotions.png`
- `book-9-relationships.png`
- `book-10-communication.png`
- Plus supporting graphics and author photos
