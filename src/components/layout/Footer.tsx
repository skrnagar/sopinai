import React from 'react';
import { RoutePath } from '../../types/navigation';
import { SopinLogo } from '../brand/SopinLogo';

interface FooterProps {
  onNavigate: (path: RoutePath, sectionId?: string, queryParams?: Record<string, string>) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const columns: {
    heading: string;
    links: { label: string; href: RoutePath; sectionId?: string }[];
  }[] = [
    {
      heading: 'Platform',
      links: [
        { label: 'Overview', href: '/platform' },
        { label: 'SOPIN Studio', href: '/studio' },
        { label: 'SOPIN Flow', href: '/flow' },
        { label: 'SOPIN Decisions', href: '/decisions' },
        { label: 'SOPIN Context', href: '/context' },
        { label: 'SOPIN Graph', href: '/graph' },
        { label: 'SOPIN Gateway', href: '/gateway' },
        { label: 'SOPIN Runtime', href: '/runtime' },
        { label: 'Observe & Evaluate', href: '/observe' },
        { label: 'Control & Cloud', href: '/control' },
      ],
    },
    {
      heading: 'Solutions',
      links: [
        { label: 'Business Automation', href: '/solutions', sectionId: 'business-automation' },
        { label: 'Document Intelligence', href: '/solutions', sectionId: 'document-intelligence' },
        { label: 'AI Research', href: '/solutions', sectionId: 'ai-research' },
        { label: 'Software Engineering', href: '/solutions', sectionId: 'software-engineering' },
        { label: 'Data & Machine Learning', href: '/solutions', sectionId: 'machine-learning' },
        { label: 'Multi-Agent Applications', href: '/solutions', sectionId: 'multi-agent' },
        { label: 'Enterprise AI', href: '/solutions', sectionId: 'enterprise-ai' },
      ],
    },
    {
      heading: 'Developers',
      links: [
        { label: 'Documentation', href: '/docs' },
        { label: 'API and SDK', href: '/developers', sectionId: 'sdk' },
        { label: 'MCP and A2A', href: '/developers', sectionId: 'protocols' },
        { label: 'Integrations', href: '/developers', sectionId: 'integrations' },
        { label: 'Open Source', href: '/developers', sectionId: 'open-source' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'Try SOPIN', href: '/app' },
        { label: 'About SOPIN', href: '/about' },
        { label: 'Trust & Security Center', href: '/security' },
        { label: 'SOPIN Enterprise', href: '/enterprise' },
        { label: 'Resources', href: '/resources' },
        { label: 'Pricing & Access', href: '/pricing' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  ];

  return (
    <footer className="border-t border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] text-[#101014] dark:text-[#FFFFFF] pb-safe">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-10 py-14 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-4">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              aria-label="SOPIN Home"
              className="inline-flex items-center text-[#101014] dark:text-white min-h-[44px] rounded-md"
            >
              <SopinLogo size="md" />
            </a>
            <p className="text-sm text-[#5E5E6E] dark:text-[#A4A4B5] leading-relaxed max-w-xs">
              Unified AI Agent Engineering and Execution Platform. Design. Connect. Execute. Verify. Govern.
            </p>
            <p className="text-xs font-medium text-[#101014] dark:text-[#D2D2E0]">
              SOPIN · A platform under the SONIL Group · sopin.ai
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {columns.map((col) => (
              <div key={col.heading}>
                <h3 className="text-xs font-semibold tracking-tight text-[#101014] dark:text-white mb-4">
                  {col.heading}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={`${col.heading}-${link.label}`}>
                      <a
                        href={link.sectionId ? `${link.href}#${link.sectionId}` : link.href}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(link.href, link.sectionId);
                        }}
                        className="inline-block py-0.5 text-sm text-[#5E5E6E] dark:text-[#A4A4B5] hover:text-[#101014] dark:hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-[#101014]/10 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#5E5E6E] dark:text-[#9A9AB0]">
          <p>© 2026 SOPIN · SONIL Group. Platform architecture preview.</p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="/app"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/app');
              }}
              className="inline-flex items-center min-h-[36px] hover:text-[#101014] dark:hover:text-white transition-colors"
            >
              Try SOPIN
            </a>
            <a
              href="/security"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/security');
              }}
              className="inline-flex items-center min-h-[36px] hover:text-[#101014] dark:hover:text-white transition-colors"
            >
              Trust &amp; Security
            </a>
            <a
              href="/docs"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/docs');
              }}
              className="inline-flex items-center min-h-[36px] hover:text-[#101014] dark:hover:text-white transition-colors"
            >
              Specifications
            </a>
            <a
              href="/contact"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/contact');
              }}
              className="inline-flex items-center min-h-[36px] hover:text-[#101014] dark:hover:text-white transition-colors"
            >
              hello@sopin.ai
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
