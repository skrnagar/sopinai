import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Briefcase,
  ChevronDown,
  Code2,
  Compass,
  Cpu,
  Database,
  FileCode2,
  FileText,
  FlaskConical,
  GitBranch,
  History,
  Layers,
  Mail,
  Menu,
  Network,
  Scale,
  ShieldCheck,
  Sparkles,
  Terminal,
  Workflow,
  X,
} from 'lucide-react';
import {
  DEFAULT_FEATURED_PRODUCT_ID,
  FEATURED_PLATFORM_PRODUCTS,
  NAVIGATION_CATEGORIES,
  PLATFORM_MENU_GROUPS,
} from '../../data/sopinData';
import { RESOURCE_ARTICLES } from '../../data/contentCatalog';
import { FeaturedPlatformProductId, RoutePath } from '../../types/navigation';
import { SopinLogo } from '../brand/SopinLogo';

interface NavbarProps {
  currentRoute: RoutePath;
  onNavigate: (path: RoutePath, sectionId?: string, queryParams?: Record<string, string>) => void;
  featuredProductId?: FeaturedPlatformProductId;
}

const FEATURED_RESEARCH_ARTICLE =
  RESOURCE_ARTICLES.find((a) => a.id === 'arch-unifying-studio-runtime') ?? RESOURCE_ARTICLES[0];

function getItemIcon(label: string) {
  switch (label) {
    case 'SOPIN Studio':
      return Sparkles;
    case 'SOPIN Flow':
      return GitBranch;
    case 'SOPIN Context':
    case 'Intelligent knowledge operations':
      return Database;
    case 'SOPIN Decisions':
    case 'Business decision automation':
      return Scale;
    case 'SOPIN Graph':
    case 'Multi-agent systems':
    case 'Enterprise AI automation':
      return Workflow;
    case 'SOPIN Runtime':
      return Cpu;
    case 'SOPIN Gateway':
      return Network;
    case 'SOPIN Observe':
      return Activity;
    case 'SOPIN Evaluate':
    case 'AI Research':
      return FlaskConical;
    case 'SOPIN Control':
    case 'Governed AI execution':
    case 'Trust & Security':
      return ShieldCheck;
    case 'Developer operations':
      return Terminal;
    case 'Agent Engineering':
    case 'API and SDK resources':
      return Code2;
    case 'Enterprise AI':
      return Layers;
    case 'Technical Perspectives':
    case 'Developer Guides':
      return Compass;
    case 'Case Studies':
      return FileText;
    case 'Documentation':
      return BookOpen;
    case 'Tutorials':
      return FileCode2;
    case 'Changelog':
      return History;
    case 'About SOPIN':
      return Briefcase;
    case 'Our Mission':
      return Compass;
    case 'Contact':
      return Mail;
    default:
      return Layers;
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
]);

function isCategoryActive(categoryId: string, currentRoute: RoutePath): boolean {
  if (categoryId === 'platform') return PLATFORM_ROUTES.has(currentRoute);
  if (categoryId === 'solutions') return currentRoute === '/solutions';
  if (categoryId === 'research') {
    return (
      currentRoute === '/research' ||
      currentRoute.startsWith('/research/') ||
      currentRoute === '/enterprise'
    );
  }
  if (categoryId === 'resources') {
    return (
      currentRoute === '/resources' ||
      currentRoute.startsWith('/resources/') ||
      currentRoute === '/developers' ||
      currentRoute.startsWith('/docs/')
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
  return false;
}

const FeaturedProductIllustration: React.FC<{ productId: FeaturedPlatformProductId }> = ({
  productId,
}) => {
  return (
    <div
      className="relative w-full aspect-[16/10] rounded-lg border border-[#05070E]/12 bg-[#080D18] overflow-hidden sopin-grid-dark"
      style={{
        backgroundImage:
          'radial-gradient(75% 75% at 78% 20%, rgba(37, 99, 235, 0.28) 0%, rgba(16, 29, 53, 0.72) 55%, rgba(8, 13, 24, 0.98) 100%)',
      }}
    >
      <svg
        viewBox="0 0 240 150"
        aria-hidden="true"
        className="w-full h-full block"
      >
        {productId === 'decisions' ? (
          <>
            <rect x="20" y="24" width="200" height="24" rx="5" fill="#0F1B33" stroke="rgba(96,165,250,0.35)" />
            <rect x="30" y="32" width="46" height="8" rx="2" fill="#60A5FA" opacity="0.85" />
            <rect x="86" y="32" width="60" height="8" rx="2" fill="rgba(226,232,240,0.4)" />
            <rect x="166" y="31" width="42" height="10" rx="3" fill="rgba(37,99,235,0.45)" />

            <rect x="20" y="58" width="200" height="24" rx="5" fill="#132444" stroke="#60A5FA" strokeWidth="1.2" />
            <rect x="30" y="66" width="52" height="8" rx="2" fill="#BFDBFE" />
            <rect x="92" y="66" width="52" height="8" rx="2" fill="rgba(226,232,240,0.65)" />
            <rect x="166" y="65" width="42" height="10" rx="3" fill="#2563EB" />

            <rect x="20" y="92" width="200" height="24" rx="5" fill="#0F1B33" stroke="rgba(148,163,184,0.22)" />
            <rect x="30" y="100" width="40" height="8" rx="2" fill="rgba(148,163,184,0.45)" />
            <rect x="80" y="100" width="66" height="8" rx="2" fill="rgba(148,163,184,0.3)" />
            <rect x="166" y="99" width="42" height="10" rx="3" fill="rgba(148,163,184,0.25)" />
          </>
        ) : (
          <>
            {/* Architectural Graph & Studio Blueprint SVG */}
            <path
              d="M 46 75 C 80 75, 86 42, 120 42 C 154 42, 160 75, 194 75"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="1.5"
            />
            <path
              d="M 46 75 C 80 75, 86 108, 120 108 C 154 108, 160 75, 194 75"
              fill="none"
              stroke="rgba(96, 165, 250, 0.45)"
              strokeWidth="1.25"
              strokeDasharray="3 4"
            />
            <rect x="24" y="59" width="44" height="32" rx="6" fill="#0F1B33" stroke="rgba(147,197,253,0.4)" />
            <rect x="33" y="71" width="26" height="6" rx="2" fill="#93C5FD" />

            <rect x="96" y="26" width="48" height="32" rx="6" fill="#132444" stroke="#60A5FA" strokeWidth="1.2" />
            <rect x="106" y="38" width="28" height="6" rx="2" fill="#EFF6FF" />

            <rect x="96" y="92" width="48" height="32" rx="6" fill="#0F1B33" stroke="rgba(147,197,253,0.35)" />
            <rect x="106" y="104" width="28" height="6" rx="2" fill="rgba(147,197,253,0.7)" />

            <rect x="172" y="59" width="44" height="32" rx="6" fill="#0F1B33" stroke="rgba(147,197,253,0.4)" />
            <rect x="181" y="71" width="26" height="6" rx="2" fill="#60A5FA" />
          </>
        )}
      </svg>
    </div>
  );
};

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  featuredProductId = DEFAULT_FEATURED_PRODUCT_ID,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>('platform');
  const [isScrolled, setIsScrolled] = useState(false);

  const navContainerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const closeTimerRef = useRef<number | null>(null);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 8);
  });

  const cancelCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpenDropdown(null);
    }, 130);
  };

  const handleOpenCategory = (categoryId: string) => {
    cancelCloseTimer();
    setOpenDropdown(categoryId);
  };

  useEffect(() => {
    return () => cancelCloseTimer();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openDropdown) {
          const activeTrigger = triggerRefs.current[openDropdown];
          setOpenDropdown(null);
          activeTrigger?.focus();
        }
        if (mobileOpen) {
          setMobileOpen(false);
          menuButtonRef.current?.focus();
        }
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [openDropdown, mobileOpen]);

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
    cancelCloseTimer();
    setOpenDropdown(null);
    setMobileOpen(false);
    onNavigate(path, sectionId);
  };

  const featuredProduct =
    FEATURED_PLATFORM_PRODUCTS[featuredProductId] ??
    FEATURED_PLATFORM_PRODUCTS[DEFAULT_FEATURED_PRODUCT_ID];

  const isDocsActive = currentRoute === '/docs' || currentRoute.startsWith('/docs/');

  const activeCategory = NAVIGATION_CATEGORIES.find((c) => c.id === openDropdown) ?? null;

  return (
    <div ref={navContainerRef}>
      <div className="h-16 pt-safe shrink-0" aria-hidden="true" />

      <header
        className={`fixed top-0 inset-x-0 z-50 pt-safe border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-200 ${
          isScrolled
            ? 'border-[#05070E]/12 bg-[#FAF9F5]/95 backdrop-blur-lg shadow-[0_6px_22px_-12px_rgba(5,7,14,0.14)]'
            : 'border-[#05070E]/[0.08] bg-[#FAF9F5]/90 backdrop-blur-md'
        }`}
      >
        <div
          className="relative max-w-[1280px] mx-auto h-16 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4"
          onMouseLeave={scheduleClose}
        >
          {/* Left: Official SOPIN Logo */}
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

          {/* Middle: Desktop Navigation Triggers */}
          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-1 xl:gap-2">
            {NAVIGATION_CATEGORIES.map((category) => {
              const isOpen = openDropdown === category.id;
              const active = isCategoryActive(category.id, currentRoute);
              const panelId = `nav-dropdown-${category.id}`;

              return (
                <div
                  key={category.id}
                  className="relative"
                  onMouseEnter={() => handleOpenCategory(category.id)}
                >
                  <button
                    ref={(el) => {
                      triggerRefs.current[category.id] = el;
                    }}
                    type="button"
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    aria-controls={panelId}
                    onClick={() => {
                      cancelCloseTimer();
                      setOpenDropdown(isOpen ? null : category.id);
                    }}
                    className={`relative inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isOpen
                        ? 'text-[#05070E] bg-[#05070E]/[0.04]'
                        : active
                        ? 'text-[#05070E]'
                        : 'text-[#4B4D5C] hover:text-[#05070E] hover:bg-[#05070E]/[0.03]'
                    }`}
                  >
                    <span>{category.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-current transition-transform duration-150 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                    {active && !isOpen && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-[#8F00FF]"
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Right: Docs + Sign in + Get Started CTA */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            <a
              href="/docs"
              aria-current={isDocsActive ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('/docs');
              }}
              className={`hidden lg:inline-flex items-center px-2.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                isDocsActive
                  ? 'text-[#8F00FF]'
                  : 'text-[#4B4D5C] hover:text-[#8F00FF]'
              }`}
            >
              Docs
            </a>

            <a
              href="/app"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('/app');
              }}
              className="hidden sm:inline-flex items-center min-h-[38px] px-3 py-1.5 rounded-lg text-sm font-medium text-[#05070E] hover:text-[#8F00FF] transition-colors whitespace-nowrap shrink-0"
            >
              Sign in
            </a>

            <a
              href="/docs"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('/docs');
              }}
              className="hidden sm:inline-flex items-center gap-1.5 min-h-[38px] px-4 py-2 text-sm font-semibold rounded-lg bg-[#05070E] hover:bg-[#1E293B] text-white transition-colors whitespace-nowrap shrink-0"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => {
                setOpenDropdown(null);
                setMobileOpen((prev) => !prev);
              }}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="lg:hidden w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg inline-flex items-center justify-center text-[#05070E] hover:bg-[#05070E]/[0.05] transition-colors shrink-0"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Desktop Mega Menu & Dropdown Panels */}
          <AnimatePresence>
            {openDropdown && activeCategory && (
              <motion.div
                key={activeCategory.id}
                id={`nav-dropdown-${activeCategory.id}`}
                role="menu"
                aria-label={`${activeCategory.label} menu`}
                onMouseEnter={cancelCloseTimer}
                onMouseLeave={scheduleClose}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-full pt-2.5 z-50 max-w-[calc(100vw-2rem)]"
                style={{
                  width:
                    activeCategory.id === 'platform'
                      ? 'min(980px, calc(100vw - 2rem))'
                      : activeCategory.id === 'research'
                      ? 'min(660px, calc(100vw - 2rem))'
                      : activeCategory.id === 'solutions'
                      ? 'min(580px, calc(100vw - 2rem))'
                      : activeCategory.id === 'resources'
                      ? 'min(440px, calc(100vw - 2rem))'
                      : 'min(360px, calc(100vw - 2rem))',
                }}
              >
                <div className="rounded-xl border border-[#05070E]/12 bg-[#FAF9F5] shadow-[0_20px_48px_-14px_rgba(8,13,24,0.16)] overflow-hidden">
                  {/* PLATFORM 3-ZONE MEGA MENU */}
                  {activeCategory.id === 'platform' && (
                    <div className="grid grid-cols-12">
                      {/* Left: Platform Overview */}
                      <div className="col-span-3 bg-[#FAF9F5] border-r border-[#05070E]/[0.08] p-6 flex flex-col justify-between gap-5">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8F00FF]">
                            Platform
                          </p>
                          <h3 className="mt-2 font-display text-lg font-semibold text-[#05070E] leading-snug">
                            The SOPIN Platform
                          </h3>
                          <p className="mt-2.5 text-[13px] text-[#5E5E6E] leading-relaxed">
                            One unified environment for engineering, orchestrating and governing intelligent agents.
                          </p>
                        </div>

                        <a
                          href="/platform"
                          role="menuitem"
                          onClick={(e) => {
                            e.preventDefault();
                            handleLinkClick('/platform');
                          }}
                          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8F00FF] hover:underline transition-colors"
                        >
                          <span>Explore the Platform</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      </div>

                      {/* Centre: 10 Product Surfaces in Logical Groups */}
                      <div className="col-span-6 p-5 space-y-4">
                        {/* Group 1: Authoring & Logic (4 products, 2x2) */}
                        <div>
                          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5E5E6E]">
                            {PLATFORM_MENU_GROUPS[0].label}
                          </p>
                          <div className="mt-1.5 grid grid-cols-2 gap-1">
                            {PLATFORM_MENU_GROUPS[0].items.map((item) => {
                              const Icon = getItemIcon(item.label);
                              return (
                                <a
                                  key={item.href}
                                  href={item.href}
                                  role="menuitem"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleLinkClick(item.href);
                                  }}
                                  className="group rounded-lg p-2 hover:bg-[#05070E]/[0.04] transition-colors flex items-start gap-2.5"
                                >
                                  <div className="w-7 h-7 rounded-md border border-[#05070E]/10 bg-[#FAF9F5] flex items-center justify-center shrink-0 mt-0.5 text-[#8F00FF] group-hover:bg-[#8F00FF]/[0.08] group-hover:border-[#8F00FF]/35 transition-colors">
                                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="block text-[13px] font-semibold text-[#05070E] group-hover:text-[#8F00FF] transition-colors truncate">
                                      {item.label}
                                    </span>
                                    <span className="block text-[11.5px] text-[#5E5E6E] leading-snug">
                                      {item.description}
                                    </span>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </div>

                        {/* Groups 2 & 3 Side-by-Side */}
                        <div className="pt-3 border-t border-[#05070E]/[0.07] grid grid-cols-2 gap-3">
                          {PLATFORM_MENU_GROUPS.slice(1).map((group) => (
                            <div key={group.id}>
                              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5E5E6E]">
                                {group.label}
                              </p>
                              <div className="mt-1.5 space-y-0.5">
                                {group.items.map((item) => {
                                  const Icon = getItemIcon(item.label);
                                  return (
                                    <a
                                      key={item.href}
                                      href={item.href}
                                      role="menuitem"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleLinkClick(item.href);
                                      }}
                                      className="group rounded-lg p-2 hover:bg-[#05070E]/[0.04] transition-colors flex items-start gap-2.5"
                                    >
                                      <div className="w-7 h-7 rounded-md border border-[#05070E]/10 bg-[#FAF9F5] flex items-center justify-center shrink-0 mt-0.5 text-[#8F00FF] group-hover:bg-[#8F00FF]/[0.08] group-hover:border-[#8F00FF]/35 transition-colors">
                                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                                      </div>
                                      <div className="min-w-0">
                                        <span className="block text-[13px] font-semibold text-[#05070E] group-hover:text-[#8F00FF] transition-colors truncate">
                                          {item.label}
                                        </span>
                                        <span className="block text-[11.5px] text-[#5E5E6E] leading-snug">
                                          {item.description}
                                        </span>
                                      </div>
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Configurable Featured Product */}
                      <div className="col-span-3 bg-[#FAF9F5] border-l border-[#05070E]/[0.08] p-5 flex flex-col justify-between gap-4">
                        <div className="space-y-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5E5E6E]">
                            Featured Product
                          </p>
                          <FeaturedProductIllustration productId={featuredProduct.id} />
                          <div>
                            <h4 className="font-display text-[15px] font-semibold text-[#05070E]">
                              {featuredProduct.name}
                            </h4>
                            <p className="mt-1 text-[12px] text-[#5E5E6E] leading-relaxed">
                              {featuredProduct.summary}
                            </p>
                          </div>
                        </div>

                        <a
                          href={featuredProduct.href}
                          role="menuitem"
                          onClick={(e) => {
                            e.preventDefault();
                            handleLinkClick(featuredProduct.href);
                          }}
                          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#8F00FF] hover:underline transition-colors"
                        >
                          <span>{featuredProduct.ctaLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* SOLUTIONS DROPDOWN */}
                  {activeCategory.id === 'solutions' && activeCategory.items && (
                    <div>
                      <div className="p-4 grid grid-cols-2 gap-1.5">
                        {activeCategory.items.map((item) => {
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
                              className="group rounded-lg p-2.5 hover:bg-[#05070E]/[0.04] transition-colors flex items-start gap-2.5"
                            >
                              <div className="w-8 h-8 rounded-md border border-[#05070E]/10 bg-[#FAF9F5] flex items-center justify-center shrink-0 mt-0.5 text-[#8F00FF] group-hover:bg-[#8F00FF]/[0.08] group-hover:border-[#8F00FF]/35 transition-colors">
                                <Icon className="w-4 h-4" aria-hidden="true" />
                              </div>
                              <div className="min-w-0">
                                <span className="block text-[13.5px] font-semibold text-[#05070E] group-hover:text-[#8F00FF] transition-colors">
                                  {item.label}
                                </span>
                                <span className="block mt-0.5 text-[12px] text-[#5E5E6E] leading-snug">
                                  {item.description}
                                </span>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                      <div className="border-t border-[#05070E]/[0.08] bg-[#FAF9F5] px-5 py-3 flex items-center justify-between">
                        <span className="text-xs text-[#5E5E6E]">
                          Inspect reference architectures across domains
                        </span>
                        <a
                          href="/solutions"
                          role="menuitem"
                          onClick={(e) => {
                            e.preventDefault();
                            handleLinkClick('/solutions');
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#8F00FF] hover:underline"
                        >
                          <span>All Solutions</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* RESEARCH DROPDOWN WITH REAL FEATURED ARTICLE */}
                  {activeCategory.id === 'research' && activeCategory.items && (
                    <div className="grid grid-cols-12">
                      <div className="col-span-6 p-4 space-y-1">
                        {activeCategory.items.map((item) => {
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
                              className="group rounded-lg p-2.5 hover:bg-[#05070E]/[0.04] transition-colors flex items-start gap-2.5"
                            >
                              <div className="w-7 h-7 rounded-md border border-[#05070E]/10 bg-[#FAF9F5] flex items-center justify-center shrink-0 mt-0.5 text-[#8F00FF] group-hover:bg-[#8F00FF]/[0.08] group-hover:border-[#8F00FF]/35 transition-colors">
                                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                              </div>
                              <div className="min-w-0">
                                <span className="block text-[13.5px] font-semibold text-[#05070E] group-hover:text-[#8F00FF] transition-colors">
                                  {item.label}
                                </span>
                                <span className="block mt-0.5 text-[11.5px] text-[#5E5E6E] leading-snug">
                                  {item.description}
                                </span>
                              </div>
                            </a>
                          );
                        })}
                      </div>

                      <div className="col-span-6 bg-[#FAF9F5] border-l border-[#05070E]/[0.08] p-5 flex flex-col justify-between gap-4">
                        <div className="space-y-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8F00FF]">
                            Featured Publication
                          </p>
                          <div className="rounded-lg border border-[#05070E]/10 bg-[#080D18] p-3.5 sopin-grid-dark text-white">
                            <span className="block font-mono text-[10px] text-[#93C5FD]">
                              {FEATURED_RESEARCH_ARTICLE.dateLabel}
                            </span>
                            <p className="mt-1 font-display text-sm font-semibold leading-snug text-white">
                              {FEATURED_RESEARCH_ARTICLE.title}
                            </p>
                          </div>
                          <p className="text-[12px] text-[#5E5E6E] leading-relaxed">
                            {FEATURED_RESEARCH_ARTICLE.summary}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#05070E]/[0.08]">
                          <span className="text-[11px] font-medium text-[#5E5E6E]">
                            {FEATURED_RESEARCH_ARTICLE.publishedDate} · {FEATURED_RESEARCH_ARTICLE.readTime}
                          </span>
                          <a
                            href={`/research/${FEATURED_RESEARCH_ARTICLE.id}`}
                            role="menuitem"
                            onClick={(e) => {
                              e.preventDefault();
                              handleLinkClick(
                                `/research/${FEATURED_RESEARCH_ARTICLE.id}` as RoutePath
                              );
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#8F00FF] hover:underline"
                          >
                            <span>Read Article</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RESOURCES & COMPANY SIMPLE CLEAN LISTS */}
                  {(activeCategory.id === 'resources' || activeCategory.id === 'company') &&
                    activeCategory.items && (
                      <div className="p-3 space-y-1">
                        {activeCategory.items.map((item) => {
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
                              className="group rounded-lg p-2.5 hover:bg-[#05070E]/[0.04] transition-colors flex items-start gap-3"
                            >
                              <div className="w-8 h-8 rounded-md border border-[#05070E]/10 bg-[#FAF9F5] flex items-center justify-center shrink-0 mt-0.5 text-[#8F00FF] group-hover:bg-[#8F00FF]/[0.08] group-hover:border-[#8F00FF]/35 transition-colors">
                                <Icon className="w-4 h-4" aria-hidden="true" />
                              </div>
                              <div className="min-w-0">
                                <span className="block text-[13.5px] font-semibold text-[#05070E] group-hover:text-[#8F00FF] transition-colors">
                                  {item.label}
                                </span>
                                <span className="block mt-0.5 text-[12px] text-[#5E5E6E] leading-snug">
                                  {item.description}
                                </span>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden fixed inset-x-0 top-[calc(4rem+env(safe-area-inset-top,0px))] bottom-0 z-50 bg-[#FAF9F5] border-t border-[#05070E]/10 overflow-y-auto overscroll-contain px-5 py-5 pb-safe"
          >
            <nav aria-label="Mobile navigation" className="space-y-1 max-w-lg mx-auto pb-8">
              {NAVIGATION_CATEGORIES.map((category) => {
                const isExpanded = mobileExpanded === category.id;
                const isPlatform = category.id === 'platform';

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
                        className={`w-4 h-4 text-current transition-transform duration-150 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {isExpanded && (
                      <div className="pl-2 pb-3 space-y-3">
                        {isPlatform ? (
                          <>
                            <a
                              href="/platform"
                              onClick={(e) => {
                                e.preventDefault();
                                handleLinkClick('/platform');
                              }}
                              className="flex items-center justify-between min-h-[44px] px-3 py-2 rounded-lg bg-[#FAF9F5] border border-[#05070E]/12 text-sm font-semibold text-[#8F00FF]"
                            >
                              <span>Explore the Platform</span>
                              <ArrowRight className="w-4 h-4" aria-hidden="true" />
                            </a>

                            {PLATFORM_MENU_GROUPS.map((group) => (
                              <div key={group.id} className="space-y-1">
                                <p className="px-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5E5E6E]">
                                  {group.label}
                                </p>
                                {group.items.map((item) => {
                                  const Icon = getItemIcon(item.label);
                                  return (
                                    <a
                                      key={item.href}
                                      href={item.href}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleLinkClick(item.href);
                                      }}
                                      className="w-full text-left min-h-[44px] p-2.5 rounded-lg hover:bg-[#05070E]/[0.04] flex items-start gap-3"
                                    >
                                      <Icon
                                        className="w-4 h-4 text-[#8F00FF] mt-0.5 shrink-0"
                                        aria-hidden="true"
                                      />
                                      <div className="min-w-0">
                                        <span className="block text-sm font-semibold text-[#05070E]">
                                          {item.label}
                                        </span>
                                        <span className="block text-xs text-[#5E5E6E]">
                                          {item.description}
                                        </span>
                                      </div>
                                    </a>
                                  );
                                })}
                              </div>
                            ))}
                          </>
                        ) : (
                          category.items && (
                            <div className="space-y-1">
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
                                    className="w-full text-left min-h-[44px] p-2.5 rounded-lg hover:bg-[#05070E]/[0.04] flex items-start gap-3"
                                  >
                                    <Icon
                                      className="w-4 h-4 text-[#8F00FF] mt-0.5 shrink-0"
                                      aria-hidden="true"
                                    />
                                    <div className="min-w-0">
                                      <span className="block text-sm font-semibold text-[#05070E]">
                                        {item.label}
                                      </span>
                                      <span className="block text-xs text-[#5E5E6E]">
                                        {item.description}
                                      </span>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Direct Docs Link */}
              <a
                href="/docs"
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick('/docs');
                }}
                className="flex items-center justify-between w-full text-left min-h-[48px] py-3 px-2 text-base font-semibold text-[#05070E] border-b border-[#05070E]/[0.08]"
              >
                <span>Docs</span>
                <ArrowRight className="w-4 h-4 text-current" aria-hidden="true" />
              </a>

              {/* Primary Mobile Actions */}
              <div className="pt-6 flex flex-col gap-3">
                <a
                  href="/docs"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick('/docs');
                  }}
                  className="w-full min-h-[48px] py-3 px-4 rounded-lg bg-[#05070E] hover:bg-[#1E293B] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <a
                  href="/app"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick('/app');
                  }}
                  className="w-full min-h-[48px] py-3 px-4 rounded-lg border border-[#05070E]/15 bg-[#FAF9F5] hover:bg-[#05070E]/[0.04] text-sm font-semibold text-[#05070E] inline-flex items-center justify-center"
                >
                  Sign in
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
