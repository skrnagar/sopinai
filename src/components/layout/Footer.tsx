import React from 'react';
import { RoutePath } from '../../types/navigation';
import { SopinLogo } from '../brand/SopinLogo';

interface FooterProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const columns: {
    heading: string;
    links: { label: string; href: RoutePath; sectionId?: string }[];
  }[] = [
    {
      heading: 'Platform',
      links: [
        { label: 'Overview', href: '/platform', sectionId: 'overview' },
        { label: 'Agent Studio', href: '/studio' },
        { label: 'Workflow Automation', href: '/workflow-automation' },
        { label: 'Context and Memory', href: '/context' },
        { label: 'Model Gateway', href: '/platform', sectionId: 'gateway' },
        { label: 'Runtime & Governance', href: '/platform', sectionId: 'runtime' },
      ],
    },
    {
      heading: 'Solutions',
      links: [
        { label: 'Business Automation', href: '/solutions', sectionId: 'business-automation' },
        { label: 'AI Research', href: '/solutions', sectionId: 'ai-research' },
        { label: 'Software Engineering', href: '/solutions', sectionId: 'software-engineering' },
        { label: 'Data and ML', href: '/solutions', sectionId: 'data-ml' },
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
        { label: 'About SOPIN', href: '/about' },
        { label: 'Resources', href: '/resources' },
        { label: 'Pricing & Access', href: '/pricing' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  ];

  return (
    <footer className="border-t border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] text-[#101014] dark:text-[#FFFFFF]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-4">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              aria-label="SOPIN Home"
              className="inline-flex items-center text-[#101014] dark:text-white"
            >
              <SopinLogo size="md" />
            </button>
            <p className="text-sm text-[#777786] dark:text-[#A4A4B5] leading-relaxed max-w-xs">
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
                        className="text-sm text-[#777786] dark:text-[#A4A4B5] hover:text-[#101014] dark:hover:text-white transition-colors"
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

        <div className="mt-14 pt-8 border-t border-[#101014]/10 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#777786] dark:text-[#9A9AB0]">
          <p>© 2026 SOPIN · SONIL Group. Platform architecture preview.</p>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigate('/platform', 'governance')}
              className="hover:text-[#101014] dark:hover:text-white transition-colors"
            >
              Governance Architecture
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/docs')}
              className="hover:text-[#101014] dark:hover:text-white transition-colors"
            >
              Specifications
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/contact')}
              className="hover:text-[#101014] dark:hover:text-white transition-colors"
            >
              hello@sopin.ai
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
