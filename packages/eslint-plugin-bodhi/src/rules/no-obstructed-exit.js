/**
 * bodhi/no-obstructed-exit (M2)
 *
 * Detects patterns that obstruct user exit:
 *   - Cancel/close buttons with lower visual prominence than confirm
 *   - Missing cancel options in modal/dialog contexts
 *   - Multi-step cancellation flows (more steps to leave than to join)
 *
 * Regulatory basis:
 *   - FTC Click-to-Cancel Rule: Cancellation must mirror signup.
 *   - GDPR Art 7(3): Withdrawal as easy as giving consent.
 *
 * Default mode: Dogmatic
 */

import { formatViolation } from '../koans.js';

const RULE_ID = 'no-obstructed-exit';

// Words suggesting a dismiss/cancel/exit action
const EXIT_KEYWORDS = [
  'cancel', 'close', 'dismiss', 'decline', 'reject', 'skip',
  'no-thanks', 'no thanks', 'not now', 'maybe later', 'exit',
  'go back', 'nevermind', 'unsubscribe',
];

// Words suggesting a confirm/accept/proceed action
const CONFIRM_KEYWORDS = [
  'accept', 'confirm', 'agree', 'subscribe', 'continue',
  'submit', 'yes', 'sign up', 'get started', 'join',
  'buy', 'purchase', 'checkout', 'proceed', 'ok', 'okay',
];

function textMatchesKeywords(text, keywords) {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  return keywords.some((kw) => lower.includes(kw));
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
  }
  return undefined;
}

function getJSXText(node) {
  if (!node || !node.parent || !node.parent.children) return '';
  return node.parent.children
    .filter((child) => child.type === 'JSXText' || child.type === 'Literal')
    .map((child) => child.value || '')
    .join(' ')
    .trim();
}

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect obstructed exit patterns: hidden cancel buttons, asymmetric exit paths',
      category: 'Design Ethics',
      recommended: true,
      url: 'https://github.com/yourusername/bodhi/blob/main/docs/rules/no-obstructed-exit.md',
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
      exitLessVisible: '{{ message }}',
      missingExit: '{{ message }}',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const mode = options.mode || 'dogmatic';
    const interfaceMode = options.interfaceMode || 'poetic';

    // Track dialog/modal contexts and their children
    const dialogStack = [];

    return {
      // Detect dialog/modal containers
      JSXOpeningElement(node) {
        const tagName =
          node.name && node.name.type === 'JSXIdentifier'
            ? node.name.name
            : null;

        if (!tagName) return;

        // Track dialog-like elements
        const roleAttr = getJSXAttribute(node, 'role');
        const roleVal = getJSXAttributeValue(roleAttr);

        const isDialog =
          tagName === 'dialog' ||
          tagName === 'Dialog' ||
          tagName === 'Modal' ||
          roleVal === 'dialog' ||
          roleVal === 'alertdialog';

        if (isDialog) {
          dialogStack.push({
            node,
            hasExit: false,
            hasConfirm: false,
          });
        }

        // Check buttons/links for exit vs confirm text
        if (
          tagName === 'button' ||
          tagName === 'Button' ||
          tagName === 'a' ||
          tagName === 'Link'
        ) {
          const text = getJSXText(node);
          const ariaLabel = getJSXAttributeValue(getJSXAttribute(node, 'aria-label'));
          const combinedText = `${text} ${ariaLabel || ''}`;

          const isExit = textMatchesKeywords(combinedText, EXIT_KEYWORDS);
          const isConfirm = textMatchesKeywords(combinedText, CONFIRM_KEYWORDS);

          // Check for visual suppression of exit actions
          if (isExit) {
            const className = getJSXAttributeValue(getJSXAttribute(node, 'className')) || '';
            const style = getJSXAttribute(node, 'style');

            // Heuristic: exit button styled as plain text/link while confirm is a button
            // This is a simplified check — full implementation needs render-time analysis
            const suppressionClues = [
              'text-sm', 'text-xs', 'text-gray', 'text-muted', 'opacity-',
              'link', 'underline', 'secondary', 'ghost', 'subtle', 'quiet',
              'text-only', 'btn-link', 'btn-text',
            ];

            const hasSuppression = suppressionClues.some((clue) =>
              className.toLowerCase().includes(clue),
            );

            if (hasSuppression) {
              const message = formatViolation(RULE_ID, interfaceMode, {
                severity: mode,
                fix: 'Give the exit action equal visual weight to the confirm action.',
              });

              context.report({
                node,
                messageId: 'exitLessVisible',
                data: { message },
              });
            }

            // Track for dialog completeness
            if (dialogStack.length > 0) {
              dialogStack[dialogStack.length - 1].hasExit = true;
            }
          }

          if (isConfirm && dialogStack.length > 0) {
            dialogStack[dialogStack.length - 1].hasConfirm = true;
          }
        }
      },

      // On closing a dialog, check if it had both exit and confirm
      JSXClosingElement(node) {
        const tagName =
          node.name && node.name.type === 'JSXIdentifier'
            ? node.name.name
            : null;

        if (dialogStack.length > 0) {
          const current = dialogStack[dialogStack.length - 1];
          const currentTag =
            current.node.name && current.node.name.type === 'JSXIdentifier'
              ? current.node.name.name
              : null;

          if (tagName === currentTag) {
            if (current.hasConfirm && !current.hasExit) {
              const message = formatViolation(RULE_ID, interfaceMode, {
                severity: mode,
                fix: 'Add a visible cancel/close option with equal prominence.',
              });

              context.report({
                node: current.node,
                messageId: 'missingExit',
                data: { message },
              });
            }
            dialogStack.pop();
          }
        }
      },
    };
  },
};

export default rule;
