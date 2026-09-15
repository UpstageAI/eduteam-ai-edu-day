/* Fingertip skim for material sheets. Without this script the drawer simply stays still. */
(() => {
  'use strict';

  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const OMEGA = 30; // spring speed: about 130ms to reach 90% of a move
  const SPREAD = 0.72; // bulge width as a share of the row pitch
  const TEXT_GAP = 4; // pixels a raised sheet keeps between its tab and the text behind it
  const TABS = '.type-label, .format-label';
  const TEXT = '.resource-title, .card-description, .action-label';

  const active = () => finePointer.matches && !reducedMotion.matches;
  const offsetOf = sheet => parseFloat(sheet.style.getPropertyValue('--sheet-y')) || 0;

  // Exact critically damped spring step: it never overshoots and stays stable at any frame rate.
  function spring(value, velocity, goal, dt) {
    const offset = value - goal;
    const decay = Math.exp(-OMEGA * dt);
    const drift = (velocity + OMEGA * offset) * dt;
    return [goal + (offset + drift) * decay, (velocity - OMEGA * drift) * decay];
  }

  const sheetOf = target => (target instanceof Element ? target.closest('.learning-card') : null);

  // A click anywhere on a sheet opens it like its link. A drag that selected text does not,
  // and shift-click is left to extend a selection.
  function openSheet(event) {
    const sheet = sheetOf(event.target);
    const link = sheet?.querySelector('.text-link');
    if (!link || event.defaultPrevented || event.shiftKey || event.target.closest('a') || String(getSelection()).trim()) return;
    if (event.button === 1) {
      window.open(link.href, '_blank', 'noopener,noreferrer');
      return;
    }
    // Forward the modifiers so the browser treats Cmd/Ctrl-click exactly as it would on the link itself.
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, ctrlKey: event.ctrlKey, metaKey: event.metaKey, altKey: event.altKey }));
  }

  // Opening a document: the clicked sheet's title and the destination heading share one transition name,
  // so the title glides into place. Coming back, the heading glides into its sheet again.
  function titleFor(url) {
    if (!url) return null;
    const path = new URL(url, location.href).pathname;
    const sheet = Array.from(document.querySelectorAll('.learning-card'))
      .find(candidate => candidate.querySelector('.text-link') && new URL(candidate.querySelector('.text-link').href).pathname === path);
    return sheet?.querySelector('.resource-title') ?? null;
  }

  function nameTitle(title, transition) {
    document.querySelectorAll('.resource-title').forEach(node => node.style.removeProperty('view-transition-name'));
    if (!title || !transition) return;
    title.style.setProperty('view-transition-name', 'doc-title');
    transition.finished.finally(() => title.style.removeProperty('view-transition-name'));
  }

  // The transition only reads well when the header is on screen at both ends; from a scrolled page
  // the header and title would fly in from far away, so the page simply changes instead.
  function headerOffScreen() {
    const header = document.querySelector('.site-header');
    if (!header) return false;
    const box = header.getBoundingClientRect();
    return box.bottom <= 0 || box.top >= innerHeight;
  }

  addEventListener('pageswap', event => {
    const transition = event.viewTransition;
    const url = event.activation?.entry?.url;
    if (transition && (headerOffScreen() || url === location.href)) {
      transition.skipTransition();
      return;
    }
    nameTitle(titleFor(url), transition);
  });
  addEventListener('pagereveal', event => {
    const transition = event.viewTransition;
    if (transition && headerOffScreen()) {
      transition.skipTransition();
      return;
    }
    nameTitle(titleFor(window.navigation?.activation?.from?.url), transition);
  });

  function focusVisible(element) {
    try {
      return element.matches(':focus-visible');
    } catch {
      return false;
    }
  }

  function attach(grid) {
    let pointerInside = false;
    let pointerY = 0;
    let target = null;
    let peak = 0;
    let peakVelocity = 0;
    let strength = 0;
    let strengthVelocity = 0;
    let last = 0;
    let frame = 0;
    let stale = true;
    let sheets = [];
    let centers = [];
    let reach = [];
    let spread = 0;
    let lift = 0;
    let peakSheet = null;

    // Rect edges where they sit at rest, undoing the sheet's current lift.
    const restingEdges = (sheet, selector, side) =>
      Array.from(sheet.querySelectorAll(selector), node => node.getBoundingClientRect()[side] - offsetOf(sheet));

    // Card boxes never move (only their paper and print do), so their rects are the fixed slots.
    function measure() {
      stale = false;
      sheets = Array.from(grid.querySelectorAll(':scope > .learning-card'));
      const origin = grid.getBoundingClientRect().top;
      const boxes = sheets.map(sheet => sheet.getBoundingClientRect());
      const style = getComputedStyle(grid);
      lift = parseFloat(style.getPropertyValue('--sheet-lift')) || 0; // no token, no motion
      // A sheet's row starts at its tab, so pointing at a tab raises that tab's own sheet.
      const tab = parseFloat(style.getPropertyValue('--sheet-tab')) || 0;
      centers = boxes.map((box, index) => (box.top - tab + (boxes[index + 1] ? boxes[index + 1].top - tab : box.bottom)) / 2 - origin);
      const gaps = centers.slice(1).map((center, index) => center - centers[index]).sort((a, b) => a - b);
      spread = SPREAD * (gaps[Math.floor(gaps.length / 2)] || 44);
      // How far each sheet may rise past the one behind it before its tab reaches that sheet's text.
      reach = sheets.map((sheet, index) => {
        if (index === 0) return Infinity;
        const top = Math.min(boxes[index].top, ...restingEdges(sheet, TABS, 'top'));
        const ink = restingEdges(sheets[index - 1], TEXT, 'bottom');
        return ink.length ? Math.max(0, top - Math.max(...ink) - TEXT_GAP) : Infinity;
      });
    }

    // Aim the bulge at y (grid coordinates), or lower it with null.
    function aim(y) {
      if (y !== null && strength < 0.02) {
        peak = y; // start at the pointer instead of sliding in from the last spot
        peakVelocity = 0;
      }
      target = y;
      if (!frame) frame = requestAnimationFrame(step);
    }

    // The highest sheet carries the deeper tab outline, so the tint always agrees with the bulge.
    function markPeak(sheet) {
      if (sheet === peakSheet) return;
      peakSheet?.removeAttribute('data-peak');
      sheet?.setAttribute('data-peak', '');
      peakSheet = sheet;
    }

    function stop() {
      markPeak(null);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      target = null;
      pointerInside = false;
      strength = 0;
      strengthVelocity = 0;
      peakVelocity = 0;
      grid.querySelectorAll(':scope > .learning-card').forEach(sheet => sheet.style.removeProperty('--sheet-y'));
    }

    function step(now) {
      if (stale) measure();
      const dt = last ? (now - last) / 1000 : 1 / 60;
      last = now;
      if (target !== null) [peak, peakVelocity] = spring(peak, peakVelocity, target, dt);
      [strength, strengthVelocity] = spring(strength, strengthVelocity, target === null ? 0 : 1, dt);

      let behind = 0;
      let highest = null;
      let highestY = 0;
      sheets.forEach((sheet, index) => {
        let y = lift * strength * Math.exp(-((peak - centers[index]) ** 2) / (2 * spread ** 2));
        if (index > 0) y = Math.max(y, behind - reach[index]);
        behind = y;
        if (y < highestY) [highest, highestY] = [sheet, y];
        sheet.style.setProperty('--sheet-y', `${y.toFixed(2)}px`);
      });
      markPeak(target === null ? null : highest);

      if (target === null) {
        if (Math.abs(lift * strength) < 0.05) {
          stop();
          return;
        }
      } else if (Math.abs(target - peak) < 0.05 && Math.abs(1 - strength) < 0.001) {
        frame = 0; // parked under a still pointer; the next move wakes it
        last = 0;
        return;
      }
      frame = requestAnimationFrame(step);
    }

    function centerOf(element) {
      if (stale) measure();
      const index = sheets.findIndex(sheet => sheet.contains(element));
      return index < 0 ? null : centers[index];
    }

    const skims = event => event.pointerType !== 'touch' && active();
    const follow = () => aim(pointerY - grid.getBoundingClientRect().top);

    grid.setAttribute('data-open', '');
    grid.addEventListener('click', openSheet);
    grid.addEventListener('auxclick', event => { if (event.button === 1) openSheet(event); });

    grid.addEventListener('pointerenter', event => {
      if (skims(event)) stale = true;
    });
    grid.addEventListener('pointermove', event => {
      if (!skims(event)) return;
      pointerInside = true;
      pointerY = event.clientY;
      follow();
    });
    grid.addEventListener('pointerleave', () => {
      if (!pointerInside) return;
      pointerInside = false;
      const focused = document.activeElement;
      aim(active() && grid.contains(focused) && focusVisible(focused) ? centerOf(focused) : null);
    });
    addEventListener('scroll', () => {
      if (pointerInside) follow();
    }, { passive: true, capture: true });

    // Keyboard focus moves the drawer the same way while the pointer is elsewhere.
    grid.addEventListener('focusin', event => {
      if (pointerInside || !active() || !focusVisible(event.target)) return;
      const y = centerOf(event.target);
      if (y !== null) aim(y);
    });
    grid.addEventListener('focusout', event => {
      if (pointerInside || grid.contains(event.relatedTarget)) return;
      aim(null);
    });

    // Rows arrive from GitHub discovery and layouts change at breakpoints; measure again before the next frame.
    const markStale = () => { stale = true; };
    new MutationObserver(markStale).observe(grid, { childList: true });
    if (typeof ResizeObserver === 'function') new ResizeObserver(markStale).observe(grid);

    // While the skim runs, CSS hands the hover tint over to the highest sheet.
    const syncActive = () => {
      grid.toggleAttribute('data-skim', active());
      if (!active()) stop();
    };
    syncActive();
    finePointer.addEventListener?.('change', syncActive);
    reducedMotion.addEventListener?.('change', syncActive);
    addEventListener('pagehide', stop);
    addEventListener('blur', () => {
      if (!pointerInside) return;
      pointerInside = false;
      aim(null);
    });
  }

  document.querySelectorAll('.learning-grid').forEach(attach);
})();
