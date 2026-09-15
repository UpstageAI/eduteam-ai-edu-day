const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sharedCss = fs.readFileSync(path.join(root, 'reading-list/assets/reading-list.css'), 'utf8');
const siteCss = fs.readFileSync(path.join(root, 'assets/site.css'), 'utf8');

function ruleBodies(css, selectorFragment) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors]) => selectors.includes(selectorFragment))
    .map(([, , body]) => body);
}

function customProperty(name) {
  const match = sharedCss.match(new RegExp(`${name}\\s*:\\s*(#[0-9a-f]{3,8})`, 'i'));
  assert.ok(match, `${name} must remain a concrete shared color token`);
  return match[1];
}

function rgb(hex) {
  const value = hex.slice(1);
  const expanded = value.length === 3 ? [...value].map(char => char + char).join('') : value.slice(0, 6);
  return [0, 2, 4].map(offset => Number.parseInt(expanded.slice(offset, offset + 2), 16));
}

function contrast(foreground, background) {
  const luminance = color => {
    const channels = rgb(color).map(channel => channel / 255)
      .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

test('shared text and accent roles remain readable on the paper surface', () => {
  const paper = customProperty('--paper');
  for (const token of ['--ink', '--muted', '--green']) {
    assert.ok(contrast(customProperty(token), paper) >= 4.5, `${token} must meet WCAG AA for normal text on --paper`);
  }
});

test('minimal header links retain a visible keyboard focus treatment', () => {
  const header=home.match(/<header class="site-header">([\s\S]*?)<\/header>/);
  assert.ok(header);
  assert.equal((header[1].match(/<a\b/g)||[]).length,2);
  const focusRules = ruleBodies(sharedCss, ':focus-visible').join('\n') + ruleBodies(siteCss, ':focus-within').join('\n');
  assert.match(focusRules, /outline\s*:\s*(?!none\b)/, 'keyboard focus needs a visible outline');
});

test('interactive hover states do not move or rotate content', () => {
  const hoverRules = ruleBodies(siteCss, ':hover').join('\n');
  assert.doesNotMatch(hoverRules, /transform\s*:\s*[^;]*(?:translate|rotate)/i);
});

test('shared pages avoid entrance motion and forced smooth scrolling', () => {
  const css = `${sharedCss}\n${siteCss}`;
  assert.doesNotMatch(css, /\banimation(?:-\w+)?\s*:/i);
  assert.doesNotMatch(css, /^\s*transform\s*:/im);
  assert.doesNotMatch(css, /scroll-behavior\s*:\s*smooth/i);
});

test('transitions are brief and limited to interaction colors and borders', () => {
  const declarations = [...`${sharedCss}\n${siteCss}`.matchAll(/\btransition\s*:\s*([^;}]+)/gi)].map(match => match[1].trim());
  assert.ok(declarations.length > 0);
  for (const declaration of declarations) {
    if (/^none\b/.test(declaration)) continue;
    for (const item of declaration.split(',')) {
      assert.match(item.trim(), /^(?:color|background(?:-color)?|border(?:-color)?|text-decoration-color)\s+/i, `non-interaction transition: ${item.trim()}`);
      const duration = item.match(/([\d.]+)(ms|s)\b/i);
      assert.ok(duration, `transition needs an explicit short duration: ${item.trim()}`);
      const milliseconds = Number(duration[1]) * (duration[2].toLowerCase() === 's' ? 1000 : 1);
      assert.ok(milliseconds <= 200, `transition exceeds 200ms: ${item.trim()}`);
    }
  }
});
