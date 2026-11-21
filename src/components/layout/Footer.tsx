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
        { label: 'SOPIN Context', href: '/context' },
        { label: 'SOPIN Graph', href: '/graph' },
        { label: 'SOPIN Runtime', href: '/runtime' },
        { label: 'SOPIN Gateway', href: '/gateway' },
        { label: 'Observe & Evaluate', href: '/observe' },
        { label: 'SOPIN Control', href: '/control' },
        { label: 'SOPIN Decisions', href: '/decisions' },
      ],
    },
    {
      heading: 'Solutions',
      links: [
        { label: 'Enterprise AI Automation', href: '/solutions', sectionId: 'business-automation' },
        { label: 'Knowledge Operations', href: '/solutions', sectionId: 'document-intelligence' },
        { label: 'Multi-Agent Workflows', href: '/solutions', sectionId: 'multi-agent' },
        { label: 'Decision Automation', href: '/decisions' },
        { label: 'Developer Operations', href: '/solutions', sectionId: 'software-engineering' },
        { label: 'Governed Execution', href: '/solutions', sectionId: 'enterprise-ai' },
      ],
    },
    {
      heading: 'Developers',
      links: [
        { label: 'Documentation', href: '/docs' },
        { label: 'Quickstart', href: '/docs/quickstart' },
        { label: 'API and SDK', href: '/developers', sectionId: 'sdk' },
        { label: 'MCP and A2A', href: '/developers', sectionId: 'protocols' },
        { label: 'Decisions Spec', href: '/docs/decisions-spec' },
      ],
    },
    {
      heading: 'Research',
      links: [
        { label: 'All Insights', href: '/research' },
        { label: 'Research', href: '/research', sectionId: 'research' },
        { label: 'Engineering', href: '/research', sectionId: 'engineering' },
        { label: 'Case Studies', href: '/research', sectionId: 'case-studies' },
        { label: 'Resources Library', href: '/resources' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About SOPIN', href: '/about' },
        { label: 'SOPIN Cloud', href: '/cloud' },
        { label: 'SOPIN Enterprise', href: '/enterprise' },
        { label: 'Pricing & Access', href: '/pricing' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Trust & Security', href: '/security' },
        { label: 'Privacy Notice', href: '/legal', sectionId: 'privacy' },
        { label: 'Terms of Use', href: '/legal', sectionId: 'terms' },
        { label: 'Responsible AI', href: '/legal', sectionId: 'responsible-ai' },
      ],
    },
  ];

  return (
    <footer className="border-t border-[#E5E7EB] dark:border-white/10 bg-[#F7F8FA] dark:bg-[#080D18] text-[#111827] dark:text-[#FFFFFF] pb-safe">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-10 py-14 sm:py-16">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 lg:gap-12">
          <div className="xl:col-span-3 space-y-4">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              aria-label="SOPIN Home"
              className="inline-flex items-center text-[#111827] dark:text-white min-h-[44px] rounded-md"
            >
              <SopinLogo size="md" />
            </a>
            <p className="text-sm text-[#667085] dark:text-[#94A3B8] leading-relaxed max-w-xs">
              Intelligence beyond limits. Unified AI Agent Engineering and Execution Platform.
            </p>
            <p className="text-xs font-semibold text-[#111827] dark:text-[#CBD5E1]">
              Design. Connect. Execute. Verify. Govern.
            </p>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
              SOPIN · A platform under SONIL Group
            </p>
          </div>

          <div className="xl:col-span-9 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
            {columns.map((col) => (
              <div key={col.heading}>
                <h3 className="text-xs font-semibold tracking-tight text-[#111827] dark:text-white mb-3.5">
                  {col.heading}
                </h3>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={`${col.heading}-${link.label}`}>
                      <a
                        href={link.sectionId ? `${link.href}#${link.sectionId}` : link.href}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(link.href, link.sectionId);
                        }}
                        className="inline-block py-0.5 text-sm text-[#667085] dark:text-[#94A3B8] hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors"
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

        <div className="mt-14 pt-8 border-t border-[#E5E7EB] dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#667085] dark:text-[#94A3B8]">
          <p>© 2026 SOPIN · SONIL Group. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="/docs"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/docs');
              }}
              className="inline-flex items-center min-h-[36px] hover:text-[#111827] dark:hover:text-white transition-colors"
            >
              Documentation
            </a>
            <a
              href="/security"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/security');
              }}
              className="inline-flex items-center min-h-[36px] hover:text-[#111827] dark:hover:text-white transition-colors"
            >
              Security
            </a>
            <a
              href="/app"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/app');
              }}
              className="inline-flex items-center min-h-[36px] hover:text-[#111827] dark:hover:text-white transition-colors"
            >
              Sign in
            </a>
            <a
              href="/contact"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/contact');
              }}
              className="inline-flex items-center min-h-[36px] hover:text-[#111827] dark:hover:text-white transition-colors"
            >
              hello@sopin.ai
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
