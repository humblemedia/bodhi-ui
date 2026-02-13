# Bodhi (बोधि)

**Awakening for the web.**

Bodhi is a semantic-first UI framework that enforces design ethics at the code level. When user and publisher interests conflict, Bodhi sides with the user.

Most UI frameworks are agnostic about the relationship between what publishers want (conversion, engagement, attention capture) and what users want (clarity, cognitive ease, not being manipulated). Bodhi takes a position: **the overlap is the only legitimate design space.**

## What It Does

Bodhi ships an ESLint plugin that detects nine categories of dark patterns in your markup — and tells you about them with Zen koans instead of dry error messages.

```
⚠ bodhi/no-consent-erosion (M4)

  "The monk asked: 'Did the student choose, or did the teacher
   choose for them?' The master replied: 'Check the default.'"

  Pre-checked checkbox detected. GDPR Art 4(11) requires consent
  through a clear affirmative act. A pre-ticked box is not consent.

  Dogmatic: Remove defaultChecked.
  Lenient: Add justification prop explaining the default.
```

## Status

🚧 **Proto-Bodhi** — Early development. The architecture is decided ([Decision Document v0.2](docs/architecture.md)). The code is being built.

Working now:
- ESLint plugin with initial marker rules
- Koan-based violation messages with three interface modes

Coming soon:
- CLI tool (`bodhi init`, `bodhi lint`, `bodhi token compile`, `bodhi report`)
- Rūpa token system (brand-specific design tokens with poetic vocabulary)
- WordPress theme (first compile target)

## The Nine Markers

| # | Marker | What It Catches |
|---|--------|----------------|
| M1 | Manufactured Urgency | Fake countdown timers, urgency keywords |
| M2 | Obstructed Exit | Hidden cancel buttons, asymmetric exit paths |
| M3 | Attention Capture | Autoplay, infinite animation, scroll hijacking |
| M4 | Consent Erosion | Pre-checked boxes, bundled consent, Accept/Reject asymmetry |
| M5 | False Social Proof | Hardcoded "X people viewing", fake reviews |
| M6 | Cognitive Overload | Element density that overwhelms decision-making |
| M7 | Asymmetric Salience | "Accept" is big and green, "Decline" is small and grey |
| M8 | Anchoring Manipulation | Fake original prices, decoy pricing tiers |
| M9 | Enforced Continuity | Auto-renew buried in fine print |

Each marker maps to existing regulations (GDPR, DSA, FTC, CCPA). Bodhi doesn't invent ethics — it enforces what the law already requires.

## Quick Start

```bash
npm install eslint-plugin-bodhi --save-dev
```

```js
// eslint.config.js (ESLint v9 flat config)
import bodhi from 'eslint-plugin-bodhi';

export default [
  bodhi.configs.recommended,
  // ... your other configs
];
```

## Philosophy

Bodhi's design philosophy is **Mettā-ism** (मैत्री) — loving-kindness operationalized as design constraint. Not minimalism (aesthetic choice), not brutalism (confrontational statement). The interface *cares* about users.

The Sanskrit naming system isn't decoration — it's productive friction. When a developer writes `Nivedana` instead of "form," they're forced to think about what a form *means* for the user: an offering, a submission of trust.

## Design Principles

1. Use generic, recognizable web layouts and justify deviations with user story.
2. Choose the simplest path that fulfills the dharma.
3. Global constants should govern at least 80% of a layout's features.
4. Improve the system before giving more control to the developer.
5. Usability and accessibility over aesthetics always.
6. Give developers better and clearer choices.
7. Semantic, design-agnostic components.
8. Design on principles, not metrics.

## License

MIT

## Related

- [Vajra-vāk](https://github.com/yourusername/vajra-vak) — The linguistic framework Bodhi instantiates in the interface domain
- [Seva](https://github.com/yourusername/seva) — Coercive control detection (Bodhi's interpersonal parallel)
