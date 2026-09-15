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
  check(await js(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')].slice(0,4),heights=rows.map(row=>row.getBoundingClientRect().height);return heights.every(height=>height>=44&&height<=66)&&Math.max(...heights)-Math.min(...heights)<=10})()`),'wide-screen material rows stay compact while retaining a usable hit area');
  check(await js(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).map(row=>row.getBoundingClientRect());return rows.slice(1).every((row,index)=>{const overlap=rows[index].bottom-row.top;return overlap>=15&&overlap<=17})})()`),'each sheet tucks about sixteen pixels behind the next without leaving normal flow');
  const clearance=String.raw`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')],paperY=row=>{const s=getComputedStyle(row,'::before');return row.getBoundingClientRect().top+(s.translate==='none'?0:parseFloat(s.translate.split(' ')[1]||'0'))};return Math.min(...rows.slice(0,-1).map((row,index)=>paperY(rows[index+1])-Math.max(...[...row.querySelectorAll('.card-content>*,.action-label')].map(node=>node.getBoundingClientRect().bottom))))})()`;
  check(await js(clearance)>=9,'text keeps more clearance above the next sheet than the lift covers');
  check(await js(`[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).every(row=>{const surface=getComputedStyle(row,'::before'),stops=[...surface.backgroundImage.matchAll(/rgba\\(91,\\s*95,\\s*233,\\s*([\\d.]+)\\)/g)];return surface.position==='absolute'&&parseFloat(surface.borderTopWidth)===1&&stops.length>=2&&stops.every(stop=>Number(stop[1])>0&&Number(stop[1])<=.2)})`),'each pseudo surface keeps a faint one-pixel violet glass line');
  check(await js(`[...document.querySelectorAll('#pages>.learning-card')].every(row=>{const owner=getComputedStyle(row),summary=getComputedStyle(row.querySelector('.card-description')),link=row.querySelector('.text-link');return owner.transform==='none'&&owner.translate==='none'&&summary.whiteSpace!=='nowrap'&&summary.textOverflow!=='ellipsis'&&parseFloat(getComputedStyle(link).minHeight)>=40})`),'stable owner hit areas keep all text wrappable and actions reachable');
  check(await js(`!document.querySelector('.home-hero,#catalog-controls,#catalog-search,#catalog-count,#catalog-empty,#catalog-feedback,.site-footer')`),'removed homepage UI is absent rather than hidden');
  check(await js(`[document.querySelector('#resources'),...document.querySelectorAll('#pages>.learning-card')].every(element=>{const s=getComputedStyle(element),r=element.getBoundingClientRect();return s.visibility==='visible'&&parseFloat(s.opacity)===1&&s.transform==='none'&&r.width>0&&r.height>0})`),'all catalog content is immediately visible');

  const target='.learning-card:nth-child(2)';
  const layerY=String.raw`row=>[getComputedStyle(row,'::before'),getComputedStyle(row.querySelector('.card-content')),getComputedStyle(row.querySelector('.action-label'))].map(style=>style.translate==='none'?0:parseFloat(style.translate.split(' ')[1]||'0'))`;
  await js(`document.querySelector('${target}').scrollIntoView({block:'center',behavior:'instant'})`);
  const ownerRectsBefore=await js(`[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).map(row=>{const r=row.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})`);
  const actionRectsBefore=await js(`[...document.querySelectorAll('#pages>.learning-card .text-link')].slice(0,4).map(link=>{const r=link.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})`);
  const stackBefore=await js(`[...document.querySelectorAll('#pages>.learning-card')].map(row=>getComputedStyle(row).zIndex).join()`);
  const point=await js(`(()=>{const r=document.querySelector('${target}').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+14}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y});
  await sleep(40);
  check(await js(`document.querySelector('${target}').matches(':hover')&&getComputedStyle(document.querySelector('${target} .card-content')).transitionDuration==='0.28s'`),'real mouse enter starts the quick 280ms rise');
  await sleep(560);
  check(await js(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')],lift=(${layerY});return lift(rows[1]).every(y=>y<=-7.5&&y>=-8.5)&&lift(rows[0]).every(y=>y===0)&&rows.slice(2).every(row=>lift(row).every(y=>y>=3.5&&y<=4.5))})()`),'the brushed sheet rises eight pixels in sync while sheets in front lean four and the one behind stays');
  check(await js(`[...document.querySelectorAll('#pages>.learning-card')].map(row=>getComputedStyle(row).zIndex).join()==='${stackBefore}'&&getComputedStyle(document.querySelector('${target}'),'::before').boxShadow!=='none'`),'hover keeps the stacking order and casts a faint shadow on the sheet behind');
  check(await js(clearance)>=0.5,'the raised paper never covers any text on the sheet behind it');
  check(await js(`document.querySelector('${target}').matches(':hover')&&getComputedStyle(document.querySelector('${target} .card-content')).translate!=='none'`),'hover lift remains while the pointer lingers');
  const ownerRectsHover=await js(`[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).map(row=>{const r=row.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})`);
  check(ownerRectsBefore.every((rect,row)=>rect.every((value,index)=>Math.abs(value-ownerRectsHover[row][index])<.5)),'hover leaves owner and neighbor geometry stable');
  const actionRectsHover=await js(`[...document.querySelectorAll('#pages>.learning-card .text-link')].slice(0,4).map(link=>{const r=link.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})`);
  check(actionRectsBefore.every((rect,row)=>rect.every((value,index)=>Math.abs(value-actionRectsHover[row][index])<.5)),'action hit boxes stay fixed even when their visible labels rise');
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  await sleep(40);
  check(await js(`!document.querySelector('${target}').matches(':hover')&&getComputedStyle(document.querySelector('${target} .card-content')).transitionDuration==='0.46s'`),'mouse leave settles on the slower 460ms curve');
  await sleep(700);
  check(await js(`[...document.querySelectorAll('#pages>.learning-card')].every(row=>(${layerY})(row).every(y=>y===0))`),'every sheet returns to rest');

  // Sweep the real pointer down and back up at 60fps. A smooth skim never restacks,
  // never separates paper from print and never jumps more than a few pixels per frame.
  await js('EduDayPortal.initializeCatalog().then(()=>true)');
  const sweep=await js(`(()=>{const r=[...document.querySelectorAll('#pages>.learning-card')].map(row=>row.getBoundingClientRect());return {x:r[0].x+r[0].width/2,from:r[0].top-24,to:r[r.length-1].bottom+24}})()`);
  await js(`window.__skim=[];(function frame(t){const rows=[...document.querySelectorAll('#pages>.learning-card')];window.__skim.push({t,z:rows.map(row=>getComputedStyle(row).zIndex).join(),y:rows.map(row=>(${layerY})(row))});if(!window.__skimDone)requestAnimationFrame(frame)})(performance.now())`);
  for (const [a,b] of [[sweep.from,sweep.to],[sweep.to,sweep.from]]) {
    for (let step=0;step<=36;step++) { await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:sweep.x,y:a+(b-a)*step/36}); await sleep(16); }
  }
  await sleep(700);
  const skim=await js(`(()=>{window.__skimDone=true;const frames=window.__skim;let jump=0;for(let i=1;i<frames.length;i++){const dt=Math.max(frames[i].t-frames[i-1].t,1);frames[i].y.forEach((layers,row)=>layers.forEach((y,layer)=>{jump=Math.max(jump,Math.abs(y-frames[i-1].y[row][layer])*16.7/dt)}))}return {frames:frames.length,restacks:new Set(frames.map(frame=>frame.z)).size-1,split:frames.filter(frame=>frame.y.some(layers=>Math.max(...layers)-Math.min(...layers)>.01)).length,jump,moved:frames.some(frame=>frame.y.some(layers=>layers[0]!==0)),rest:frames.at(-1).y.every(layers=>layers.every(y=>y===0))}})()`);
  check(skim.frames>30&&skim.moved&&skim.restacks===0&&skim.split===0&&skim.jump<=4&&skim.rest,`a real skim is one smooth wave (${skim.frames} frames, ${skim.restacks} restacks, ${skim.split} split frames, max ${skim.jump.toFixed(2)}px/frame)`);

  // Visit every fixed row slot in both directions, including the action column.
  // A raised folder must not trap the pointer over a neighboring folder's target.
  const drawerSlots=await js(`[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).map(row=>{const r=row.getBoundingClientRect(),title=row.querySelector('.resource-title').getBoundingClientRect(),summary=row.querySelector('.card-description').getBoundingClientRect();return {title:title.x+title.width/2,summary:summary.x+summary.width/2,action:r.right-56,y:title.y+title.height/2}})`);
  for (const column of ['title','summary','action']) {
    for (const index of [0,1,2,3,2,1,0]) {
      await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:drawerSlots[index][column],y:drawerSlots[index].y});
      await sleep(230);
      check(await js(`document.querySelectorAll('#pages>.learning-card')[${index}].matches(':hover')`),`drawer ${column} pass selects folder ${index+1} without being trapped`);
    }
  }
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  await sleep(240);

  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:drawerSlots[1].title,y:drawerSlots[1].y});
  await sleep(240);
  await js('getSelection().removeAllRanges()');
  const titleRange=await js(`(()=>{const r=document.querySelector('${target} .resource-title').getBoundingClientRect();return {x:r.x+2,end:r.right-2,y:r.y+r.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:titleRange.x,y:titleRange.y,button:'left',clickCount:1});
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:titleRange.end,y:titleRange.y,button:'left',buttons:1});
  await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:titleRange.end,y:titleRange.y,button:'left',clickCount:1});
  check(await js(`getSelection().toString().includes(document.querySelector('${target} .resource-title').textContent)`),'raised folder titles remain selectable with a normal text drag');
  await js('getSelection().removeAllRanges()');
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  await sleep(240);

  let linkPoint=await js(`(()=>{const r=document.querySelector('${target} .text-link').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:linkPoint.x,y:linkPoint.y});
  await sleep(400);
  linkPoint=await js(`(()=>{const r=document.querySelector('${target} .action-label').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  check(await js(`document.elementFromPoint(${linkPoint.x},${linkPoint.y}).closest('a')===document.querySelector('${target} .text-link')`),'raised CTA remains the pointer hit target');
  await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:linkPoint.x,y:linkPoint.y,button:'left',clickCount:1});
  await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:linkPoint.x,y:linkPoint.y,button:'left',clickCount:1});
  await waitLoad();
  check(await js(`location.pathname.endsWith('/omc-intro/')`),'real click on the raised CTA opens the second material');
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  await go();

  await js('document.activeElement.blur()');
  for (let tab=0;tab<20&&!(await js(`document.activeElement===document.querySelector('${target} .text-link')`));tab++) for (const type of ['keyDown','keyUp']) await cdp('Input.dispatchKeyEvent',{type,key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await sleep(400);
  check(await js(`(()=>{const row=document.querySelector('${target}'),link=row.querySelector('.text-link'),label=getComputedStyle(row.querySelector('.action-label'));return document.activeElement===link&&link.matches(':focus-visible')&&!row.matches(':hover')&&(${layerY})(row).every(y=>y<-7)&&label.outlineStyle!=='none'&&parseFloat(label.outlineWidth)>0})()`),'keyboard focus raises the sheet the same way with a visible ring');
  check(await js(`(()=>{const row=document.querySelector('${target}'),next=row.nextElementSibling,label=row.querySelector('.action-label'),r=label.getBoundingClientRect(),s=getComputedStyle(label),ring=r.bottom+parseFloat(s.outlineOffset)+parseFloat(s.outlineWidth);return ring<next.getBoundingClientRect().top})()`),'the focus ring stays whole instead of slipping under the next sheet');

  // Keyboard focus and the pointer never move the drawer at the same time.
  const lastRow=await js(`(()=>{const r=document.querySelector('#pages>.learning-card:nth-child(4) .resource-title').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:lastRow.x,y:lastRow.y});
  await sleep(700);
  check(await js(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')],lift=(${layerY});return document.activeElement===rows[1].querySelector('.text-link')&&lift(rows[1]).every(y=>y===0)&&lift(rows[2]).every(y=>y===0)&&lift(rows[3]).every(y=>y<-7)})()`)&&await js(clearance)>=0.5,'hovering another sheet while a link keeps focus moves only the hovered sheet and covers no text');
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  await sleep(700);
  await js('document.activeElement.blur()');

  check(await js(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).map(row=>[...row.querySelector('.card-content').children].map(node=>node.getBoundingClientRect()));return rows.every(fields=>fields.every((field,index)=>index===0||(field.left>=fields[index-1].right-1&&field.top<fields[0].bottom&&fields[0].top<field.bottom)))&&rows.slice(1).every(fields=>fields.every((field,index)=>Math.abs(field.left-rows[0][index].left)<3))})()`),'desktop rows align category, format, title and summary in four baseline-aligned columns');
  check(await js(`[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).every(row=>{const content=row.querySelector('.card-content').getBoundingClientRect(),bottom=row.querySelector('.card-bottom').getBoundingClientRect(),cta=row.querySelector('.text-link').getBoundingClientRect(),box=row.getBoundingClientRect(),sameLine=bottom.top<content.bottom&&content.top<bottom.bottom;return sameLine&&content.right<=bottom.left+1&&Math.abs(cta.right-bottom.right)<3&&bottom.right<=box.right})`),'each desktop CTA is the rightmost inline action');

  for (const width of [1440,768,390,320]) {
    await viewport(width,width<600?844:1000);
    await go();
    check(await js(clearance)>=9,`${width}px text keeps clearance above the next sheet`);
    check(await js('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),`${width}px layout has no horizontal overflow`);
    check(await js(`document.querySelectorAll('.site-header a').length===2&&[...document.querySelectorAll('.site-header a')].every(link=>{const r=link.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth+1})`),`${width}px shows only the two header links`);
    check(await js(`[...document.querySelectorAll('#pages>.learning-card')].every(row=>{const nodes=[...row.querySelector('.card-content').children],rects=nodes.map(node=>node.getBoundingClientRect()),summary=getComputedStyle(nodes[3]),cta=getComputedStyle(row.querySelector('.text-link'));return nodes.length===4&&nodes[0].matches('.type-label')&&nodes[1].matches('.format-label')&&nodes[2].matches('h2.resource-title')&&nodes[3].matches('.card-description')&&summary.display!=='none'&&summary.visibility==='visible'&&summary.whiteSpace!=='nowrap'&&parseFloat(cta.minHeight)>=40&&rects.every((rect,index)=>{if(index===0)return true;const previous=rects[index-1],sameLine=rect.top<previous.bottom&&previous.top<rect.bottom;return sameLine?rect.left>previous.left:rect.top>=previous.bottom-1})})`),`${width}px rows preserve visible wrapping category, format, title and summary order`);
  }

  await viewport(1440,1000);
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await go();
  const reducedPoint=await js(`(()=>{const r=document.querySelector('${target}').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:reducedPoint.x,y:reducedPoint.y});
  await sleep(300);
  check(await js(`(()=>{const row=document.querySelector('${target}'),link=row.querySelector('.text-link'),parts=[getComputedStyle(row,'::before'),getComputedStyle(row.querySelector('.card-content')),getComputedStyle(row.querySelector('.action-label'))];return matchMedia('(prefers-reduced-motion: reduce)').matches&&row.matches(':hover')&&parts.every(style=>style.translate==='none'&&style.transitionDuration.split(',').every(value=>parseFloat(value)===0))&&link.getBoundingClientRect().width>0})()`),'reduced motion keeps brushed sheets still with no transitions while links stay usable');
  await js(`document.querySelector('${target} .text-link').focus({focusVisible:true})`);
  check(await js(`(()=>{const label=getComputedStyle(document.querySelector('${target} .action-label'));return document.querySelector('${target} .text-link').matches(':focus-visible')&&label.outlineStyle!=='none'&&parseFloat(label.outlineWidth)>0&&label.translate==='none'})()`),'reduced motion keeps a visible focus ring without movement');

  await cdp('Emulation.setEmulatedMedia',{media:'',features:[]});
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await go();
  const coarsePoint=await js(`(()=>{const r=document.querySelector('${target}').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:coarsePoint.x,y:coarsePoint.y});
  await sleep(240);
  check(await js(`(()=>{const row=document.querySelector('${target}'),parts=[getComputedStyle(row,'::before'),getComputedStyle(row.querySelector('.card-content')),getComputedStyle(row.querySelector('.action-label'))];return matchMedia('(pointer: coarse)').matches&&matchMedia('(hover: none)').matches&&parts.every(style=>style.translate==='none'||parseFloat(style.translate.split(' ')[1]||'0')===0)&&row.querySelector('.card-description').getBoundingClientRect().height>0&&parseFloat(getComputedStyle(row.querySelector('.text-link')).minHeight)>=44})()`),'coarse pointers keep the sheet static with visible text and a 44px action');
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
  check(await js(`document.querySelector('main.reader-body[data-reader] h1') && !document.querySelector('.reading-progress,.reading-toolbar,.reading-sidebar,.article-end,.breadcrumb,[data-reader-control]')`),'reader keeps article content without auxiliary chrome');

  await go('gas-tutorial/');
  check(await js(`getComputedStyle(document.querySelector('.workshop-layout')).gridTemplateColumns.split(' ').length===1&&getComputedStyle(document.querySelector('.workshop-aside')).position==='static'`),'workshop details use one in-flow vertical layout');
  return {passed:checks.length,base:base.href,checks};
} finally {
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:false});
  await cdp('Emulation.setEmulatedMedia',{media:'',features:[]});
  await viewport(1440,1000);
}
