import { useEffect } from 'react';

// Wrapper classes used across the app for horizontally-scrollable tables.
// Compact preview tables (e.g. dashboard widgets) are excluded — they don't
// need a top scrollbar.
const SELECTOR = '.vst-table-wrap:not(.vst-table-wrap--compact), .modern-table-container, .table-wrapper';

// Mounted once at the app root. Scans the DOM for known table wrappers and
// attaches a synced horizontal scrollbar directly above each one. Idempotent:
// each wrapper is bound at most once even when React re-renders or new
// wrappers appear after navigation (handled via MutationObserver).
export default function TopScrollbars() {
  useEffect(() => {
    const bound = new WeakMap();

    const attach = (wrap) => {
      if (bound.has(wrap) || !wrap.parentNode) return;

      const bar = document.createElement('div');
      bar.className = 'top-hscroll-bar';
      const spacer = document.createElement('div');
      spacer.className = 'top-hscroll-spacer';
      bar.appendChild(spacer);
      wrap.parentNode.insertBefore(bar, wrap);

      let syncing = false;
      const syncFromBar = () => {
        if (syncing) return;
        syncing = true;
        wrap.scrollLeft = bar.scrollLeft;
        syncing = false;
      };
      const syncFromWrap = () => {
        if (syncing) return;
        syncing = true;
        bar.scrollLeft = wrap.scrollLeft;
        syncing = false;
      };
      bar.addEventListener('scroll', syncFromBar, { passive: true });
      wrap.addEventListener('scroll', syncFromWrap, { passive: true });

      const refresh = () => {
        spacer.style.width = wrap.scrollWidth + 'px';
        bar.style.display = wrap.scrollWidth > wrap.clientWidth + 1 ? '' : 'none';
      };

      const ro = new ResizeObserver(refresh);
      ro.observe(wrap);
      const inner = wrap.querySelector('table') || wrap.firstElementChild;
      if (inner) ro.observe(inner);

      refresh();

      bound.set(wrap, { bar, ro });
    };

    const scan = () => {
      document.querySelectorAll(SELECTOR).forEach(attach);
    };

    scan();

    const mo = new MutationObserver((mutations) => {
      // Only re-scan if any added node is or contains a matching wrapper.
      for (const m of mutations) {
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          if (n.matches?.(SELECTOR) || n.querySelector?.(SELECTOR)) {
            scan();
            return;
          }
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => mo.disconnect();
  }, []);

  return null;
}
