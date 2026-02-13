/**
 * bodhi/no-attention-capture (M3)
 *
 * Detects patterns that capture attention without consent:
 *   - autoPlay/autoplay on video/audio/iframe
 *   - loop attribute on animated content
 *   - Infinite animation CSS classes (animate-spin, animate-pulse, etc.)
 *   - <marquee> element
 *
 * Regulatory basis:
 *   - WCAG 2.1 Criterion 2.2.2: Pause, Stop, Hide
 *   - UK Age Appropriate Design Code: Minimize attention capture for minors
 *
 * Default mode: Lenient
 */

import { formatViolation } from '../koans.js';

const RULE_ID = 'no-attention-capture';

const INFINITE_ANIMATION_CLUES = [
  'animate-spin', 'animate-pulse', 'animate-bounce',
  'animate-ping', 'infinite', 'animation-infinite',
  'animate-infinite',
];

// Classes that suggest finite/controlled animation (reduce false positives)
const FINITE_ANIMATION_CLUES = [
  'animate-once', 'animation-once', 'animate-1',
  'iteration-1', 'animation-count-1',
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

function hasInfiniteAnimation(className) {
  if (!className) return false;
  const lower = className.toLowerCase();
  const hasInfinite = INFINITE_ANIMATION_CLUES.some((clue) => lower.includes(clue));
  const hasFinite = FINITE_ANIMATION_CLUES.some((clue) => lower.includes(clue));
  return hasInfinite && !hasFinite;
}

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect attention capture patterns: autoplay, infinite animations, marquee',
      category: 'Design Ethics',
      recommended: true,
      url: 'https://github.com/yourusername/bodhi/blob/main/docs/rules/no-attention-capture.md',
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
      autoplayDetected: '{{ message }}',
      infiniteAnimation: '{{ message }}',
      marqueeDetected: '{{ message }}',
      loopDetected: '{{ message }}',
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

        // ─── Detection 1: <marquee> element ─────────────────
        if (tagName === 'marquee' || tagName === 'Marquee') {
          const message = formatViolation(RULE_ID, interfaceMode, {
            severity: mode,
            fix: 'Remove <marquee>. Use CSS animation with user controls if motion is needed.',
          });

          context.report({
            node,
            messageId: 'marqueeDetected',
            data: { message },
          });
          return;
        }

        // ─── Detection 2: autoPlay/autoplay on media ────────
        if (
          tagName === 'video' || tagName === 'Video' ||
          tagName === 'audio' || tagName === 'Audio' ||
          tagName === 'iframe' || tagName === 'Iframe'
        ) {
          const autoPlayAttr =
            getJSXAttribute(node, 'autoPlay') || getJSXAttribute(node, 'autoplay');

          if (autoPlayAttr) {
            const val = getJSXAttributeValue(autoPlayAttr);
            // autoplay={false} is fine
            if (val === false) return;

            const message = formatViolation(RULE_ID, interfaceMode, {
              severity: mode,
              fix: 'Remove autoPlay. Let the user choose when to start playback.',
            });

            context.report({
              node,
              messageId: 'autoplayDetected',
              data: { message },
            });
            return;
          }

          // ─── Detection 3: loop on media ────────────────────
          const loopAttr = getJSXAttribute(node, 'loop');
          if (loopAttr) {
            const val = getJSXAttributeValue(loopAttr);
            if (val === false) return;

            const message = formatViolation(RULE_ID, interfaceMode, {
              severity: mode,
              fix: 'Remove loop or add user controls to stop playback.',
            });

            context.report({
              node,
              messageId: 'loopDetected',
              data: { message },
            });
            return;
          }
        }

        // ─── Detection 4: Infinite animation classes ────────
        const className =
          getJSXAttributeValue(getJSXAttribute(node, 'className')) || '';

        if (hasInfiniteAnimation(className)) {
          const message = formatViolation(RULE_ID, interfaceMode, {
            severity: mode,
            fix: 'Add finite iteration count or user controls to stop the animation.',
          });

          context.report({
            node,
            messageId: 'infiniteAnimation',
            data: { message },
          });
        }
      },
    };
  },
};

export default rule;
