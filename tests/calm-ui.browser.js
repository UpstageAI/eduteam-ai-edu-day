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
  check(await js(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')].slice(0,4),heights=rows.map(row=>row.getBoundingClientRect().height);return heights.every(height=>height>=44&&height<=66)&&Math.max(...heights)-Math.min(...heights)<=10})()`),'wide-screen material rows are approximately half-height while retaining a usable hit area');
  check(await js(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).map(row=>row.getBoundingClientRect());return rows.slice(1).every((row,index)=>{const overlap=rows[index].bottom-row.top;return overlap>=1&&overlap<=8})})()`),'document sheets overlap slightly without leaving normal flow');
  check(await js(`[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).every(row=>{const surface=getComputedStyle(row,'::before'),stops=[...surface.backgroundImage.matchAll(/rgba\\(91,\\s*95,\\s*233,\\s*([\\d.]+)\\)/g)];return surface.position==='absolute'&&parseFloat(surface.borderTopWidth)===1&&stops.length>=2&&stops.every(stop=>Number(stop[1])>0&&Number(stop[1])<=.2)})`),'each pseudo surface keeps a faint one-pixel violet glass line');
  check(await js(`[...document.querySelectorAll('#pages>.learning-card')].every(row=>{const owner=getComputedStyle(row),summary=getComputedStyle(row.querySelector('.card-description')),link=row.querySelector('.text-link');return owner.transform==='none'&&summary.whiteSpace!=='nowrap'&&summary.textOverflow!=='ellipsis'&&parseFloat(getComputedStyle(link).minHeight)>=44})`),'stable owner hit areas keep all text wrappable and actions reachable');
  check(await js(`!document.querySelector('.home-hero,#catalog-controls,#catalog-search,#catalog-count,#catalog-empty,#catalog-feedback,.site-footer')`),'removed homepage UI is absent rather than hidden');
  check(await js(`[document.querySelector('#resources'),...document.querySelectorAll('#pages>.learning-card')].every(element=>{const s=getComputedStyle(element),r=element.getBoundingClientRect();return s.visibility==='visible'&&parseFloat(s.opacity)===1&&s.transform==='none'&&r.width>0&&r.height>0})`),'all catalog content is immediately visible');

  const target='.learning-card:nth-child(2)';
  await js(`document.querySelector('${target}').scrollIntoView({block:'center',behavior:'instant'})`);
  const ownerRectsBefore=await js(`[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).map(row=>{const r=row.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})`);
  const point=await js(`(()=>{const r=document.querySelector('${target}').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y});
  await sleep(260);
  check(await js(`document.querySelector('${target}').matches(':hover')`),'real mouse enter activates the hovered sheet');
  check(await js(`(()=>{const row=document.querySelector('${target}'),parts=[getComputedStyle(row,'::before'),getComputedStyle(row.querySelector('.card-content')),getComputedStyle(row.querySelector('.card-bottom'))];return parts.every(style=>{const y=new DOMMatrixReadOnly(style.transform).m42;return y<0&&y>=-6})})()`),'hover lifts the pseudo surface and both content layers by at most six pixels');
  check(await js(`(()=>{const row=document.querySelector('${target}'),neighbors=[row.previousElementSibling,row.nextElementSibling];return Number(getComputedStyle(row).zIndex)>Math.max(...neighbors.map(item=>Number(getComputedStyle(item).zIndex)||0))&&getComputedStyle(row,'::before').boxShadow!=='none'})()`),'hovered sheet stays above neighbors with a subtle shadow');
  await sleep(500);
  check(await js(`document.querySelector('${target}').matches(':hover')&&new DOMMatrixReadOnly(getComputedStyle(document.querySelector('${target} .card-content')).transform).m42<0`),'hover lift remains while the pointer lingers');
  const ownerRectsHover=await js(`[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).map(row=>{const r=row.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})`);
  check(ownerRectsBefore.every((rect,row)=>rect.every((value,index)=>Math.abs(value-ownerRectsHover[row][index])<.5)),'hover leaves owner and neighbor geometry stable');
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  await sleep(260);
  check(await js(`!document.querySelector('${target}').matches(':hover')&&new DOMMatrixReadOnly(getComputedStyle(document.querySelector('${target} .card-content')).transform).m42===0`),'mouse leave returns the sheet surface to rest');

  let linkPoint=await js(`(()=>{const r=document.querySelector('${target} .text-link').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:linkPoint.x,y:linkPoint.y});
  await sleep(260);
  linkPoint=await js(`(()=>{const r=document.querySelector('${target} .text-link').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  check(await js(`document.elementFromPoint(${linkPoint.x},${linkPoint.y}).closest('a')===document.querySelector('${target} .text-link')`),'raised CTA remains the pointer hit target');
  await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:linkPoint.x,y:linkPoint.y,button:'left',clickCount:1});
  await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:linkPoint.x,y:linkPoint.y,button:'left',clickCount:1});
  await waitLoad();
  check(await js(`location.pathname.endsWith('/omc-intro/')`),'real click on the raised CTA opens the second material');
  await go();

  await js(`document.querySelector('${target} .text-link').focus()`);
  await sleep(260);
  check(await js(`(()=>{const row=document.querySelector('${target}'),link=row.querySelector('.text-link'),s=getComputedStyle(link);return row.matches(':focus-within')&&new DOMMatrixReadOnly(getComputedStyle(row.querySelector('.card-content')).transform).m42<0&&Number(getComputedStyle(row).zIndex)>0&&s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0})()`),'keyboard focus visibly raises the sheet without losing its outline');
  check(await js(`['${target}::before','${target} .card-content','${target} .card-bottom'].every(selector=>{const pseudo=selector.endsWith('::before'),element=document.querySelector(pseudo?selector.slice(0,-8):selector),s=getComputedStyle(element,pseudo?'::before':null),durations=s.transitionDuration.split(',').map(value=>parseFloat(value)*1000);return durations.some(duration=>duration>=180&&duration<=220)&&durations.every(duration=>duration<=220)})`),'surface lift transitions stay between 180 and 220 milliseconds');

  check(await js(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).map(row=>[...row.querySelector('.card-content').children].map(node=>node.getBoundingClientRect()));return rows.every(fields=>fields.every((field,index)=>index===0||(field.left>=fields[index-1].right-1&&field.top<fields[0].bottom&&fields[0].top<field.bottom)))&&rows.slice(1).every(fields=>fields.every((field,index)=>Math.abs(field.left-rows[0][index].left)<3))})()`),'desktop rows align category, format, title and summary in four baseline-aligned columns');
  check(await js(`[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).every(row=>{const content=row.querySelector('.card-content').getBoundingClientRect(),bottom=row.querySelector('.card-bottom').getBoundingClientRect(),cta=row.querySelector('.text-link').getBoundingClientRect(),box=row.getBoundingClientRect(),sameLine=bottom.top<content.bottom&&content.top<bottom.bottom;return sameLine&&content.right<=bottom.left+1&&Math.abs(cta.right-bottom.right)<3&&bottom.right<=box.right})`),'each desktop CTA is the rightmost inline action');

  for (const width of [1440,768,390,320]) {
    await viewport(width,width<600?844:1000);
    await go();
    check(await js('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),`${width}px layout has no horizontal overflow`);
    check(await js(`document.querySelectorAll('.site-header a').length===2&&[...document.querySelectorAll('.site-header a')].every(link=>{const r=link.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth+1})`),`${width}px shows only the two header links`);
    check(await js(`[...document.querySelectorAll('#pages>.learning-card')].every(row=>{const nodes=[...row.querySelector('.card-content').children],rects=nodes.map(node=>node.getBoundingClientRect()),summary=getComputedStyle(nodes[3]),cta=getComputedStyle(row.querySelector('.text-link'));return nodes.length===4&&nodes[0].matches('.type-label')&&nodes[1].matches('.format-label')&&nodes[2].matches('h2.resource-title')&&nodes[3].matches('.card-description')&&summary.display!=='none'&&summary.visibility==='visible'&&summary.whiteSpace!=='nowrap'&&parseFloat(cta.minHeight)>=44&&rects.every((rect,index)=>{if(index===0)return true;const previous=rects[index-1],sameLine=rect.top<previous.bottom&&previous.top<rect.bottom;return sameLine?rect.left>previous.left:rect.top>=previous.bottom-1})})`),`${width}px rows preserve visible wrapping category, format, title and summary order`);
  }

  await viewport(1440,1000);
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await go();
  await js(`document.querySelector('${target} .text-link').focus()`);
  const reducedPoint=await js(`(()=>{const r=document.querySelector('${target}').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:reducedPoint.x,y:reducedPoint.y});
  check(await js(`(()=>{const row=document.querySelector('${target}'),link=row.querySelector('.text-link'),parts=[getComputedStyle(row,'::before'),getComputedStyle(row.querySelector('.card-content')),getComputedStyle(row.querySelector('.card-bottom'))];return matchMedia('(prefers-reduced-motion: reduce)').matches&&parts.every(style=>new DOMMatrixReadOnly(style.transform).m42===0&&style.boxShadow==='none'&&style.transitionDuration.split(',').every(value=>parseFloat(value)===0))&&getComputedStyle(link).outlineStyle!=='none'&&link.getBoundingClientRect().width>0})()`),'reduced motion removes lifts, shadows, and transitions while preserving focus and links');

  await cdp('Emulation.setEmulatedMedia',{media:'',features:[]});
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await go();
  const coarsePoint=await js(`(()=>{const r=document.querySelector('${target}').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:coarsePoint.x,y:coarsePoint.y});
  await sleep(240);
  check(await js(`(()=>{const row=document.querySelector('${target}'),parts=[getComputedStyle(row,'::before'),getComputedStyle(row.querySelector('.card-content')),getComputedStyle(row.querySelector('.card-bottom'))];return matchMedia('(pointer: coarse)').matches&&matchMedia('(hover: none)').matches&&parts.every(style=>new DOMMatrixReadOnly(style.transform).m42===0)&&row.querySelector('.card-description').getBoundingClientRect().height>0&&parseFloat(getComputedStyle(row.querySelector('.text-link')).minHeight)>=44})()`),'coarse pointers keep the sheet static with visible text and a 44px action');
  const coarseLinkPoint=await js(`(()=>{const r=document.querySelector('${target} .text-link').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  check(await js(`document.elementFromPoint(${coarseLinkPoint.x},${coarseLinkPoint.y}).closest('a')===document.querySelector('${target} .text-link')`),'coarse-pointer CTA remains the direct hit target');
  await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:coarseLinkPoint.x,y:coarseLinkPoint.y}]});
  await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await waitLoad();
  check(await js(`location.pathname.endsWith('/omc-intro/')`),'coarse-pointer CTA click opens the material without hover');
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:false});

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
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:false});
  await cdp('Emulation.setEmulatedMedia',{media:'',features:[]});
  await viewport(1440,1000);
}
