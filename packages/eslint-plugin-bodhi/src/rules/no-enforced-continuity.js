/**
 * bodhi/no-enforced-continuity (M9)
 *
 * Detects patterns that enforce continuity without informed consent:
 *   - Auto-renew checkboxes that are defaultChecked
 *   - Subscription/renewal terms inside collapsed elements
 *   - Cancel content with lower text hierarchy than subscribe content
 *
 * Regulatory basis:
 *   - FTC Negative Option Rule: Clear disclosure + affirmative consent
 *   - GDPR Art 7(3): Withdrawal as easy as giving consent
 *   - California ARL (Auto-Renewal Law)
 *
 * Default mode: Dogmatic
 */

import { formatViolation } from '../koans.js';

const RULE_ID = 'no-enforced-continuity';

const AUTO_RENEW_KEYWORDS = [
  'auto-renew', 'autorenew', 'automatic renewal', 'recurring',
  'auto-renewal', 'autorenewal', 'automatically renew',
  'recurring billing', 'recurring charge', 'continuous',
  'subscription will renew', 'will be charged',
];

const CANCEL_KEYWORDS = [
  'cancel', 'cancellation', 'unsubscribe', 'opt out',
  'stop subscription', 'end subscription', 'terminate',
];

const SUBSCRIBE_KEYWORDS = [
  'subscribe', 'sign up', 'start trial', 'begin subscription',
  'activate', 'join', 'get started', 'upgrade',
];

// Elements that hide/collapse content
const COLLAPSED_ELEMENTS = [
  'details', 'Details', 'summary', 'Summary',
];

const COLLAPSED_CLASS_CLUES = [
  'collapse', 'collapsed', 'accordion', 'tooltip',
  'hidden', 'display-none', 'd-none', 'invisible',
  'sr-only', 'screen-reader-only', 'visually-hidden',
  'expandable', 'toggle-content',
];

// Lower hierarchy text elements
const SMALL_TEXT_CLUES = [
  'text-xs', 'text-sm', 'fine-print', 'small-print',
  'footnote', 'disclaimer', 'terms-text',
];

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

function gatherContextClues(node) {
  const clues = [];
  for (const attrName of ['id', 'name', 'className', 'aria-label', 'data-testid']) {
    const attr = getJSXAttribute(node, attrName);
    if (attr) {
      const val = getJSXAttributeValue(attr);
      if (typeof val === 'string') clues.push(val);
    }
  }
  return clues;
}

function hasAutoRenewContext(texts) {
  return texts.some((text) => {
    if (!text) return false;
    const lower = text.toLowerCase();
    return AUTO_RENEW_KEYWORDS.some((kw) => lower.includes(kw));
  });
}

function hasCancelContext(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return CANCEL_KEYWORDS.some((kw) => lower.includes(kw));
}

function hasCollapsedClass(className) {
  if (!className) return false;
  const lower = className.toLowerCase();
  return COLLAPSED_CLASS_CLUES.some((clue) => lower.includes(clue));
}

function hasSmallTextClass(className) {
  if (!className) return false;
  const lower = className.toLowerCase();
  return SMALL_TEXT_CLUES.some((clue) => lower.includes(clue));
}

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect enforced continuity: auto-renewal defaults, buried cancellation terms',
      category: 'Design Ethics',
      recommended: true,
      url: 'https://github.com/yourusername/bodhi/blob/main/docs/rules/no-enforced-continuity.md',
    },
    hasSuggestions: true,
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
      autoRenewDefault: '{{ message }}',
      buriedTerms: '{{ message }}',
      suppressedCancel: '{{ message }}',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const mode = options.mode || 'dogmatic';
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
        const clues = gatherContextClues(node);

        // ─── Detection 1: Auto-renew defaultChecked ─────────
        if (tagName === 'input' || tagName === 'Input') {
          const typeAttr = getJSXAttribute(node, 'type');
          const typeVal = getJSXAttributeValue(typeAttr);

          if (typeVal === 'checkbox') {
            const defaultCheckedAttr = getJSXAttribute(node, 'defaultChecked');
            const checkedAttr = getJSXAttribute(node, 'checked');
            const defaultCheckedVal = getJSXAttributeValue(defaultCheckedAttr);
            const checkedVal = getJSXAttributeValue(checkedAttr);

            const isPreChecked =
              defaultCheckedVal === true || checkedVal === true;

            if (isPreChecked) {
              const allContext = [...clues, text];
              if (hasAutoRenewContext(allContext)) {
                const message = formatViolation(RULE_ID, interfaceMode, {
                  severity: mode,
                  fix: 'Remove defaultChecked from auto-renewal checkbox. Recurring charges require explicit opt-in.',
                });

                context.report({
                  node,
                  messageId: 'autoRenewDefault',
                  data: { message },
                  ...(defaultCheckedAttr && {
                    suggest: [
                      {
                        desc: 'Remove defaultChecked to require explicit auto-renewal consent',
                        fix(fixer) {
                          return fixer.remove(defaultCheckedAttr);
                        },
                      },
                    ],
                  }),
                });
                return;
              }
            }
          }
        }

        // ─── Detection 2: Renewal terms in collapsed elements ─
        if (COLLAPSED_ELEMENTS.includes(tagName) || hasCollapsedClass(className)) {
          if (hasAutoRenewContext([text]) || hasCancelContext(text)) {
            const message = formatViolation(RULE_ID, interfaceMode, {
              severity: mode,
              fix: 'Display renewal and cancellation terms prominently. Do not hide them in collapsed or tooltip content.',
            });

            context.report({
              node,
              messageId: 'buriedTerms',
              data: { message },
            });
            return;
          }
        }

        // ─── Detection 3: Cancel text with suppressed styling ─
        if (hasCancelContext(text) && hasSmallTextClass(className)) {
          const message = formatViolation(RULE_ID, interfaceMode, {
            severity: mode,
            fix: 'Give cancellation information equal visual hierarchy to subscription information.',
          });

          context.report({
            node,
            messageId: 'suppressedCancel',
            data: { message },
          });
        }
      },
    };
  },
};

export default rule;
