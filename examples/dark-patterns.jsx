/**
 * examples/dark-patterns.jsx
 *
 * A gallery of common dark patterns for Bodhi to detect.
 * Run: npx eslint examples/dark-patterns.jsx
 *
 * Every violation here is something real companies ship daily.
 * Bodhi catches them. With koans.
 */

import React from 'react';

// ─── M1: Manufactured Urgency ────────────────────────────────
// Fake countdown timers that reset on reload.

function FlashSaleBanner() {
  return (
    <div>
      {/* 🚨 Bodhi will catch this: countdown class with no real deadline */}
      <div className="countdown-timer">
        Sale ends in 02:59:00
      </div>

      {/* ✅ This is fine: no countdown class or urgency pattern */}
      <div className="meeting-time">
        Next standup: 10:00 AM
      </div>
    </div>
  );
}

// ─── M2: Obstructed Exit ────────────────────────────────────
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

// ─── M3: Attention Capture ──────────────────────────────────
// Autoplay video and infinite animations without user consent.

function MediaSection() {
  return (
    <div>
      {/* 🚨 Bodhi will catch this: autoPlay on video */}
      <video autoPlay src="/promo.mp4" />

      {/* 🚨 Bodhi will catch this: loop on audio */}
      <audio loop src="/background.mp3" />

      {/* 🚨 Bodhi will catch this: infinite animation */}
      <div className="animate-spin infinite">
        <span>Loading...</span>
      </div>

      {/* 🚨 Bodhi will catch this: marquee element */}
      <marquee>Breaking news: you should not use marquee</marquee>

      {/* ✅ This is fine: no autoplay, user-initiated */}
      <video controls src="/demo.mp4" />

      {/* ✅ This is fine: autoplay explicitly false */}
      <video autoPlay={false} src="/safe.mp4" />
    </div>
  );
}

// ─── M4: Consent Erosion ────────────────────────────────────
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

// ─── M5: False Social Proof ─────────────────────────────────
// Hardcoded numbers pretending to be live data.

function ProductPage() {
  return (
    <div>
      {/* 🚨 Bodhi will catch this: static social proof pattern */}
      <span>2,847 people bought this today</span>

      {/* 🚨 Bodhi will catch this: hardcoded viewer count */}
      <p>14 users viewing this right now</p>

      {/* 🚨 Bodhi will catch this: static "X customers" pattern */}
      <small>Trusted by 10,000 customers worldwide</small>

      {/* ✅ This is fine: no social proof keywords */}
      <span>Product weight: 250 grams</span>

      {/* ✅ This is fine: no numbers */}
      <span>Many people love this product</span>
    </div>
  );
}

// ─── M6: Cognitive Overload ─────────────────────────────────
// Too many choices at a decision point.

function OverloadedCheckout() {
  return (
    <form>
      {/* 🚨 Bodhi will catch this: 6+ interactive elements in a form */}
      <input type="text" name="name" placeholder="Full name" />
      <input type="email" name="email" placeholder="Email" />
      <input type="tel" name="phone" placeholder="Phone" />
      <select name="country"><option>US</option></select>
      <input type="text" name="promo" placeholder="Promo code" />
      <input type="text" name="referral" placeholder="Referral code" />
      <button className="btn-cta primary">Buy Now</button>
      <button className="btn-cta primary">Subscribe</button>
      <button className="btn-cta primary">Gift This</button>
      <button className="btn-cta primary">Add to Wishlist</button>
    </form>
  );
}

// ─── M7: Asymmetric Salience ────────────────────────────────
// Accept cookies is a big blue button.
// Decline is barely visible grey text.

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

// ─── M8: Anchoring Manipulation ─────────────────────────────
// Strikethrough pricing and decoy tiers.

function PricingSection() {
  return (
    <div>
      {/* 🚨 Bodhi will catch this: <del> with price content */}
      <del>$99.99</del>
      <span className="sale-price">$19.99</span>

      {/* 🚨 Bodhi will catch this: anchor price class with sale sibling */}
      <div>
        <span className="original-price">$199.00</span>
        <span className="sale-price">$49.00</span>
      </div>

      {/* ✅ This is fine: no price anchoring pattern */}
      <span>$29.99/month</span>
    </div>
  );
}

// ─── M9: Enforced Continuity ────────────────────────────────
// Auto-renewal buried in fine print.

function SubscriptionForm() {
  return (
    <form>
      <h2>Start your free trial</h2>

      {/* 🚨 Bodhi will catch this: auto-renew checkbox defaultChecked */}
      <label>
        <input
          type="checkbox"
          name="auto-renew"
          defaultChecked
        />
        Enable automatic renewal
      </label>

      {/* 🚨 Bodhi will catch this: renewal terms in collapsed details */}
      <details>
        <summary>Terms</summary>
        Your subscription will automatically renew each month.
        Cancel anytime before renewal date.
      </details>

      {/* 🚨 Bodhi will catch this: cancel info in suppressed text */}
      <p className="text-xs fine-print">
        To cancel your subscription, visit account settings.
      </p>

      {/* ✅ This is fine: unchecked auto-renewal */}
      <label>
        <input
          type="checkbox"
          name="auto-renew-clean"
        />
        Enable automatic renewal (optional)
      </label>

      <button type="submit">Start Trial</button>
    </form>
  );
}

// ─── Clean Example ──────────────────────────────────────────
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
  FlashSaleBanner,
  SubscriptionModal,
  MediaSection,
  CheckoutForm,
  ProductPage,
  OverloadedCheckout,
  CookieBanner,
  PricingSection,
  SubscriptionForm,
  BodhiConsentBanner,
};
