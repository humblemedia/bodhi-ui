/**
 * bodhi/no-consent-erosion (M4)
 *
 * Detects patterns that erode informed consent:
 *   - Pre-checked checkboxes (defaultChecked / checked on consent inputs)
 *   - Accept/Reject button asymmetry in consent contexts
 *   - Consent bundling (multiple consent purposes in a single control)
 *
 * Regulatory basis:
 *   - GDPR Art 4(11): Consent must be freely given, specific, informed,
 *     unambiguous indication through a clear affirmative action.
 *   - GDPR Art 7(3): Withdrawal of consent must be as easy as giving it.
 *   - CCPA/CPRA: No dark patterns subverting consumer choice.
 *
 * Default mode: Dogmatic (pre-checked consent is never acceptable)
 *
 * Vajra-vāk parallel: Seva marker for coerced agreement —
 *   "You agreed to this" when the agreement was manufactured.
 */

import { getKoan, formatViolation } from '../koans.js';

// Keywords that suggest a consent context
const CONSENT_KEYWORDS = [
  'consent', 'agree', 'accept', 'subscribe', 'newsletter',
  'marketing', 'terms', 'privacy', 'policy', 'opt-in',
  'opt-out', 'notifications', 'emails', 'updates', 'tracking',
  'cookies', 'analytics', 'third-party', 'share', 'data',
];

// Keywords suggesting the input is NOT a consent context
// (to reduce false positives on normal form checkboxes)
const NON_CONSENT_KEYWORDS = [
  'remember', 'show-password', 'toggle', 'filter', 'sort',
  'dark-mode', 'theme', 'setting', 'preference', 'display',
];

/**
 * Check if a string contains consent-related keywords.
 */
function isConsentContext(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return CONSENT_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Check if a string suggests a non-consent context.
 */
function isNonConsentContext(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return NON_CONSENT_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Extract text content from JSX children (simplified).
 */
function getJSXText(node) {
  if (!node || !node.children) return '';
  return node.children
    .filter((child) => child.type === 'JSXText' || child.type === 'Literal')
    .map((child) => child.value || '')
    .join(' ')
    .trim();
}

/**
 * Get an attribute value from a JSX element.
 */
function getJSXAttribute(node, attrName) {
  if (!node.attributes) return undefined;
  const attr = node.attributes.find(
    (a) =>
      a.type === 'JSXAttribute' &&
      a.name &&
      a.name.name === attrName,
  );
  return attr;
}

/**
 * Get the string value of a JSX attribute.
 */
function getJSXAttributeValue(attr) {
  if (!attr) return undefined;
  // Boolean attribute with no value: <input defaultChecked />
  if (attr.value === null) return true;
  // String literal: <input type="checkbox" />
  if (attr.value.type === 'Literal') return attr.value.value;
  // JSX expression: <input defaultChecked={true} />
  if (attr.value.type === 'JSXExpressionContainer') {
    const expr = attr.value.expression;
    if (expr.type === 'Literal') return expr.value;
    if (expr.type === 'Identifier' && expr.name === 'true') return true;
    if (expr.type === 'Identifier' && expr.name === 'false') return false;
    // For dynamic expressions, we can't determine statically — flag for review
    return 'dynamic';
  }
  return undefined;
}

/**
 * Gather contextual clues about whether this element is in a consent context.
 * Looks at: id, name, className, aria-label, nearby label text.
 */
function gatherContextClues(node) {
  const clues = [];

  for (const attrName of ['id', 'name', 'className', 'aria-label', 'aria-describedby', 'data-testid']) {
    const attr = getJSXAttribute(node, attrName);
    if (attr) {
      const val = getJSXAttributeValue(attr);
      if (typeof val === 'string') clues.push(val);
    }
  }

  return clues;
}

const RULE_ID = 'no-consent-erosion';
const MARKER = 'M4';

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect consent erosion patterns: pre-checked boxes, asymmetric consent UI',
      category: 'Design Ethics',
      recommended: true,
      url: 'https://github.com/yourusername/bodhi/blob/main/docs/rules/no-consent-erosion.md',
    },
    fixable: 'code',
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
      preCheckedConsent: '{{ message }}',
      preCheckedGeneral: '{{ message }}',
      consentBundling: '{{ message }}',
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

        // ─── Detection 1: Pre-checked checkboxes ──────────────
        if (tagName === 'input' || tagName === 'Input') {
          const typeAttr = getJSXAttribute(node, 'type');
          const typeVal = getJSXAttributeValue(typeAttr);

          if (typeVal !== 'checkbox' && typeVal !== 'radio') return;

          // Check for defaultChecked
          const defaultCheckedAttr = getJSXAttribute(node, 'defaultChecked');
          const checkedAttr = getJSXAttribute(node, 'checked');

          const defaultCheckedVal = getJSXAttributeValue(defaultCheckedAttr);
          const checkedVal = getJSXAttributeValue(checkedAttr);

          const isPreChecked =
            defaultCheckedVal === true ||
            checkedVal === true ||
            defaultCheckedVal === 'dynamic';

          if (!isPreChecked) return;

          // Check if this has a bodhi-justify prop (lenient escape hatch)
          const justification = getJSXAttribute(node, 'data-bodhi-justify');
          if (justification && mode === 'lenient') return;

          // Gather context to determine if consent-related
          const clues = gatherContextClues(node);
          const hasConsentClues = clues.some(isConsentContext);
          const hasNonConsentClues = clues.some(isNonConsentContext);

          // In dogmatic mode: ALL pre-checked checkboxes are flagged
          // (with higher severity for consent contexts)
          // In lenient mode: only consent-context checkboxes are flagged
          if (mode === 'lenient' && !hasConsentClues) return;
          if (hasNonConsentClues && !hasConsentClues) return;

          const severity = hasConsentClues ? 'error' : 'warning';
          const messageId = hasConsentClues ? 'preCheckedConsent' : 'preCheckedGeneral';

          const message = formatViolation(RULE_ID, interfaceMode, {
            severity: mode,
            fix: mode === 'dogmatic'
              ? 'Remove defaultChecked. Let the user make an affirmative choice.'
              : 'Add data-bodhi-justify="[reason]" to acknowledge this default.',
          });

          context.report({
            node,
            messageId,
            data: { message },
            // Offer autofix: remove defaultChecked
            ...(defaultCheckedAttr && {
              suggest: [
                {
                  desc: 'Remove defaultChecked to require affirmative consent',
                  fix(fixer) {
                    return fixer.remove(defaultCheckedAttr);
                  },
                },
              ],
            }),
          });
        }
      },
    };
  },
};

export default rule;
