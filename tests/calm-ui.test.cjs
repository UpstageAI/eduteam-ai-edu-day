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

test('drawer sheets lift their paper and print without moving the card or restacking', () => {
  const ownerRules = [...siteCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([,selectors])=>selectors.split(',').some(selector=>selector.trim()==='.learning-card'))
    .map(([, ,body])=>body).join('\n');
  assert.doesNotMatch(ownerRules,/\b(?:transform|translate)\s*:/i,'the normal-flow card owner must stay fixed');
  assert.match(siteCss,/\.learning-card::before,\.card-content,\.action-label\s*\{[^}]*translate\s*:\s*0\s+var\(--sheet-y\)/,'paper, text and label travel together');
  const brushed=ruleBodies(siteCss,':hover').join('\n');
  assert.match(brushed,/--sheet-y\s*:\s*var\(--sheet-lift\)/,'a brushed sheet rises');
  assert.match(brushed,/--sheet-y\s*:\s*var\(--sheet-part\)/,'sheets in front lean away');
  assert.doesNotMatch(brushed,/z-index\s*:/i,'hover must never change stacking order');
  const tokens=Object.fromEntries([...siteCss.matchAll(/(--sheet-(?:pad|lift|part))\s*:\s*(-?[\d.]+)px/g)].map(([,name,value])=>[name,Number(value)]));
  assert.ok(Math.abs(tokens['--sheet-lift'])<tokens['--sheet-pad'],'the lift stays inside the empty margin of the sheet behind');
  assert.ok(tokens['--sheet-part']>0&&tokens['--sheet-part']<Math.abs(tokens['--sheet-lift']),'the lean is smaller than the lift');
});

test('shared pages avoid entrance motion and forced smooth scrolling', () => {
  const css = `${sharedCss}\n${siteCss}`;
  assert.doesNotMatch(css, /\banimation(?:-\w+)?\s*:/i);
  assert.doesNotMatch(css, /scroll-behavior\s*:\s*smooth/i);
});

test('transitions stay limited to interaction feedback and settle slower than they rise', () => {
  const css=`${sharedCss}\n${siteCss}`;
  const motions=[...new Set([...siteCss.matchAll(/--sheet-motion\s*:\s*([^;}]+)/g)].map(match=>match[1].trim()))];
  assert.equal(motions.length,2,'one resting curve and one brushed curve');
  const milliseconds=value=>{const duration=value.match(/([\d.]+)(ms|s)\b/i);assert.ok(duration,`transition needs an explicit duration: ${value}`);return Number(duration[1])*(duration[2].toLowerCase()==='s'?1000:1);};
  const [settle,rise]=motions.map(milliseconds);
  assert.ok(rise>=200&&rise<settle&&settle<=500,`rise ${rise}ms must be quicker than settle ${settle}ms and both brief`);
  const declarations = [...css.matchAll(/\btransition\s*:\s*([^;}]+)/gi)].map(match => match[1].trim());
  assert.ok(declarations.length > 0);
  for (const declaration of declarations) {
    if (/^none\b/.test(declaration)) continue;
    const items=declaration.replace(/cubic-bezier\([^)]*\)/gi,'timing-function').split(',');
    for (const item of items) {
      assert.match(item.trim(), /^(?:color|background(?:-color)?|border(?:-color)?|text-decoration-color|translate|box-shadow)\s+/i, `non-interaction transition: ${item.trim()}`);
      if (/var\(--sheet-motion\)/.test(item)) continue;
      assert.ok(milliseconds(item) <= 220, `transition exceeds 220ms: ${item.trim()}`);
    }
  }
});

test('reduced motion and coarse pointers keep sheets still', () => {
  assert.match(siteCss,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  const reduced=siteCss.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(reduced);
  assert.match(reduced[1],/\.learning-card::before,\.card-content,\.action-label\s*\{[^}]*transition\s*:\s*none[^}]*translate\s*:\s*none/,'reduced motion stops every travelling layer');
  const gate=siteCss.match(/@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(gate,'hover lift must be gated to real fine pointers');
  const outside=[...siteCss.replace(gate[0],'').matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const movers=outside.filter(([,,body])=>/--sheet-y\s*:/.test(body)).map(([,selectors])=>selectors.trim());
  assert.deepEqual(movers,['.learning-card'],'only the resting sheet sets --sheet-y outside the fine-pointer gate');
  for (const [,selectors,body] of [...siteCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)]) {
    for (const [,value] of body.matchAll(/(?:^|[;\s])translate\s*:\s*([^;}]+)/g)) {
      assert.match(value.trim(),/^(?:0 var\(--sheet-y\)|none)$/,`sheets move only through --sheet-y: ${selectors.trim()}`);
    }
    assert.doesNotMatch(body,/\btransform\s*:\s*(?!none)/,`no transform-based sheet motion: ${selectors.trim()}`);
  }
  const focusMovers=[...gate[1].matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([,,body])=>/--sheet-y\s*:/.test(body))
    .flatMap(([,selectors])=>selectors.split(',').map(selector=>selector.trim())).filter(selector=>selector.includes(':focus-visible'));
  assert.ok(focusMovers.length>=2&&focusMovers.every(selector=>selector.startsWith('.learning-grid:not(:hover)>')),'keyboard focus moves sheets only while the pointer is elsewhere');
  for (const [,selectors] of gate[1].matchAll(/([^{}]+)\{/g)) {
    const usesHas=selectors.split(',').map(selector=>selector.includes(':has('));
    assert.ok(usesHas.every(Boolean)||!usesHas.some(Boolean),`keep :has() rules separate so browsers without it keep the hover lift: ${selectors.trim()}`);
  }
});
