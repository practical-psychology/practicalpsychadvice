// One-off / idempotent: creates a Stripe Product + Price for each book in
// scripts/book-catalog-source.mjs (skipping any book_slug that already exists),
// then writes lib/book-catalog.json for the site's checkout buttons to consume.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Stripe from 'stripe';
import { loadEnvLocal } from './load-env-local.mjs';
import { BOOKS, PRICE_USD_CENTS } from './book-catalog-source.mjs';

loadEnvLocal();

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

async function findExistingPrice(slug) {
  const products = await stripe.products.search({
    query: `metadata['book_slug']:'${slug}' AND active:'true'`,
  });
  if (products.data.length === 0) return null;
  const product = products.data[0];
  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 1 });
  return prices.data[0] ?? null;
}

async function main() {
  const catalog = [];

  for (const book of BOOKS) {
    let price = await findExistingPrice(book.slug);

    if (price) {
      console.log(`= ${book.slug}: reusing existing price ${price.id}`);
    } else {
      const product = await stripe.products.create({
        name: book.title,
        metadata: { book_slug: book.slug },
      });
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: PRICE_USD_CENTS,
        currency: 'usd',
      });
      console.log(`+ ${book.slug}: created product ${product.id} / price ${price.id}`);
    }

    catalog.push({
      slug: book.slug,
      title: book.title,
      priceId: price.id,
      books2readCode: book.books2readCode,
    });
  }

  const outPath = path.join(rootDir, 'lib', 'book-catalog.json');
  writeFileSync(outPath, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`\nWrote ${catalog.length} books to lib/book-catalog.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
