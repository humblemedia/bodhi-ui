# Sadhana Programming Language — Parallels and Lessons for Bodhi

**Date:** March 2026
**Status:** Research note / design influence

## Source Material

- **Zenodo record:** https://zenodo.org/records/18846465
- **GitHub repo:** https://github.com/nickzq7/Sadhana-Programming-Language

Sadhana is an experimental programming language that bridges classical Sanskrit linguistics (specifically Panini's Ashtadhyayi) with modern compiler design. It compiles declarative specifications into code across seven backends (HTML/CSS, Python, SQL, Rust, Go, Java, C++). The compiler is implemented as a single 3,587-line pure Python file with no external dependencies. The project frames itself as AGI alignment research.

---

## The Deep Parallel: Meaning as the Invariant Layer

Both Bodhi and Sadhana independently arrived at the same structural insight from Panini's grammar: **surface forms should be derived from invariant semantic roots through rule-governed transformations.**

In Bodhi, a Yantra like Kriya (action/trigger) maintains its semantic identity whether it compiles to a button, a link, or a submit element. The component's *meaning* is stable across targets. Sadhana does something structurally identical with its **Canonical Meaning Kernel (CMK)** — a five-part semantic fingerprint that stays stable whether compiling to Python, Rust, or SQL.

The multi-target compilation pipelines are nearly identical in shape:

- **Bodhi:** YAML specification -> Bodhi Compiler (TypeScript) -> WordPress / React / Static HTML
- **Sadhana:** Declarative spec -> Sadhana Compiler (Python) -> Python / Rust / SQL / Go / Java / C++

Both are asserting that the specification language should be about *what you mean*, and the target language is an implementation detail.

---

## Three Concepts Worth Importing

### 1. Sandhi Engine (Meaning Composition Rules)

Sadhana includes a "Sandhi Engine" that handles mandatory meaning composition during code generation — rules for how semantic units combine without losing identity. In Sanskrit, sandhi governs how sounds change at word boundaries while preserving meaning.

**Relevance to Bodhi:** When combining Yantra + Mudra (e.g., Pantha + Jala for navigation-in-a-grid), there is an implicit composition step where meaning must be preserved. Currently this is handled by convention. A formalized composition engine — Sandhi rules for component combination — would make Bodhi's combinatorial system more rigorous.

Questions this raises:

- What are the rules for when two Mudras can stack on the same Yantra?
- What happens to the Metta score when you compose components? Is it additive, multiplicative, or does it follow its own Sandhi?
- Are there forbidden combinations (like Sanskrit's phonological constraints) where certain Yantra+Mudra pairings produce welfare violations by construction?

### 2. Reversible Semantic Encoding (Bija System)

Sadhana's "Bija system" provides reversible semantic encoding — you can go from the compiled output back to the semantic specification. In Sanskrit, bija ("seed") refers to the latent form from which manifest forms arise.

**Relevance to Bodhi:** The diagnostic layer already places `data-yantra`, `data-mudra`, and `data-metta-score` attributes on rendered components. This is a partial semantic fingerprint. But reversibility is a stronger property. Full reversibility would mean: given a rendered WordPress page, reconstruct the Bodhi YAML specification that produced it.

This has a concrete adoption use case: scan existing sites, reverse-engineer the semantic structure, score them against Metta Math, and show developers exactly what Bodhi would change and why. "Your contact form is a Nivedana with a Metta score of 0.3 because of pre-checked consent boxes. Here's what the same form looks like at 0.9."

### 3. Provable Semantic Preservation Across Transformations

Sadhana's central claim is that its CMK guarantees equivalent meaning across compilation targets. Whether or not the implementation delivers on that claim, the *aspiration* is worth borrowing in a more grounded form.

**Relevance to Bodhi:** A Metta score computed at the YAML specification level should be provably preserved (or at worst, bounded with known degradation) at the output level. If a component scores MIL-2 in the spec, the compiled WordPress theme should not be able to introduce MIL-3 failure modes. The compiler should guarantee welfare properties, not just functional properties.

This connects directly to the Metta Integrity Level system. MIL certification at the spec level should cascade to all compile targets, with the compiler responsible for proving no welfare degradation occurred during transformation.

---

## Where Sadhana and Bodhi Diverge

These differences matter and should be preserved, not collapsed.

**Purpose of Sanskrit vocabulary.** Sadhana uses Sanskrit *structurally* — modeling Panini's grammar rules in code. Bodhi uses Sanskrit *pedagogically* — forcing developers to think about what components mean for users. Bodhi's approach changes how people think, not just how the compiler works. This is arguably the more interesting move.

**Grounding.** Bodhi's claims are grounded in existing regulations (GDPR, DSA, FTC, CCPA) and established engineering frameworks (FMEA, SIL, NASA-TLX). Sadhana frames itself as AGI alignment research, which is a much larger and vaguer claim. Bodhi should not adopt this framing. The strength of the project is its specificity.

**Ethics as primary constraint.** Sadhana is ethics-agnostic — it's about semantic fidelity in code generation. Bodhi's entire architecture exists to enforce a position: user welfare is the primary constraint. This is the core innovation and should not be diluted by importing Sadhana's more neutral posture.

---

## Proposed Design Work

Based on this analysis, three threads are worth exploring:

1. **Formalize Yantra+Mudra composition rules** as an explicit Sandhi system, with named rules governing what happens when semantic units combine. Include welfare-preserving constraints (compositions that would produce dark patterns by construction are forbidden).

2. **Investigate reversibility** from compiled output back to Bodhi spec. Start with the diagnostic data attributes already in place. Determine what additional information the compiler would need to emit for full round-trip fidelity.

3. **Prove Metta score preservation** across compilation. Define what it means for a compile target to be "welfare-equivalent" to its source spec. This is the formal version of the question: does the WordPress theme honor the same commitments as the YAML?

---

*This document records research influence, not endorsement. Sadhana's core architectural ideas are worth studying; its larger claims about AGI alignment are not adopted here.*
