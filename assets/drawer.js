/* Fingertip skim for material sheets. Without this script the drawer simply stays still. */
(() => {
  'use strict';

  const canMove = matchMedia('(hover: hover) and (pointer: fine)');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const STIFFNESS = 380;
  const DAMPING = 2 * Math.sqrt(STIFFNESS);
  const TEXT_GAP = 2;

  const active = () => canMove.matches && !calm.matches;
  const offsetOf = sheet => parseFloat(sheet.style.getPropertyValue('--sheet-y')) || 0;

  function focusVisible(element) {
    try {
      return Boolean(element) && element.matches(':focus-visible');
    } catch {
      return false;
    }
  }

  function attach(grid) {
    let pointerInside = false;
    let pointerY = 0;
    let target = null;
    let focus = 0;
    let focusVelocity = 0;
    let amount = 0;
    let amountVelocity = 0;
    let last = 0;
    let frame = 0;
    let stale = true;
    let sheets = [];
    let centers = [];
    let reach = [];
    let spread = 32;
    let lift = -12;

    // Card boxes never move (only their paper and print do), so their rects are the fixed slots.
    function measure() {
      stale = false;
      sheets = Array.from(grid.querySelectorAll(':scope > .learning-card'));
      const origin = grid.getBoundingClientRect().top;
      const boxes = sheets.map(sheet => sheet.getBoundingClientRect());
      // A sheet's slot starts at its tab, so pointing at a tab raises that tab's own sheet.
      const tops = sheets.map((sheet, index) => Math.min(boxes[index].top, ...Array.from(sheet.querySelectorAll('.type-label, .format-label'), node => node.getBoundingClientRect().top - offsetOf(sheet))));
      centers = boxes.map((box, index) => {
        const bottom = index + 1 < tops.length ? tops[index + 1] : box.bottom;
        return (tops[index] + bottom) / 2 - origin;
      });
      const gaps = centers.slice(1).map((center, index) => center - centers[index]).sort((a, b) => a - b);
      spread = 0.72 * (gaps[Math.floor(gaps.length / 2)] || 44);
      lift = parseFloat(getComputedStyle(grid).getPropertyValue('--sheet-lift')) || -12;
      // How far each sheet may rise past the one behind it before its tab or edge reaches that sheet's text.
      reach = sheets.map((sheet, index) => {
        if (index === 0) return Infinity;
        const behind = sheets[index - 1];
        const ink = Array.from(behind.querySelectorAll('.resource-title, .card-description, .action-label'), node => node.getBoundingClientRect().bottom);
        if (!ink.length) return Infinity;
        return Math.max(0, tops[index] - (Math.max(...ink) - offsetOf(behind)) - TEXT_GAP);
      });
    }

    function settle(y) {
      if (stale) measure();
      if (amount < 0.02) {
        focus = y;
        focusVelocity = 0;
      }
      target = y;
      if (!frame) frame = requestAnimationFrame(step);
    }

    function release() {
      target = null;
      if (!frame) frame = requestAnimationFrame(step);
    }

    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      target = null;
      pointerInside = false;
      amount = 0;
      amountVelocity = 0;
      focusVelocity = 0;
      grid.querySelectorAll(':scope > .learning-card').forEach(sheet => sheet.style.removeProperty('--sheet-y'));
    }

    function step(now) {
      if (stale) measure();
      const dt = Math.min(0.032, last ? (now - last) / 1000 : 0.016);
      last = now;
      if (target !== null) {
        focusVelocity += (STIFFNESS * (target - focus) - DAMPING * focusVelocity) * dt;
        focus += focusVelocity * dt;
      }
      const goal = target === null ? 0 : 1;
      amountVelocity += (STIFFNESS * (goal - amount) - DAMPING * amountVelocity) * dt;
      amount += amountVelocity * dt;

      let behind = 0;
      sheets.forEach((sheet, index) => {
        let y = lift * amount * Math.exp(-((focus - centers[index]) ** 2) / (2 * spread ** 2));
        if (index > 0) y = Math.max(y, behind - reach[index]);
        behind = y;
        sheet.style.setProperty('--sheet-y', `${y.toFixed(2)}px`);
      });

      const resting = target === null
        ? Math.abs(lift * amount) < 0.05 && Math.abs(lift * amountVelocity) < 0.5
        : Math.abs(target - focus) < 0.05 && Math.abs(focusVelocity) < 0.05 && Math.abs(1 - amount) < 0.001;
      if (resting && target === null) {
        stop();
      } else if (resting) {
        frame = 0;
        last = 0;
      } else {
        frame = requestAnimationFrame(step);
      }
    }

    function follow() {
      settle(pointerY - grid.getBoundingClientRect().top);
    }

    function centerOf(element) {
      if (stale) measure();
      const index = sheets.findIndex(sheet => sheet.contains(element));
      return index < 0 ? null : centers[index];
    }

    const skims = event => event.pointerType !== 'touch' && active();

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
      pointerInside = false;
      const focused = document.activeElement;
      const y = active() && grid.contains(focused) && focusVisible(focused) ? centerOf(focused) : null;
      if (y === null) release(); else settle(y);
    });
    addEventListener('scroll', () => {
      if (pointerInside) follow();
    }, { passive: true, capture: true });

    // Keyboard focus moves the drawer the same way while the pointer is elsewhere.
    grid.addEventListener('focusin', event => {
      if (pointerInside || !active() || !focusVisible(event.target)) return;
      const y = centerOf(event.target);
      if (y !== null) settle(y);
    });
    grid.addEventListener('focusout', event => {
      if (pointerInside || grid.contains(event.relatedTarget)) return;
      release();
    });

    // Rows arrive from GitHub discovery and layouts change at breakpoints; measure again before the next frame.
    const markStale = () => { stale = true; };
    new MutationObserver(markStale).observe(grid, { childList: true });
    if (typeof ResizeObserver === 'function') new ResizeObserver(markStale).observe(grid);

    const settleAll = () => { if (!active()) stop(); };
    canMove.addEventListener?.('change', settleAll);
    calm.addEventListener?.('change', settleAll);
    addEventListener('pagehide', stop);
    addEventListener('blur', () => {
      if (pointerInside) {
        pointerInside = false;
        release();
      }
    });
  }

  document.querySelectorAll('.learning-grid').forEach(attach);
})();
