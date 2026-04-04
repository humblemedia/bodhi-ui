# 05 — Bodhi UI Framework

## Abstract
Bodhi ("awakening" in Sanskrit) is Andrew's Buddhist-informed UI framework that treats web interfaces as safety-critical systems rather than aesthetic constructions. The core innovation is Mettā Math — a mathematical welfare measurement system with four axes (Artha/purpose, Duḥkha/friction, Hidden Harm, Ruin) and non-compensatory veto rules preventing harm trading. Components use Sanskrit semantic vocabulary (Yantras for constructs, Mudrās for gesture qualities) and compile from human-readable YAML to multiple targets (WordPress themes, React components, static HTML). Engineering frameworks (FMEA, SIL, NASA-TLX) are adapted for UI welfare assessment, including "Mettā Integrity Levels" for component certification. The framework enforces accessibility and welfare baselines while permitting unlimited aesthetic customization through brand JSON files.

---

## 1. Core Philosophy

### 1.1 The Problem Bodhi Solves
Traditional UI frameworks optimize for publisher goals (engagement, conversion, time-on-site) with user welfare as an afterthought. Bodhi inverts this: **user welfare is the primary constraint**, and publisher goals must be achieved within welfare boundaries rather than at their expense.

### 1.2 Engineering, Not Architecture
Bodhi approaches web design like precision engineering with measurable safety properties, not like architecture or retail design. Interfaces have failure modes, tolerance thresholds, and safety ratings — just like bridges or medical devices.

### 1.3 The No-Scroll Constraint
Bodhi enforces a radical constraint: no scrolling. Content must be chunked and paginated. This forces designers to make deliberate decisions about information hierarchy rather than dumping everything on an infinite page and hoping users find what matters.

---

## 2. Mettā Math

### 2.1 The Four Axes

| Axis | Sanskrit | Measures | Examples |
|------|----------|----------|----------|
| **Ā** (Artha) | Purpose/value | Did the user accomplish what they came for? | Task completion, information found, goal achieved |
| **Ḏ** (Duḥkha) | Friction/suffering | How much unnecessary difficulty did the user experience? | Confusing navigation, hidden controls, forced registration |
| **H** (Hidden Harm) | Invisible damage | What damage occurs that the user doesn't notice? | Dark patterns, manipulative defaults, privacy erosion |
| **Ṝ** (Ruin) | Long-term catastrophe | Could this cause irreversible harm? | Addiction loops, financial ruin pathways, identity theft exposure |

### 2.2 The Master Equation
```
Mettā = Ā × e^{-γḎ} × (1 - Ṝ)
```

**Key properties:**
- **Multiplicative, not additive:** High purpose fulfillment cannot compensate for high harm. A slot machine that's fun to use still scores badly.
- **Exponential friction penalty:** Small amounts of friction are acceptable; large amounts collapse the score rapidly.
- **Ruin as hard constraint:** (1 - Ṝ) means any significant ruin potential drives the entire score toward zero.
- **Non-compensatory veto rules:** Certain conditions (addiction loop detected, financial ruin pathway, identity theft exposure) trigger automatic failure regardless of other scores.

### 2.3 Operationalization

**Artha** is best operationalized through regret-minimization: "Would the user, with full information, regret this interaction?" This handles the problem that users often don't know their own goals — it measures against their *informed* preferences.

**Duḥkha** uses behavioral measurement: task completion time, error rate, abandonment rate, number of unnecessary steps. Anchored with behavioral descriptions rather than verbal scales.

**Hidden Harm** is measured through behavior-intent divergence: does the interface do what it appears to do? Uses a protocol comparing stated function against actual behavior, with emphasis on default settings, data collection, and what happens when users click without reading.

**Ruin** functions as a constraint violation rather than a continuous score. Binary flags for: addiction loop present, financial ruin pathway accessible, irreversible action without confirmation, minors exposed to adult content, identity data exposed.

### 2.4 Validation Protocol
Designed for 30 components across good/bad/ambiguous categories. Inter-rater reliability testing with behavioral anchoring. Ground truth established through dark pattern taxonomy (Harry Brignull's work) and WCAG conformance protocols rather than Andrew's own scoring.

---

## 3. Component System

### 3.1 Yantras (Semantic Constructs)
22 core constructs that define WHAT an element does:

| Yantra | Purpose | Conventional Equivalent |
|--------|---------|----------------------|
| Sūci | List/sequence | ul, ol, menu |
| Kriyā | Action/trigger | button, link, submit |
| Darśana | Display/presentation | card, hero, banner |
| Vākya | Text content | paragraph, heading, label |
| Praveśa | Input/entry | form field, text input, select |
| Saṃvāda | Dialogue/conversation | modal, dialog, tooltip |
| Panthā | Navigation/wayfinding | nav, breadcrumb, tabs |
| (+ 15 more) | ... | ... |

### 3.2 Mudrās (Gesture Qualities)
15 qualities that define HOW an element behaves:

| Mudrā | Quality | Effect |
|-------|---------|--------|
| Stūpa | Stacking/layering | Vertical composition |
| Jāla | Grid/network | Spatial arrangement |
| Sthira | Stability/persistence | Fixed positioning, sticky elements |
| Cala | Movement/transition | Animation, state changes |
| Gupta | Hidden/revealed | Expandable, collapsible, progressive disclosure |
| (+ 10 more) | ... | ... |

### 3.3 Combination Logic
Any component is a Yantra + one or more Mudrās. A navigation menu is Panthā + Jāla (wayfinding in a grid). A collapsible FAQ is Vākya + Gupta (text content that hides/reveals). This semantic layer means the same component can be styled infinitely while maintaining its functional identity.

---

## 4. Rūpa (Appearance) Specification

10 token categories enabling complete visual customization through brand JSON files:

1. **Colors** — Semantic color roles (primary, danger, surface) not raw values
2. **Typography** — Font families, sizes, weights, line heights
3. **Spacing** — Consistent spacing scale (4px base unit)
4. **Sizing** — Component dimensions, breakpoints
5. **Borders** — Radius, width, style
6. **Shadows** — Elevation system
7. **Icons** — Icon library selection and sizing
8. **Motion** — Animation durations, easing curves
9. **Density** — Compact/comfortable/spacious modes
10. **Special treatments** — Brand-specific decorative elements

**The vision:** AI-generated designs where developers describe desired sites and drop brand JSON files into builds for complete visual transformation. Semantic structure constrains what's possible; aesthetic choices are unlimited within those constraints.

---

## 5. Technical Architecture

### 5.1 Compilation Pipeline
```
YAML Specification → Bodhi Compiler (TypeScript) → Target Output
```

**Targets:**
- WordPress themes (PHP + CSS)
- React components (JSX + Tailwind)
- Static HTML (HTML + CSS)

### 5.2 Diagnostic Layer
Semantic data attributes on every component enable runtime welfare measurement. The compiler adds `data-yantra`, `data-mudra`, and `data-metta-score` attributes that diagnostic tools can read without affecting performance. Single CSS class per component for rendering; data attributes for analysis.

### 5.3 Implementation Plan
20-task agent breakdown designed for AI-assisted building (Claude Code). Comprehensive schemas for YAML input format, component definitions, and brand JSON structure.

---

## 6. Engineering Framework Adaptations

### 6.1 FMEA (Failure Mode and Effects Analysis) → UI Failure Modes
Traditional FMEA identifies how physical systems fail. Bodhi adapts this for UI:
- **Severity:** How bad is it when the component fails? (Cosmetic → Annoying → Harmful → Catastrophic)
- **Occurrence:** How often does the failure mode happen?
- **Detection:** How quickly does the user notice?
- **Invisibility:** (Bodhi addition) Can the user even perceive this failure? Dark patterns score high here.

### 6.2 SIL (Safety Integrity Levels) → Mettā Integrity Levels
Component certification system:
- **MIL-1:** Informational components (headings, paragraphs). Low harm potential.
- **MIL-2:** Interactive components (buttons, forms). Moderate harm potential.
- **MIL-3:** Transactional components (payment, account changes). High harm potential.
- **MIL-4:** Irreversible components (deletion, publishing, financial commitment). Maximum scrutiny required.

### 6.3 NASA-TLX → Cognitive Load Measurement
Adapted subjective workload assessment for UI evaluation:
- Mental demand: How much thinking does this interface require?
- Temporal demand: How much time pressure does it create?
- Performance: How successfully can users accomplish their goals?
- Effort: How hard do they have to work?
- Frustration: How discouraged do they feel?

---

## 7. Key Design Decisions

- **Sanskrit terminology as pedagogical forcing function:** Using terms like "Duḥkha" for friction makes ethics unavoidable in the design workflow. You can't discuss components without engaging with welfare concepts.
- **Non-decomposability may be correct:** The resistance to collapsing all four axes into a single number might be a feature, not a bug. Different stakeholders need different axes.
- **Regret-minimization for Artha:** Solves the problem of users not knowing their own goals.
- **Dark pattern taxonomy as ground truth:** Building on Brignull's established work rather than inventing new categories.
- **Buddhist vocabulary as "aikido":** Redirects the psychological need for meaning-dense language toward liberation rather than control — the inverse of cult vocabulary that uses dense terminology for capture.

---

## 8. Connections

- **Bodhi → Upaya:** Mettā Math is the measurement algorithm; Upaya tools use it for decision logic
- **Bodhi → Effortless Yield:** Bodhi implements the theory that tools should serve users, not extract from them
- **Bodhi → Dyad:** Bodhi would be the UI layer for the Dyad platform
- **Bodhi → Seva:** Buddhist terminology in Bodhi functions as anti-capture language — the inverse of cult vocabulary
- **Mettā Math → Power Index:** The welfare measurement approach extends to personal decision-making tools

→ See: `04-UPAYA-TOOLKIT.md`, `08-DYAD-PLATFORM.md`, `10-PERSONAL-FRAMEWORKS.md`

---

*Source conversations span January 26 – February 8, 2026. Framework at specification stage — implementation designed but not yet built.*
