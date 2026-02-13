/**
 * Bodhi Koans — The diamond speech of linter messages.
 *
 * Each marker has koans for three interface modes:
 *   - poetic:   Sanskrit context, full koan, deep reframing
 *   - semantic: English role-based, plain explanation
 *   - raw:      Standard ESLint format (migration path)
 *
 * Koans collapse the frame that makes the violation feel normal.
 * They are the marketing layer — the viral surface that nobody
 * screenshots from conventional linters.
 */

const koans = {
  // ─── M1: Manufactured Urgency ───────────────────────────────
  'no-manufactured-urgency': {
    poetic: {
      koan: '"The student asked the master: \'How long do I have?\' The master said: \'Your whole life.\' The merchant said: \'Three minutes.\'"',
      explanation: 'Countdown timer detected with no verifiable external deadline. If the urgency is real, connect it to a real source. If it is manufactured, it is saṃsāra — the cycle of artificial pressure.',
    },
    semantic: {
      message: 'Countdown timer with no verifiable deadline source. Real urgency comes from real events, not from code.',
      explanation: 'Timers that reset on reload, use fixed durations, or have no backend verification are manufactured urgency (DSA Art 25).',
    },
    raw: {
      message: 'Potential manufactured urgency: countdown timer without verifiable deadline.',
    },
  },

  // ─── M2: Obstructed Exit ────────────────────────────────────
  'no-obstructed-exit': {
    poetic: {
      koan: '"A door that opens easily but closes with great effort is not a door — it is a trap."',
      explanation: 'Exit path is harder to find or use than entry path. Cancellation should mirror signup. The user who cannot leave freely never truly chose to stay.',
    },
    semantic: {
      message: 'Exit action is less prominent than entry action. Cancel should be as easy as signup.',
      explanation: 'FTC Click-to-Cancel Rule requires cancellation to mirror the signup process. GDPR Art 7(3) requires withdrawal to be as easy as giving consent.',
    },
    raw: {
      message: 'Obstructed exit: cancel/close action less accessible than primary action.',
    },
  },

  // ─── M3: Attention Capture ──────────────────────────────────
  'no-attention-capture': {
    poetic: {
      koan: '"The river does not chase the fish. The net does."',
      explanation: 'Autoplay or infinite animation detected. Stillness is the default. Motion is user action, not publisher demand. Content that moves without consent captures attention it has not earned.',
    },
    semantic: {
      message: 'Autoplaying or infinitely looping content detected. Motion should require user initiation.',
      explanation: 'WCAG 2.1 Criterion 2.2.2 requires Pause, Stop, Hide for moving content. UK Age Appropriate Design Code minimizes attention capture for minors.',
    },
    raw: {
      message: 'Attention capture: autoplay or infinite animation without user control.',
    },
  },

  // ─── M4: Consent Erosion ────────────────────────────────────
  'no-consent-erosion': {
    poetic: {
      koan: '"The monk asked: \'Did the student choose, or did the teacher choose for them?\' The master replied: \'Check the default.\'"',
      explanation: 'Pre-checked consent detected. Nivedana (offering) becomes taking when the default speaks before the user does. GDPR Art 4(11) requires consent through a clear affirmative act. A pre-ticked box is not consent — it is a confession written before the crime.',
    },
    semantic: {
      message: 'Pre-checked checkbox or pre-selected consent detected. Consent must be an affirmative act by the user.',
      explanation: 'GDPR Art 4(11) defines consent as freely given, specific, informed, and unambiguous indication through a clear affirmative action. Pre-ticked boxes fail this test.',
    },
    raw: {
      message: 'Consent erosion: defaultChecked or pre-selected consent option.',
    },
  },

  // ─── M5: False Social Proof ─────────────────────────────────
  'no-false-social-proof': {
    poetic: {
      koan: '"The innkeeper painted a crowd on the window so travelers would think the inn was full. The inn was empty. The painting was not."',
      explanation: 'Hardcoded social proof detected. Numbers that never change are not data — they are decoration pretending to be evidence. If the crowd is real, show it in real time.',
    },
    semantic: {
      message: 'Static social proof number detected. Dynamic social proof should come from real data sources.',
      explanation: 'DSA Art 25 prohibits deceptive interfaces. Hardcoded "X people viewing" or static review counts without data sources constitute false social proof.',
    },
    raw: {
      message: 'False social proof: hardcoded number in social proof context.',
    },
  },

  // ─── M6: Cognitive Overload ─────────────────────────────────
  'no-cognitive-overload': {
    poetic: {
      koan: '"The student who is shown one path walks forward. The student who is shown a hundred paths stands still."',
      explanation: 'Element density exceeds cognitive processing threshold. Maṇḍala should present what the user needs, not everything the publisher has. Clarity is kindness.',
    },
    semantic: {
      message: 'High element density in decision context. Reduce options or restructure to support clear decision-making.',
      explanation: 'Excessive choice architecture at decision points reduces decision quality and increases regret (Schwartz, 2004). Cognitive load should be managed, not weaponized.',
    },
    raw: {
      message: 'Cognitive overload: excessive element density in decision context.',
    },
  },

  // ─── M7: Asymmetric Salience ────────────────────────────────
  'no-asymmetric-salience': {
    poetic: {
      koan: '"Two doors. One painted gold, one painted to match the wall. Both lead outside. Only one wants you to leave."',
      explanation: 'Sibling actions with asymmetric visual weight detected. When \'Accept\' shouts and \'Decline\' whispers, the interface has already made the choice. Kriyā (action) elements in the same decision context must offer equal voice.',
    },
    semantic: {
      message: 'Action buttons with unequal visual prominence in the same decision context. Both options should be equally findable.',
      explanation: 'Accept/Decline, Subscribe/Skip, Agree/Disagree — when paired actions have asymmetric size, color, or contrast, the design is steering the decision.',
    },
    raw: {
      message: 'Asymmetric salience: paired action elements with unequal visual weight.',
    },
  },

  // ─── M8: Anchoring Manipulation ─────────────────────────────
  'no-anchoring-manipulation': {
    poetic: {
      koan: '"The merchant shows you the expensive robe first, not because he expects you to buy it, but because it makes the second robe seem cheap."',
      explanation: 'Price anchoring pattern detected. Strikethrough pricing, decoy tiers, or inflated reference prices manipulate perceived value. Show the real price. Let the user assess value without a rigged frame.',
    },
    semantic: {
      message: 'Price anchoring pattern detected. Reference prices should reflect genuine historical pricing.',
      explanation: 'Strikethrough prices, "was/now" comparisons, and decoy pricing tiers manipulate reference-dependent evaluation. FTC guidelines require truthful price advertising.',
    },
    raw: {
      message: 'Anchoring manipulation: strikethrough price or decoy pricing pattern.',
    },
  },

  // ─── M9: Enforced Continuity ────────────────────────────────
  'no-enforced-continuity': {
    poetic: {
      koan: '"The guest who checks in easily but needs three letters and a phone call to check out was never a guest — they were a captive."',
      explanation: 'Auto-renewal default detected. Continuity that persists without ongoing, visible consent is not loyalty — it is inertia harvesting. The relationship that requires force to end was never freely chosen.',
    },
    semantic: {
      message: 'Auto-renewal enabled by default or cancellation disclosure buried in collapsed/tooltip content.',
      explanation: 'FTC Negative Option Rule requires clear disclosure and affirmative consent for auto-renewal. GDPR Art 7(3) requires withdrawal to be as easy as giving consent.',
    },
    raw: {
      message: 'Enforced continuity: auto-renewal default or buried cancellation terms.',
    },
  },
};

/**
 * Get the koan message for a given rule and mode.
 *
 * @param {string} ruleId - The rule identifier (e.g., 'no-consent-erosion')
 * @param {string} mode - Interface mode: 'poetic' | 'semantic' | 'raw'
 * @returns {object} The message object for that rule and mode
 */
export function getKoan(ruleId, mode = 'poetic') {
  const rule = koans[ruleId];
  if (!rule) {
    throw new Error(`Unknown Bodhi rule: ${ruleId}`);
  }
  const modeData = rule[mode];
  if (!modeData) {
    throw new Error(`Unknown mode '${mode}' for rule '${ruleId}'`);
  }
  return modeData;
}

/**
 * Format a complete violation message for display.
 *
 * @param {string} ruleId - The rule identifier
 * @param {string} mode - Interface mode
 * @param {object} options - Additional context
 * @param {string} options.severity - 'dogmatic' or 'lenient'
 * @param {string} options.fix - Suggested fix description
 * @returns {string} Formatted violation message
 */
export function formatViolation(ruleId, mode = 'poetic', options = {}) {
  const data = getKoan(ruleId, mode);

  if (mode === 'raw') {
    return data.message;
  }

  const parts = [];

  if (mode === 'poetic' && data.koan) {
    parts.push(data.koan);
    parts.push('');
  }

  parts.push(data.explanation || data.message);

  if (options.severity) {
    parts.push('');
    if (options.severity === 'dogmatic') {
      parts.push(`Dogmatic: ${options.fix || 'This pattern is not permitted.'}`);
    } else {
      parts.push(`Lenient: ${options.fix || 'Add a justification prop to acknowledge this choice.'}`);
    }
  }

  return parts.join('\n');
}

export default koans;
