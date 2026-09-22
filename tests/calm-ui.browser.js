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
  check(await js(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')].slice(0,4),heights=rows.map(row=>row.getBoundingClientRect().height);return heights.slice(0,-1).every(height=>height>=70&&height<=90)&&Math.max(...heights)-Math.min(...heights)<=20})()`),'wide-screen material rows stay compact while making room for the next file tab');
  check(await js(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).map(row=>row.getBoundingClientRect());return rows.slice(1).every((row,index)=>{const overlap=rows[index].bottom-row.top;return overlap>=15&&overlap<=17})})()`),'each sheet tucks about sixteen pixels behind the next without leaving normal flow');
  const clearance=String.raw`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')],paperY=row=>{const s=getComputedStyle(row,'::before');return Math.min(row.getBoundingClientRect().top+(s.translate==='none'?0:parseFloat(s.translate.split(' ')[1]||'0')),row.querySelector('.type-label').getBoundingClientRect().top)};return Math.min(...rows.slice(0,-1).map((row,index)=>paperY(rows[index+1])-Math.max(...[...row.querySelectorAll('.resource-title,.card-description,.action-label')].map(node=>node.getBoundingClientRect().bottom))))})()`;
  check(await js(clearance)>=9,'text keeps more clearance above the next sheet than the lift covers');
  check(await js(`[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).every(row=>{const surface=getComputedStyle(row,'::before');return surface.position==='absolute'&&parseFloat(surface.borderTopWidth)===1&&surface.borderTopStyle==='solid'&&surface.borderTopColor===surface.borderLeftColor&&surface.backgroundImage==='none'})`),'each sheet frame is one solid hairline, so overlapping sheets never draw darker seams');
  check(await js(`[...document.querySelectorAll('#pages>.learning-card')].every(row=>{const owner=getComputedStyle(row),summary=getComputedStyle(row.querySelector('.card-description')),link=row.querySelector('.text-link');return owner.transform==='none'&&owner.translate==='none'&&summary.whiteSpace!=='nowrap'&&summary.textOverflow!=='ellipsis'&&parseFloat(getComputedStyle(link).minHeight)>=40})`),'stable owner hit areas keep all text wrappable and actions reachable');
  check(await js(`!document.querySelector('.home-hero,#catalog-controls,#catalog-search,#catalog-count,#catalog-empty,#catalog-feedback,.site-footer')`),'removed homepage UI is absent rather than hidden');
  check(await js(`[document.querySelector('#resources'),...document.querySelectorAll('#pages>.learning-card')].every(element=>{const s=getComputedStyle(element),r=element.getBoundingClientRect();return s.visibility==='visible'&&parseFloat(s.opacity)===1&&s.transform==='none'&&r.width>0&&r.height>0})`),'all catalog content is immediately visible');

  const target='.learning-card:nth-child(2)';
  const until=async(expression,timeout=4000)=>{const start=Date.now();while(Date.now()-start<timeout){if(await js(expression))return true;await sleep(50);}return false;};
  const atRest=()=>until(`[...document.querySelectorAll('#pages>.learning-card')].every(row=>!row.style.getPropertyValue('--sheet-y'))`);

  // Scraps: same-size squares on their own wall, each lifting a corner when pointed at.
  // The wall is filled from notes.md, so wait for that fetch rather than racing it over a real network.
  check(await until(`document.querySelectorAll('#note-wall .note').length>0`),'the wall fills itself from notes.md');
  const wall=await js(`(()=>{const notes=[...document.querySelectorAll('#note-wall .note')];if(!notes.length)return null;const boxes=notes.map(note=>note.getBoundingClientRect());const first=notes[0].getBoundingClientRect();return {count:notes.length,square:boxes.every(box=>Math.abs(box.width-box.height)<1.5),same:boxes.every(box=>Math.abs(box.width-boxes[0].width)<1.5&&Math.abs(box.height-boxes[0].height)<1.5),paper:getComputedStyle(notes[0]).backgroundColor,sheet:getComputedStyle(document.querySelector('#pages>.learning-card'),'::before').backgroundColor,x:first.x+first.width/2,y:first.y+first.height/2,external:[...document.querySelectorAll('#note-wall a')].every(link=>link.target==='_blank'&&link.rel.includes('noopener'))}})()`);
  check(wall&&wall.count>0&&wall.square&&wall.same&&wall.paper!==wall.sheet&&wall.external,`scraps are ${wall&&wall.count} same-size squares of their own paper, linking out in a new tab`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:wall.x,y:wall.y});
  check(await until(`(()=>{const note=document.querySelector('#note-wall .note'),style=getComputedStyle(note),y=Number(style.transform.match(/matrix\\(1, 0, 0, 1, 0, (-?[\\d.]+)\\)/)?.[1]);return y<=-9&&style.boxShadow!=='none'})()`),'pointing at a scrap lifts it off the wall, shadow and all');
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  check(await until(`getComputedStyle(document.querySelector('#note-wall .note')).transform==='none'`),'the scrap settles flat again');

  const layerY=String.raw`row=>[getComputedStyle(row,'::before'),getComputedStyle(row.querySelector('.card-content')),getComputedStyle(row.querySelector('.action-label'))].map(style=>style.translate==='none'?0:parseFloat(style.translate.split(' ')[1]||'0'))`;
  await js(`document.querySelector('${target}').scrollIntoView({block:'center',behavior:'instant'})`);
  const ownerRectsBefore=await js(`[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).map(row=>{const r=row.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})`);
  const actionRectsBefore=await js(`[...document.querySelectorAll('#pages>.learning-card .text-link')].slice(0,4).map(link=>{const r=link.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})`);
  const stackBefore=await js(`[...document.querySelectorAll('#pages>.learning-card')].map(row=>getComputedStyle(row).zIndex).join()`);
  const point=await js(`(()=>{const r=document.querySelector('${target} .resource-title').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y-6});
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y});
  check(await until(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')],lift=(${layerY}),y=rows.map(row=>lift(row));return y.every(layers=>Math.max(...layers)-Math.min(...layers)<.01)&&y[1][0]<=-10&&y[1][0]>=-12.5&&y[0][0]<-.5&&y[0][0]>y[1][0]&&y[2][0]<-.5&&y[2][0]>y[1][0]&&y[3][0]>y[2][0]})()`),'the sheet under the pointer rises most while the sheets beside it rise a little, paper and print in sync');
  check(await js(`[...document.querySelectorAll('#pages>.learning-card')].map(row=>getComputedStyle(row).zIndex).join()==='${stackBefore}'`),'skimming never changes the stacking order');
  check(await js(clearance)>=3.95,'the raised paper and tab stay at least four pixels clear of the text behind');
  await sleep(500);
  check(await js(`(${layerY})(document.querySelector('${target}'))[0]<=-10`),'the lift stays while the pointer lingers');
  const ownerRectsHover=await js(`[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).map(row=>{const r=row.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})`);
  check(ownerRectsBefore.every((rect,row)=>rect.every((value,index)=>Math.abs(value-ownerRectsHover[row][index])<.5)),'skimming leaves owner and neighbor geometry stable');
  const actionRectsHover=await js(`[...document.querySelectorAll('#pages>.learning-card .text-link')].slice(0,4).map(link=>{const r=link.getBoundingClientRect();return [r.x,r.y,r.width,r.height]})`);
  check(actionRectsBefore.every((rect,row)=>rect.every((value,index)=>Math.abs(value-actionRectsHover[row][index])<.5)),'action hit boxes stay fixed even when their visible labels rise');

  // The bulge follows the pointer continuously, not card by card: a slow move inside one
  // sheet shifts its neighbours through many in-between heights.
  const slow=[];
  for (let step=0;step<24;step++) {
    await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y-14+step*1.5});
    await sleep(40);
    slow.push(await js(`(${layerY})(document.querySelector('#pages>.learning-card:nth-child(3)'))[0]`));
  }
  check(new Set(slow.map(y=>y.toFixed(1))).size>=8&&slow.at(-1)<slow[0],`a slow move inside one sheet glides its neighbour through ${new Set(slow.map(y=>y.toFixed(1))).size} heights`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  check(await atRest()&&await js(`[...document.querySelectorAll('#pages>.learning-card')].every(row=>(${layerY})(row).every(y=>y===0))`),'every sheet settles back to rest when the pointer leaves');

  // Sweep the real pointer down and back up at 60fps. A smooth skim never restacks,
  // never separates paper from print, never covers text and never jumps more than a few pixels per frame.
  await js('EduDayPortal.initializeCatalog().then(()=>true)');
  const sweep=await js(`(()=>{const r=[...document.querySelectorAll('#pages>.learning-card')].map(row=>row.getBoundingClientRect());return {x:r[0].x+r[0].width/2,from:r[0].top-56,to:r[r.length-1].bottom+24}})()`);
  await js(`window.__skim=[];(function frame(t){const rows=[...document.querySelectorAll('#pages>.learning-card')];window.__skim.push({t,z:rows.map(row=>getComputedStyle(row).zIndex).join(),y:rows.map(row=>(${layerY})(row)),clear:${clearance}});if(!window.__skimDone)requestAnimationFrame(frame)})(performance.now())`);
  for (const [a,b] of [[sweep.from,sweep.to],[sweep.to,sweep.from]]) {
    for (let step=0;step<=36;step++) { await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:sweep.x,y:a+(b-a)*step/36}); await sleep(16); }
  }
  await atRest();
  await sleep(120); // let the frame recorder log the resting frame before reading it
  const skim=await js(`(()=>{window.__skimDone=true;const frames=window.__skim;let jump=0;for(let i=1;i<frames.length;i++){const dt=Math.max(frames[i].t-frames[i-1].t,1);frames[i].y.forEach((layers,row)=>layers.forEach((y,layer)=>{jump=Math.max(jump,Math.abs(y-frames[i-1].y[row][layer])*16.7/dt)}))}return {frames:frames.length,restacks:new Set(frames.map(frame=>frame.z)).size-1,split:frames.filter(frame=>frame.y.some(layers=>Math.max(...layers)-Math.min(...layers)>.01)).length,jump,clear:Math.min(...frames.map(frame=>frame.clear)),moved:frames.some(frame=>frame.y.some(layers=>layers[0]<-5)),rest:frames.at(-1).y.every(layers=>layers.every(y=>y===0))}})()`);
  check(skim.frames>30&&skim.moved&&skim.restacks===0&&skim.split===0&&skim.jump<=4&&skim.clear>=3.95&&skim.rest,`a real skim is one smooth wave (${skim.frames} frames, ${skim.restacks} restacks, ${skim.split} split frames, max ${skim.jump.toFixed(2)}px/frame, min clearance ${skim.clear.toFixed(1)}px)`);

  // Brush slowly down through a tab. The tint must always sit on the highest sheet and change only once.
  const band=await js(`(()=>{const tab=document.querySelector('#pages>.learning-card:nth-child(3) .type-label').getBoundingClientRect(),box=document.querySelector('#pages>.learning-card:nth-child(3)').getBoundingClientRect();return {x:tab.x+tab.width/2,from:tab.top-14,to:box.top+14,mid:tab.top+tab.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:band.x,y:band.from-6});
  const brush=[];
  for (let y=band.from;y<=band.to;y+=1) {
    await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:band.x,y});
    await sleep(30);
    brush.push(await js(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')],lift=rows.map(row=>(${layerY})(row)[0]),low=Math.min(...lift);return {tinted:rows.findIndex(row=>row.hasAttribute('data-peak')),highest:lift.indexOf(low),low}})()`));
  }
  const tintChanges=brush.slice(1).filter((sample,index)=>sample.tinted!==brush[index].tinted).length;
  const agree=brush.every(sample=>sample.low>-.5||sample.tinted===sample.highest);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:band.x,y:band.mid});
  const onTab=await until(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')],lift=rows.map(row=>(${layerY})(row)[0]);return rows[2].hasAttribute('data-peak')&&lift[2]===Math.min(...lift)&&lift[2]<-6})()`);
  check(agree&&tintChanges<=1&&onTab,`brushing through a tab keeps the tint on the highest sheet with ${tintChanges} tint change, and a tab raises its own sheet`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  await atRest();

  // Uneven rows are where a sheet could rise far enough to reach the text behind it. Add two rows,
  // make one summary wrap onto several lines, then scan the pointer across the drawer.
  await js(`(()=>{const grid=document.querySelector('#pages');for(const name of ['a','b'])grid.append(EduDayPortal.createCard({kind:'page',path:'probe-'+name,name:'확인용 '+name,label:'페이지',description:'짧은 설명입니다.',category:'workshop',href:'./'}));const summary=grid.children[2].querySelector('.card-description');summary.dataset.original=summary.textContent;summary.textContent=Array(9).fill(summary.textContent).join(' ');return true})()`);
  await sleep(100);
  const tall=await js(`(()=>{const r=document.querySelector('#pages').getBoundingClientRect();return {x:r.x+r.width*0.3,top:r.top,bottom:r.bottom}})()`);
  let unevenClear=Infinity;
  for (let y=tall.top-8;y<=tall.bottom;y+=6) {
    await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:tall.x,y});
    await sleep(60);
    unevenClear=Math.min(unevenClear,await js(clearance));
  }
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  check(unevenClear>=3.95&&await atRest(),`uneven rows keep raised tabs at least four pixels clear of the text behind (min ${unevenClear.toFixed(2)}px)`);
  await js(`(()=>{const grid=document.querySelector('#pages');grid.querySelectorAll('[data-resource-key^="probe-"]').forEach(row=>row.remove());const summary=grid.children[2].querySelector('.card-description');summary.textContent=summary.dataset.original;delete summary.dataset.original;return true})()`);
  await sleep(100);


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
  await sleep(400);
  check(await js(`getSelection().toString().includes(document.querySelector('${target} .resource-title').textContent)`)&&await js(`location.href===${JSON.stringify(base.href)}`),'raised folder titles remain selectable with a normal text drag, and the drag does not open the sheet');
  await js('getSelection().removeAllRanges()');
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  await sleep(240);

  let linkPoint=await js(`(()=>{const r=document.querySelector('${target} .text-link').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:linkPoint.x,y:linkPoint.y});
  await sleep(500);
  linkPoint=await js(`(()=>{const r=document.querySelector('${target} .action-label').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  check(await js(`document.elementFromPoint(${linkPoint.x},${linkPoint.y}).closest('a')===document.querySelector('${target} .text-link')`),'raised CTA remains the pointer hit target');
  await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:linkPoint.x,y:linkPoint.y,button:'left',clickCount:1});
  await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:linkPoint.x,y:linkPoint.y,button:'left',clickCount:1});
  await waitLoad();
  check(await js(`location.pathname.endsWith('/omc-intro/')`),'real click on the raised CTA opens the second material');
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  await go();

  const edge=await js(`(()=>{const sheet=document.querySelector('#pages>.learning-card:nth-child(3)'),r=sheet.getBoundingClientRect(),title=sheet.querySelector('.resource-title').getBoundingClientRect();return {x:r.x+r.width*0.55,top:r.top,titleY:title.y+title.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:edge.x,y:edge.titleY});
  await until(`(${layerY})(document.querySelector('#pages>.learning-card:nth-child(3)'))[0]<=-10`);
  const raisedTop=await js(`document.querySelector('#pages>.learning-card:nth-child(3)').getBoundingClientRect().top+(${layerY})(document.querySelector('#pages>.learning-card:nth-child(3)'))[0]`);
  check(await js(`document.elementFromPoint(${edge.x},${raisedTop+4}).closest('.learning-card')===document.querySelector('#pages>.learning-card:nth-child(3)')`),'the strip just below a raised sheet\'s top edge belongs to that raised sheet');
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  await atRest();

  // The whole sheet opens its document: clicking the summary text works like the link.
  check(await js(`getComputedStyle(document.querySelector('${target}')).cursor==='pointer'`),'the whole sheet shows it can be opened');
  await js(`(()=>{window.__named='';addEventListener('pageswap',()=>{const title=document.querySelector('${target} .resource-title');sessionStorage.setItem('vt-name',getComputedStyle(title).viewTransitionName||'none');sessionStorage.setItem('vt-supported',String('onpageswap' in window))});return true})()`);
  const summaryPoint=await js(`(()=>{const r=document.querySelector('${target} .card-description').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:summaryPoint.x,y:summaryPoint.y});
  await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:summaryPoint.x,y:summaryPoint.y,button:'left',clickCount:1});
  await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:summaryPoint.x,y:summaryPoint.y,button:'left',clickCount:1});
  await waitLoad();
  await sleep(400);
  check(await js(`location.pathname.endsWith('/omc-intro/')`),'clicking a sheet\'s summary opens its document');
  check(await js(`sessionStorage.getItem('vt-supported')!=='true'||sessionStorage.getItem('vt-name')==='doc-title'`)&&await js(`getComputedStyle(document.querySelector('.workshop-title')).viewTransitionName==='doc-title'`),'the opened sheet\'s title and the page heading share one transition name');
  await js(`(()=>{sessionStorage.removeItem('vt-name');sessionStorage.removeItem('vt-supported');return true})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  await go();

  await js('document.activeElement.blur()');
  for (let tab=0;tab<20&&!(await js(`document.activeElement===document.querySelector('${target} .text-link')`));tab++) for (const type of ['keyDown','keyUp']) await cdp('Input.dispatchKeyEvent',{type,key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  check(await until(`(()=>{const row=document.querySelector('${target}'),link=row.querySelector('.text-link'),label=getComputedStyle(row.querySelector('.action-label'));return document.activeElement===link&&link.matches(':focus-visible')&&!row.matches(':hover')&&(${layerY})(row).every(y=>y<=-10)&&label.outlineStyle!=='none'&&parseFloat(label.outlineWidth)>0})()`),'keyboard focus raises its sheet the same way with a visible ring');
  check(await js(`(()=>{const row=document.querySelector('${target}'),next=row.nextElementSibling,label=row.querySelector('.action-label'),r=label.getBoundingClientRect(),s=getComputedStyle(label),ring=r.bottom+parseFloat(s.outlineOffset)+parseFloat(s.outlineWidth),paper=next.getBoundingClientRect().top+(${layerY})(next)[0];return ring<paper})()`),'the focus ring stays whole instead of slipping under the next sheet');

  // The pointer takes over from keyboard focus while it is inside the drawer.
  const lastRow=await js(`(()=>{const r=document.querySelector('#pages>.learning-card:nth-child(4) .resource-title').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:lastRow.x,y:lastRow.y-6});
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:lastRow.x,y:lastRow.y});
  check(await until(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')],lift=(${layerY});return document.activeElement===rows[1].querySelector('.text-link')&&lift(rows[1])[0]>-.5&&lift(rows[3])[0]<=-10})()`)&&await js(clearance)>=3.95,'hovering another sheet while a link keeps focus moves the drawer to the pointer and covers no text');
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  await js('document.activeElement.blur()');
  await atRest();

  check(await js(`[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).every(row=>{const box=row.getBoundingClientRect(),type=row.querySelector('.type-label').getBoundingClientRect(),format=row.querySelector('.format-label').getBoundingClientRect(),style=getComputedStyle(row.querySelector('.type-label'));return Math.abs(type.bottom-(box.top+1))<1.5&&Math.abs(format.bottom-type.bottom)<.5&&Math.abs(format.left-type.right)<.5&&type.top<box.top&&parseFloat(style.borderBottomWidth)===0&&style.backgroundColor!=='rgba(0, 0, 0, 0)'})`),'category and format form one file tab rising from the top edge of each sheet');
  check(await js(`(()=>{const line=row=>getComputedStyle(row.querySelector('.type-label')).borderTopColor,rows=[...document.querySelectorAll('#pages>.learning-card')].slice(0,4),work=rows.filter(row=>row.dataset.category==='workshop').map(line),read=rows.filter(row=>row.dataset.category==='reading').map(line);return work.length&&read.length&&new Set(work).size===1&&new Set(read).size===1&&work[0]!==read[0]&&rows.every(row=>getComputedStyle(row.querySelector('.format-label')).borderTopColor===line(row))})()`),'each category gives its whole tab one soft outline color');
  const tabLine=`getComputedStyle(document.querySelector('#pages>.learning-card:nth-child(3) .type-label')).borderTopColor`;
  const restLine=await js(tabLine);
  const thirdTitle=await js(`(()=>{const r=document.querySelector('#pages>.learning-card:nth-child(3) .resource-title').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:thirdTitle.x,y:thirdTitle.y});
  await sleep(300);
  const hoverLine=await js(tabLine);
  const otherLine=await js(`getComputedStyle(document.querySelector('#pages>.learning-card:nth-child(4) .type-label')).borderTopColor`);
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  await sleep(300);
  const rgbSum=value=>value.match(/[\d.]+/g).slice(0,3).map(Number).reduce((a,b)=>a+b,0);
  check(hoverLine!==restLine&&rgbSum(hoverLine)<rgbSum(restLine)&&otherLine===restLine&&await js(tabLine)===restLine,'the selected sheet deepens only its own tab outline and returns when the pointer leaves');
  await atRest();
  check(await js(`(()=>{const rows=[...document.querySelectorAll('#pages>.learning-card')].slice(0,4).map(row=>['.type-label','.resource-title','.card-description'].map(selector=>row.querySelector(selector).getBoundingClientRect()));return rows.every(([tab,title,summary])=>title.top>=tab.bottom&&summary.left>title.right&&summary.top<title.bottom&&title.top<summary.bottom)&&rows.slice(1).every(row=>row.every((rect,index)=>Math.abs(rect.left-rows[0][index].left)<3))})()`),'desktop rows put title and summary side by side under the tab, aligned across rows');
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
  check(await js(`(()=>{const row=document.querySelector('${target}'),link=row.querySelector('.text-link'),parts=[getComputedStyle(row,'::before'),getComputedStyle(row.querySelector('.card-content')),getComputedStyle(row.querySelector('.action-label'))];return matchMedia('(prefers-reduced-motion: reduce)').matches&&row.matches(':hover')&&parts.every(style=>style.translate==='none')&&!row.style.getPropertyValue('--sheet-y')&&link.getBoundingClientRect().width>0})()`),'reduced motion keeps brushed sheets still with no transitions while links stay usable');
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
  check(await js(`document.querySelectorAll('[data-resource]').length===4&&!document.querySelector('.collection-hero,.collection-toolbar,#result-count,#empty-state,.site-footer,script[src*="reading-list.js"]')`),'Reading List is a static catalog without catalogue UI or runtime');

  await go('reading-list/forward-deployed-engineer/');
  check(await js(`document.querySelector('main.reader-body[data-reader] h1') && !document.querySelector('.reading-progress,.reading-toolbar,.reading-sidebar,.article-end,.breadcrumb,[data-reader-control]')`),'reader keeps article content without auxiliary chrome');

  const heads=[];
  for (const page of ['gas-tutorial/','omc-intro/','reading-list/externalization-llm-agents/','reading-list/forward-deployed-engineer/']) {
    await go(page);
    heads.push(await js(`(()=>{const back=document.querySelector('.back a').getBoundingClientRect(),title=document.querySelector('h1'),box=title.getBoundingClientRect(),style=getComputedStyle(title);return [Math.round(back.x),Math.round(back.y),Math.round(box.x+box.width/2),Math.round(box.y),style.fontSize,style.fontWeight,style.textAlign].join()})()`));
  }
  check(new Set(heads).size===1&&await js(`!document.querySelector('.breadcrumb')`),`every detail page places its back link and centered title identically (${heads[0]})`);
  await go('gas-tutorial/');
  check(await js(`getComputedStyle(document.querySelector('.workshop-layout')).gridTemplateColumns.split(' ').length===1&&getComputedStyle(document.querySelector('.workshop-aside')).position==='static'`),'workshop details use one in-flow vertical layout');
  return {passed:checks.length,base:base.href,checks};
} finally {
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:false});
  await cdp('Emulation.setEmulatedMedia',{media:'',features:[]});
  await viewport(1440,1000);
}
