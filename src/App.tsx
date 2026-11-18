/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MotionConfig } from 'motion/react';
import { useRoute } from './hooks/useRoute';
import { useTheme } from './hooks/useTheme';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { PlatformPage } from './pages/PlatformPage';
import { StudioPage } from './pages/StudioPage';
import { WorkflowPage } from './pages/WorkflowPage';
import { ContextPage } from './pages/ContextPage';
import { DevelopersPage } from './pages/DevelopersPage';
import { SolutionsPage } from './pages/SolutionsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { DocsPage } from './pages/DocsPage';

export default function App() {
  const { route, navigate } = useRoute();
  const { theme, toggleTheme } = useTheme();

  const renderPage = () => {
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
          {renderPage()}
        </main>

        <Footer onNavigate={navigate} />
      </div>
    </MotionConfig>
  );
}
