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
  assert.match(ruleBodies(sharedCss, ':focus-visible').join('\n'), /outline\s*:\s*(?!none\b)/, 'keyboard focus needs a visible outline');
  assert.match(ruleBodies(siteCss, '.text-link:focus-visible .action-label').join('\n'), /outline\s*:\s*2px\s+solid/, 'catalog focus rings travel with the label so the next sheet cannot hide them');
});

test('drawer sheets move their paper and print through one variable without moving the card', () => {
  const ownerRules = [...siteCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([,selectors])=>selectors.split(',').some(selector=>selector.trim()==='.learning-card'))
    .map(([, ,body])=>body).join('\n');
  assert.doesNotMatch(ownerRules,/\b(?:transform|translate)\s*:/i,'the normal-flow card owner must stay fixed');
  const layers=siteCss.match(/\.learning-card::before,\.card-content,\.action-label\s*\{([^}]*)\}/);
  assert.ok(layers,'paper, text and label share one rule');
  assert.match(layers[1],/translate\s*:\s*0\s+var\(--sheet-y\)/,'paper, text and label travel together');
  assert.doesNotMatch(layers[1],/transition/,'the skim script sets every frame, so a CSS transition would only add lag');
  const movers=[...siteCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([,,body])=>/--sheet-y\s*:/.test(body)).map(([,selectors])=>selectors.trim());
  assert.deepEqual(movers,['.learning-card'],'only the script moves sheets; CSS only sets the resting value');
  for (const [,selectors,body] of [...siteCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)]) {
    for (const [,value] of body.matchAll(/(?:^|[;\s])translate\s*:\s*([^;}]+)/g)) {
      assert.match(value.trim(),/^(?:0 var\(--sheet-y\)|none)$/,`sheets move only through --sheet-y: ${selectors.trim()}`);
    }
    assert.doesNotMatch(body,/\btransform\s*:\s*(?!none)/,`no transform-based sheet motion: ${selectors.trim()}`);
    if (/:hover|:focus/.test(selectors)) assert.doesNotMatch(body,/z-index\s*:/i,`interaction never changes stacking order: ${selectors.trim()}`);
  }
  for (const [,selectors,body] of [...siteCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([,selectors])=>/learning-|card-|text-link|action-label/.test(selectors))) {
    assert.doesNotMatch(body,/border-radius/,`catalog sheets and rings stay square: ${selectors.trim()}`);
  }
  assert.match(siteCss,/\.type-label,\.format-label\s*\{[^}]*height\s*:\s*calc\(var\(--sheet-tab\)\s*\+\s*1px\)[^}]*border\s*:\s*2px solid var\(--tab-line[^}]*border-bottom\s*:\s*0/,'category and format share a file tab with a colored outline and an open bottom that joins the sheet');
  assert.match(siteCss,/\.learning-card\[data-category="workshop"\]\s*\{\s*--tab-line\s*:\s*#[0-9a-f]{6};/i,'workshop tabs carry one soft outline color');
  assert.match(siteCss,/\.learning-card\[data-category="reading"\]\s*\{\s*--tab-line\s*:\s*#[0-9a-f]{6};/i,'reading tabs carry one soft outline color');
  assert.match(siteCss,/\.learning-card:hover\s*\{\s*--tab-line\s*:\s*var\(--tab-line-strong\)\s*;\s*\}/,'the sheet under the pointer deepens its tab outline');
  assert.match(siteCss,/--tab-line-strong\s*:\s*#[0-9a-f]{6}[^}]*\}\s*\.learning-card\[data-category="reading"\]\s*\{[^}]*--tab-line-strong\s*:\s*#[0-9a-f]{6}/i,'each category has a slightly deeper outline for the selected sheet');
  const readingList=fs.readFileSync(path.join(root,'reading-list/index.html'),'utf8');
  assert.equal((readingList.match(/data-category="reading"/g)||[]).length,2,'Reading List sheets use the reading tab color');
  assert.match(siteCss,/\.card-content\s*\{[^}]*margin-top\s*:\s*calc\(\(var\(--sheet-pad\)\s*\+\s*var\(--sheet-tab\)\)\s*\*\s*-1\)/,'the tab rises above the sheet edge into the empty strip of the sheet behind');
  const tokens=Object.fromEntries([...siteCss.matchAll(/(--sheet-(?:tuck|pad|tab|lift))\s*:\s*(-?[\d.]+)px/g)].map(([,name,value])=>[name,Number(value)]));
  assert.ok(tokens['--sheet-lift']<0&&tokens['--sheet-pad']>=4&&tokens['--sheet-tuck']>0&&tokens['--sheet-tab']>=16,'drawer tokens stay concrete pixel values the script can read');
});

test('the skim script is small, gated and keeps text clear', () => {
  const drawer=fs.readFileSync(path.join(root,'assets/drawer.js'),'utf8');
  assert.match(drawer,/matchMedia\('\(hover: hover\) and \(pointer: fine\)'\)/,'only fine pointers skim');
  assert.match(drawer,/matchMedia\('\(prefers-reduced-motion: reduce\)'\)/,'reduced motion keeps the drawer still');
  assert.match(drawer,/requestAnimationFrame/);
  assert.doesNotMatch(drawer,/setInterval|innerHTML|localStorage|fetch\(/);
  assert.match(drawer,/\.resource-title, \.card-description, \.action-label/,'each sheet measures the text of the sheet behind it before rising');
  assert.match(drawer,/Math\.max\(y, behind - reach\[index\]\)/,'a sheet never rises far enough to reach that text');
  assert.match(drawer,/removeProperty\('--sheet-y'\)/,'sheets return to the CSS resting value');
  assert.match(drawer,/new MutationObserver/,'rows discovered later are measured again');
  assert.match(drawer,/addEventListener\('pagehide', stop\)/,'a page restored from history starts at rest');
  assert.match(drawer,/pointerType !== 'touch'/,'mouse and pen skim; touch does not');
  for (const file of ['index.html','reading-list/index.html']) {
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.match(html,/<script src="(?:\.\/|\.\.\/)assets\/drawer\.js(?:\?[^"]+)?" defer><\/script>/,`${file} loads the skim script`);
  }
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
    for (const item of declaration.replace(/cubic-bezier\([^)]*\)/gi,'timing-function').split(',')) {
      assert.match(item.trim(), /^(?:color|background(?:-color)?|border(?:-color)?|text-decoration-color)\s+/i, `non-interaction transition: ${item.trim()}`);
      const duration = item.match(/([\d.]+)(ms|s)\b/i);
      assert.ok(duration, `transition needs an explicit short duration: ${item.trim()}`);
      assert.ok(Number(duration[1]) * (duration[2].toLowerCase() === 's' ? 1000 : 1) <= 220, `transition exceeds 220ms: ${item.trim()}`);
    }
  }
});

test('reduced motion and print keep sheets still', () => {
  const reduced=siteCss.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(reduced);
  assert.match(reduced[1],/\.learning-card::before,\.card-content,\.action-label\s*\{[^}]*translate\s*:\s*none/,'reduced motion stops every travelling layer');
  const print=siteCss.match(/@media\s+print\s*\{([\s\S]*?)\n\}/);
  assert.ok(print);
  assert.match(print[1],/\.card-content,\.action-label\s*\{[^}]*translate\s*:\s*none/);
  assert.match(siteCss,/@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/,'fine pointers keep the compact 40px action target');
});
