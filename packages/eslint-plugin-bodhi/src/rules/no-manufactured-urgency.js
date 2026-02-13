/**
 * bodhi/no-manufactured-urgency (M1)
 *
 * Detects patterns that manufacture urgency:
 *   - Countdown timer patterns (setTimeout/setInterval near urgency keywords)
 *   - Fixed-value countdown displays (elements with time-like content)
 *   - CSS classes suggesting countdown UI (countdown, timer, urgent, hurry)
 *
 * Regulatory basis:
 *   - DSA Art 25: No deceptive interfaces
 *   - FTC Act Section 5: Unfair or deceptive practices
 *
 * Default mode: Lenient
 */

import { formatViolation } from '../koans.js';

const RULE_ID = 'no-manufactured-urgency';

const URGENCY_KEYWORDS = [
  'hurry', 'limited', 'expires', 'only', 'left',
  'act now', 'ending soon', 'last chance', 'don\'t miss',
  'running out', 'almost gone', 'selling fast', 'flash sale',
  'deadline', 'urgent', 'rush',
];

const COUNTDOWN_CLASS_CLUES = [
  'countdown', 'timer', 'urgent', 'hurry',
  'time-left', 'time-remaining', 'expires',
  'ticking', 'clock',
];

// Matches patterns like "02:59:00", "4:59", "23:59:59"
const TIME_PATTERN = /\d{1,2}:\d{2}(:\d{2})?/;

function getJSXAttribute(node, attrName) {
  if (!node.attributes) return undefined;
  return node.attributes.find(
    (a) => a.type === 'JSXAttribute' && a.name && a.name.name === attrName,
  );
}

function getJSXAttributeValue(attr) {
  if (!attr) return undefined;
  if (attr.value === null) return true;
  if (attr.value.type === 'Literal') return attr.value.value;
  if (attr.value.type === 'JSXExpressionContainer') {
    const expr = attr.value.expression;
    if (expr.type === 'Literal') return expr.value;
    if (expr.type === 'TemplateLiteral') {
      return expr.quasis.map((q) => q.value.raw).join('');
    }
  }
  return undefined;
}

function getNodeText(openingElement) {
  const parent = openingElement.parent;
  if (!parent || !parent.children) return '';
  return parent.children
    .filter((child) => child.type === 'JSXText' || child.type === 'Literal')
    .map((child) => child.value || '')
    .join(' ')
    .trim();
}

function hasUrgencyKeywords(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return URGENCY_KEYWORDS.some((kw) => lower.includes(kw));
}

function hasCountdownClass(className) {
  if (!className) return false;
  const lower = className.toLowerCase();
  return COUNTDOWN_CLASS_CLUES.some((clue) => lower.includes(clue));
}

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect manufactured urgency patterns: fake countdowns, artificial scarcity',
      category: 'Design Ethics',
      recommended: true,
      url: 'https://github.com/yourusername/bodhi/blob/main/docs/rules/no-manufactured-urgency.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          mode: {
            type: 'string',
            enum: ['dogmatic', 'lenient'],
            default: 'lenient',
          },
          interfaceMode: {
            type: 'string',
            enum: ['poetic', 'semantic', 'raw'],
            default: 'poetic',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      countdownDisplay: '{{ message }}',
      urgencyClass: '{{ message }}',
      urgencyText: '{{ message }}',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const mode = options.mode || 'lenient';
    const interfaceMode = options.interfaceMode || 'poetic';

    return {
      JSXOpeningElement(node) {
        const tagName =
          node.name && node.name.type === 'JSXIdentifier'
            ? node.name.name
            : null;

        if (!tagName) return;

        // Check for bodhi-justify escape hatch in lenient mode
        const justification = getJSXAttribute(node, 'data-bodhi-justify');
        if (justification && mode === 'lenient') return;

        const className =
          getJSXAttributeValue(getJSXAttribute(node, 'className')) || '';
        const text = getNodeText(node);

        // ─── Detection 1: Countdown class names ──────────────
        if (hasCountdownClass(className)) {
          const message = formatViolation(RULE_ID, interfaceMode, {
            severity: mode,
            fix: 'Connect countdown to a verifiable external deadline, or remove it.',
          });

          context.report({
            node,
            messageId: 'urgencyClass',
            data: { message },
          });
          return;
        }

        // ─── Detection 2: Time-pattern content (e.g. "02:59:00") ─
        if (TIME_PATTERN.test(text)) {
          // In lenient mode, only flag if also has urgency keywords
          if (mode === 'lenient' && !hasUrgencyKeywords(text) && !hasCountdownClass(className)) return;

          const message = formatViolation(RULE_ID, interfaceMode, {
            severity: mode,
            fix: 'If this deadline is real, bind it to a data source. Static time displays suggest manufactured urgency.',
          });

          context.report({
            node,
            messageId: 'countdownDisplay',
            data: { message },
          });
          return;
        }

        // ─── Detection 3: Urgency text in span/div/p elements ────
        if (
          (tagName === 'span' || tagName === 'div' || tagName === 'p' || tagName === 'strong') &&
          hasUrgencyKeywords(text) &&
          hasCountdownClass(className)
        ) {
          const message = formatViolation(RULE_ID, interfaceMode, {
            severity: mode,
            fix: 'Remove manufactured urgency language or connect it to a real deadline.',
          });

          context.report({
            node,
            messageId: 'urgencyText',
            data: { message },
          });
        }
      },
    };
  },
};

export default rule;
