/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, Suspense, lazy, useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { useRoute } from './hooks/useRoute';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { PageSkeleton } from './components/ui/PageSkeleton';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { StateDisplay } from './components/ui/EditorialPrimitives';
import { PRODUCT_SPECS_BY_ROUTE } from './data/productsData';
import { RESOURCE_ARTICLES } from './data/contentCatalog';

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const PlatformPage = lazy(() =>
  import('./pages/PlatformPage').then((m) => ({ default: m.PlatformPage }))
);
const StudioPage = lazy(() => import('./pages/StudioPage').then((m) => ({ default: m.StudioPage })));
const WorkflowPage = lazy(() =>
  import('./pages/WorkflowPage').then((m) => ({ default: m.WorkflowPage }))
);
const ContextPage = lazy(() =>
  import('./pages/ContextPage').then((m) => ({ default: m.ContextPage }))
);
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage }))
);
const SecurityPage = lazy(() =>
  import('./pages/SecurityPage').then((m) => ({ default: m.SecurityPage }))
);
const DevelopersPage = lazy(() =>
  import('./pages/DevelopersPage').then((m) => ({ default: m.DevelopersPage }))
);
const SolutionsPage = lazy(() =>
  import('./pages/SolutionsPage').then((m) => ({ default: m.SolutionsPage }))
);
const ResearchPage = lazy(() =>
  import('./pages/ResearchPage').then((m) => ({ default: m.ResearchPage }))
);
const ResourcesPage = lazy(() =>
  import('./pages/ResourcesPage').then((m) => ({ default: m.ResourcesPage }))
);
const ResourceArticlePage = lazy(() =>
  import('./pages/ResourceArticlePage').then((m) => ({ default: m.ResourceArticlePage }))
);
const PricingPage = lazy(() =>
  import('./pages/PricingPage').then((m) => ({ default: m.PricingPage }))
);
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const LegalPage = lazy(() =>
  import('./pages/LegalPage').then((m) => ({ default: m.LegalPage }))
);
const DocsPage = lazy(() => import('./pages/DocsPage').then((m) => ({ default: m.DocsPage })));
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);
const SopinAppShell = lazy(() =>
  import('./app/SopinAppShell').then((m) => ({ default: m.SopinAppShell }))
);

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#FAF9F5]">
          <StateDisplay
            mode="error"
            title="Unable to render view"
            description="An unexpected rendering error occurred. Reload to restore your SOPIN session."
            actionLabel="Reload Application"
            onAction={() => window.location.reload()}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { route, isNotFound, activeSection, searchQueryString, navigate } = useRoute();
  const isAppRoute = route === '/app' && !isNotFound;

  useEffect(() => {
    if (!isAppRoute) {
      document.documentElement.classList.remove('dark');
    }
  }, [isAppRoute]);

  if (isAppRoute) {
    return (
      <MotionConfig reducedMotion="user">
        <AppErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <SopinAppShell onNavigate={navigate} />
          </Suspense>
        </AppErrorBoundary>
      </MotionConfig>
    );
  }

  const renderPage = () => {
    if (isNotFound) {
      return <NotFoundPage onNavigate={navigate} />;
    }

    if (route.startsWith('/docs/')) {
      const slug = route.slice('/docs/'.length);
      return <DocsPage activeSlug={slug} onNavigate={navigate} />;
    }

    if (route.startsWith('/research/')) {
      const slug = route.slice('/research/'.length);
      const article = RESOURCE_ARTICLES.find((a) => a.id === slug);
      if (article) {
        return (
          <ResourceArticlePage article={article} basePath="/research" onNavigate={navigate} />
        );
      }
      return <NotFoundPage onNavigate={navigate} />;
    }

    if (route.startsWith('/resources/')) {
      const slug = route.slice('/resources/'.length);
      const article = RESOURCE_ARTICLES.find((a) => a.id === slug);
      if (article) {
        return (
          <ResourceArticlePage article={article} basePath="/resources" onNavigate={navigate} />
        );
      }
      return <NotFoundPage onNavigate={navigate} />;
    }

    const productSpec = PRODUCT_SPECS_BY_ROUTE[route];
    if (productSpec) {
      return <ProductDetailPage spec={productSpec} onNavigate={navigate} />;
    }

    switch (route) {
      case '/platform':
        return <PlatformPage onNavigate={navigate} />;
      case '/studio':
        return <StudioPage onNavigate={navigate} />;
      case '/flow':
      case '/workflow-automation':
        return <WorkflowPage onNavigate={navigate} />;
      case '/context':
        return <ContextPage onNavigate={navigate} />;
      case '/security':
        return <SecurityPage onNavigate={navigate} />;
      case '/developers':
        return <DevelopersPage onNavigate={navigate} />;
      case '/solutions':
        return <SolutionsPage onNavigate={navigate} />;
      case '/research':
        return <ResearchPage activeSection={activeSection} onNavigate={navigate} />;
      case '/resources':
        return <ResourcesPage onNavigate={navigate} />;
      case '/pricing':
        return <PricingPage onNavigate={navigate} />;
      case '/about':
        return <AboutPage onNavigate={navigate} />;
      case '/contact':
        return <ContactPage queryString={searchQueryString} />;
      case '/legal':
        return <LegalPage onNavigate={navigate} />;
      case '/docs':
        return <DocsPage onNavigate={navigate} />;
      case '/':
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <AppErrorBoundary>
        <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-[#05070E]">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#000000] focus:text-white focus:text-sm focus:font-semibold"
          >
            Skip to main content
          </a>

          <Navbar currentRoute={route} onNavigate={navigate} />

          <main id="main-content" className="flex-1">
            <Suspense fallback={<PageSkeleton />}>{renderPage()}</Suspense>
          </main>

          <Footer onNavigate={navigate} />
          <OfflineBanner />
        </div>
      </AppErrorBoundary>
    </MotionConfig>
  );
}
