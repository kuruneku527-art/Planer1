/**
 * viewportManager
 *
 * FIX: this file was missing entirely from src/services/, while
 * src/App.tsx still imported it ("Cannot find module
 * './services/viewportManager'"). That unresolved import made
 * `vite build` fail immediately, which is why the GitHub Actions
 * "Build web application" step kept failing before Gradle/Android
 * ever ran.
 *
 * Purpose: keeps a reliable CSS custom property (--app-height, in
 * px) in sync with the *actual* visible viewport height. Plain CSS
 * "100vh" is unreliable on mobile — it does not account for the
 * on-screen keyboard, or the browser's address bar showing/hiding —
 * which typically shows up as content being cut off or extra blank
 * space at the bottom. This uses the VisualViewport API when
 * available (best behavior with the keyboard open) and falls back
 * to window.innerHeight on older WebViews.
 *
 * Usage (already wired up in App.tsx):
 *   const cleanup = viewportManager.init();
 *   // ... later, on unmount:
 *   cleanup();
 *
 * In CSS, use it like:
 *   .full-height { height: var(--app-height, 100vh); }
 */

function setAppHeightVar() {
  const height =
    (typeof window !== 'undefined' && window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight) || window.innerHeight;

  document.documentElement.style.setProperty('--app-height', `${height}px`);
}

function init(): () => void {
  if (typeof window === 'undefined') {
    // no-op on non-browser environments (SSR/build-time), keeps this
    // safe to import anywhere.
    return () => {};
  }

  setAppHeightVar();

  const handleResize = () => setAppHeightVar();

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
  }

  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', handleResize);
      window.visualViewport.removeEventListener('scroll', handleResize);
    }
  };
}

export const viewportManager = {
  init,
};
