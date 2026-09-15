/* Optional catalog controls and GitHub discovery. Static cards remain usable without JavaScript. */
(() => {
  'use strict';

  const owner = 'UpstageAI';
  const repo = 'eduteam-ai-edu-day';
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
  const storagePrefix = 'edu-reading-list:v1:complete:';
  const curatedKeys = new Set([
    'gas-tutorial',
    'omc-intro',
    'reading-list/externalization-llm-agents',
    'reading-list/forward-deployed-engineer',
  ]);
  const excludedRootPages = new Set(['reading-list', 'externalization-llm-agents']);

  function normalize(value) {
    return String(value || '').normalize('NFKC').toLocaleLowerCase();
  }

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

  function appendLink(parent, text, href, external = false, className = '') {
    const link = document.createElement('a');
    link.textContent = text;
    link.setAttribute('href', href);
    if (className) link.className = className;
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
    card.dataset.search = `${item.name} ${item.label} ${item.path}`;

    const content = document.createElement('div');
    content.className = 'card-content';

    const label = document.createElement('div');
    label.className = 'card-label';
    label.textContent = item.label;
    content.appendChild(label);

    const heading = document.createElement('h3');
    const isPptx = item.kind === 'pptx';
    const primaryHref = isPptx ? toOfficeViewerUrl(item.href) : item.href;
    appendLink(heading, item.name, primaryHref, isPptx);
    content.appendChild(heading);

    const description = document.createElement('p');
    description.className = 'card-description';
    description.textContent = item.description;
    content.appendChild(description);

    const bottom = document.createElement('div');
    bottom.className = 'card-bottom';
    if (isPptx) {
      appendLink(bottom, 'Office 미리보기', primaryHref, true, 'text-link');
      appendLink(bottom, '원본 파일', item.href, true, 'text-link');
    } else {
      appendLink(bottom, '자료 열기 →', item.href, false, 'text-link');
    }
    content.appendChild(bottom);
    card.appendChild(content);
    return card;
  }

  function readCompletion(resourceKey) {
    const slug = resourceKey.startsWith('reading-list/')
      ? resourceKey.slice('reading-list/'.length)
      : null;
    if (!slug) return { available: true, complete: false, applicable: false };
    try {
      return {
        available: true,
        complete: window.localStorage.getItem(storagePrefix + slug) === 'true',
        applicable: true,
      };
    } catch (_) {
      return { available: false, complete: false, applicable: true };
    }
  }

  function refreshReadStatus(root = document) {
    root.querySelectorAll('[data-resource-key]').forEach(card => {
      const status = card.querySelector('[data-card-status]');
      if (!status) return;
      const state = readCompletion(card.dataset.resourceKey);
      status.textContent = state.complete ? '✓ 읽음' : '아직 읽지 않음';
      status.dataset.complete = String(state.complete);
      status.hidden = !state.applicable || !state.available;
    });
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

  function initializeCatalog() {
    const pages = document.querySelector('#pages');
    const controls = document.querySelector('#catalog-controls');
    const search = document.querySelector('#catalog-search');
    const filters = Array.from(document.querySelectorAll('[data-category-filter]'));
    const count = document.querySelector('#catalog-count');
    const empty = document.querySelector('#catalog-empty');
    const reset = document.querySelector('#catalog-reset');
    const feedback = document.querySelector('#catalog-feedback');

    refreshReadStatus();
    window.addEventListener('pageshow', () => refreshReadStatus());
    window.addEventListener('storage', () => refreshReadStatus());

    if (!pages || !controls || !search || !filters.length || !count || !empty || !reset) return;

    let activeCategory = 'all';
    const cards = () => Array.from(pages.querySelectorAll('[data-resource-key]'));
    const applyFilters = () => {
      const query = normalize(search.value.trim());
      let visible = 0;
      cards().forEach(card => {
        const categoryMatches = activeCategory === 'all' || card.dataset.category === activeCategory;
        const searchText = normalize(`${card.dataset.search || ''} ${card.textContent}`);
        const matches = categoryMatches && searchText.includes(query);
        card.hidden = !matches;
        if (matches) visible += 1;
      });
      count.textContent = `${visible}개의 학습 자료`;
      empty.hidden = visible !== 0;
    };

    const selectCategory = button => {
      activeCategory = button.dataset.categoryFilter || 'all';
      filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      applyFilters();
    };

    filters.forEach(button => button.addEventListener('click', () => selectCategory(button)));
    search.addEventListener('input', applyFilters);
    reset.addEventListener('click', () => {
      search.value = '';
      selectCategory(filters.find(button => button.dataset.categoryFilter === 'all') || filters[0]);
      search.focus();
    });

    controls.hidden = false;
    applyFilters();

    fetchTree().then(tree => {
      const knownKeys = new Set(cards().map(card => card.dataset.resourceKey));
      const additions = discover(tree).filter(item => !knownKeys.has(item.path));
      additions.forEach(item => pages.appendChild(createCard(item)));
      if (feedback && additions.length) {
        feedback.textContent = `추가 자료 ${additions.length}개를 불러왔습니다.`;
        feedback.hidden = false;
      }
      applyFilters();
    }).catch(() => {
      // Static cards remain readable when GitHub is unavailable or the request times out.
    });
  }

  window.EduDayPortal = Object.freeze({
    createCard,
    discover,
    initializeCatalog,
    normalize,
    readCompletion,
    refreshReadStatus,
    toOfficeViewerUrl,
    toRepoHref,
  });

  initializeCatalog();
})();
