import Link from 'next/link';
import Stripe from 'stripe';
import catalog from '@/lib/book-catalog.json';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const SUPPORT_EMAIL = 'info@practicalpsychadvice.com';

// Download link for a purchased book, e.g. BOOK_DOWNLOAD_URL_BOOK_1 for slug "book-1".
function downloadUrlFor(slug: string): string | undefined {
  const key = `BOOK_DOWNLOAD_URL_${slug.toUpperCase().replace(/-/g, '_')}`;
  return process.env[key] || undefined;
}

type Result =
  | { ok: true; title: string; email: string | null; downloadUrl?: string }
  | { ok: false };

async function lookup(sessionId: string | undefined): Promise<Result> {
  if (!sessionId || !sessionId.startsWith('cs_')) return { ok: false };
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') return { ok: false };
    const book = catalog.find((b) => b.slug === session.metadata?.slug);
    if (!book) return { ok: false };
    return {
      ok: true,
      title: book.title,
      email: session.customer_details?.email ?? null,
      downloadUrl: downloadUrlFor(book.slug),
    };
  } catch (err) {
    console.error('Success page lookup failed:', err);
    return { ok: false };
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const result = await lookup(searchParams.session_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        {result.ok ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank you!</h1>
            <p className="text-gray-600 mb-6">
              Your purchase of <strong>{result.title}</strong> is confirmed.
            </p>

            {result.downloadUrl ? (
              <a
                href={result.downloadUrl}
                className="block w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition mb-4"
              >
                Download your book
              </a>
            ) : (
              <p className="text-sm text-gray-700 bg-gray-50 rounded p-4 mb-4">
                We&rsquo;ll email your copy to {result.email ?? 'the address you used at checkout'} shortly.
              </p>
            )}

            <p className="text-sm text-gray-600 mb-8">
              Stripe emails your receipt{result.email ? ` to ${result.email}` : ''}. Questions? Write to{' '}
              <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">We couldn&rsquo;t confirm this order</h1>
            <p className="text-gray-600 mb-8">
              If you were charged, email{' '}
              <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>{' '}
              and we&rsquo;ll sort it out.
            </p>
          </>
        )}

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full border-2 border-green-600 text-green-600 font-semibold py-3 rounded-lg hover:bg-green-50 transition"
          >
            Return to Home
          </Link>
          <a
            href="/#series"
            className="block w-full text-green-700 font-semibold py-2 hover:underline"
          >
            Browse More Books
          </a>
        </div>
      </div>
    </div>
  );
}
