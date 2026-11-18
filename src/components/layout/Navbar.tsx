import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, Moon, Sun, X, ArrowRight } from 'lucide-react';
import { NAVIGATION_CATEGORIES } from '../../data/sopinData';
import { RoutePath } from '../../types/navigation';
import { ThemeMode } from '../../hooks/useTheme';
import { SopinLogo } from '../brand/SopinLogo';

interface NavbarProps {
  currentRoute: RoutePath;
  onNavigate: (path: RoutePath, sectionId?: string) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
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
  const navRef = useRef<HTMLElement>(null);

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

  const handleLinkClick = (path: RoutePath, sectionId?: string) => {
    setOpenDropdown(null);
    setMobileOpen(false);
    onNavigate(path, sectionId);
  };

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 h-16 border-b border-[#101014]/10 dark:border-white/10 bg-[#FFFFFF]/95 dark:bg-[#101014]/95 backdrop-blur-md transition-colors"
    >
      <div className="max-w-[1280px] mx-auto h-full px-6 lg:px-10 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
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

        {/* Zone 2: Clean single-line Navigation Links */}
        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-6">
          {NAVIGATION_CATEGORIES.map((category) => {
            const hasItems = Boolean(category.items && category.items.length > 0);
            const isOpen = openDropdown === category.id;
            const isActive = category.href ? currentRoute === category.href : false;

            if (!hasItems && category.href) {
              return (
                <a
                  key={category.id}
                  href={category.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick(category.href!);
                  }}
                  className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-2 border-b-2 ${
                    isActive
                      ? 'text-[#101014] dark:text-white border-[#6252E8]'
                      : 'text-[#777786] dark:text-[#A4A4B5] border-transparent hover:text-[#101014] dark:hover:text-white'
                  }`}
                >
                  {category.label}
                </a>
              );
            }

            return (
              <div
                key={category.id}
                className="relative"
                onMouseEnter={() => setOpenDropdown(category.id)}
                onMouseLeave={() => setOpenDropdown((prev) => (prev === category.id ? null : prev))}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  onClick={() => setOpenDropdown(isOpen ? null : category.id)}
                  className={`inline-flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-2 ${
                    isOpen
                      ? 'text-[#101014] dark:text-white'
                      : 'text-[#777786] dark:text-[#A4A4B5] hover:text-[#101014] dark:hover:text-white'
                  }`}
                >
                  <span>{category.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      isOpen ? 'rotate-180 text-[#6252E8]' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && category.items && (
                  <div
                    role="menu"
                    aria-label={`${category.label} menu`}
                    className="absolute left-0 top-full pt-2 w-[480px]"
                  >
                    <div className="rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#101126] shadow-xl p-3 grid grid-cols-2 gap-1.5">
                      {category.items.map((item) => (
                        <button
                          key={`${item.href}-${item.label}`}
                          type="button"
                          role="menuitem"
                          onClick={() => handleLinkClick(item.href, item.sectionId)}
                          className="group text-left rounded-lg p-3 hover:bg-[#F7F7FA] dark:hover:bg-white/[0.06] transition-colors flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-[#101014] dark:text-white group-hover:text-[#6252E8] dark:group-hover:text-[#965BFF] transition-colors">
                              {item.label}
                            </span>
                            {item.status && (
                              <span className="text-[11px] font-medium text-[#777786] dark:text-[#9A9AB0] shrink-0">
                                {item.status}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#777786] dark:text-[#A4A4B5] leading-snug">
                            {item.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Zone 3: Theme Toggle + Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            className="w-10 h-10 rounded-lg inline-flex items-center justify-center text-[#777786] dark:text-[#A4A4B5] hover:text-[#101014] dark:hover:text-white hover:bg-[#F7F7FA] dark:hover:bg-white/10 transition-colors shrink-0"
          >
            {theme === 'light' ? (
              <Moon className="w-[18px] h-[18px]" aria-hidden="true" />
            ) : (
              <Sun className="w-[18px] h-[18px]" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleLinkClick('/docs')}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#6252E8] text-white hover:bg-[#5243d6] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Start Building</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden w-11 h-11 rounded-lg inline-flex items-center justify-center text-[#101014] dark:text-white hover:bg-[#F7F7FA] dark:hover:bg-white/10 transition-colors shrink-0"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-[#FFFFFF] dark:bg-[#101014] border-t border-[#101014]/10 dark:border-white/10 overflow-y-auto px-6 py-6">
          <nav aria-label="Mobile navigation" className="space-y-2 max-w-lg mx-auto">
            {NAVIGATION_CATEGORIES.map((category) => {
              const hasItems = Boolean(category.items && category.items.length > 0);
              const isExpanded = mobileExpanded === category.id;

              if (!hasItems && category.href) {
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleLinkClick(category.href!)}
                    className="w-full text-left py-3 px-2 text-base font-semibold text-[#101014] dark:text-white border-b border-[#101014]/10 dark:border-white/10"
                  >
                    {category.label}
                  </button>
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
                    className="w-full flex items-center justify-between py-3 px-2 text-base font-semibold text-[#101014] dark:text-white"
                  >
                    <span>{category.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isExpanded ? 'rotate-180 text-[#6252E8]' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isExpanded && category.items && (
                    <div className="pl-2 pb-2 space-y-1">
                      {category.items.map((item) => (
                        <button
                          key={`${item.href}-${item.label}`}
                          type="button"
                          onClick={() => handleLinkClick(item.href, item.sectionId)}
                          className="w-full text-left p-2.5 rounded-lg hover:bg-[#F7F7FA] dark:hover:bg-white/5 flex flex-col gap-0.5"
                        >
                          <span className="text-sm font-medium text-[#101014] dark:text-white">
                            {item.label}
                            {item.status ? ` · ${item.status}` : ''}
                          </span>
                          <span className="text-xs text-[#777786] dark:text-[#A4A4B5]">
                            {item.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleLinkClick('/docs')}
                className="w-full py-3 px-4 rounded-lg bg-[#6252E8] text-white text-sm font-medium inline-flex items-center justify-center gap-2"
              >
                <span>Start Building</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleLinkClick('/contact')}
                className="w-full py-3 px-4 rounded-lg border border-[#101014]/15 dark:border-white/15 text-sm font-medium text-[#101014] dark:text-white"
              >
                Contact SONIL Group
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
