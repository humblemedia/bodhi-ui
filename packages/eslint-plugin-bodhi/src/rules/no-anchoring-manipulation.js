/**
 * bodhi/no-anchoring-manipulation (M8)
 *
 * Detects price anchoring and decoy pricing patterns:
 *   - <del> or <s> elements adjacent to price-like content
 *   - Class names suggesting "original-price", "was-price", "old-price"
 *     near "new-price", "sale-price", "now"
 *   - Three-tier pricing with middle option visually emphasized (decoy)
 *
 * Regulatory basis:
 *   - FTC Guides Against Deceptive Pricing
 *   - DSA Art 25: No deceptive interfaces
 *
 * Default mode: Lenient
 */

import { formatViolation } from '../koans.js';

const RULE_ID = 'no-anchoring-manipulation';

// Price-like patterns: $XX, €XX, £XX, ¥XX
const PRICE_PATTERN = /[$\u20AC\u00A3\u00A5]\s*\d[\d,.]+/;

const ANCHOR_PRICE_CLASS_CLUES = [
  'original-price', 'was-price', 'old-price', 'strikethrough',
  'strike-through', 'line-through', 'crossed-out', 'before-price',
  'regular-price', 'list-price', 'msrp', 'rrp',
];

const SALE_PRICE_CLASS_CLUES = [
  'new-price', 'sale-price', 'now-price', 'current-price',
  'special-price', 'discount-price', 'offer-price', 'final-price',
];

const EMPHASIS_CLASS_CLUES = [
  'featured', 'popular', 'recommended', 'best-value', 'highlight',
  'selected', 'most-popular', 'best-seller', 'preferred',
  'ring', 'border-primary', 'scale-105', 'scale-110', 'z-10',
  'shadow-lg', 'shadow-xl',
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

function hasAnchorPriceClass(className) {
  if (!className) return false;
  const lower = className.toLowerCase();
  return ANCHOR_PRICE_CLASS_CLUES.some((clue) => lower.includes(clue));
}

function hasSalePriceClass(className) {
  if (!className) return false;
  const lower = className.toLowerCase();
  return SALE_PRICE_CLASS_CLUES.some((clue) => lower.includes(clue));
}

function hasEmphasisClass(className) {
  if (!className) return false;
  const lower = className.toLowerCase();
  return EMPHASIS_CLASS_CLUES.some((clue) => lower.includes(clue));
}

function hasPriceContent(text) {
  return PRICE_PATTERN.test(text || '');
}

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect anchoring manipulation: strikethrough pricing, decoy tiers',
      category: 'Design Ethics',
      recommended: true,
      url: 'https://github.com/yourusername/bodhi/blob/main/docs/rules/no-anchoring-manipulation.md',
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
      strikethroughPrice: '{{ message }}',
      anchorPriceClass: '{{ message }}',
      decoyPricing: '{{ message }}',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const mode = options.mode || 'lenient';
    const interfaceMode = options.interfaceMode || 'poetic';

    // Track pricing tiers for decoy detection
    const pricingContainers = new Map();

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

        // ─── Detection 1: <del> or <s> with price content ───
        if (tagName === 'del' || tagName === 's') {
          if (hasPriceContent(text)) {
            const message = formatViolation(RULE_ID, interfaceMode, {
              severity: mode,
              fix: 'If the original price is genuine, add data-bodhi-justify with the pricing history source.',
            });

            context.report({
              node,
              messageId: 'strikethroughPrice',
              data: { message },
            });
            return;
          }
        }

        // ─── Detection 2: Anchor price class near sale price ─
        if (hasAnchorPriceClass(className) && hasPriceContent(text)) {
          // Check siblings for a sale price
          const parent = node.parent && node.parent.parent;
          if (parent && parent.children) {
            const hasSaleSibling = parent.children.some((sibling) => {
              if (sibling.type !== 'JSXElement') return false;
              const sibOpening = sibling.openingElement;
              if (!sibOpening) return false;
              const sibClass =
                getJSXAttributeValue(getJSXAttribute(sibOpening, 'className')) || '';
              return hasSalePriceClass(sibClass);
            });

            if (hasSaleSibling) {
              const message = formatViolation(RULE_ID, interfaceMode, {
                severity: mode,
                fix: 'Ensure the reference price reflects genuine historical pricing, not an inflated anchor.',
              });

              context.report({
                node,
                messageId: 'anchorPriceClass',
                data: { message },
              });
              return;
            }
          }
        }

        // ─── Detection 3: Decoy pricing (3-tier with emphasis) ─
        // Collect pricing tier cards for analysis at Program:exit
        if (className && hasEmphasisClass(className) && hasPriceContent(text)) {
          const container = node.parent && node.parent.parent;
          if (!container) return;

          const key = `${container.start || container.range?.[0] || 'root'}`;

          if (!pricingContainers.has(key)) {
            pricingContainers.set(key, { tiers: [], emphasisNode: null });
          }

          const entry = pricingContainers.get(key);
          entry.emphasisNode = node;
        }

        // Track all price-bearing children in containers
        if (hasPriceContent(text)) {
          const container = node.parent && node.parent.parent;
          if (!container) return;

          const key = `${container.start || container.range?.[0] || 'root'}`;

          if (!pricingContainers.has(key)) {
            pricingContainers.set(key, { tiers: [], emphasisNode: null });
          }

          pricingContainers.get(key).tiers.push(node);
        }
      },

      'Program:exit'() {
        // Check for decoy pricing pattern: 3+ tiers, middle one emphasized
        for (const [, data] of pricingContainers) {
          if (data.tiers.length >= 3 && data.emphasisNode) {
            const message = formatViolation(RULE_ID, interfaceMode, {
              severity: mode,
              fix: 'Review pricing tier layout. If the middle option is a decoy to push users toward a specific choice, present options with equal visual weight.',
            });

            context.report({
              node: data.emphasisNode,
              messageId: 'decoyPricing',
              data: { message },
            });
          }
        }
      },
    };
  },
};

export default rule;
