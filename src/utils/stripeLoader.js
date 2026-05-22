/** Load Stripe.js v3 and return a Stripe instance. */
export function loadStripeJs(publishableKey) {
  return new Promise((resolve, reject) => {
    if (!publishableKey?.trim()) {
      reject(new Error('Stripe publishable key is missing.'));
      return;
    }

    const init = () => {
      if (!window.Stripe) {
        reject(new Error('Stripe.js failed to initialize.'));
        return;
      }
      resolve(window.Stripe(publishableKey.trim()));
    };

    if (window.Stripe) {
      init();
      return;
    }

    const existing = document.querySelector('script[data-stripe-js]');
    if (existing) {
      existing.addEventListener('load', init);
      existing.addEventListener('error', () => reject(new Error('Could not load Stripe.js')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.dataset.stripeJs = '1';
    script.onload = init;
    script.onerror = () => reject(new Error('Could not load Stripe.js'));
    document.body.appendChild(script);
  });
}
