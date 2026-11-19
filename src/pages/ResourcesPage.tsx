import React, { useMemo, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { RESOURCE_ENTRIES, ResourceEntry } from '../data/sopinData';
import { RoutePath } from '../types/navigation';
import { StateDisplay, StatusText } from '../components/ui/EditorialPrimitives';

interface ResourcesPageProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

type CategoryFilter = 'All' | ResourceEntry['category'];

export const ResourcesPage: React.FC<ResourcesPageProps> = ({ onNavigate }) => {
  const [category, setCategory] = useState<CategoryFilter>('All');
  const [query, setQuery] = useState('');
  const [viewState, setViewState] = useState<'ready' | 'loading' | 'error'>('ready');

  const categories: CategoryFilter[] = ['All', 'Blog', 'Guides', 'Tutorials', 'Case Studies', 'Academy'];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RESOURCE_ENTRIES.filter((entry) => {
      const catMatch = category === 'All' || entry.category === category;
      const qMatch =
        !q ||
        entry.title.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q);
      return catMatch && qMatch;
    });
  }, [category, query]);

  const handleCategoryChange = (next: CategoryFilter) => {
    setViewState('loading');
    setCategory(next);
    setTimeout(() => {
      setViewState('ready');
    }, 180);
  };

  return (
    <div className="overflow-x-clip">
      <section className="border-b border-[#101014]/[0.08] dark:border-white/10 bg-[#FFFFFF] dark:bg-[#101014] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={['SOPIN Resources', 'Engineering Knowledge Base']} accentLast />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#101014] dark:text-white text-balance">
              Guides, tutorials, and architecture notes.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
              Practical technical resources from the SOPIN team. Case studies and Academy tracks are explicitly marked as upcoming until production cohorts are validated.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#F7F7FA] dark:bg-[#101126]/40 min-h-[540px]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-8">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Resource categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={category === cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    category === cat
                      ? 'bg-[#6252E8] text-white'
                      : 'bg-white dark:bg-[#101126] text-[#777786] dark:text-[#B5B5C5] border border-[#101014]/10 dark:border-white/10 hover:text-[#101014] dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <div className="relative w-full sm:w-64 md:w-72">
                <Search
                  className="w-4 h-4 text-[#777786] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter guides & tutorials..."
                  aria-label="Filter resources"
                  className="w-full min-h-[40px] pl-9 pr-4 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-white dark:bg-[#101014] text-sm text-[#101014] dark:text-white placeholder:text-[#777786]"
                />
              </div>
              <button
                type="button"
                onClick={() => setViewState(viewState === 'error' ? 'ready' : 'error')}
                className="min-h-[40px] px-3 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 text-xs font-medium text-[#777786] dark:text-[#B5B5C5] hover:text-[#101014] dark:hover:text-white whitespace-nowrap shrink-0"
              >
                {viewState === 'error' ? 'Restore Feed' : 'Test Error State'}
              </button>
            </div>
          </div>

          {/* Content States */}
          {viewState === 'loading' && (
            <StateDisplay
              mode="loading"
              title="Loading resource catalog"
              description="Fetching matching guides, tutorials, and architecture specifications."
            />
          )}

          {viewState === 'error' && (
            <StateDisplay
              mode="error"
              title="Unable to reach resource index"
              description="A simulated feed interruption occurred. Retry to restore the technical resource catalog."
              actionLabel="Retry Feed"
              onAction={() => setViewState('ready')}
            />
          )}

          {viewState === 'ready' && filtered.length === 0 && (
            <StateDisplay
              mode="empty"
              title="No matching resources found"
              description={`No articles matched "${query}" in ${category}. Clear your filter to browse all SOPIN technical resources.`}
              actionLabel="Reset Filters"
              onAction={() => {
                setCategory('All');
                setQuery('');
              }}
            />
          )}

          {viewState === 'ready' && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((entry) => (
                <article
                  key={entry.id}
                  id={entry.category.toLowerCase().replace(/\s+/g, '-')}
                  className="rounded-2xl border border-[#101014]/[0.08] dark:border-white/10 bg-white dark:bg-[#101014] p-7 flex flex-col justify-between shadow-[0_1px_2px_rgba(16,16,20,0.04)]"
                >
                  <div>
                    <StatusText
                      items={[entry.category, entry.readTime, entry.status]}
                      accentLast={entry.status !== 'Available'}
                    />
                    <h2 className="mt-3 font-display text-xl font-semibold text-[#101014] dark:text-white leading-snug">
                      {entry.title}
                    </h2>
                    <p className="mt-3 text-sm text-[#777786] dark:text-[#B5B5C5] leading-relaxed">
                      {entry.summary}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#101014]/10 dark:border-white/10 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#777786] dark:text-[#9A9AB0]">
                      {entry.dateLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate(entry.status === 'Available' ? '/docs' : '/contact')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6252E8] dark:text-[#965BFF] hover:underline"
                    >
                      <span>{entry.status === 'Available' ? 'Read Spec' : 'Request Updates'}</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
