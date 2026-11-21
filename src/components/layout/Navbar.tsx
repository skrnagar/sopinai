import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
  Moon,
  Network,
  Plug,
  Scale,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Terminal,
  Workflow,
  X,
} from 'lucide-react';
import { NAVIGATION_CATEGORIES } from '../../data/sopinData';
import { RoutePath } from '../../types/navigation';
import { ThemeMode } from '../../hooks/useTheme';
import { SopinLogo } from '../brand/SopinLogo';

interface NavbarProps {
  currentRoute: RoutePath;
  onNavigate: (path: RoutePath, sectionId?: string, queryParams?: Record<string, string>) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
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
    title: 'SOPIN Platform Architecture',
    description:
      'Twelve modular systems uniting visual authoring, deterministic business decisions, cyclic graphs, context management, sandboxed runtime, and governance.',
    ctaLabel: 'Platform Overview',
    ctaHref: '/platform',
  },
  solutions: {
    title: 'Domain Blueprints',
    description:
      'Reference topologies binding scoped tools, document parsing, ML pipelines, and human approvals across critical work.',
    ctaLabel: 'All Solutions',
    ctaHref: '/solutions',
  },
  developers: {
    title: 'Developer Ecosystem',
    description:
      'Typed TypeScript & Python SDKs with native Model Context Protocol (MCP) and Agent-to-Agent (A2A) standards.',
    ctaLabel: 'Open Documentation',
    ctaHref: '/docs',
  },
  resources: {
    title: 'Engineering Knowledge Base',
    description:
      'Guides, implementation tutorials, and architectural notes authored by the SOPIN team.',
    ctaLabel: 'Browse All Resources',
    ctaHref: '/resources',
  },
  company: {
    title: 'SOPIN · SONIL Group',
    description:
      'Stewarded under the SONIL Group with defense-in-depth security, transparent roadmap labeling, and direct engineering partnership.',
    ctaLabel: 'Trust & Security Center',
    ctaHref: '/security',
  },
};

function getItemIcon(label: string) {
  switch (label) {
    case 'Overview':
    case 'About SOPIN':
      return Layers;
    case 'SOPIN Studio':
    case 'Agent Studio':
      return Sparkles;
    case 'SOPIN Flow':
    case 'Workflow Automation':
      return GitBranch;
    case 'SOPIN Decisions':
      return Scale;
    case 'SOPIN Context':
    case 'Context and Memory':
      return Database;
    case 'SOPIN Graph':
    case 'Multi-Agent Applications':
      return Workflow;
    case 'SOPIN Gateway':
    case 'Model Gateway':
      return Network;
    case 'SOPIN Runtime':
    case 'Runtime':
    case 'Machine Learning':
      return Cpu;
    case 'SOPIN Observe':
      return Activity;
    case 'SOPIN Evaluate':
    case 'Evaluations':
      return FlaskConical;
    case 'SOPIN Control':
    case 'Governance':
    case 'Trust & Security Center':
      return ShieldCheck;
    case 'SOPIN Cloud':
    case 'Open Source':
      return Globe;
    case 'SOPIN Enterprise':
    case 'Enterprise AI':
      return Lock;
    case 'Document Intelligence':
      return FileText;
    case 'Data Intelligence':
      return BarChart3;
    case 'Documentation':
      return BookOpen;
    case 'API and SDK':
      return Code2;
    case 'MCP and A2A':
      return Plug;
    case 'Integrations':
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
  if (categoryId === 'developers') {
    return currentRoute === '/developers' || currentRoute === '/docs' || currentRoute.startsWith('/docs/');
  }
  if (categoryId === 'resources') {
    return currentRoute === '/resources' || currentRoute.startsWith('/resources/');
  }
  if (categoryId === 'pricing') return currentRoute === '/pricing';
  if (categoryId === 'company') {
    return currentRoute === '/about' || currentRoute === '/contact' || currentRoute === '/security';
  }
  return false;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  theme,
  onToggleTheme,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>('platform');
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileOpen(false);
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
  }, []);

  // Lock background page scroll while mobile navigation drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  // Close mobile drawer automatically if viewport expands past lg breakpoint
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
      <header className="sticky top-0 z-50 pt-safe border-b border-[#101014]/[0.08] dark:border-white/10 bg-[#FFFFFF]/95 dark:bg-[#101014]/95 backdrop-blur-md transition-colors">
        <div className="max-w-[1280px] mx-auto h-16 px-3 sm:px-6 lg:px-10 flex items-center justify-between gap-2 sm:gap-4 lg:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('/');
            }}
            aria-label="SOPIN Home"
            className="inline-flex items-center text-[#101014] dark:text-[#FFFFFF] whitespace-nowrap shrink-0 rounded-md py-1"
          >
            <SopinLogo size="md" />
          </a>

          {/* Zone 2: Primary Navigation with Mega Menus (Desktop lg+) */}
          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-6">
            {NAVIGATION_CATEGORIES.map((category) => {
              const hasItems = Boolean(category.items && category.items.length > 0);
              const isOpen = openDropdown === category.id;
              const active = isCategoryActive(category.id, currentRoute);
              const intro = MEGA_MENU_INTRO[category.id];
              const isPlatform = category.id === 'platform';
              const isMega =
                category.id === 'platform' ||
                category.id === 'solutions' ||
                category.id === 'developers';

              const alignClass =
                category.id === 'platform'
                  ? 'left-0'
                  : category.id === 'resources' || category.id === 'company'
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
                      active
                        ? 'text-[#101014] dark:text-white'
                        : 'text-[#5E5E6E] dark:text-[#A4A4B5] hover:text-[#101014] dark:hover:text-white'
                    }`}
                  >
                    <span>{category.label}</span>
                    {active && (
                      <motion.span
                        layoutId="nav-active-underline"
                        className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-[#6252E8]"
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
                      isOpen || active
                        ? 'text-[#101014] dark:text-white'
                        : 'text-[#5E5E6E] dark:text-[#A4A4B5] hover:text-[#101014] dark:hover:text-white'
                    }`}
                  >
                    <span>{category.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${
                        isOpen ? 'rotate-180 text-[#6252E8]' : ''
                      }`}
                      aria-hidden="true"
                    />
                    {active && !isOpen && (
                      <motion.span
                        layoutId="nav-active-underline"
                        className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-[#6252E8]"
                      />
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && category.items && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        role="menu"
                        aria-label={`${category.label} menu`}
                        className={`absolute ${alignClass} top-full pt-3 max-w-[calc(100vw-2rem)] ${
                          isPlatform ? 'w-[900px]' : isMega ? 'w-[740px]' : 'w-[600px]'
                        }`}
                      >
                        <div className="rounded-2xl border border-[#101014]/12 dark:border-white/12 bg-[#FFFFFF] dark:bg-[#101126] shadow-2xl overflow-hidden grid grid-cols-12">
                          {/* Left Editorial Summary Rail */}
                          {intro && (
                            <div
                              className={`${
                                isPlatform ? 'col-span-3' : 'col-span-4'
                              } bg-[#F7F7FA] dark:bg-[#101014]/60 border-r border-[#101014]/[0.08] dark:border-white/10 p-5 flex flex-col justify-between gap-4`}
                            >
                              <div>
                                <p className="text-[11px] font-semibold text-[#6252E8] dark:text-[#965BFF]">
                                  {category.label}
                                </p>
                                <h3 className="mt-1.5 font-display text-base font-semibold text-[#101014] dark:text-white leading-snug">
                                  {intro.title}
                                </h3>
                                <p className="mt-2 text-xs text-[#5E5E6E] dark:text-[#A4A4B5] leading-relaxed">
                                  {intro.description}
                                </p>
                              </div>
                              <a
                                href={intro.ctaHref}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleLinkClick(intro.ctaHref);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6252E8] dark:text-[#965BFF] hover:underline text-left"
                              >
                                <span>{intro.ctaLabel}</span>
                                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                              </a>
                            </div>
                          )}

                          {/* Right Structured Links Grid */}
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
                                  className="group text-left rounded-xl p-2.5 hover:bg-[#F7F7FA] dark:hover:bg-white/[0.06] transition-colors flex items-start gap-2.5"
                                >
                                  <div className="w-8 h-8 rounded-lg border border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101014] flex items-center justify-center shrink-0 mt-0.5 text-[#6252E8] dark:text-[#965BFF] group-hover:border-[#6252E8]/40 transition-colors">
                                    <Icon className="w-4 h-4" aria-hidden="true" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1.5">
                                      <span className="text-sm font-semibold text-[#101014] dark:text-white group-hover:text-[#6252E8] dark:group-hover:text-[#965BFF] transition-colors truncate">
                                        {item.label}
                                      </span>
                                      {item.status && (
                                        <span className="text-[10px] font-medium text-[#5E5E6E] dark:text-[#9A9AB0] shrink-0">
                                          {item.status}
                                        </span>
                                      )}
                                    </div>
                                    <span className="block mt-0.5 text-xs text-[#5E5E6E] dark:text-[#A4A4B5] leading-snug">
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

          {/* Zone 3: Theme Toggle + Try SOPIN + Primary Action */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg inline-flex items-center justify-center text-[#5E5E6E] dark:text-[#A4A4B5] hover:text-[#101014] dark:hover:text-white hover:bg-[#F7F7FA] dark:hover:bg-white/10 transition-colors shrink-0"
            >
              {theme === 'light' ? (
                <Moon className="w-[18px] h-[18px]" aria-hidden="true" />
              ) : (
                <Sun className="w-[18px] h-[18px]" aria-hidden="true" />
              )}
            </button>

            <a
              href="/app"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('/app');
              }}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] text-[#101014] dark:text-white hover:border-[#6252E8] transition-colors whitespace-nowrap shrink-0"
            >
              <Smartphone
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6252E8] dark:text-[#965BFF] shrink-0"
                aria-hidden="true"
              />
              <span>Try SOPIN</span>
            </a>

            <a
              href="/docs"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('/docs');
              }}
              className="hidden sm:inline-flex items-center gap-2 min-h-[40px] px-4 py-2 text-sm font-semibold rounded-lg bg-[#6252E8] text-white hover:bg-[#5243d6] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Start Building</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="lg:hidden w-10 h-10 sm:w-11 sm:h-11 rounded-lg inline-flex items-center justify-center text-[#101014] dark:text-white hover:bg-[#F7F7FA] dark:hover:bg-white/10 transition-colors shrink-0"
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

      {/* Responsive Mobile Navigation Drawer (Sibling outside header so backdrop-filter does not clip fixed height) */}
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
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden fixed inset-x-0 top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 z-50 bg-[#FFFFFF] dark:bg-[#101014] border-t border-[#101014]/10 dark:border-white/10 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 pb-safe shadow-2xl"
          >
            <nav aria-label="Mobile navigation" className="space-y-2 max-w-lg mx-auto pb-8">
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
                      className="flex items-center w-full text-left min-h-[48px] py-3 px-2 text-base font-semibold text-[#101014] dark:text-white border-b border-[#101014]/10 dark:border-white/10"
                    >
                      {category.label}
                    </a>
                  );
                }

                return (
                  <div
                    key={category.id}
                    className="border-b border-[#101014]/10 dark:border-white/10 pb-2"
                  >
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setMobileExpanded(isExpanded ? null : category.id)}
                      className="w-full flex items-center justify-between min-h-[48px] py-3 px-2 text-base font-semibold text-[#101014] dark:text-white"
                    >
                      <span>{category.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-150 ${
                          isExpanded ? 'rotate-180 text-[#6252E8]' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {isExpanded && category.items && (
                      <div className="pl-2 pb-2 space-y-1">
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
                              className="w-full text-left min-h-[44px] p-2.5 rounded-xl hover:bg-[#F7F7FA] dark:hover:bg-white/5 flex items-start gap-3"
                            >
                              <Icon
                                className="w-4 h-4 text-[#6252E8] dark:text-[#965BFF] mt-0.5 shrink-0"
                                aria-hidden="true"
                              />
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-sm font-medium text-[#101014] dark:text-white">
                                  {item.label}
                                  {item.status ? ` · ${item.status}` : ''}
                                </span>
                                <span className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
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

              <div className="pt-5 flex flex-col gap-3">
                <a
                  href="/app"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick('/app');
                  }}
                  className="w-full min-h-[48px] py-3 px-4 rounded-lg bg-[#6252E8] text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" aria-hidden="true" />
                  <span>Try SOPIN</span>
                </a>
                <a
                  href="/docs"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick('/docs');
                  }}
                  className="w-full min-h-[48px] py-3 px-4 rounded-lg bg-[#101014] dark:bg-white text-white dark:text-[#101014] text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <span>Start Building (Docs)</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick('/contact');
                  }}
                  className="w-full min-h-[48px] py-3 px-4 rounded-lg border border-[#101014]/15 dark:border-white/15 text-sm font-semibold text-[#101014] dark:text-white inline-flex items-center justify-center"
                >
                  Contact SONIL Group
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
