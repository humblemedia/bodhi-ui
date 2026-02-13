/**
 * examples/dark-patterns.jsx
 *
 * A gallery of common dark patterns for Bodhi to detect.
 * Run: npx eslint --rulesdir packages/eslint-plugin-bodhi/src/rules examples/
 *
 * Every violation here is something real companies ship daily.
 * Bodhi catches them. With koans.
 */

import React from 'react';

// ─── M4: Consent Erosion ──────────────────────────────────────
// Pre-checked newsletter signup buried in a checkout form.
// GDPR Art 4(11) says this is not consent.

function CheckoutForm() {
  return (
    <form>
      <input type="text" name="email" placeholder="Email address" />

      {/* 🚨 Bodhi will catch this: defaultChecked on a consent checkbox */}
      <label>
        <input
          type="checkbox"
          name="newsletter-consent"
          defaultChecked
        />
        Send me marketing emails and special offers
      </label>

      {/* 🚨 Bodhi will catch this: pre-checked tracking consent */}
      <label>
        <input
          type="checkbox"
          name="tracking-consent"
          defaultChecked={true}
        />
        I agree to third-party tracking for personalized ads
      </label>

      {/* ✅ This is fine: not pre-checked, user makes affirmative choice */}
      <label>
        <input
          type="checkbox"
          name="terms-accept"
        />
        I have read and accept the Terms of Service
      </label>

      <button type="submit">Complete Purchase</button>
    </form>
  );
}

// ─── M2: Obstructed Exit ──────────────────────────────────────
// Cancel is tiny grey text. Subscribe is a big green button.
// FTC says cancellation should mirror signup.

function SubscriptionModal() {
  return (
    <div role="dialog" aria-label="Subscription offer">
      <h2>Upgrade to Premium!</h2>
      <p>Get unlimited access for just $9.99/month</p>

      {/* The confirm action: large, prominent, impossible to miss */}
      <button className="btn-primary bg-green text-white font-bold px-8 py-4 rounded-full shadow-lg w-full">
        Subscribe Now
      </button>

      {/* 🚨 Bodhi will catch this: exit action visually suppressed */}
      <button className="text-xs text-gray underline opacity-50">
        no thanks
      </button>
    </div>
  );
}

// ─── M7: Asymmetric Salience ──────────────────────────────────
// Accept cookies is a big blue button.
// Decline is barely visible grey text.
// The interface has already made the choice for you.

function CookieBanner() {
  return (
    <div>
      <p>We use cookies to improve your experience.</p>
      <div>
        {/* Big, bold, impossible to miss */}
        <button className="btn-primary bg-blue text-white font-bold px-6 py-3 rounded-lg shadow-md">
          Accept All Cookies
        </button>

        {/* 🚨 Bodhi will catch this: asymmetric pair */}
        <button className="btn-link text-xs text-gray underline">
          Decline
        </button>
      </div>
    </div>
  );
}

// ─── Clean Example ────────────────────────────────────────────
// This is what Bodhi-compliant consent looks like.

function BodhiConsentBanner() {
  return (
    <div role="dialog" aria-label="Cookie preferences">
      <p>We use cookies. You choose which ones.</p>
      <div>
        {/* Equal visual weight. Equal voice. */}
        <button className="btn-primary px-6 py-3 rounded-lg">
          Accept Selected
        </button>
        <button className="btn-primary px-6 py-3 rounded-lg">
          Decline All
        </button>
      </div>

      {/* Unchecked by default. User makes the choice. */}
      <label>
        <input type="checkbox" name="analytics-consent" />
        Analytics cookies
      </label>
      <label>
        <input type="checkbox" name="marketing-consent" />
        Marketing cookies
      </label>
    </div>
  );
}

export {
  CheckoutForm,
  SubscriptionModal,
  CookieBanner,
  BodhiConsentBanner,
};
