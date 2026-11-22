import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  ChevronDown,
  Code2,
  Cpu,
  Database,
  FileText,
  FlaskConical,
  GitBranch,
  Globe,
  Layers,
  Lock,
  Menu,
  Network,
  Plug,
  Scale,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
  X,
} from 'lucide-react';
import { NAVIGATION_CATEGORIES } from '../../data/sopinData';
import { RoutePath } from '../../types/navigation';
import { SopinLogo } from '../brand/SopinLogo';

interface NavbarProps {
  currentRoute: RoutePath;
  onNavigate: (path: RoutePath, sectionId?: string, queryParams?: Record<string, string>) => void;
}

const MEGA_MENU_INTRO: Record<
  string,
  {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: RoutePath;
  }
> = {
  platform: {
    title: 'SOPIN Platform',
    description:
      'One unified platform connecting agent authoring, context, workflows, graphs, deterministic decisions, runtime, and governance.',
    ctaLabel: 'Platform Overview',
    ctaHref: '/platform',
  },
  solutions: {
    title: 'Enterprise Solutions',
    description:
      'Production-oriented architectures combining scoped tools, knowledge grounding, deterministic rules, and human checkpoints.',
    ctaLabel: 'Explore All Solutions',
    ctaHref: '/solutions',
  },
  research: {
    title: 'Research & Insights',
    description:
      'Technical research papers, engineering guides, and transparent architecture notes from SOPIN and SONIL Group.',
    ctaLabel: 'All Research & Insights',
    ctaHref: '/research',
  },
  resources: {
    title: 'Resources & Developers',
    description:
      'Guides, tutorials, SDK specs, MCP & A2A interoperability, and architectural security documentation.',
    ctaLabel: 'Browse Resources',
    ctaHref: '/resources',
  },
  company: {
    title: 'SOPIN · SONIL Group',
    description:
      'Stewarded under SONIL Group with transparent roadmap labeling, architectural security, and enterprise partnership.',
    ctaLabel: 'About SOPIN',
    ctaHref: '/about',
  },
};

function getItemIcon(label: string) {
  switch (label) {
    case 'Platform Overview':
    case 'About SOPIN':
      return Layers;
    case 'SOPIN Studio':
      return Sparkles;
    case 'SOPIN Flow':
      return GitBranch;
    case 'SOPIN Decisions':
    case 'Business Decision Automation':
      return Scale;
    case 'SOPIN Context':
    case 'Intelligent Knowledge Operations':
      return Database;
    case 'SOPIN Graph':
    case 'Multi-Agent Workflows':
      return Workflow;
    case 'SOPIN Gateway':
      return Network;
    case 'SOPIN Runtime':
      return Cpu;
    case 'SOPIN Observe':
      return Activity;
    case 'SOPIN Evaluate':
      return FlaskConical;
    case 'SOPIN Control':
    case 'Trust & Security Center':
    case 'Governed Enterprise Execution':
      return ShieldCheck;
    case 'SOPIN Cloud & Access':
    case 'All Research & Insights':
    case 'Research':
      return Globe;
    case 'SOPIN Enterprise':
      return Lock;
    case 'Case Studies':
    case 'Resource Library':
      return FileText;
    case 'Engineering':
      return BarChart3;
    case 'Documentation':
      return BookOpen;
    case 'API & SDK Hub':
      return Code2;
    case 'MCP and A2A':
      return Plug;
    case 'AI-Powered Developer Operations':
      return Terminal;
    default:
      return Briefcase;
  }
}

const PLATFORM_ROUTES = new Set<string>([
  '/platform',
  '/studio',
  '/flow',
  '/workflow-automation',
  '/decisions',
  '/context',
  '/graph',
  '/gateway',
  '/runtime',
  '/observe',
  '/evaluate',
  '/control',
  '/cloud',
  '/enterprise',
]);

function isCategoryActive(categoryId: string, currentRoute: RoutePath): boolean {
  if (categoryId === 'platform') return PLATFORM_ROUTES.has(currentRoute);
  if (categoryId === 'solutions') return currentRoute === '/solutions';
  if (categoryId === 'research') {
    return currentRoute === '/research' || currentRoute.startsWith('/research/');
  }
  if (categoryId === 'resources') {
    return (
      currentRoute === '/resources' ||
      currentRoute.startsWith('/resources/') ||
      currentRoute === '/developers' ||
      currentRoute === '/pricing'
    );
  }
  if (categoryId === 'company') {
    return (
      currentRoute === '/about' ||
      currentRoute === '/contact' ||
      currentRoute === '/security' ||
      currentRoute === '/legal'
    );
  }
  if (categoryId === 'docs') {
    return currentRoute === '/docs' || currentRoute.startsWith('/docs/');
  }
  return false;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>('platform');
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 10);
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        if (mobileOpen) {
          setMobileOpen(false);
          menuButtonRef.current?.focus();
        }
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLinkClick = (path: RoutePath, sectionId?: string) => {
    setOpenDropdown(null);
    setMobileOpen(false);
    onNavigate(path, sectionId);
  };

  return (
    <div ref={navRef}>
      <div className="h-16 pt-safe shrink-0" aria-hidden="true" />

      <header
        className={`fixed top-0 inset-x-0 z-50 pt-safe border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-200 ${
          isScrolled
            ? 'border-[#05070E]/10 bg-[#FAF9F5]/95 backdrop-blur-lg shadow-[0_8px_24px_-12px_rgba(5,7,14,0.12)]'
            : 'border-[#05070E]/[0.08] bg-[#FAF9F5]/90 backdrop-blur-md'
        }`}
      >
        <div className="max-w-[1280px] mx-auto h-16 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('/');
            }}
            aria-label="SOPIN Home"
            className="inline-flex items-center text-[#05070E] whitespace-nowrap shrink-0 rounded-md py-1"
          >
            <SopinLogo size="md" />
          </a>

          {/* Primary Desktop Navigation */}
          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-6">
            {NAVIGATION_CATEGORIES.map((category) => {
              const hasItems = Boolean(category.items && category.items.length > 0);
              const isOpen = openDropdown === category.id;
              const active = isCategoryActive(category.id, currentRoute);
              const intro = MEGA_MENU_INTRO[category.id];
              const isPlatform = category.id === 'platform';

              const alignClass =
                category.id === 'platform'
                  ? 'left-0'
                  : category.id === 'company' || category.id === 'resources'
                  ? 'right-0'
                  : 'left-1/2 -translate-x-1/2';

              if (!hasItems && category.href) {
                return (
                  <a
                    key={category.id}
                    href={category.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(category.href!);
                    }}
                    className={`relative text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-2 ${
                      active ? 'text-[#05070E]' : 'text-[#5E5E6E] hover:text-[#05070E]'
                    }`}
                  >
                    <span>{category.label}</span>
                    {active && (
                      <motion.span
                        layoutId="nav-active-underline"
                        className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-[#2563EB]"
                      />
                    )}
                  </a>
                );
              }

              return (
                <div
                  key={category.id}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(category.id)}
                  onMouseLeave={() =>
                    setOpenDropdown((prev) => (prev === category.id ? null : prev))
                  }
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    onClick={() => setOpenDropdown(isOpen ? null : category.id)}
                    className={`relative inline-flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-2 ${
                      isOpen || active ? 'text-[#05070E]' : 'text-[#5E5E6E] hover:text-[#05070E]'
                    }`}
                  >
                    <span>{category.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${
                        isOpen ? 'rotate-180 text-[#2563EB]' : ''
                      }`}
                      aria-hidden="true"
                    />
                    {active && !isOpen && (
                      <motion.span
                        layoutId="nav-active-underline"
                        className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-[#2563EB]"
                      />
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && category.items && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        role="menu"
                        aria-label={`${category.label} menu`}
                        className={`absolute ${alignClass} top-full pt-3 max-w-[calc(100vw-2rem)] ${
                          isPlatform ? 'w-[880px]' : 'w-[660px]'
                        }`}
                      >
                        <div className="rounded-2xl border border-[#05070E]/10 bg-[#FAF9F5] shadow-2xl overflow-hidden grid grid-cols-12">
                          {intro && (
                            <div
                              className={`${
                                isPlatform ? 'col-span-3' : 'col-span-4'
                              } bg-[#FBF7F0] border-r border-[#05070E]/[0.08] p-5 flex flex-col justify-between gap-4`}
                            >
                              <div>
                                <p className="text-[11px] font-semibold text-[#2563EB]">
                                  {category.label}
                                </p>
                                <h3 className="mt-1.5 font-display text-base font-semibold text-[#05070E] leading-snug">
                                  {intro.title}
                                </h3>
                                <p className="mt-2 text-xs text-[#5E5E6E] leading-relaxed">
                                  {intro.description}
                                </p>
                              </div>
                              <a
                                href={intro.ctaHref}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleLinkClick(intro.ctaHref);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
                              >
                                <span>{intro.ctaLabel}</span>
                                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                              </a>
                            </div>
                          )}

                          <div
                            className={`${
                              intro ? (isPlatform ? 'col-span-9' : 'col-span-8') : 'col-span-12'
                            } p-3.5 grid ${isPlatform ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5`}
                          >
                            {category.items.map((item) => {
                              const Icon = getItemIcon(item.label);
                              const targetHref = item.sectionId
                                ? `${item.href}#${item.sectionId}`
                                : item.href;
                              return (
                                <a
                                  key={`${item.href}-${item.label}`}
                                  href={targetHref}
                                  role="menuitem"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleLinkClick(item.href, item.sectionId);
                                  }}
                                  className="group text-left rounded-xl p-2.5 hover:bg-[#FBF7F0] transition-colors flex items-start gap-2.5"
                                >
                                  <div className="w-8 h-8 rounded-lg border border-[#05070E]/10 bg-[#FAF9F5] flex items-center justify-center shrink-0 mt-0.5 text-[#2563EB] group-hover:border-[#2563EB]/40 transition-colors">
                                    <Icon className="w-4 h-4" aria-hidden="true" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1.5">
                                      <span className="text-sm font-semibold text-[#05070E] group-hover:text-[#2563EB] transition-colors truncate">
                                        {item.label}
                                      </span>
                                      {item.status && (
                                        <span className="text-[10px] font-medium text-[#5E5E6E] shrink-0">
                                          {item.status}
                                        </span>
                                      )}
                                    </div>
                                    <span className="block mt-0.5 text-xs text-[#5E5E6E] leading-snug">
                                      {item.description}
                                    </span>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Right Actions: Sign in + Start for free CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="/app"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('/app');
              }}
              className="hidden sm:inline-flex items-center min-h-[40px] px-3 py-2 text-sm font-medium text-[#05070E] hover:text-[#2563EB] transition-colors whitespace-nowrap shrink-0"
            >
              Sign in
            </a>

            <a
              href="/docs"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('/docs');
              }}
              className="hidden sm:inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 text-sm font-semibold rounded-lg bg-[#000000] text-white hover:bg-[#1F2937] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Start for free</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="lg:hidden w-11 h-11 rounded-lg inline-flex items-center justify-center text-[#05070E] hover:bg-[#FBF7F0] transition-colors shrink-0"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Height Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden fixed inset-x-0 top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 z-50 bg-[#FAF9F5] border-t border-[#05070E]/10 overflow-y-auto overscroll-contain px-5 py-6 pb-safe shadow-2xl"
          >
            <nav aria-label="Mobile navigation" className="space-y-1 max-w-lg mx-auto pb-8">
              {NAVIGATION_CATEGORIES.map((category) => {
                const hasItems = Boolean(category.items && category.items.length > 0);
                const isExpanded = mobileExpanded === category.id;

                if (!hasItems && category.href) {
                  return (
                    <a
                      key={category.id}
                      href={category.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLinkClick(category.href!);
                      }}
                      className="flex items-center justify-between w-full text-left min-h-[48px] py-3 px-2 text-base font-semibold text-[#05070E] border-b border-[#05070E]/[0.08]"
                    >
                      <span>{category.label}</span>
                      <ArrowRight className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
                    </a>
                  );
                }

                return (
                  <div
                    key={category.id}
                    className="border-b border-[#05070E]/[0.08] pb-1"
                  >
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setMobileExpanded(isExpanded ? null : category.id)}
                      className="w-full flex items-center justify-between min-h-[48px] py-3 px-2 text-base font-semibold text-[#05070E]"
                    >
                      <span>{category.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-150 ${
                          isExpanded ? 'rotate-180 text-[#2563EB]' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {isExpanded && category.items && (
                      <div className="pl-2 pb-3 space-y-1">
                        {category.items.map((item) => {
                          const Icon = getItemIcon(item.label);
                          const targetHref = item.sectionId
                            ? `${item.href}#${item.sectionId}`
                            : item.href;
                          return (
                            <a
                              key={`${item.href}-${item.label}`}
                              href={targetHref}
                              onClick={(e) => {
                                e.preventDefault();
                                handleLinkClick(item.href, item.sectionId);
                              }}
                              className="w-full text-left min-h-[44px] p-2.5 rounded-xl hover:bg-[#FBF7F0] flex items-start gap-3"
                            >
                              <Icon
                                className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0"
                                aria-hidden="true"
                              />
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-sm font-medium text-[#05070E]">
                                  {item.label}
                                  {item.status ? ` · ${item.status}` : ''}
                                </span>
                                <span className="text-xs text-[#5E5E6E]">
                                  {item.description}
                                </span>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="pt-6 flex flex-col gap-3">
                <a
                  href="/docs"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick('/docs');
                  }}
                  className="w-full min-h-[48px] py-3 px-4 rounded-lg bg-[#000000] hover:bg-[#1F2937] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Start for free</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <a
                  href="/app"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick('/app');
                  }}
                  className="w-full min-h-[48px] py-3 px-4 rounded-lg border border-[#05070E]/15 bg-[#FBF7F0] text-sm font-semibold text-[#05070E] inline-flex items-center justify-center"
                >
                  Sign in to Workspace
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
