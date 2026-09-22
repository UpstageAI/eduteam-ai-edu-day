// Run with an already open isolated Chrome session:
// chromux run <session> --file tests/reading-list.browser.js --arg base=http://127.0.0.1:8000/
// Reader pages are intentionally static: no progress meter, font controls, TOC, or reader runtime.
const base = new URL(args.base || 'http://127.0.0.1:8000/');
const results = [];
const check = (condition, message) => { if (!condition) throw new Error(message); results.push(message); };
async function go(path) {
  await cdp('Page.navigate', { url: new URL(path, base).href });
  await waitLoad();
  await waitFor('main, body');
}
const viewport = (width, height, mobile = false) => cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
const noOverflow = () => js('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1');
const errorScript = await cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__readingErrors=[];window.addEventListener("error",e=>window.__readingErrors.push(e.message));' });
try {
  await viewport(1440, 1000);
  await go('reading-list/');
  check(await js('document.querySelectorAll("[data-resource]").length===4'), 'collection retains its static resource rows');
  check(await js('document.querySelectorAll(".site-header a").length===2'), 'collection keeps only brand and GitHub links');
  check(await js('!document.querySelector(".collection-hero,.collection-toolbar,#resource-search,#result-count,#empty-state,.read-state")'), 'collection has no auxiliary catalogue UI or runtime');
  check(await noOverflow(), 'desktop collection has no horizontal overflow');
  await go('reading-list/forward-deployed-engineer/');
  check(await js('document.querySelectorAll("[data-source-paragraph]").length===57'), 'FDE article keeps all 57 translated paragraphs');
  check(await js('document.querySelectorAll(".source-figure img").length===3'), 'article preserves all three original images');
  check(await js('!document.querySelector(".reading-progress,.reading-toolbar,.reading-sidebar,.article-end,.breadcrumb,[data-reader-control],[data-progress],[data-percent],[data-size],[data-complete],[data-reading-id]")'), 'reader omits progress, font controls, TOC, breadcrumbs and completion chrome');
  check(await js('![...document.querySelectorAll("body,main")].some(node=>/스크롤 진행률|글자 크기|이 글의 목차|읽음으로 표시/.test(node.textContent))'), 'reader omits progress, font, TOC and completion copy');
  check(await js('document.querySelector("main[data-reader] h1") && document.querySelector("main[data-reader] .byline")'), 'article title and source byline remain visible');
  await js('document.querySelectorAll("img").forEach(img=>img.loading="eager")');
  await js('Promise.all([...document.images].map(image => image.decode())).then(() => true)');
  check(await js('[...document.images].every(img=>img.complete && img.naturalWidth>0)'), 'all original images decode successfully');
  check(await noOverflow(), 'desktop article has no horizontal overflow');

  await go('reading-list/externalization-llm-agents/slides-externalization-llm-agents/dist/presentation.html');
  check(await js('document.querySelector(".legacy-body article .toc") && getComputedStyle(document.querySelector(".legacy-body article .toc")).display==="none"'), 'legacy presentation hides its embedded contents block');
  check(await js(`(()=>{const link=document.querySelector('.doc-cross a[href="eli5.html"]'),style=link&&getComputedStyle(link),box=link&&link.getBoundingClientRect();return !!link&&style.display!=='none'&&box.width>0&&style.color!==getComputedStyle(document.body).backgroundColor})()`), 'the deep summary links to the short version in plain, visible text');
  await go('reading-list/externalization-llm-agents/slides-externalization-llm-agents/dist/eli5.html');
  check(await js('document.querySelector(".legacy-body article .nav-bar") && getComputedStyle(document.querySelector(".legacy-body article .nav-bar")).display==="none"'), 'legacy short article hides its auxiliary jump bar');
  check(await js(`(()=>{const link=document.querySelector('.doc-cross a[href="presentation.html"]'),box=link&&link.getBoundingClientRect();return !!link&&box.width>0&&box.height>0&&getComputedStyle(link).color!==getComputedStyle(document.body).backgroundColor})()`), 'the short version links to the deep summary in plain, visible text');

  for (const [width, height] of [[390, 844], [320, 740]]) {
    await viewport(width, height, true);
    for (const path of ['reading-list/', 'reading-list/forward-deployed-engineer/', 'reading-list/externalization-llm-agents/', 'reading-list/externalization-llm-agents/slides-externalization-llm-agents/dist/eli5.html', 'reading-list/externalization-llm-agents/slides-externalization-llm-agents/dist/presentation.html']) {
      await go(path);
      check(await noOverflow(), `${width}px no horizontal overflow: ${path}`);
      check(await js('!(window.__readingErrors || []).length'), `no browser script errors: ${width}px ${path}`);
      check(await js('document.querySelectorAll(".site-header a").length===2'), `two header links remain: ${width}px ${path}`);
    }
  }

  await go('externalization-llm-agents/slides-externalization-llm-agents/dist/presentation.html?from=bookmark#s3');
  await waitFor('[data-reader]');
  check(await js('location.pathname.includes("reading-list/externalization-llm-agents/") && location.hash==="#s3" && location.search==="?from=bookmark" && !!document.querySelector("#s3")'), 'old deep links preserve queries and section anchors');
  await go('externalization-llm-agents/');
  await waitFor('[data-reader]');
  check(await js('location.pathname.endsWith("/reading-list/externalization-llm-agents/")'), 'old collection entry redirects to the new resource');

  await cdp('Emulation.setScriptExecutionDisabled', { value: true });
  try {
    await go('reading-list/');
    check(await js('document.querySelectorAll("[data-resource]").length===4 && !document.querySelector(".collection-toolbar")'), 'no-JavaScript collection retains rows without dead UI');
    await go('reading-list/forward-deployed-engineer/');
    check(await js('document.querySelectorAll("[data-source-paragraph]").length===57 && document.querySelectorAll(".source-figure img").length===3'), 'no-JavaScript article retains text and images');
  } finally { await cdp('Emulation.setScriptExecutionDisabled', { value: false }); }

  await cdp('Emulation.setEmulatedMedia', { media: 'print', features: [] });
  await go('reading-list/forward-deployed-engineer/');
  check(await js('getComputedStyle(document.querySelector(".site-header")).display==="none"'), 'print mode hides the minimal header');
  return { passed: results.length, base: base.href, checks: results };
} finally {
  await cdp('Emulation.setScriptExecutionDisabled', { value: false });
  await cdp('Emulation.setEmulatedMedia', { media: '', features: [] });
  await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: errorScript.identifier });
  await viewport(1440, 1000);
}
