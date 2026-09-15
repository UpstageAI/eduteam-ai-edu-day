// chromux run <session> --file tests/calm-ui.browser.js --arg base=http://127.0.0.1:8000/
const base = new URL(args.base || 'http://127.0.0.1:8000/');
const checks = [];
const check = (condition, message) => { if (!condition) throw new Error(message); checks.push(message); };
const viewport = (width, height = 900) => cdp('Emulation.setDeviceMetricsOverride', { width,height,deviceScaleFactor:1,mobile:width<600 });
async function go(path='') {
  await cdp('Page.navigate',{url:new URL(path,base).href});
  await waitLoad();
  await waitFor('main');
}
const contrast = String.raw`selectors => {
  function rgba(value) { const n=value.match(/[\d.]+/g).map(Number); return [n[0],n[1],n[2],n.length>3?n[3]:1]; }
  function surface(element) { for(let node=element;node;node=node.parentElement){const c=rgba(getComputedStyle(node).backgroundColor);if(c[3]>=.99)return c;}return [255,255,255,1]; }
  function luminance(color){const c=color.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];}
  return selectors.map(selector=>{const element=document.querySelector(selector),values=[luminance(rgba(getComputedStyle(element).color)),luminance(surface(element))].sort((a,b)=>b-a);return {selector,ratio:(values[0]+.05)/(values[1]+.05)};});
}`;
try {
  await viewport(1440,1000);
  await go();
  const ratios=await js(`(${contrast})(['body','.type-label','.format-label','.resource-title','.card-description','.text-link'])`);
  check(ratios.every(item=>item.ratio>=4.5),`catalog text meets 4.5:1 contrast (${ratios.map(item=>`${item.selector} ${item.ratio.toFixed(2)}`).join(', ')})`);
  check(await js(`!document.querySelector('.home-hero,#catalog-controls,#catalog-search,#catalog-count,#catalog-empty,#catalog-feedback,.site-footer')`),'removed homepage UI is absent rather than hidden');
  check(await js(`[document.querySelector('#resources'),...document.querySelectorAll('#pages>.learning-card')].every(element=>{const s=getComputedStyle(element),r=element.getBoundingClientRect();return s.visibility==='visible'&&parseFloat(s.opacity)===1&&s.transform==='none'&&r.width>0&&r.height>0})`),'all catalog content is immediately visible');

  await js(`document.querySelector('.text-link').focus()`);
  check(await js(`(()=>{const s=getComputedStyle(document.activeElement);return s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0})()`),'material CTA has visible keyboard focus');
  check(await js(`['.text-link','.learning-card'].every(selector=>{const s=getComputedStyle(document.querySelector(selector)),p=s.transitionProperty.split(',').map(v=>v.trim()),d=s.transitionDuration.split(',').map(v=>parseFloat(v)*1000);return d.every((duration,index)=>duration===0||(duration<=200&&/^(color|background-color|border-color|text-decoration-color)$/.test(p[index%p.length])))})`),'interaction transitions are at most 200ms and color-only');

  for (const selector of ['.text-link','.learning-card']) {
    await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);
    const before=await js(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()`);
    const point={x:before[0]+before[2]/2,y:before[1]+before[3]/2};
    await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y});
    await sleep(220);
    check(await js(`document.querySelector(${JSON.stringify(selector)}).matches(':hover')`),`${selector} receives hover`);
    const after=await js(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()`);
    check(before.every((value,index)=>Math.abs(value-after[index])<.5),`${selector} hover does not move content`);
  }

  check(await js(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).map(row=>[...row.querySelector('.card-content').children].map(node=>node.getBoundingClientRect()));return rows.every(fields=>fields.every((field,index)=>index===0||(field.left>=fields[index-1].right-1&&field.top<fields[0].bottom&&fields[0].top<field.bottom)))&&rows.slice(1).every(fields=>fields.every((field,index)=>Math.abs(field.left-rows[0][index].left)<3))})()`),'desktop rows align category, format, title and summary in four baseline-aligned columns');
  check(await js(`[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).every(row=>{const content=row.querySelector('.card-content').getBoundingClientRect(),bottom=row.querySelector('.card-bottom').getBoundingClientRect(),cta=row.querySelector('.text-link').getBoundingClientRect(),box=row.getBoundingClientRect();return bottom.top>=content.bottom-1&&Math.abs(cta.right-box.right)<3})`),'each desktop CTA sits beneath its row and aligns right');

  for (const width of [1440,768,390,320]) {
    await viewport(width,width<600?844:1000);
    await go();
    check(await js('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),`${width}px layout has no horizontal overflow`);
    check(await js(`document.querySelectorAll('.site-header a').length===2&&[...document.querySelectorAll('.site-header a')].every(link=>{const r=link.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth+1})`),`${width}px shows only the two header links`);
    check(await js(`[...document.querySelectorAll('#pages>.learning-card')].every(row=>{const nodes=[...row.querySelector('.card-content').children],rects=nodes.map(node=>node.getBoundingClientRect());return nodes.length===4&&nodes[0].matches('.type-label')&&nodes[1].matches('.format-label')&&nodes[2].matches('h2.resource-title')&&nodes[3].matches('.card-description')&&rects.every((rect,index)=>{if(index===0)return true;const previous=rects[index-1],sameLine=rect.top<previous.bottom&&previous.top<rect.bottom;return sameLine?rect.left>previous.left:rect.top>=previous.bottom-1})})`),`${width}px rows preserve category, format, title and summary order`);
  }

  await viewport(1440,1000);
  await go('reading-list/');
  check(await js(`document.querySelectorAll('[data-resource]').length===2&&!document.querySelector('.collection-hero,.collection-toolbar,#result-count,#empty-state,.site-footer,script[src*="reading-list.js"]')`),'Reading List is a static two-row catalog without catalogue UI or runtime');

  await go('reading-list/forward-deployed-engineer/');
  await js(`document.querySelector('[data-complete]').setAttribute('aria-pressed','true')`);
  const selected=await js(`(${contrast})(['[data-complete]'])`);
  check(selected[0].ratio>=4.5,`selected reader control meets 4.5:1 contrast (${selected[0].ratio.toFixed(2)})`);
  check(await js(`getComputedStyle(document.querySelector('.reading-layout')).gridTemplateColumns.split(' ').length===1&&getComputedStyle(document.querySelector('.reading-sidebar')).position==='static'`),'reader details use one in-flow vertical layout');

  await go('gas-tutorial/');
  check(await js(`getComputedStyle(document.querySelector('.workshop-layout')).gridTemplateColumns.split(' ').length===1&&getComputedStyle(document.querySelector('.workshop-aside')).position==='static'`),'workshop details use one in-flow vertical layout');
  return {passed:checks.length,base:base.href,checks};
} finally {
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
  await viewport(1440,1000);
}
