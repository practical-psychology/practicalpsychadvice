(function () {
  function escapeForAlert(msg) {
    return String(msg || 'Unable to start checkout right now. Please try again or use a retailer link below.');
  }

  async function handleClick(event) {
    var btn = event.currentTarget;
    var priceId = btn.getAttribute('data-price-id');
    if (!priceId) return;

    event.preventDefault();
    var bookTitle = btn.getAttribute('data-book-title') || '';
    var originalText = btn.textContent;

    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Processing…';

    try {
      var res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: priceId, bookTitle: bookTitle, quantity: 1 }),
      });

      if (!res.ok) throw new Error('Checkout request failed');
      var data = await res.json();
      if (!data.url) throw new Error('No checkout URL returned');

      window.location.href = data.url;
    } catch (err) {
      console.error('Stripe checkout error:', err);
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = originalText;
      window.alert(escapeForAlert('Unable to start checkout right now. Please try again or use a retailer link below.'));
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-stripe-checkout]').forEach(function (btn) {
      btn.addEventListener('click', handleClick);
    });
  });
})();
