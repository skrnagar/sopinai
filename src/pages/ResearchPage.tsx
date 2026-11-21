import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { RESOURCE_ARTICLES, ResearchCategory } from '../data/contentCatalog';
import { RoutePath } from '../types/navigation';
import { StateDisplay, StatusText } from '../components/ui/EditorialPrimitives';

interface ResearchPageProps {
  activeSection?: string | null;
  onNavigate: (path: RoutePath, sectionId?: string, queryParams?: Record<string, string>) => void;
}

type FilterOption = 'All' | ResearchCategory;

const HASH_TO_CATEGORY: Record<string, FilterOption> = {
  research: 'Research',
  engineering: 'Engineering',
  'case-studies': 'Case Studies',
  '#research': 'Research',
  '#engineering': 'Engineering',
  '#case-studies': 'Case Studies',
};

export const ResearchPage: React.FC<ResearchPageProps> = ({ activeSection, onNavigate }) => {
  const [category, setCategory] = useState<FilterOption>(() => {
    if (activeSection) {
      return HASH_TO_CATEGORY[activeSection.toLowerCase()] ?? 'All';
    }
    if (typeof window !== 'undefined' && window.location.hash) {
      return HASH_TO_CATEGORY[window.location.hash.toLowerCase()] ?? 'All';
    }
    return 'All';
  });
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (activeSection) {
      const next = HASH_TO_CATEGORY[activeSection.toLowerCase()];
      if (next) setCategory(next);
    }
  }, [activeSection]);

  useEffect(() => {
    const syncHash = () => {
      const next = HASH_TO_CATEGORY[window.location.hash.toLowerCase()];
      if (next) setCategory(next);
    };
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const categories: FilterOption[] = ['All', 'Research', 'Engineering', 'Case Studies'];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RESOURCE_ARTICLES.filter((entry) => {
      const catMatch = category === 'All' || entry.researchCategory === category;
      const qMatch =
        !q ||
        entry.title.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q) ||
        entry.researchCategory.toLowerCase().includes(q) ||
        entry.pillar.toLowerCase().includes(q);
      return catMatch && qMatch;
    });
  }, [category, query]);

  return (
    <div className="overflow-x-clip">
      <section className="border-b border-[#E5E7EB] dark:border-white/10 bg-[#FFFFFF] dark:bg-[#080D18] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText
              items={['SOPIN Research & Insights', 'SONIL Group']}
              accentLast
            />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#111827] dark:text-white text-balance">
              Research, systems engineering, and transparent field notes.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#667085] dark:text-[#CBD5E1] leading-relaxed">
              Explore our architectural papers, engineering implementation guides, and design-partner case study previews across agent systems, deterministic decisions, and runtime verification.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-[#F7F8FA] dark:bg-[#0B1221] min-h-[540px]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div
              className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-1.5 pb-1 sm:pb-0"
              role="tablist"
              aria-label="Research and Insights categories"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={category === cat}
                  onClick={() => setCategory(cat)}
                  className={`min-h-[44px] sm:min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    category === cat
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-white dark:bg-[#080D18] text-[#667085] dark:text-[#CBD5E1] border border-[#E5E7EB] dark:border-white/10 hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                className="w-4 h-4 text-[#667085] dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                inputMode="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search research & guides..."
                aria-label="Search research publications"
                className="w-full min-h-[44px] pl-9 pr-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/15 bg-white dark:bg-[#080D18] text-base sm:text-sm text-[#111827] dark:text-white placeholder:text-[#667085] dark:placeholder:text-[#94A3B8]"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <StateDisplay
              mode="empty"
              title="No matching publications found"
              description={`No publications matched "${query}" in ${category}. Clear your filter to browse all SOPIN Research & Insights entries.`}
              actionLabel="Reset Filters"
              onAction={() => {
                setCategory('All');
                setQuery('');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((entry) => {
                const articleHref = `/research/${entry.id}` as RoutePath;
                return (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#080D18] p-6 sm:p-7 flex flex-col justify-between shadow-[0_1px_2px_rgba(17,24,39,0.04)]"
                  >
                    <div>
                      <StatusText
                        items={[entry.researchCategory, entry.publishedDate, entry.status]}
                        accentLast={entry.status !== 'Available'}
                      />
                      <h2 className="mt-3 font-display text-xl font-semibold text-[#111827] dark:text-white leading-snug">
                        <a
                          href={articleHref}
                          onClick={(e) => {
                            e.preventDefault();
                            onNavigate(articleHref);
                          }}
                          className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors"
                        >
                          {entry.title}
                        </a>
                      </h2>
                      <p className="mt-3 text-sm text-[#667085] dark:text-[#94A3B8] leading-relaxed">
                        {entry.summary}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E5E7EB] dark:border-white/10 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#667085] dark:text-[#94A3B8]">
                        {entry.readTime}
                      </span>
                      <a
                        href={articleHref}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(articleHref);
                        }}
                        className="inline-flex items-center gap-1.5 min-h-[40px] px-2 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline whitespace-nowrap"
                      >
                        <span>Read more</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
