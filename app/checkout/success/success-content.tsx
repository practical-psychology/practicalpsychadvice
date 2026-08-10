'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order has been confirmed.
        </p>

        {sessionId && (
          <div className="bg-gray-50 rounded p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-1">Order ID:</p>
            <p className="text-sm font-mono text-gray-900 break-all">{sessionId}</p>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-8">
          A confirmation email has been sent to your email address with your book links and receipt.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition"
          >
            Return to Home
          </Link>
          <Link
            href="#series"
            className="block w-full border-2 border-green-600 text-green-600 font-semibold py-3 rounded-lg hover:bg-green-50 transition"
          >
            Browse More Books
          </Link>
        </div>
      </div>
    </div>
  );
}
