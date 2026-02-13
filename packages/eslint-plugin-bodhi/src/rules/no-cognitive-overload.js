/**
 * bodhi/no-cognitive-overload (M6)
 *
 * Detects patterns that weaponize cognitive load:
 *   - More than 5 interactive elements as direct children of a decision container
 *   - More than 3 CTA-style buttons in the same container
 *   - Nested decision contexts (form inside modal inside dialog)
 *
 * Regulatory basis:
 *   - DSA Art 25: No deceptive interfaces
 *   - Schwartz (2004): The Paradox of Choice
 *
 * Default mode: Lenient
 */

import { formatViolation } from '../koans.js';

const RULE_ID = 'no-cognitive-overload';

const INTERACTIVE_ELEMENTS = [
  'button', 'Button', 'a', 'Link',
  'input', 'Input', 'select', 'Select',
  'textarea', 'Textarea',
];

const CTA_CLASS_CLUES = [
  'btn-primary', 'btn-cta', 'cta', 'btn-success',
  'btn-action', 'primary', 'bg-brand',
];

const DECISION_CONTEXT_ELEMENTS = [
  'form', 'Form', 'dialog', 'Dialog', 'Modal',
];

const DECISION_CONTEXT_ROLES = [
  'dialog', 'alertdialog', 'form',
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

function isDecisionContext(node) {
  const tagName =
    node.name && node.name.type === 'JSXIdentifier'
      ? node.name.name
      : null;

  if (!tagName) return false;

  if (DECISION_CONTEXT_ELEMENTS.includes(tagName)) return true;

  const roleAttr = getJSXAttribute(node, 'role');
  const roleVal = getJSXAttributeValue(roleAttr);
  if (roleVal && DECISION_CONTEXT_ROLES.includes(roleVal)) return true;

  // Check className for modal/checkout clues
  const className =
    getJSXAttributeValue(getJSXAttribute(node, 'className')) || '';
  const lower = className.toLowerCase();
  return ['modal', 'checkout', 'decision', 'wizard', 'step'].some(
    (clue) => lower.includes(clue),
  );
}

function hasCTAClass(className) {
  if (!className) return false;
  const lower = className.toLowerCase();
  return CTA_CLASS_CLUES.some((clue) => lower.includes(clue));
}

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect cognitive overload: excessive options at decision points',
      category: 'Design Ethics',
      recommended: true,
      url: 'https://github.com/yourusername/bodhi/blob/main/docs/rules/no-cognitive-overload.md',
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
      excessiveInteractive: '{{ message }}',
      excessiveCTA: '{{ message }}',
      nestedDecision: '{{ message }}',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const mode = options.mode || 'lenient';
    const interfaceMode = options.interfaceMode || 'poetic';

    // Track nested decision contexts
    const decisionStack = [];

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

        if (!isDecisionContext(node)) return;

        // ─── Detection 1: Nested decision contexts ───────────
        if (decisionStack.length >= 2) {
          const message = formatViolation(RULE_ID, interfaceMode, {
            severity: mode,
            fix: 'Flatten nested decision contexts. A form inside a modal inside a dialog overwhelms the user.',
          });

          context.report({
            node,
            messageId: 'nestedDecision',
            data: { message },
          });
        }

        decisionStack.push(node);

        // Analyze direct children for interactive element density
        const parent = node.parent;
        if (!parent || !parent.children) return;

        let interactiveCount = 0;
        let ctaCount = 0;

        for (const child of parent.children) {
          if (child.type !== 'JSXElement') continue;
          const childOpening = child.openingElement;
          if (!childOpening) continue;

          const childTag =
            childOpening.name && childOpening.name.type === 'JSXIdentifier'
              ? childOpening.name.name
              : null;

          if (!childTag) continue;

          if (INTERACTIVE_ELEMENTS.includes(childTag)) {
            interactiveCount++;
          }

          // Check if this is a CTA button
          if (childTag === 'button' || childTag === 'Button') {
            const childClassName =
              getJSXAttributeValue(getJSXAttribute(childOpening, 'className')) || '';
            if (hasCTAClass(childClassName)) {
              ctaCount++;
            }
          }
        }

        // ─── Detection 2: Too many interactive elements ──────
        if (interactiveCount > 5) {
          const message = formatViolation(RULE_ID, interfaceMode, {
            severity: mode,
            fix: `Reduce interactive elements (found ${interactiveCount}). Group related actions or use progressive disclosure.`,
          });

          context.report({
            node,
            messageId: 'excessiveInteractive',
            data: { message },
          });
        }

        // ─── Detection 3: Too many CTA buttons ──────────────
        if (ctaCount > 3) {
          const message = formatViolation(RULE_ID, interfaceMode, {
            severity: mode,
            fix: `Too many CTA buttons (found ${ctaCount}). One clear primary action per context.`,
          });

          context.report({
            node,
            messageId: 'excessiveCTA',
            data: { message },
          });
        }
      },

      JSXClosingElement(node) {
        const tagName =
          node.name && node.name.type === 'JSXIdentifier'
            ? node.name.name
            : null;

        if (decisionStack.length > 0) {
          const current = decisionStack[decisionStack.length - 1];
          const currentTag =
            current.name && current.name.type === 'JSXIdentifier'
              ? current.name.name
              : null;

          if (tagName === currentTag) {
            decisionStack.pop();
          }
        }
      },
    };
  },
};

export default rule;
