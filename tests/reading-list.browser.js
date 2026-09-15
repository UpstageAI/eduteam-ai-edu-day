// Run with an already open isolated Chrome session:
// chromux run <session> --file tests/reading-list.browser.js --arg base=http://127.0.0.1:8000/
// This test only modifies reading-list storage keys in that test browser.
const base = new URL(args.base || 'http://127.0.0.1:8000/');
const results = [];
const check = (condition, message) => { if (!condition) throw new Error(message); results.push(message); };
async function go(path) {
  await cdp('Page.navigate', { url: new URL(path,base).href });
  await waitLoad();
  await waitFor('main, body');
}
const viewport = async (width,height,mobile=false) => cdp('Emulation.setDeviceMetricsOverride', { width,height,deviceScaleFactor:1,mobile });
const noOverflow = async () => js('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1');
const errorScript = await cdp('Page.addScriptToEvaluateOnNewDocument', {source: 'window.__readingErrors=[];window.addEventListener("error",e=>window.__readingErrors.push(e.message));'});
try {
  await viewport(1440,1000);
  await go('reading-list/');
  await js(`Object.keys(localStorage).filter(k=>k.startsWith('edu-reading-list:v1:')).forEach(k=>localStorage.removeItem(k));`);
  check(await js('document.querySelectorAll("[data-resource]").length===2'), 'collection has two static resource cards');
  await js('document.querySelector("[data-filter=agents]").click()');
  check(await js('document.querySelectorAll("[data-resource]:not([hidden])").length===1 && !document.querySelector("[data-resource=externalization-llm-agents]").hidden'), 'topic filter selects the matching resource');
  await js('document.querySelector("[data-filter=all]").click();const s=document.querySelector("#resource-search");s.value="FDE";s.dispatchEvent(new Event("input",{bubbles:true}));');
  check(await js('document.querySelectorAll("[data-resource]:not([hidden])").length===1 && !document.querySelector("[data-resource=forward-deployed-engineer]").hidden'), 'case-insensitive keyword search finds FDE');
  await js('const s=document.querySelector("#resource-search");s.value="not-a-resource";s.dispatchEvent(new Event("input",{bubbles:true}));');
  check(await js('!document.querySelector("#empty-state").hidden'), 'search has an accessible empty state');
  await js('document.querySelector("#reset-filters").click()');
  check(await js('document.querySelectorAll("[data-resource]:not([hidden])").length===2 && document.activeElement.id==="resource-search"'), 'reset restores all cards and focuses the search field');
  check(await noOverflow(), 'desktop collection has no horizontal overflow');
  await go('reading-list/');
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  check(await js('document.activeElement.classList.contains("skip-link")'), 'keyboard navigation reaches the skip link first');
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  check(await js('document.activeElement.id==="content"'), 'skip link moves keyboard focus to the main content');


  await go('reading-list/forward-deployed-engineer/');
  check(await js('document.querySelectorAll(".source-figure img").length===3'), 'article preserves all three original images');
  await js('document.querySelector(".source-gallery").open=true;document.querySelectorAll("img").forEach(img=>img.loading="eager")');
  await js('Promise.all([...document.images].map(image => image.decode())).then(() => true)');
  check(await js('[...document.images].every(img=>img.complete && img.naturalWidth>0)'), 'all original images decode successfully');
  await js('document.querySelector("[data-size=larger]").click()');
  check(await js('getComputedStyle(document.querySelector("[data-reader]")).fontSize==="20px"'), 'font-size control changes the reader text');
  await js('document.querySelector("[data-complete]").click()');
  await go('reading-list/forward-deployed-engineer/');
  check(await js('document.querySelector("[data-complete]").getAttribute("aria-pressed")==="true" && document.querySelector("[data-size-output]").textContent==="20px"'), 'reading status and type size persist after navigation');
  await js('document.querySelector("[data-complete]").click()');
  check(await js('document.querySelector("[data-complete]").getAttribute("aria-pressed")==="false"'), 'completion can be undone');
  await js('document.querySelector("[data-complete]").click();window.scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"})');
  await sleep(150);
  check(await js('document.querySelector("[data-percent]").textContent==="100%"'), 'scroll progress reaches 100 percent at the end');
  await go('reading-list/');
  check(await js('document.querySelector("[data-resource=forward-deployed-engineer] [data-read-state]").dataset.complete==="true"'), 'collection reflects saved reading status');

  for (const [width,height] of [[390,844],[320,740]]) {
    await viewport(width,height,true);
    for (const path of ['reading-list/','reading-list/forward-deployed-engineer/','reading-list/externalization-llm-agents/','reading-list/externalization-llm-agents/slides-externalization-llm-agents/dist/eli5.html','reading-list/externalization-llm-agents/slides-externalization-llm-agents/dist/presentation.html']) {
      await go(path);
      check(await noOverflow(), `${width}px no horizontal overflow: ${path}`);
      check(await js('!(window.__readingErrors || []).length'), `no browser script errors: ${width}px ${path}`);
    }
  }
  await go('externalization-llm-agents/slides-externalization-llm-agents/dist/presentation.html?from=bookmark#s3');
  await waitFor('[data-reader]');
  check(await js('location.pathname.includes("reading-list/externalization-llm-agents/") && location.hash==="#s3" && location.search==="?from=bookmark" && !!document.querySelector("#s3")'), 'old deep links preserve queries and section anchors');
  await go('externalization-llm-agents/');
  await waitFor('[data-reader]');
  check(await js('location.pathname.endsWith("/reading-list/externalization-llm-agents/")'), 'old collection entry redirects to the new resource');

  const storageScript = await cdp('Page.addScriptToEvaluateOnNewDocument', {source:'Object.defineProperty(window,"localStorage",{get(){throw new Error("Storage blocked for test");}});'});
  try {
    await go('reading-list/forward-deployed-engineer/');
    await js('document.querySelector("[data-size=larger]").click();document.querySelector("[data-complete]").click()');
    check(await js('document.querySelector("[data-storage-note]").textContent.includes("이번 페이지") && document.querySelector("[data-complete]").getAttribute("aria-pressed")==="true" && !(window.__readingErrors || []).length'), 'blocked storage does not break reading controls');
  } finally { await cdp('Page.removeScriptToEvaluateOnNewDocument',{identifier:storageScript.identifier}); }

  await cdp('Emulation.setScriptExecutionDisabled',{value:true});
  try {
    await go('reading-list/');
    check(await js('document.querySelectorAll("[data-resource]:not([hidden])").length===2 && document.querySelector(".collection-toolbar").hidden'), 'no-JavaScript collection retains both readable resources');
    await go('reading-list/forward-deployed-engineer/');
    check(await js('!!document.querySelector("#summary") && document.querySelectorAll(".source-figure img").length===3 && document.querySelector(".reading-toolbar").hidden'), 'no-JavaScript article retains text, images and static navigation');
    await go('');
    check(await js('[...document.querySelectorAll("a")].some(a=>a.getAttribute("href")==="./reading-list/")'), 'no-JavaScript portal links to Reading List');
  } finally { await cdp('Emulation.setScriptExecutionDisabled',{value:false}); }

  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await go('reading-list/forward-deployed-engineer/');
  check(await js('getComputedStyle(document.documentElement).scrollBehavior==="auto"'), 'reduced motion disables smooth scrolling');
  await cdp('Emulation.setEmulatedMedia',{media:'print',features:[]});
  check(await js('getComputedStyle(document.querySelector(".site-header")).display==="none" && getComputedStyle(document.querySelector("[data-reader]")).fontSize==="16px"'), 'print layout hides navigation and uses readable text');
  return { passed:results.length, base:base.href, checks:results };
} finally {
  await cdp('Emulation.setEmulatedMedia',{media:'',features:[]});
  await cdp('Page.removeScriptToEvaluateOnNewDocument',{identifier:errorScript.identifier});
  await viewport(1440,1000);
}
