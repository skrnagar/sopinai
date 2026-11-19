import { useCallback, useEffect, useState } from 'react';
import { ROUTE_META } from '../data/sopinData';
import { RoutePath } from '../types/navigation';

const VALID_ROUTES: Set<string> = new Set<RoutePath>([
  '/',
  '/platform',
  '/studio',
  '/workflow-automation',
  '/context',
  '/developers',
  '/solutions',
  '/resources',
  '/pricing',
  '/about',
  '/contact',
  '/docs',
  '/app',
]);

function parsePath(pathname: string): { route: RoutePath; isNotFound: boolean } {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (VALID_ROUTES.has(clean)) {
    return { route: clean as RoutePath, isNotFound: false };
  }
  return { route: '/', isNotFound: true };
}

export function useRoute() {
  const [routeState, setRouteState] = useState<{ route: RoutePath; isNotFound: boolean }>(() =>
    parsePath(window.location.pathname)
  );
  const [activeSection, setActiveSection] = useState<string | null>(() =>
    window.location.hash ? window.location.hash.slice(1) : null
  );

  useEffect(() => {
    const handlePopState = () => {
      setRouteState(parsePath(window.location.pathname));
      setActiveSection(window.location.hash ? window.location.hash.slice(1) : null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (routeState.isNotFound) {
      document.title = 'Page Not Found — SOPIN';
      return;
    }

    const meta = ROUTE_META[routeState.route];
    document.title = meta.title;

    const setMetaTag = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) {
        el.setAttribute('content', content);
      }
    };

    setMetaTag('meta[name="description"]', meta.description);
    setMetaTag('meta[property="og:title"]', meta.title);
    setMetaTag('meta[property="og:description"]', meta.description);
    setMetaTag('meta[name="twitter:title"]', meta.title);
    setMetaTag('meta[name="twitter:description"]', meta.description);
  }, [routeState]);

  const navigate = useCallback((target: RoutePath, sectionId?: string) => {
    const url = sectionId ? `${target}#${sectionId}` : target;
    if (window.location.pathname !== target || window.location.hash !== (sectionId ? `#${sectionId}` : '')) {
      window.history.pushState({}, '', url);
    }
    setRouteState({ route: target, isNotFound: false });
    setActiveSection(sectionId ?? null);

    if (sectionId) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 60);
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return { route: routeState.route, isNotFound: routeState.isNotFound, activeSection, navigate };
}
