/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, Suspense, lazy } from 'react';
import { MotionConfig } from 'motion/react';
import { useRoute } from './hooks/useRoute';
import { useTheme } from './hooks/useTheme';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { PageSkeleton } from './components/ui/PageSkeleton';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { StateDisplay } from './components/ui/EditorialPrimitives';

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
const DevelopersPage = lazy(() =>
  import('./pages/DevelopersPage').then((m) => ({ default: m.DevelopersPage }))
);
const SolutionsPage = lazy(() =>
  import('./pages/SolutionsPage').then((m) => ({ default: m.SolutionsPage }))
);
const ResourcesPage = lazy(() =>
  import('./pages/ResourcesPage').then((m) => ({ default: m.ResourcesPage }))
);
const PricingPage = lazy(() =>
  import('./pages/PricingPage').then((m) => ({ default: m.PricingPage }))
);
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
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
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#FFFFFF] dark:bg-[#101014]">
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
  const { route, isNotFound, navigate } = useRoute();
  const { theme, toggleTheme } = useTheme();

  if (route === '/app' && !isNotFound) {
    return (
      <MotionConfig reducedMotion="user">
        <AppErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <SopinAppShell onNavigate={navigate} theme={theme} onToggleTheme={toggleTheme} />
          </Suspense>
        </AppErrorBoundary>
      </MotionConfig>
    );
  }

  const renderPage = () => {
    if (isNotFound) {
      return <NotFoundPage onNavigate={navigate} />;
    }

    switch (route) {
      case '/platform':
        return <PlatformPage onNavigate={navigate} />;
      case '/studio':
        return <StudioPage onNavigate={navigate} />;
      case '/workflow-automation':
        return <WorkflowPage onNavigate={navigate} />;
      case '/context':
        return <ContextPage onNavigate={navigate} />;
      case '/developers':
        return <DevelopersPage onNavigate={navigate} />;
      case '/solutions':
        return <SolutionsPage onNavigate={navigate} />;
      case '/resources':
        return <ResourcesPage onNavigate={navigate} />;
      case '/pricing':
        return <PricingPage onNavigate={navigate} />;
      case '/about':
        return <AboutPage onNavigate={navigate} />;
      case '/contact':
        return <ContactPage />;
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
        <div className="min-h-screen flex flex-col bg-[#FFFFFF] dark:bg-[#101014] text-[#101014] dark:text-[#FFFFFF] transition-colors">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#6252E8] focus:text-white focus:text-sm focus:font-semibold"
          >
            Skip to main content
          </a>

          <Navbar
            currentRoute={route}
            onNavigate={navigate}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

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
