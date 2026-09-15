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

test('stack interaction moves surfaces without moving the card hit area', () => {
  const ownerRules = [...siteCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([,selectors])=>selectors.split(',').some(selector=>selector.trim()==='.learning-card'))
    .map(([, ,body])=>body).join('\n');
  assert.doesNotMatch(ownerRules,/\btransform\s*:/i,'the normal-flow card owner must stay fixed');
  const raisedRules=ruleBodies(siteCss,':hover').join('\n')+ruleBodies(siteCss,':focus-within').join('\n');
  assert.match(raisedRules,/transform\s*:\s*translateY\s*\(/i,'hover or focus must lift an inner surface');
  assert.match(raisedRules,/z-index\s*:/i,'raised sheets must paint above their neighbors');
});

test('shared pages avoid entrance motion and forced smooth scrolling', () => {
  const css = `${sharedCss}\n${siteCss}`;
  assert.doesNotMatch(css, /\banimation(?:-\w+)?\s*:/i);
  assert.doesNotMatch(css, /scroll-behavior\s*:\s*smooth/i);
});

test('transitions stay brief and limited to interaction feedback', () => {
  const declarations = [...`${sharedCss}\n${siteCss}`.matchAll(/\btransition\s*:\s*([^;}]+)/gi)].map(match => match[1].trim());
  assert.ok(declarations.length > 0);
  for (const declaration of declarations) {
    if (/^none\b/.test(declaration)) continue;
    const items=declaration.replace(/cubic-bezier\([^)]*\)/gi,'timing-function').split(',');
    for (const item of items) {
      assert.match(item.trim(), /^(?:color|background(?:-color)?|border(?:-color)?|text-decoration-color|transform|box-shadow)\s+/i, `non-interaction transition: ${item.trim()}`);
      const duration = item.match(/([\d.]+)(ms|s)\b/i);
      assert.ok(duration, `transition needs an explicit short duration: ${item.trim()}`);
      const milliseconds = Number(duration[1]) * (duration[2].toLowerCase() === 's' ? 1000 : 1);
      assert.ok(milliseconds <= 220, `transition exceeds 220ms: ${item.trim()}`);
    }
  }
});

test('reduced motion and coarse pointers remove the sheet lift', () => {
  assert.match(siteCss,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  const reduced=siteCss.slice(siteCss.search(/@media\s*\(prefers-reduced-motion:\s*reduce\)/));
  assert.match(reduced,/transition\s*:\s*none/);
  assert.match(reduced,/transform\s*:\s*none/);
  assert.match(reduced,/box-shadow\s*:\s*none/);
  assert.match(siteCss,/@media[^{}]*hover:\s*hover[^{}]*pointer:\s*fine/,'hover lift must be gated to real fine pointers');
});
