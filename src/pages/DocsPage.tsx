import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Book, Search } from 'lucide-react';
import { DOC_SECTIONS } from '../data/contentCatalog';
import { RoutePath } from '../types/navigation';
import { DataTable, DataTableColumn } from '../components/ui/DataTable';
import { CodeBlock, StateDisplay, StatusText } from '../components/ui/EditorialPrimitives';

interface DocsPageProps {
  activeSlug?: string;
  onNavigate: (path: RoutePath, sectionId?: string, queryParams?: Record<string, string>) => void;
}

export const DocsPage: React.FC<DocsPageProps> = ({ activeSlug, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedId =
    activeSlug && DOC_SECTIONS.some((d) => d.id === activeSlug) ? activeSlug : 'quickstart';

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return DOC_SECTIONS;
    return DOC_SECTIONS.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.summary.toLowerCase().includes(q) ||
        doc.group.toLowerCase().includes(q) ||
        doc.body.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeDoc = filteredDocs.find((d) => d.id === selectedId) ?? filteredDocs[0] ?? null;

  const paramColumns: DataTableColumn<{
    name: string;
    type: string;
    required: string;
    description: string;
  }>[] = [
    {
      key: 'name',
      header: 'Field / Option',
      render: (r) => <code className="font-mono text-xs text-[#6252E8] dark:text-[#B894FF]">{r.name}</code>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => <code className="font-mono text-xs">{r.type}</code>,
    },
    {
      key: 'required',
      header: 'Required',
      render: (r) => r.required,
    },
    {
      key: 'description',
      header: 'Description',
      render: (r) => r.description,
    },
  ];

  return (
    <div className="overflow-x-clip bg-[#FFFFFF] dark:bg-[#101014] min-h-[75vh]">
      <section className="border-b border-[#101014]/[0.08] dark:border-white/10 py-12 lg:py-16">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <StatusText items={['SOPIN Documentation', 'Developer Hub', 'Specification Preview']} accentLast />
            <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-[#101014] dark:text-white">
              SOPIN Engineering Documentation
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
              Bookmarkable specifications for @sopin/sdk, Studio blueprint schemas, MCP tool scopes, A2A handoffs, and ML Gateway routing.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              className="w-4 h-4 text-[#5E5E6E] dark:text-[#A4A4B5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="search"
              inputMode="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search docs (Ctrl/Cmd + K)..."
              aria-label="Search documentation"
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101126] text-base sm:text-sm text-[#101014] dark:text-white placeholder:text-[#5E5E6E] dark:placeholder:text-[#9A9AB0]"
            />
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-10 py-10 sm:py-12">
        {filteredDocs.length === 0 ? (
          <StateDisplay
            mode="empty"
            title="No matching documentation sections"
            description={`No specification pages matched "${searchQuery}". Reset search to view all SOPIN documentation modules.`}
            actionLabel="Show All Docs"
            onAction={() => setSearchQuery('')}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            <aside className="lg:col-span-4 min-w-0">
              <div className="text-xs font-semibold text-[#5E5E6E] dark:text-[#9A9AB0] px-1 lg:px-3 pb-2">
                Specification Sections
              </div>
              <nav aria-label="Documentation topics" className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0 snap-x">
                {filteredDocs.map((doc) => {
                  const isSelected = activeDoc?.id === doc.id;
                  const targetPath = `/docs/${doc.id}` as RoutePath;
                  return (
                    <a
                      key={doc.id}
                      href={targetPath}
                      aria-current={isSelected ? 'page' : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(targetPath);
                      }}
                      className={`snap-start shrink-0 w-[230px] lg:w-full min-h-[44px] text-left rounded-xl p-3.5 border transition-colors block ${
                        isSelected
                          ? 'border-[#6252E8] bg-[#6252E8]/[0.06] dark:bg-[#6252E8]/15'
                          : 'border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126]/60 hover:border-[#6252E8]/40'
                      }`}
                    >
                      <div className="text-[11px] font-medium text-[#6252E8] dark:text-[#965BFF] truncate">
                        {doc.group}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-[#101014] dark:text-white line-clamp-2">
                        {doc.title}
                      </div>
                    </a>
                  );
                })}
              </nav>
            </aside>

            {activeDoc && (
              <div className="lg:col-span-8 space-y-6 min-w-0">
                <div className="rounded-2xl border border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126]/50 p-6 sm:p-8 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#6252E8] dark:text-[#965BFF] mb-2">
                    <Book className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {activeDoc.group} · {activeDoc.status}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#101014] dark:text-white">
                    {activeDoc.title}
                  </h2>
                  <p className="mt-3 text-base text-[#101014] dark:text-[#E8E8F2] leading-relaxed">
                    {activeDoc.summary}
                  </p>
                  <p className="mt-4 text-sm text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                    {activeDoc.body}
                  </p>
                </div>

                <CodeBlock label={activeDoc.codeLabel} code={activeDoc.code} />

                {activeDoc.parameters && activeDoc.parameters.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-display text-lg font-semibold text-[#101014] dark:text-white">
                      Configuration Schema Reference
                    </h3>
                    <DataTable
                      caption={`${activeDoc.title} parameters`}
                      columns={paramColumns}
                      rows={activeDoc.parameters}
                      rowKey={(r) => r.name}
                    />
                  </div>
                )}

                <div className="rounded-xl border border-[#101014]/[0.08] dark:border-white/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-[#101014] dark:text-white">
                      Need early cohort SDK credentials?
                    </h3>
                    <p className="text-sm text-[#5E5E6E] dark:text-[#A4A4B5]">
                      Request Developer Preview access through the SOPIN engineering intake form.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate('/contact', undefined, { topic: 'Developer Preview & SDK' })
                    }
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-[#6252E8] hover:bg-[#5243d6] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Request Access</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
