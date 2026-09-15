// chromux run <session> --file tests/calm-ui.browser.js --arg base=http://127.0.0.1:8000/
const base = new URL(args.base || 'http://127.0.0.1:8000/');
const checks = [];
const check = (condition, message) => { if (!condition) throw new Error(message); checks.push(message); };
const viewport = (width, height = 900) => cdp('Emulation.setDeviceMetricsOverride', {
  width, height, deviceScaleFactor: 1, mobile: width < 600,
});

async function go(path = '') {
  await cdp('Page.navigate', { url: new URL(path, base).href });
  await waitLoad();
  await waitFor('main');
}

const contrastAudit = String.raw`(() => {
  function rgba(value) {
    const numbers = value.match(/[\d.]+/g).map(Number);
    return [numbers[0], numbers[1], numbers[2], numbers.length > 3 ? numbers[3] : 1];
  }
  function surface(element) {
    for (let node = element; node; node = node.parentElement) {
      const color = rgba(getComputedStyle(node).backgroundColor);
      if (color[3] >= .99) return color;
    }
    return [255, 255, 255, 1];
  }
  function luminance(color) {
    const channels = color.slice(0, 3).map(value => value / 255)
      .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
  }
  return ['body', '.home-lede', '.button-primary', '.catalog-filters [aria-pressed=true]', '.type-label', '.card-description'].map(selector => {
    const element = document.querySelector(selector);
    const foreground = rgba(getComputedStyle(element).color);
    const background = surface(element);
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return { selector, ratio: (values[0] + .05) / (values[1] + .05) };
  });
})()`;

try {
  await viewport(1440, 1000);
  await go();

  const ratios = await js(contrastAudit);
  check(ratios.every(result => result.ratio >= 4.5), `normal text and accents meet 4.5:1 contrast (${ratios.map(result => `${result.selector} ${result.ratio.toFixed(2)}`).join(', ')})`);
  check(await js(`!document.querySelector('.hero-art,.card-visual,.collection-feature,.learning-principle,.intro-strip,#pages img')`), 'home renders as text-first editorial content without decorative panels');
  check(await js(`[document.querySelector('.home-hero .hero-content'), ...document.querySelectorAll('.learning-card')].every(element => { const s=getComputedStyle(element),r=element.getBoundingClientRect(); return s.visibility==='visible' && parseFloat(s.opacity)===1 && s.transform==='none' && r.width>0 && r.height>0; })`), 'primary content is immediately visible without an entrance state');

  await js('document.querySelector("[data-category-filter=reading]").focus()');
  check(await js(`(() => { const s=getComputedStyle(document.activeElement); return s.outlineStyle!=='none' && parseFloat(s.outlineWidth)>0; })()`), 'keyboard focus has a visible outline');
  await js('document.activeElement.click()');
  check(await js(`document.activeElement.getAttribute('aria-pressed')==='true' && document.querySelector('[data-category-filter=all]').getAttribute('aria-pressed')==='false'`), 'active filter has a programmatic pressed state');
  check(await js(`(() => { const s=getComputedStyle(document.activeElement); return s.textDecorationLine!=='none' || parseInt(s.fontWeight,10)>parseInt(getComputedStyle(document.querySelector('[data-category-filter=all]')).fontWeight,10); })()`), 'active filter also has a non-color visual cue');

  await js('document.querySelector("[data-category-filter=all]").click()');
  check(await js(`['.button-primary','.learning-card','.catalog-filters button'].every(selector => { const s=getComputedStyle(document.querySelector(selector)); const properties=s.transitionProperty.split(',').map(v=>v.trim()); const durations=s.transitionDuration.split(',').map(v=>parseFloat(v)*1000); return durations.every((duration,index) => duration===0 || (duration<=200 && /^(color|background-color|border-color|text-decoration-color)$/.test(properties[index%properties.length]))); })`), 'interactive transitions are at most 200ms and limited to color, background, or border');

  for (const selector of ['.button-primary', '.learning-card']) {
    await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);
    await sleep(50);
    const before = await js(`(() => { const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return [r.x,r.y,r.width,r.height]; })()`);
    check(before[2] > 0 && before[3] > 0 && before[0] < 1440 && before[1] >= 0 && before[1] < 1000, `${selector} is visible before hover audit`);
    const point = { x: before[0] + before[2] / 2, y: before[1] + before[3] / 2 };
    await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
    await sleep(450);
    check(await js(`document.querySelector(${JSON.stringify(selector)}).matches(':hover')`), `${selector} receives the real hover state`);
    const after = await js(`(() => { const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return [r.x,r.y,r.width,r.height]; })()`);
    check(before.every((value, index) => Math.abs(value - after[index]) < .5), `${selector} hover does not translate or rotate content`);
  }

  for (const width of [1440, 768, 390, 320]) {
    await viewport(width, width < 600 ? 844 : 1000);
    await go();
    check(await js('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'), `${width}px layout has no horizontal overflow`);
    check(await js(`[...document.querySelectorAll('.header-nav a')].every(link => { const r=link.getBoundingClientRect(); return r.width>0 && r.right<=innerWidth+1; })`), `${width}px primary navigation remains visible`);
    check(await js(`(() => { const rows=[...document.querySelectorAll('#pages .learning-card')].map(card=>card.getBoundingClientRect()); return rows.every((row,index)=>index===0 || row.top>=rows[index-1].bottom-1); })()`), `${width}px catalog remains a single vertical column`);
    if (width === 1440) check(await js(`document.querySelector('main > .container').getBoundingClientRect().width<=900`), 'desktop editorial column remains narrow');
  }

  await viewport(1440, 1000);
  await go('reading-list/');
  check(await js(`document.querySelectorAll('[data-resource]').length===2 && !document.querySelector('.card-art')`), 'Reading List keeps both resources without decorative card art');

  return { passed: checks.length, base: base.href, checks };
} finally {
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  await viewport(1440, 1000);
}
