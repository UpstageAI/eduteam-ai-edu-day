/* Optional reader controls. All reading content and navigation work without this file. */
(() => {
  'use strict';
  const prefix = 'edu-reading-list:v1:';
  let storageAvailable = true;
  const get = key => {
    try { return window.localStorage.getItem(prefix + key); }
    catch { storageAvailable = false; return null; }
  };
  const set = (key, value) => {
    try { window.localStorage.setItem(prefix + key, value); return true; }
    catch { storageAvailable = false; return false; }
  };
  const completed = id => get('complete:' + id) === 'true';
  const reader = document.querySelector('[data-reader]');
  if (!reader) return;
  const id = document.body.dataset.readingId;
  const progress = document.querySelector('[data-progress]');
  const percent = document.querySelector('[data-percent]');
  const sizeOutput = document.querySelector('[data-size-output]');
  const smaller = document.querySelector('[data-size="smaller"]');
  const larger = document.querySelector('[data-size="larger"]');
  const savedSize = Number(get('font-size'));
  let size = [16,18,20,22].includes(savedSize) ? savedSize : 18;
  const applySize = () => {
    document.documentElement.style.setProperty('--reader-size', `${size}px`);
    sizeOutput.textContent = `${size}px`;
    smaller.disabled = size === 16;
    larger.disabled = size === 22;
  };
  const storageNote = document.querySelector('[data-storage-note]');
  const showStorageNote = () => {
    storageNote.textContent = storageAvailable
      ? '읽음 표시와 글자 크기는 이 브라우저에만 저장됩니다.'
      : '브라우저 저장소를 사용할 수 없어 설정은 이번 페이지에서만 유지됩니다.';
  };
  [smaller,larger].forEach(button => button.addEventListener('click', () => {
    size = Math.max(16, Math.min(22, size + (button === larger ? 2 : -2)));
    applySize();
    set('font-size', String(size));
    showStorageNote();
    updateProgress();
  }));
  applySize();
  const completeButton = document.querySelector('[data-complete]');
  let done = completed(id);
  const showCompletion = () => {
    completeButton.textContent = done ? '✓ 읽음 · 표시 취소' : '읽음으로 표시';
    completeButton.setAttribute('aria-pressed', String(done));
  };
  completeButton.addEventListener('click', () => {
    done = !done;
    set('complete:' + id, String(done));
    showCompletion();
    showStorageNote();
  });
  showCompletion();
  showStorageNote();
  const nav = document.querySelector('[data-section-nav]');
  const headings = [...reader.querySelectorAll('h2')].filter(heading => !heading.closest('.toc'));
  if (nav && !nav.children.length) headings.forEach((heading, index) => {
    if (!heading.id) {
      let newId = `reading-section-${index + 1}`;
      while (document.getElementById(newId)) newId += '-heading';
      heading.id = newId;
    }
    const link = document.createElement('a');
    link.href = '#' + heading.id;
    link.textContent = heading.textContent;
    nav.appendChild(link);
  });
  const links = nav ? [...nav.querySelectorAll('a')] : [];
  const sections = links.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1))));
  let ticking = false;
  function updateProgress() {
    const rect = reader.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const value = total <= 0 ? (rect.bottom <= window.innerHeight ? 100 : 0)
      : Math.round(Math.min(1, Math.max(0, -rect.top / total)) * 100);
    progress.style.width = `${value}%`;
    percent.textContent = `${value}%`;
    let current = 0;
    sections.forEach((section,index) => { if (section && section.getBoundingClientRect().top <= 160) current = index; });
    links.forEach((link,index) => {
      if (index === current) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; window.requestAnimationFrame(updateProgress); }
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  reader.addEventListener('toggle', updateProgress, true);
  reader.querySelectorAll('img').forEach(img => img.addEventListener('load', updateProgress));
  window.addEventListener('storage', () => { done = completed(id); showCompletion(); });
  document.querySelectorAll('[data-reader-control]').forEach(control => { control.hidden = false; });
  if (window.matchMedia('(max-width: 850px)').matches) document.querySelector('.reading-sidebar').open = false;
  updateProgress();
})();
