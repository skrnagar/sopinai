import { useCallback, useEffect, useState } from 'react';
import { ROUTE_META } from '../data/sopinData';
import { PRODUCT_SPECS_BY_ROUTE } from '../data/productsData';
import { DOC_SECTIONS, RESOURCE_ARTICLES } from '../data/contentCatalog';
import { RoutePath, StaticRoutePath } from '../types/navigation';

const SITE_ORIGIN = 'https://sopin.ai';

const STATIC_VALID_ROUTES = new Set<string>([
  '/',
  '/platform',
  '/studio',
  '/flow',
  '/workflow-automation',
  '/decisions',
  '/context',
  '/graph',
  '/runtime',
  '/gateway',
  '/observe',
  '/evaluate',
  '/control',
  '/cloud',
  '/enterprise',
  '/security',
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
  if (STATIC_VALID_ROUTES.has(clean)) {
    return { route: clean as RoutePath, isNotFound: false };
  }

  if (clean.startsWith('/docs/')) {
    const slug = clean.slice('/docs/'.length);
    if (DOC_SECTIONS.some((d) => d.id === slug)) {
      return { route: clean as RoutePath, isNotFound: false };
    }
  }

  if (clean.startsWith('/resources/')) {
    const slug = clean.slice('/resources/'.length);
    if (RESOURCE_ARTICLES.some((r) => r.id === slug)) {
      return { route: clean as RoutePath, isNotFound: false };
    }
  }

  return { route: '/', isNotFound: true };
}

function resolveRouteMeta(route: RoutePath, isNotFound: boolean) {
  if (isNotFound) {
    return {
      title: 'Page Not Found — SOPIN',
      description: 'The requested SOPIN page or specification route could not be located.',
      canonicalPath: '/',
      robots: 'noindex, nofollow',
    };
  }

  if (route.startsWith('/docs/')) {
    const slug = route.slice('/docs/'.length);
    const doc = DOC_SECTIONS.find((d) => d.id === slug);
    if (doc) {
      return {
        title: `${doc.title} — SOPIN Documentation`,
        description: doc.summary,
        canonicalPath: `/docs/${doc.id}`,
        robots: 'index, follow',
      };
    }
  }

  if (route.startsWith('/resources/')) {
    const slug = route.slice('/resources/'.length);
    const article = RESOURCE_ARTICLES.find((a) => a.id === slug);
    if (article) {
      return {
        title: `${article.title} — SOPIN Resources`,
        description: article.summary,
        canonicalPath: `/resources/${article.id}`,
        robots: 'index, follow',
      };
    }
  }

  const productMeta = PRODUCT_SPECS_BY_ROUTE[route];
  if (productMeta) {
    return {
      title: `${productMeta.name} — ${productMeta.tagline} | SOPIN`,
      description: productMeta.summary,
      canonicalPath: productMeta.route,
      robots: 'index, follow',
    };
  }

  const staticMeta = ROUTE_META[route as StaticRoutePath];
  if (staticMeta) {
    return {
      ...staticMeta,
      robots: route === '/app' ? 'noindex, nofollow' : staticMeta.robots || 'index, follow',
    };
  }

  return {
    title: 'SOPIN — Build AI agents that deliver work.',
    description:
      'Unified AI Agent Engineering and Execution Platform by SONIL Group.',
    canonicalPath: '/',
    robots: 'index, follow',
  };
}

export function useRoute() {
  const [routeState, setRouteState] = useState<{ route: RoutePath; isNotFound: boolean }>(() =>
    parsePath(window.location.pathname)
  );
  const [activeSection, setActiveSection] = useState<string | null>(() =>
    window.location.hash ? window.location.hash.slice(1) : null
  );
  const [searchQueryString, setSearchQueryString] = useState<string>(() => window.location.search);

  useEffect(() => {
    const handlePopState = () => {
      setRouteState(parsePath(window.location.pathname));
      setActiveSection(window.location.hash ? window.location.hash.slice(1) : null);
      setSearchQueryString(window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const meta = resolveRouteMeta(routeState.route, routeState.isNotFound);
    document.title = meta.title;

    const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    upsertMeta('name', 'description', meta.description);
    upsertMeta('name', 'robots', meta.robots || 'index, follow');
    upsertMeta('property', 'og:title', meta.title);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('property', 'og:url', `${SITE_ORIGIN}${meta.canonicalPath}`);
    upsertMeta('name', 'twitter:title', meta.title);
    upsertMeta('name', 'twitter:description', meta.description);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${SITE_ORIGIN}${meta.canonicalPath}`;
  }, [routeState]);

  const navigate = useCallback((target: RoutePath, sectionId?: string, queryParams?: Record<string, string>) => {
    const qs =
      queryParams && Object.keys(queryParams).length > 0
        ? `?${new URLSearchParams(queryParams).toString()}`
        : '';
    const hash = sectionId ? `#${sectionId}` : '';
    const url = `${target}${qs}${hash}`;

    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== url) {
      window.history.pushState({}, '', url);
    }

    const parsed = parsePath(target);
    setRouteState(parsed);
    setActiveSection(sectionId ?? null);
    setSearchQueryString(qs);

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

  return {
    route: routeState.route,
    isNotFound: routeState.isNotFound,
    activeSection,
    searchQueryString,
    navigate,
  };
}
