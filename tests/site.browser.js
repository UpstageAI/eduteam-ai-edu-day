// chromux run <session> --file tests/site.browser.js --arg base=http://127.0.0.1:8000/
const base = new URL(args.base || 'http://127.0.0.1:8000/');
const passed = [];
function check(ok, label) { if (!ok) throw new Error(label); passed.push(label); }
async function go(path='') {
  await cdp('Page.navigate',{url:new URL(path,base).href});
  await waitLoad();
  await waitFor('main');
}
async function viewport(width,height=900) {
  await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
}
const tracking = await cdp('Page.addScriptToEvaluateOnNewDocument',{source:'window.__siteErrors=[];addEventListener("error",e=>{if(e.message)window.__siteErrors.push(e.message)});'});
try {
  await viewport(1440,1100);
  await go();
  check(await js('document.title==="AI Edu Day · Upstage Education"'), 'new portal is the repository root');
  check(await js('document.querySelectorAll("#pages [data-resource-key]").length===4'), 'four canonical materials appear immediately');
  check(await js('!document.querySelector("#catalog-controls").hidden'), 'catalog controls progressively enhance');
  await js('window.__originalCards=[...document.querySelectorAll("#pages [data-resource-key]")];');
  await js('document.querySelector("[data-category-filter=workshop]").click()');
  check(await js('document.querySelectorAll("#pages [data-resource-key]:not([hidden])").length===2'), 'workshop filter selects both workshop entries');
  await js('document.querySelector("[data-category-filter=reading]").click()');
  check(await js('document.querySelectorAll("#pages [data-resource-key]:not([hidden])").length===2'), 'reading filter selects both reading resources');
  await js('const s=document.querySelector("#catalog-search");s.value="fde";s.dispatchEvent(new Event("input",{bubbles:true}))');
  check(await js('document.querySelectorAll("#pages [data-resource-key]:not([hidden])").length===1 && document.querySelector("#catalog-count").textContent.startsWith("1")'), 'search combines with the current category');
  await js('document.querySelector("[data-category-filter=workshop]").click()');
  check(await js('!document.querySelector("#catalog-empty").hidden'), 'incompatible filters show an empty state');
  await js('document.querySelector("#catalog-reset").click()');
  check(await js('document.querySelectorAll("#pages [data-resource-key]:not([hidden])").length===4 && document.activeElement.id==="catalog-search"'), 'reset restores cards and focuses search');
  check(await js('window.__originalCards.every(c=>c.isConnected && c.querySelector(".card-visual"))'), 'search and discovery preserve original visual card nodes');
  await js('document.querySelectorAll("img").forEach(i=>i.loading="eager")');
  await waitFor(null,{kind:'network-idle'});
  check(await js('[...document.images].every(i=>i.complete && i.naturalWidth>0)'), 'source thumbnails decode without cropping substitutions');

  // Exercise keyboard navigation through the real input event path.
  await go();
  for (const type of ['keyDown','keyUp']) await cdp('Input.dispatchKeyEvent',{type,key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  check(await js('document.activeElement.classList.contains("skip-link")'), 'skip link is the first keyboard destination');
  for (const type of ['keyDown','keyUp']) await cdp('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  check(await js('document.activeElement.id==="content"'), 'skip link transfers focus to the main content');
  await js('document.querySelector(".hero-content .button-primary").click()');
  check(await js('location.hash==="#resources"'), 'hero primary action navigates to the actual catalog');

  for (const width of [1440,768,390,320]) {
    await viewport(width,width<600?844:1000);
    for (const path of ['', 'gas-tutorial/', 'omc-intro/', 'reading-list/', 'reading-list/forward-deployed-engineer/', 'reading-list/externalization-llm-agents/']) {
      await go(path);
      check(await js('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'), `${width}px viewport without page overflow: ${path||'home'}`);
      check(await js('!window.__siteErrors.length'), `no script errors: ${width}px ${path||'home'}`);
    }
  }
  await viewport(1440,1000);
  await go('gas-tutorial/');
  check(await js('getComputedStyle(document.querySelector(".workshop-layout")).display==="grid" && document.querySelectorAll(".lesson-item").length===4'), 'GAS has styled orientation and four exercise stages');
  let links = await js('[...document.querySelectorAll("main a[href]")].map(a=>a.href)');
  for (const link of links) {
    if (new URL(link).origin!==base.origin) continue;
    check(await js(`fetch(${JSON.stringify(link)}).then(r=>r.ok)`), `GAS material loads: ${new URL(link).pathname}`);
  }
  await js('document.querySelector(".workshop-hero .button-primary").click()');
  await waitLoad();
  check(await js('location.pathname.endsWith("gas-tutorial/slides-gas-tutorial/dist/presentation.html") && document.querySelectorAll("section.slide").length===36'), 'GAS start action opens the intact 36-slide presentation');
  await go('omc-intro/');
  check(await js('document.querySelector("h1").textContent.includes("Oh-my-claude-code")'), 'OMC uses the actual source title');
  const pdf = await js('[...document.links].find(a=>a.pathname.endsWith("presentation.pdf")).href');
  check(await js(`fetch(${JSON.stringify(pdf)}).then(r=>r.ok && r.headers.get('content-type').includes('pdf'))`), 'original OMC PDF is downloadable');
  await js('document.querySelector(".workshop-hero .button-primary").click()');
  await waitLoad();
  check(await js('document.querySelectorAll("section.slide").length===20'), 'OMC start action opens all 20 original slides');

  const offlineScript = await cdp('Page.addScriptToEvaluateOnNewDocument',{source:'const realFetch=window.fetch;window.fetch=(u,...a)=>String(u).includes("api.github.com")?Promise.reject(new Error("offline test")):realFetch(u,...a);'});
  try {
    await go();
    check(await js('document.querySelectorAll("#pages [data-resource-key]").length===4 && !document.querySelector("#catalog-controls").hidden'), 'API failure leaves the designed catalog and controls usable');
  } finally { await cdp('Page.removeScriptToEvaluateOnNewDocument',{identifier:offlineScript.identifier}); }
  const blockedStorage = await cdp('Page.addScriptToEvaluateOnNewDocument',{source:'Object.defineProperty(window,"localStorage",{get(){throw new Error("blocked")}});'});
  try {
    await go();
    check(await js('[...document.querySelectorAll("[data-card-status]")].every(s=>s.hidden) && !window.__siteErrors.length'), 'blocked storage hides optional status without breaking the portal');
  } finally { await cdp('Page.removeScriptToEvaluateOnNewDocument',{identifier:blockedStorage.identifier}); }
  await cdp('Emulation.setScriptExecutionDisabled',{value:true});
  try {
    await go();
    check(await js('document.querySelectorAll("#pages [data-resource-key]").length===4 && document.querySelector("#catalog-controls").hidden'), 'no-JavaScript portal has all four resources and no dead controls');
    await go('gas-tutorial/');
    check(await js('!!document.querySelector(".workshop-hero .button-primary") && document.querySelectorAll(".lesson-item").length===4'), 'no-JavaScript workshop retains primary action and materials');
  } finally { await cdp('Emulation.setScriptExecutionDisabled',{value:false}); }
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await go();
  check(await js('getComputedStyle(document.documentElement).scrollBehavior==="auto"'), 'reduced-motion preference is respected');
  await cdp('Emulation.setEmulatedMedia',{media:'print',features:[]});
  check(await js('getComputedStyle(document.querySelector(".hero-art")).display==="none"'), 'print mode omits decorative hero art');
  return { passed:passed.length, base:base.href, checks:passed };
} finally {
  await cdp('Emulation.setScriptExecutionDisabled',{value:false});
  await cdp('Emulation.setEmulatedMedia',{media:'',features:[]});
  await cdp('Page.removeScriptToEvaluateOnNewDocument',{identifier:tracking.identifier});
  await viewport(1440,1000);
}
