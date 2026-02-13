/**
 * bodhi/no-false-social-proof (M5)
 *
 * Detects patterns that fabricate social proof:
 *   - Hardcoded numbers adjacent to social proof text
 *   - Math.random() calls near social proof context
 *   - Static strings matching "X,XXX people" or "XX users online"
 *
 * Regulatory basis:
 *   - DSA Art 25: No deceptive interfaces
 *   - FTC Act Section 5: Unfair or deceptive practices
 *
 * Default mode: Dogmatic
 */

import { formatViolation } from '../koans.js';

const RULE_ID = 'no-false-social-proof';

const SOCIAL_PROOF_KEYWORDS = [
  'people', 'viewing', 'bought', 'reviews', 'rated',
  'customers', 'users', 'watching', 'online', 'active',
  'signed up', 'joined', 'downloaded', 'purchased',
  'in cart', 'in their cart', 'looking at this',
];

// Matches patterns like "1,234 people" or "42 users"
const HARDCODED_NUMBER_PATTERN = /\d[\d,.]*/;

// Matches explicit "X,XXX people" style strings
const STATIC_SOCIAL_PATTERN = /\d[\d,.]+\s*(people|users|customers|viewers|buyers|reviews|ratings|downloads)/i;

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

function hasSocialProofContext(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return SOCIAL_PROOF_KEYWORDS.some((kw) => lower.includes(kw));
}

function containsHardcodedNumber(text) {
  if (!text) return false;
  return HARDCODED_NUMBER_PATTERN.test(text);
}

function containsStaticSocialPattern(text) {
  if (!text) return false;
  return STATIC_SOCIAL_PATTERN.test(text);
}

/**
 * Check if JSX children contain a Math.random() expression.
 */
function hasMathRandomChild(parentNode) {
  if (!parentNode || !parentNode.children) return false;
  return parentNode.children.some((child) => {
    if (child.type === 'JSXExpressionContainer' && child.expression) {
      const expr = child.expression;
      // Direct: {Math.random()}
      if (
        expr.type === 'CallExpression' &&
        expr.callee &&
        expr.callee.type === 'MemberExpression' &&
        expr.callee.object &&
        expr.callee.object.name === 'Math' &&
        expr.callee.property &&
        expr.callee.property.name === 'random'
      ) {
        return true;
      }
      // Math.floor(Math.random() * N)
      if (
        expr.type === 'CallExpression' &&
        expr.arguments &&
        expr.arguments.length > 0
      ) {
        const src = child.expression;
        return containsMathRandom(src);
      }
    }
    return false;
  });
}

function containsMathRandom(node) {
  if (!node) return false;
  if (
    node.type === 'CallExpression' &&
    node.callee &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object &&
    node.callee.object.name === 'Math' &&
    node.callee.property &&
    node.callee.property.name === 'random'
  ) {
    return true;
  }
  // Recurse into arguments and callee
  if (node.arguments) {
    for (const arg of node.arguments) {
      if (containsMathRandom(arg)) return true;
    }
  }
  if (node.left && containsMathRandom(node.left)) return true;
  if (node.right && containsMathRandom(node.right)) return true;
  if (node.argument && containsMathRandom(node.argument)) return true;
  return false;
}

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect false social proof: hardcoded viewer counts, fake reviews',
      category: 'Design Ethics',
      recommended: true,
      url: 'https://github.com/yourusername/bodhi/blob/main/docs/rules/no-false-social-proof.md',
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
      hardcodedSocialProof: '{{ message }}',
      randomSocialProof: '{{ message }}',
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

        // Only check text-bearing elements
        if (
          tagName !== 'span' && tagName !== 'div' && tagName !== 'p' &&
          tagName !== 'strong' && tagName !== 'em' && tagName !== 'small' &&
          tagName !== 'label' && tagName !== 'h1' && tagName !== 'h2' &&
          tagName !== 'h3' && tagName !== 'h4' && tagName !== 'li'
        ) return;

        // Check for bodhi-justify escape hatch in lenient mode
        const justification = getJSXAttribute(node, 'data-bodhi-justify');
        if (justification && mode === 'lenient') return;

        const text = getNodeText(node);
        const parentNode = node.parent;

        // ─── Detection 1: Math.random() in social proof context ──
        if (hasSocialProofContext(text) && hasMathRandomChild(parentNode)) {
          const message = formatViolation(RULE_ID, interfaceMode, {
            severity: mode,
            fix: 'Replace Math.random() with real data from your backend.',
          });

          context.report({
            node,
            messageId: 'randomSocialProof',
            data: { message },
          });
          return;
        }

        // ─── Detection 2: Static social proof pattern ────────────
        if (containsStaticSocialPattern(text)) {
          const message = formatViolation(RULE_ID, interfaceMode, {
            severity: mode,
            fix: 'If this number is real, bind it to a live data source. Static social proof numbers are deceptive.',
          });

          context.report({
            node,
            messageId: 'hardcodedSocialProof',
            data: { message },
          });
          return;
        }

        // ─── Detection 3: Hardcoded number + social proof keywords ─
        if (
          hasSocialProofContext(text) &&
          containsHardcodedNumber(text)
        ) {
          // In lenient mode, only flag explicit patterns
          if (mode === 'lenient') return;

          const message = formatViolation(RULE_ID, interfaceMode, {
            severity: mode,
            fix: 'Connect social proof numbers to a real data source.',
          });

          context.report({
            node,
            messageId: 'hardcodedSocialProof',
            data: { message },
          });
        }
      },
    };
  },
};

export default rule;
