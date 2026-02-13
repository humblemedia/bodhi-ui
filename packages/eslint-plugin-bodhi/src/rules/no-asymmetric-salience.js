/**
 * bodhi/no-asymmetric-salience (M7)
 *
 * Detects paired actions with unequal visual weight:
 *   - Accept/Decline buttons where accept is visually dominant
 *   - Subscribe/Skip where skip is styled as plain text
 *   - Any paired decision where one option is visually suppressed
 *
 * Regulatory basis:
 *   - DSA Art 25: No deceptive interfaces
 *   - CCPA/CPRA: No dark patterns subverting consumer choice
 *
 * Default mode: Dogmatic
 *
 * Note: Full salience analysis requires render-time computation (Layer 3).
 * This rule catches the most common static patterns — class-based
 * asymmetry, size differentials, and color clues in JSX.
 */

import { formatViolation } from '../koans.js';

const RULE_ID = 'no-asymmetric-salience';

// Classes that suggest high visual prominence
const HIGH_SALIENCE_CLUES = [
  'btn-primary', 'btn-success', 'btn-cta', 'primary', 'cta',
  'bg-blue', 'bg-green', 'bg-brand', 'bg-primary',
  'text-white', 'text-lg', 'text-xl', 'text-2xl',
  'font-bold', 'font-semibold',
  'px-6', 'px-8', 'py-3', 'py-4',
  'rounded-full', 'rounded-lg',
  'shadow', 'shadow-lg', 'shadow-md',
  'w-full',
];

// Classes that suggest low visual prominence (suppression)
const LOW_SALIENCE_CLUES = [
  'btn-link', 'btn-text', 'btn-ghost', 'btn-outline', 'btn-subtle',
  'text-sm', 'text-xs', 'text-gray', 'text-muted', 'text-slate',
  'underline', 'link', 'secondary', 'ghost', 'subtle', 'quiet',
  'opacity-50', 'opacity-60', 'opacity-70',
  'hidden', 'sr-only', 'invisible',
];

// Positive action keywords
const POSITIVE_KEYWORDS = [
  'accept', 'agree', 'confirm', 'subscribe', 'continue',
  'yes', 'ok', 'okay', 'submit', 'sign up', 'get started',
  'join', 'buy', 'purchase', 'add to cart', 'checkout',
  'enable', 'allow', 'activate', 'upgrade',
];

// Negative/neutral action keywords
const NEGATIVE_KEYWORDS = [
  'decline', 'reject', 'cancel', 'skip', 'no thanks',
  'not now', 'maybe later', 'dismiss', 'close',
  'no', 'deny', 'disable', 'block', 'opt out',
  'unsubscribe', 'go back', 'nevermind',
];

function textMatchesKeywords(text, keywords) {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  return keywords.some((kw) => lower.includes(kw));
}

function countClues(className, clueList) {
  if (!className) return 0;
  const lower = className.toLowerCase();
  return clueList.filter((clue) => lower.includes(clue)).length;
}

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

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect asymmetric salience between paired action elements',
      category: 'Design Ethics',
      recommended: true,
      url: 'https://github.com/yourusername/bodhi/blob/main/docs/rules/no-asymmetric-salience.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          mode: {
            type: 'string',
            enum: ['dogmatic', 'lenient'],
            default: 'dogmatic',
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
      asymmetricPair: '{{ message }}',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const mode = options.mode || 'dogmatic';
    const interfaceMode = options.interfaceMode || 'poetic';

    // Collect button-like elements per parent container
    // After traversal, analyze pairs within the same container
    const containerButtons = new Map();

    return {
      JSXOpeningElement(node) {
        const tagName =
          node.name && node.name.type === 'JSXIdentifier'
            ? node.name.name
            : null;

        if (!tagName) return;

        // Only analyze button-like elements
        const isButton =
          tagName === 'button' ||
          tagName === 'Button' ||
          tagName === 'a' ||
          tagName === 'Link';

        const roleAttr = getJSXAttribute(node, 'role');
        const roleVal = getJSXAttributeValue(roleAttr);
        const hasButtonRole = roleVal === 'button';

        if (!isButton && !hasButtonRole) return;

        const text = getNodeText(node);
        const ariaLabel =
          getJSXAttributeValue(getJSXAttribute(node, 'aria-label')) || '';
        const combinedText = `${text} ${ariaLabel}`.trim();

        const isPositive = textMatchesKeywords(combinedText, POSITIVE_KEYWORDS);
        const isNegative = textMatchesKeywords(combinedText, NEGATIVE_KEYWORDS);

        // Only track if it's clearly a positive or negative action
        if (!isPositive && !isNegative) return;

        const className =
          getJSXAttributeValue(getJSXAttribute(node, 'className')) || '';
        const highScore = countClues(className, HIGH_SALIENCE_CLUES);
        const lowScore = countClues(className, LOW_SALIENCE_CLUES);

        // Use the parent JSXElement as the container key
        const container = node.parent && node.parent.parent;
        if (!container) return;

        const key = `${container.start || container.range?.[0] || 'root'}`;

        if (!containerButtons.has(key)) {
          containerButtons.set(key, []);
        }

        containerButtons.get(key).push({
          node,
          text: combinedText,
          isPositive,
          isNegative,
          className,
          highScore,
          lowScore,
          salienceScore: highScore - lowScore,
        });
      },

      'Program:exit'() {
        // Analyze each container for asymmetric pairs
        for (const [, buttons] of containerButtons) {
          const positives = buttons.filter((b) => b.isPositive);
          const negatives = buttons.filter((b) => b.isNegative);

          // Need at least one of each for a pair
          if (positives.length === 0 || negatives.length === 0) continue;

          for (const pos of positives) {
            for (const neg of negatives) {
              const salienceDiff = pos.salienceScore - neg.salienceScore;

              // Threshold: if positive action has 2+ more salience clues
              // than negative action, flag it
              if (salienceDiff >= 2) {
                const message = formatViolation(RULE_ID, interfaceMode, {
                  severity: mode,
                  fix: `Give "${neg.text.trim()}" equal visual weight to "${pos.text.trim()}".`,
                });

                context.report({
                  node: neg.node,
                  messageId: 'asymmetricPair',
                  data: { message },
                });
              }
            }
          }
        }
      },
    };
  },
};

export default rule;
