import { useSyncExternalStore } from 'react';
import { sectionPath, parseRoute } from './routes';

// History entries created by in-app navigation carry `appNav`, which lets a
// modal's close button go back() (restoring the previous URL) instead of
// leaving the visitor stranded when the URL was opened directly.
// `under` is the painting modal that sits beneath an artist modal opened
// from it, so closing the artist reveals the painting again.
export interface NavState {
  appNav?: boolean;
  under?: string;
}

const NAV_EVENT = 'app:navigate';

const subscribe = (callback: () => void) => {
  window.addEventListener('popstate', callback);
  window.addEventListener(NAV_EVENT, callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener(NAV_EVENT, callback);
  };
};

const getPathname = () => window.location.pathname;

export const usePathname = () => useSyncExternalStore(subscribe, getPathname, () => '/');

export const getNavState = (): NavState => (window.history.state as NavState | null) ?? {};

export function navigate(to: string, options: { replace?: boolean; under?: string } = {}) {
  const state: NavState = { appNav: true, ...(options.under ? { under: options.under } : {}) };
  const current = window.location.pathname + window.location.search;
  if (options.replace) {
    window.history.replaceState(state, '', to);
  } else if (to !== current) {
    window.history.pushState(state, '', to);
  }
  window.dispatchEvent(new Event(NAV_EVENT));
  if (parseRoute(to.split(/[?#]/)[0]).kind === 'section') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

export function navigateToSection(section: string) {
  navigate(sectionPath(section));
}

// Close a modal route: step back if we pushed it, otherwise (direct visit
// or refresh) land on a sensible parent page.
export function closeModalRoute(fallbackPath: string) {
  if (getNavState().appNav) {
    window.history.back();
  } else {
    navigate(fallbackPath, { replace: true });
  }
}
