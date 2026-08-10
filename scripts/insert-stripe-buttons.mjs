// Inserts an on-site "Buy Instantly (Stripe)" button next to the primary
// books2read CTA on public/index.html and every public/audiences/*/book-N.html,
// driven by lib/book-catalog.json (slug/title/priceId/books2readCode).
// Idempotent: re-running skips pages that already have the button.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const catalog = JSON.parse(readFileSync(path.join(rootDir, 'lib', 'book-catalog.json'), 'utf8'));

const SCRIPT_TAG = '  <script src="/js/checkout.js" defer></script>\n';

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function ensureScriptTag(html) {
  if (html.includes('/js/checkout.js')) return html;
  return html.replace('</body>', `${SCRIPT_TAG}</body>`);
}

function insertButton(html, book, buttonHtml) {
  if (html.includes(`data-price-id="${book.priceId}"`)) return { html, inserted: false };

  const anchorPattern = new RegExp(
    `<a class="[^"]*" href="https://books2read\\.com/u/${book.books2readCode}">[^<]*</a>`
  );
  const match = html.match(anchorPattern);
  if (!match) return { html, inserted: false };

  const replaced = html.replace(anchorPattern, `${match[0]}\n            ${buttonHtml}`);
  return { html: replaced, inserted: true };
}

function processFile(filePath, book, buttonClass) {
  let html = readFileSync(filePath, 'utf8');
  const buttonHtml = `<button type="button" class="btn ${buttonClass} w-fit" data-stripe-checkout data-price-id="${book.priceId}" data-book-title="${escapeAttr(book.title)}">Buy Instantly &mdash; Secure Checkout</button>`;

  const result = insertButton(html, book, buttonHtml);
  if (!result.inserted) return false;

  html = ensureScriptTag(result.html);
  writeFileSync(filePath, html);
  return true;
}

function main() {
  let touched = 0;

  // Root homepage — one CTA per book, uses the page's own .stripe-btn style.
  const indexPath = path.join(rootDir, 'public', 'index.html');
  for (const book of catalog) {
    if (processFile(indexPath, book, 'stripe-btn')) touched++;
  }

  // Every audience funnel's book-N.html — uses brand.css's .btn-outline.
  const audiencesDir = path.join(rootDir, 'public', 'audiences');
  const audienceFolders = readdirSync(audiencesDir).filter((name) =>
    statSync(path.join(audiencesDir, name)).isDirectory()
  );

  for (const folder of audienceFolders) {
    for (const book of catalog) {
      const bookPath = path.join(audiencesDir, folder, `${book.slug}.html`);
      try {
        if (processFile(bookPath, book, 'btn-outline')) touched++;
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
        console.warn(`  (skip, not found) ${folder}/${book.slug}.html`);
      }
    }
  }

  console.log(`\nInserted/updated Stripe buttons on ${touched} page(s) across ${audienceFolders.length} audience folders + root index.`);
}

main();
