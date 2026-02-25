#!/usr/bin/env node

/**
 * Slide Maker — Build Script
 *
 * Combines individual HTML slide files into a single self-contained presentation.
 *
 * Usage:
 *   node build.js              # Build presentation
 *   node build.js --no-inline  # Build without inlining images (smaller file, needs images/ folder)
 *
 * Input:  slides/slide-*.html + styles/theme.css + images/*
 * Output: dist/presentation.html
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SLIDES_DIR = path.join(ROOT, 'slides');
const STYLES_DIR = path.join(ROOT, 'styles');
const IMAGES_DIR = path.join(ROOT, 'images');
const DIST_DIR = path.join(ROOT, 'dist');

const inlineImages = !process.argv.includes('--no-inline');
const exportPptxFlag = process.argv.includes('--pptx');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Read and sort slide files
const slideFiles = fs.readdirSync(SLIDES_DIR)
  .filter(f => f.startsWith('slide-') && f.endsWith('.html'))
  .sort();

if (slideFiles.length === 0) {
  console.error('Error: No slide files found in slides/ directory.');
  console.error('Expected files named: slide-01-title.html, slide-02-content.html, etc.');
  process.exit(1);
}

// Read slide contents
const slides = slideFiles.map(f => {
  const content = fs.readFileSync(path.join(SLIDES_DIR, f), 'utf-8');
  return { name: f, content };
});

// Read theme CSS
let theme = '';
const themePath = path.join(STYLES_DIR, 'theme.css');
if (fs.existsSync(themePath)) {
  theme = fs.readFileSync(themePath, 'utf-8');
} else {
  console.warn('Warning: styles/theme.css not found. Using minimal defaults.');
}

// Helper: convert image file to base64 data URI
function imageToBase64(imgPath) {
  const ext = path.extname(imgPath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
  };
  const mime = mimeTypes[ext] || 'image/png';
  const data = fs.readFileSync(imgPath);
  return `data:${mime};base64,${data.toString('base64')}`;
}

// Process slides: optionally inline images as base64
const processedSlides = slides.map(({ name, content }) => {
  if (!inlineImages) return content;

  return content.replace(
    /src=["'](?:\.\.\/)?images\/([^"']+)["']/g,
    (match, filename) => {
      const imgPath = path.join(IMAGES_DIR, filename);
      if (fs.existsSync(imgPath)) {
        try {
          return `src="${imageToBase64(imgPath)}"`;
        } catch (e) {
          console.warn(`Warning: Could not inline image ${filename}: ${e.message}`);
          return match;
        }
      }
      console.warn(`Warning: Image not found: images/${filename} (referenced in ${name})`);
      return match;
    }
  );
});

// If not inlining, copy images to dist
if (!inlineImages && fs.existsSync(IMAGES_DIR)) {
  const distImages = path.join(DIST_DIR, 'images');
  if (!fs.existsSync(distImages)) fs.mkdirSync(distImages, { recursive: true });
  fs.readdirSync(IMAGES_DIR).forEach(f => {
    fs.copyFileSync(path.join(IMAGES_DIR, f), path.join(distImages, f));
  });
}

const totalSlides = processedSlides.length;

// Build final HTML
const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Google Apps Script로 업무 자동화하기 — AI에게 물어보는 GAS 튜토리얼 워크숍">
  <meta property="og:title" content="GAS Tutorial Workshop">
  <meta property="og:description" content="코드를 직접 쓰지 않아도 됩니다 — AI에게 물어보세요">
  <title>Google Apps Script로 업무 자동화하기 — GAS Tutorial Workshop</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800&display=swap">
  <style>
${theme}

/* ===== Presentation Engine ===== */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  width: 100%; height: 100%;
  overflow: hidden;
  font-family: var(--font-primary, 'Segoe UI', system-ui, -apple-system, sans-serif);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.presentation {
  width: 100%; height: 100%;
  position: relative;
}

.slide {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--slide-padding, 60px 80px);
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #1a1a2e);
  overflow: hidden;
}

.slide.active {
  display: flex;
  animation: slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Slide transitions */
@keyframes slideIn {
  from { opacity: 0; transform: translateX(30px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideInReverse {
  from { opacity: 0; transform: translateX(-30px); }
  to   { opacity: 1; transform: translateX(0); }
}
.slide.active.reverse {
  animation-name: slideInReverse;
}

/* Element entrance stagger */
.slide.active .animate-in {
  animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Presenter timer */
.presenter-timer {
  position: fixed;
  bottom: 20px; left: 30px;
  font-size: 14px;
  color: var(--text-muted, #666);
  z-index: 100;
  font-family: var(--font-mono, 'SF Mono', 'Fira Code', monospace);
  user-select: none;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}
.presenter-timer.visible { opacity: 1; }

/* Help overlay */
.help-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 2000;
  display: none;
  justify-content: center;
  align-items: center;
  font-family: var(--font-primary, system-ui);
}
.help-overlay.visible { display: flex; }
.help-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px 48px;
  max-width: 520px;
  width: 90%;
  box-shadow: 0 24px 48px rgba(0,0,0,0.2);
}
.help-card h3 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1C2537;
}
.help-card table { width: 100%; border-collapse: collapse; }
.help-card td {
  padding: 8px 0;
  font-size: 14px;
  color: #434C60;
  border-bottom: 1px solid #f0f0f0;
}
.help-card td:first-child {
  font-family: var(--font-mono, monospace);
  font-weight: 600;
  color: var(--color-accent, #805CFB);
  width: 120px;
}
.help-card .help-close {
  font-size: 12px;
  color: #979CAE;
  text-align: center;
  margin-top: 16px;
}

/* Grid overview */
.grid-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1500;
  display: none;
  overflow-y: auto;
  padding: 40px;
}
.grid-overlay.visible { display: block; }
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}
.grid-thumb {
  aspect-ratio: 16/9;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  background: #fff;
  border: 2px solid transparent;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.grid-thumb:hover {
  border-color: var(--color-accent, #805CFB);
  transform: scale(1.03);
  box-shadow: 0 8px 24px rgba(128,92,251,0.4);
}
.grid-thumb.current {
  border-color: var(--color-accent, #805CFB);
  box-shadow: 0 0 0 3px var(--color-accent, #805CFB), 0 8px 24px rgba(128,92,251,0.3);
}
.grid-thumb-inner {
  width: 1920px; height: 1080px;
  transform-origin: top left;
  pointer-events: none;
}
.grid-thumb-label {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: #fff;
  padding: 20px 12px 8px;
  font-size: 13px;
  font-family: var(--font-mono, monospace);
  text-align: center;
}

/* Slide counter */
.slide-counter {
  position: fixed;
  bottom: 20px; right: 30px;
  font-size: 14px;
  color: var(--text-muted, #666);
  z-index: 100;
  font-family: var(--font-mono, 'SF Mono', 'Fira Code', monospace);
  user-select: none;
  pointer-events: none;
}

/* Progress bar */
.progress-bar {
  position: fixed;
  bottom: 0; left: 0;
  height: 2px;
  background: var(--color-accent, #e94560);
  transition: width 0.3s ease;
  z-index: 100;
}

/* Logo */
.slide-logo {
  position: fixed;
  top: 28px; right: 40px;
  z-index: 100;
  pointer-events: none;
  user-select: none;
}
.slide-logo img { height: 28px; }
.slide-logo span { font-size: 16px; font-weight: 500; color: var(--text-muted, #888); font-family: var(--font-primary, system-ui); }

/* Print styles */
@media print {
  .slide { display: flex !important; position: relative; page-break-after: always; min-height: 100vh; }
  .slide-counter, .progress-bar, .edit-toolbar { display: none; }
  @page { size: landscape; margin: 0; }
}

/* ===== Edit Mode ===== */
.edit-toolbar {
  position: fixed; top: 0; left: 0; right: 0; height: 48px;
  background: #1a1a2e; color: #fff; display: none; align-items: center;
  padding: 0 20px; gap: 8px; z-index: 1000; font-family: system-ui, sans-serif;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.edit-toolbar.visible { display: flex; }
.edit-toolbar .edit-label {
  font-size: 13px; font-weight: 600; color: #ff6b6b; margin-right: 12px;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.edit-toolbar .separator { width: 1px; height: 24px; background: #444; margin: 0 8px; }
.edit-toolbar button {
  background: transparent; color: #ccc; border: 1px solid #444; border-radius: 4px;
  padding: 4px 10px; font-size: 13px; cursor: pointer; font-family: inherit;
  transition: all 0.15s;
}
.edit-toolbar button:hover { background: #333; color: #fff; border-color: #666; }
.edit-toolbar button.active { background: #444; color: #fff; border-color: #888; }
.edit-toolbar .save-btn { background: #2563eb; color: #fff; border-color: #2563eb; font-weight: 600; margin-left: auto; }
.edit-toolbar .save-btn:hover { background: #1d4ed8; }
.edit-toolbar .exit-btn { background: #444; color: #fff; border-color: #555; font-weight: 600; }
.edit-toolbar .exit-btn:hover { background: #555; }

body.edit-mode .slide { cursor: text; }
body.edit-mode .slide [contenteditable="true"] { outline: none; }
body.edit-mode .slide [contenteditable="true"]:hover {
  outline: 2px dashed rgba(37,99,235,0.4); outline-offset: 2px; border-radius: 3px;
}
body.edit-mode .slide [contenteditable="true"]:focus {
  outline: 2px solid #2563eb; outline-offset: 2px; border-radius: 3px;
  background: rgba(37,99,235,0.03);
}
body.edit-mode .slide-counter::before {
  content: "EDIT MODE"; color: #ff6b6b; font-weight: 600; margin-right: 12px;
  font-size: 11px; letter-spacing: 0.5px;
}
  </style>
</head>
<body>
  <div class="presentation">
${processedSlides.join('\n\n')}
  </div>

  <div class="edit-toolbar" id="editToolbar">
    <span class="edit-label">Edit Mode</span>
    <div class="separator"></div>
    <button onclick="document.execCommand('bold')" title="Bold (Ctrl+B)"><strong>B</strong></button>
    <button onclick="document.execCommand('italic')" title="Italic (Ctrl+I)"><em>I</em></button>
    <button onclick="document.execCommand('underline')" title="Underline (Ctrl+U)"><u>U</u></button>
    <div class="separator"></div>
    <button onclick="document.execCommand('insertUnorderedList')" title="Bullet List">List</button>
    <button onclick="document.execCommand('removeFormat')" title="Clear Formatting">Clear</button>
    <div class="separator"></div>
    <button class="save-btn" onclick="savePresentation()" title="Download edited file">Save</button>
    <button class="exit-btn" onclick="toggleEditMode()" title="Exit edit mode (E)">Exit</button>
  </div>
  <div class="slide-counter">
    <span id="currentSlide">1</span> / <span id="totalSlides">${totalSlides}</span>
  </div>
  <div class="progress-bar" id="progressBar"></div>
  <div class="presenter-timer" id="presenterTimer">00:00</div>

  <div class="help-overlay" id="helpOverlay">
    <div class="help-card">
      <h3>Keyboard Shortcuts</h3>
      <table>
        <tr><td>&rarr; &darr; Space</td><td>Next slide</td></tr>
        <tr><td>&larr; &uarr;</td><td>Previous slide</td></tr>
        <tr><td>Home / End</td><td>First / Last slide</td></tr>
        <tr><td>G</td><td>Grid overview</td></tr>
        <tr><td>T</td><td>Toggle presenter timer</td></tr>
        <tr><td>F</td><td>Toggle fullscreen</td></tr>
        <tr><td>E</td><td>Toggle edit mode</td></tr>
        <tr><td>?</td><td>This help screen</td></tr>
        <tr><td>Esc</td><td>Close overlay</td></tr>
      </table>
      <div class="help-close">Press <strong>?</strong> or <strong>Esc</strong> to close</div>
    </div>
  </div>

  <div class="grid-overlay" id="gridOverlay"></div>

  <script>
(function() {
  var slides = document.querySelectorAll('.slide');
  var current = 0;
  var total = slides.length;
  var editMode = false;
  var gridMode = false;
  var helpVisible = false;
  var direction = 1; // 1 = forward, -1 = backward

  // ── Stagger animations ──
  function animateSlide(slide) {
    var ANIMATABLE = 'h1,h2,h3,h4,p,li,.card,.callout,.code-block,.prompt-block,.prompt-dual,.badge,.stat,.quote,pre,ol,table';
    var els = slide.querySelectorAll(ANIMATABLE);
    els.forEach(function(el, i) {
      el.classList.remove('animate-in');
      void el.offsetWidth; // force reflow
      el.classList.add('animate-in');
      el.style.animationDelay = (i * 0.06) + 's';
    });
  }

  function showSlide(n) {
    if (n === current) return;
    direction = n > current ? 1 : -1;
    slides[current].classList.remove('active', 'reverse');
    current = ((n % total) + total) % total;
    slides[current].classList.remove('reverse');
    if (direction === -1) slides[current].classList.add('reverse');
    slides[current].classList.add('active');
    animateSlide(slides[current]);
    document.getElementById('currentSlide').textContent = current + 1;
    document.getElementById('progressBar').style.width =
      ((current + 1) / total * 100) + '%';
  }

  // Initialize first slide
  if (slides.length > 0) {
    slides[0].classList.add('active');
    animateSlide(slides[0]);
    document.getElementById('progressBar').style.width = (1 / total * 100) + '%';
    document.getElementById('totalSlides').textContent = total;
  }

  // ── Presenter Timer ──
  var timerEl = document.getElementById('presenterTimer');
  var timerStart = null;
  var timerInterval = null;
  var timerVisible = false;

  function padZero(n) { return n < 10 ? '0' + n : '' + n; }
  function updateTimer() {
    if (!timerStart) return;
    var elapsed = Math.floor((Date.now() - timerStart) / 1000);
    var m = Math.floor(elapsed / 60);
    var s = elapsed % 60;
    timerEl.textContent = padZero(m) + ':' + padZero(s);
  }
  function toggleTimer() {
    timerVisible = !timerVisible;
    timerEl.classList.toggle('visible', timerVisible);
    if (timerVisible && !timerStart) {
      timerStart = Date.now();
      timerInterval = setInterval(updateTimer, 1000);
    }
  }

  // ── Help Overlay ──
  var helpOverlay = document.getElementById('helpOverlay');
  function toggleHelp() {
    helpVisible = !helpVisible;
    helpOverlay.classList.toggle('visible', helpVisible);
  }

  // ── Grid Overview ──
  var gridOverlay = document.getElementById('gridOverlay');
  function openGrid() {
    gridMode = true;
    var container = document.createElement('div');
    container.className = 'grid-container';
    for (var i = 0; i < total; i++) {
      (function(idx) {
        var thumb = document.createElement('div');
        thumb.className = 'grid-thumb' + (idx === current ? ' current' : '');
        var inner = document.createElement('div');
        inner.className = 'grid-thumb-inner';
        inner.innerHTML = slides[idx].innerHTML;
        // Copy classes for styling
        inner.className = slides[idx].className.replace('active', '') + ' grid-thumb-inner';
        inner.style.display = 'flex';
        thumb.appendChild(inner);
        var label = document.createElement('div');
        label.className = 'grid-thumb-label';
        label.textContent = (idx + 1) + ' / ' + total;
        thumb.appendChild(label);
        thumb.addEventListener('click', function(e) {
          e.stopPropagation();
          closeGrid();
          showSlide(idx);
        });
        container.appendChild(thumb);
        // Scale to fit thumbnail
        requestAnimationFrame(function() {
          var scale = thumb.offsetWidth / 1920;
          inner.style.transform = 'scale(' + scale + ')';
          thumb.style.height = (1080 * scale) + 'px';
        });
      })(i);
    }
    gridOverlay.innerHTML = '';
    gridOverlay.appendChild(container);
    gridOverlay.classList.add('visible');
  }
  function closeGrid() {
    gridMode = false;
    gridOverlay.classList.remove('visible');
  }

  // ── Edit Mode ──
  var EDITABLE = 'h1,h2,h3,h4,h5,h6,p,li,span.badge,blockquote,td,th,figcaption';

  window.toggleEditMode = function() {
    editMode = !editMode;
    document.body.classList.toggle('edit-mode', editMode);
    document.getElementById('editToolbar').classList.toggle('visible', editMode);
    slides.forEach(function(slide) {
      slide.querySelectorAll(EDITABLE).forEach(function(el) {
        if (editMode) { el.setAttribute('contenteditable', 'true'); }
        else { el.removeAttribute('contenteditable'); }
      });
    });
    if (!editMode) {
      try { localStorage.setItem('slide-backup', document.querySelector('.presentation').innerHTML); } catch(e) {}
    }
  };

  window.savePresentation = function() {
    var clone = document.documentElement.cloneNode(true);
    clone.querySelector('body').classList.remove('edit-mode');
    var tb = clone.querySelector('#editToolbar'); if (tb) tb.classList.remove('visible');
    clone.querySelectorAll('[contenteditable]').forEach(function(el) { el.removeAttribute('contenteditable'); });
    var html = '<!DOCTYPE html>\\n' + clone.outerHTML;
    var blob = new Blob([html], { type: 'text/html' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'presentation-edited.html';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Restore from localStorage if available
  try {
    var backup = localStorage.getItem('slide-backup');
    if (backup) {
      var doRestore = confirm('A previous edit was found. Restore unsaved changes?');
      if (doRestore) {
        document.querySelector('.presentation').innerHTML = backup;
        slides = document.querySelectorAll('.slide');
        total = slides.length; current = 0;
        if (slides.length > 0) slides[0].classList.add('active');
      } else { localStorage.removeItem('slide-backup'); }
    }
  } catch(e) {}

  // ── Keyboard Navigation ──
  document.addEventListener('keydown', function(e) {
    var ae = document.activeElement;
    var isEditing = ae && ae.getAttribute('contenteditable') === 'true';

    // Escape closes any overlay
    if (e.key === 'Escape') {
      if (helpVisible) { toggleHelp(); e.preventDefault(); return; }
      if (gridMode) { closeGrid(); e.preventDefault(); return; }
      if (editMode) { toggleEditMode(); e.preventDefault(); return; }
      return;
    }

    // Help overlay
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      if (!isEditing) { toggleHelp(); e.preventDefault(); return; }
    }

    // Block nav when overlays are open
    if (helpVisible || gridMode) return;

    if ((e.key === 'e' || e.key === 'E') && !isEditing && !e.ctrlKey && !e.metaKey) { toggleEditMode(); e.preventDefault(); return; }
    if (editMode && isEditing) return;
    if (editMode) return;

    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown':
        e.preventDefault(); showSlide(current + 1); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
        e.preventDefault(); showSlide(current - 1); break;
      case 'Home':
        e.preventDefault(); showSlide(0); break;
      case 'End':
        e.preventDefault(); showSlide(total - 1); break;
      case 'f': case 'F':
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(function() {});
        } else { document.exitFullscreen(); }
        break;
      case 'g': case 'G':
        e.preventDefault(); gridMode ? closeGrid() : openGrid(); break;
      case 't': case 'T':
        e.preventDefault(); toggleTimer(); break;
    }
  });

  // Touch/swipe navigation
  var touchStartX = 0;
  var touchStartY = 0;
  document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    if (editMode || gridMode || helpVisible) return;
    var dx = e.changedTouches[0].screenX - touchStartX;
    var dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      dx > 0 ? showSlide(current - 1) : showSlide(current + 1);
    }
  }, { passive: true });

  // Click navigation (disabled in edit/grid/help mode)
  document.addEventListener('click', function(e) {
    if (editMode || gridMode || helpVisible) return;
    var tag = e.target.tagName.toLowerCase();
    if (tag === 'a' || tag === 'button' || tag === 'input' || tag === 'textarea') return;
    if (e.target.closest('.solution-toggle')) return;
    var x = e.clientX / window.innerWidth;
    x < 0.15 ? showSlide(current - 1) : showSlide(current + 1);
  });

  // Solution toggle: collapse by default, click to reveal
  document.querySelectorAll('.solution-side').forEach(function(side) {
    side.classList.add('collapsed');
  });
  document.querySelectorAll('.solution-toggle').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var side = btn.closest('.solution-side');
      if (!side) return;
      var isCollapsed = side.classList.toggle('collapsed');
      btn.textContent = isCollapsed ? '\uD504\uB86C\uD504\uD2B8 \uC608\uC2DC \uBCF4\uAE30' : '\uD504\uB86C\uD504\uD2B8 \uC608\uC2DC \uC228\uAE30';
    });
  });
})();
  </script>
</body>
</html>`;

// Write output
const outputPath = path.join(DIST_DIR, 'presentation.html');
fs.writeFileSync(outputPath, html, 'utf-8');

console.log('');
console.log('  Built presentation with ' + totalSlides + ' slides');
console.log('  Output: dist/presentation.html');
console.log('');
console.log('  Navigation:');
console.log('    Arrow keys / Click  — next/prev slide');
console.log('    G                   — grid overview');
console.log('    T                   — presenter timer');
console.log('    E                   — toggle edit mode');
console.log('    F                   — toggle fullscreen');
console.log('    ?                   — keyboard shortcuts');
console.log('    Home / End          — first/last slide');
console.log('');

// PPTX export (optional)
if (exportPptxFlag) {
  try {
    require.resolve('pptxgenjs');
    require.resolve('cheerio');
  } catch (e) {
    console.error('  PPTX export requires additional dependencies.');
    console.error('  Run: npm install pptxgenjs cheerio\n');
    process.exit(1);
  }
  const exportPptx = require('./export-pptx');
  const outputPptx = path.join(DIST_DIR, 'presentation.pptx');
  exportPptx(slides, theme, outputPptx)
    .then(() => console.log(''))
    .catch(err => { console.error('PPTX export failed:', err); process.exit(1); });
}
