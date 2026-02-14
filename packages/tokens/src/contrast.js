/**
 * WCAG 2.1 Contrast Utilities
 *
 * Pure functions for calculating and adjusting color contrast ratios.
 * Used to ensure text meets AAA accessibility standards (7:1 for normal text,
 * 4.5:1 for large text).
 *
 * All calculations use the WCAG 2.1 relative luminance formula.
 */

/**
 * Convert sRGB channel value (0-255) to linear RGB.
 * @param {number} channel - RGB channel value (0-255)
 * @returns {number} - Linear RGB value (0-1)
 */
function sRGBtoLinear(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Calculate relative luminance using WCAG 2.1 formula.
 * @param {string} hex - Hex color string (#rrggbb or #rgb)
 * @returns {number} - Relative luminance (0-1)
 */
function relativeLuminance(hex) {
  // Normalize hex format
  let hexValue = hex.replace('#', '');
  
  // Expand shorthand #rgb to #rrggbb
  if (hexValue.length === 3) {
    hexValue = hexValue.split('').map(c => c + c).join('');
  }
  
  const r = parseInt(hexValue.substr(0, 2), 16);
  const g = parseInt(hexValue.substr(2, 2), 16);
  const b = parseInt(hexValue.substr(4, 2), 16);
  
  const R = sRGBtoLinear(r);
  const G = sRGBtoLinear(g);
  const B = sRGBtoLinear(b);
  
  // WCAG 2.1 relative luminance formula
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculate WCAG 2.1 contrast ratio between two colors.
 * @param {string} color1 - First hex color
 * @param {string} color2 - Second hex color
 * @returns {number} - Contrast ratio (1-21)
 */
export function contrastRatio(color1, color2) {
  const L1 = relativeLuminance(color1);
  const L2 = relativeLuminance(color2);
  
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color pair meets a target contrast ratio.
 * @param {string} foreground - Foreground hex color
 * @param {string} background - Background hex color
 * @param {number} target - Target contrast ratio (default 7:1 for AAA normal text)
 * @returns {boolean} - Whether the contrast meets the target
 */
export function meetsContrast(foreground, background, target = 7) {
  return contrastRatio(foreground, background) >= target;
}

/**
 * Convert hex to HSL.
 * @param {string} hex - Hex color string
 * @returns {{ h: number, s: number, l: number }} - HSL values (h: 0-360, s/l: 0-100)
 */
function hexToHSL(hex) {
  let hexValue = hex.replace('#', '');
  if (hexValue.length === 3) {
    hexValue = hexValue.split('').map(c => c + c).join('');
  }
  
  const r = parseInt(hexValue.substr(0, 2), 16) / 255;
  const g = parseInt(hexValue.substr(2, 2), 16) / 255;
  const b = parseInt(hexValue.substr(4, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to hex.
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} - Hex color string
 */
function hslToHex(h, s, l) {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;
  
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs((hNorm * 6) % 2 - 1));
  const m = lNorm - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (hNorm < 1/6) {
    r = c; g = x; b = 0;
  } else if (hNorm < 2/6) {
    r = x; g = c; b = 0;
  } else if (hNorm < 3/6) {
    r = 0; g = c; b = x;
  } else if (hNorm < 4/6) {
    r = 0; g = x; b = c;
  } else if (hNorm < 5/6) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  const toHex = (val) => {
    const hex = Math.round((val + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adjust a foreground color to meet target contrast against a background.
 * Preserves hue and saturation, only adjusts lightness.
 * @param {string} foreground - Foreground hex color to adjust
 * @param {string} background - Background hex color
 * @param {number} target - Target contrast ratio (default 7:1 for AAA normal text)
 * @returns {string|null} - Adjusted hex color, or null if target can't be met
 */
export function adjustForContrast(foreground, background, target = 7) {
  // Check if already meets contrast
  if (meetsContrast(foreground, background, target)) {
    return foreground;
  }
  
  const hsl = hexToHSL(foreground);
  const bgLuminance = relativeLuminance(background);
  
  // Determine if we need to go lighter or darker
  const shouldLighten = bgLuminance < 0.5;
  
  // Binary search for the right lightness value
  let minL = 0;
  let maxL = 100;
  let bestL = hsl.l;
  let iterations = 0;
  const maxIterations = 50;
  
  while (iterations < maxIterations && maxL - minL > 0.1) {
    const testL = (minL + maxL) / 2;
    const testColor = hslToHex(hsl.h, hsl.s, testL);
    const ratio = contrastRatio(testColor, background);
    
    if (Math.abs(ratio - target) < 0.1) {
      bestL = testL;
      break;
    }
    
    if (ratio < target) {
      // Need more contrast
      if (shouldLighten) {
        minL = testL;
      } else {
        maxL = testL;
      }
    } else {
      // Have enough contrast, try to get closer to target
      if (shouldLighten) {
        maxL = testL;
      } else {
        minL = testL;
      }
      bestL = testL;
    }
    
    iterations++;
  }
  
  // Final check
  const adjustedColor = hslToHex(hsl.h, hsl.s, bestL);
  if (meetsContrast(adjustedColor, background, target)) {
    return adjustedColor;
  }
  
  // If we can't meet the target, return null
  return null;
}
