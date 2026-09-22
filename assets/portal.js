/* Optional GitHub discovery. Static resource rows remain usable without JavaScript. */
(() => {
  'use strict';

  const owner = 'UpstageAI';
  const repo = 'eduteam-ai-edu-day';
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
  const curatedKeys = new Set([
    'gas-tutorial',
    'omc-intro',
    'reading-list/externalization-llm-agents',
    'reading-list/forward-deployed-engineer',
    'reading-list/what-is-a-harness',
    'reading-list/what-is-jev',
  ]);
  const excludedRootPages = new Set(['reading-list', 'externalization-llm-agents']);

  function toRepoHref(path, isDirectory = false) {
    const encodedPath = String(path)
      .split('/')
      .filter(Boolean)
      .map(segment => encodeURIComponent(segment))
      .join('/');
    return './' + encodedPath + (isDirectory ? '/' : '');
  }

  function toOfficeViewerUrl(fileHref) {
    const absolute = new URL(fileHref, window.location.href).href;
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(absolute)}`;
  }

  function discover(tree) {
    const additions = new Map();

    for (const item of tree || []) {
      if (!item || item.type !== 'blob' || typeof item.path !== 'string') continue;

      if (item.path.endsWith('/index.html')) {
        const folder = item.path.replace(/\/index\.html$/, '');
        if (!folder || folder.includes('/') || excludedRootPages.has(folder) || curatedKeys.has(folder)) continue;
        additions.set(folder, {
          kind: 'page',
          path: folder,
          name: folder,
          label: '페이지',
          description: '교육팀에서 공유한 추가 학습 자료입니다.',
          category: 'workshop',
          href: toRepoHref(folder, true),
        });
        continue;
      }

      if (item.path.toLowerCase().endsWith('.pptx')) {
        const filename = item.path.split('/').pop();
        additions.set(item.path, {
          kind: 'pptx',
          path: item.path,
          name: filename,
          label: 'PPTX',
          description: 'Office 미리보기로 열거나 원본 파일을 내려받을 수 있습니다.',
          category: 'workshop',
          href: toRepoHref(item.path),
        });
      }
    }

    return Array.from(additions.values()).sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'page' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  function appendLink(parent, text, href, external = false) {
    const link = document.createElement('a');
    const label = document.createElement('span');
    label.className = 'action-label';
    label.textContent = text;
    link.appendChild(label);
    link.setAttribute('href', href);
    link.className = 'text-link';
    if (external) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
    parent.appendChild(link);
    return link;
  }

  function createCard(item) {
    const card = document.createElement('article');
    card.className = 'learning-card';
    card.dataset.resourceKey = item.path;
    card.dataset.category = item.category || 'workshop';

    const content = document.createElement('div');
    content.className = 'card-content';

    const typeLabel = document.createElement('span');
    typeLabel.className = 'type-label';
    typeLabel.textContent = item.category === 'reading' ? '읽을거리' : '워크숍';
    content.appendChild(typeLabel);

    const formatLabel = document.createElement('span');
    formatLabel.className = 'format-label';
    formatLabel.textContent = item.label;
    content.appendChild(formatLabel);

    const heading = document.createElement('h2');
    heading.className = 'resource-title';
    heading.textContent = item.name;
    content.appendChild(heading);

    const description = document.createElement('p');
    description.className = 'card-description';
    description.textContent = item.description;
    content.appendChild(description);

    const bottom = document.createElement('div');
    bottom.className = 'card-bottom';
    if (item.kind === 'pptx') {
      appendLink(bottom, 'Office 미리보기', toOfficeViewerUrl(item.href), true)
        .setAttribute('aria-label', `${item.name} Office 미리보기`);
      appendLink(bottom, '원본 파일', item.href, true)
        .setAttribute('aria-label', `${item.name} 원본 파일`);
    } else {
      appendLink(bottom, '자료 보러 가기', item.href)
        .setAttribute('aria-label', `${item.name} 자료 보러 가기`);
    }
    card.appendChild(content);
    card.appendChild(bottom);
    return card;
  }

  async function fetchTree(timeoutMs = 5000) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const response = await fetch(treeUrl, controller ? { signal: controller.signal } : undefined);
      if (!response.ok) throw new Error('GitHub API request failed');
      const data = await response.json();
      return data.tree || [];
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  let catalogInitialization;

  function initializeCatalog() {
    const pages = document.querySelector('#pages');
    if (!pages) return Promise.resolve([]);
    if (catalogInitialization) return catalogInitialization;

    catalogInitialization = fetchTree().then(tree => {
      const knownKeys = new Set(
        Array.from(pages.querySelectorAll('[data-resource-key]'), card => card.dataset.resourceKey),
      );
      const additions = discover(tree).filter(item => !knownKeys.has(item.path));
      additions.forEach(item => pages.appendChild(createCard(item)));
      return additions;
    }).catch(() => {
      // Static rows remain readable when GitHub is unavailable or the request times out.
      return [];
    });

    return catalogInitialization;
  }

  window.EduDayPortal = Object.freeze({
    createCard,
    discover,
    initializeCatalog,
    toOfficeViewerUrl,
    toRepoHref,
  });

  initializeCatalog();
})();
