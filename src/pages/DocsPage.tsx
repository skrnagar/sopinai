import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Book,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Search,
} from 'lucide-react';
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [codeVariant, setCodeVariant] = useState<'primary' | 'secondary'>('primary');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedId =
    activeSlug && DOC_SECTIONS.some((d) => d.id === activeSlug) ? activeSlug : 'quickstart';

  useEffect(() => {
    setCodeVariant('primary');
    setMobileNavOpen(false);
  }, [selectedId]);

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
        doc.body.toLowerCase().includes(q) ||
        doc.sections.some(
          (s) =>
            s.heading.toLowerCase().includes(q) ||
            s.paragraphs.some((p) => p.toLowerCase().includes(q))
        )
    );
  }, [searchQuery]);

  const groupedDocs = useMemo(() => {
    const groups: { group: string; docs: typeof DOC_SECTIONS }[] = [];
    for (const doc of filteredDocs) {
      let existing = groups.find((g) => g.group === doc.group);
      if (!existing) {
        existing = { group: doc.group, docs: [] };
        groups.push(existing);
      }
      existing.docs.push(doc);
    }
    return groups;
  }, [filteredDocs]);

  const activeDoc = filteredDocs.find((d) => d.id === selectedId) ?? filteredDocs[0] ?? null;

  const activeDocIndex = activeDoc ? DOC_SECTIONS.findIndex((d) => d.id === activeDoc.id) : -1;
  const prevDoc = activeDocIndex > 0 ? DOC_SECTIONS[activeDocIndex - 1] : null;
  const nextDoc =
    activeDocIndex >= 0 && activeDocIndex < DOC_SECTIONS.length - 1
      ? DOC_SECTIONS[activeDocIndex + 1]
      : null;

  const tocItems = useMemo(() => {
    if (!activeDoc) return [];
    const items = [
      { id: 'doc-overview', label: 'Overview' },
      ...activeDoc.sections.map((sec) => ({ id: sec.id, label: sec.heading })),
      { id: 'code-examples', label: 'Code Specification' },
    ];
    if (activeDoc.parameters && activeDoc.parameters.length > 0) {
      items.push({ id: 'schema-reference', label: 'Schema Reference' });
    }
    return items;
  }, [activeDoc]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const paramColumns: DataTableColumn<{
    name: string;
    type: string;
    required: string;
    description: string;
  }>[] = [
    {
      key: 'name',
      header: 'Field / Option',
      render: (r) => (
        <code className="font-mono text-xs text-[#8F00FF]">{r.name}</code>
      ),
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

  const displayedCode =
    activeDoc && codeVariant === 'secondary' && activeDoc.secondaryCode
      ? activeDoc.secondaryCode
      : activeDoc
      ? { label: activeDoc.codeLabel, code: activeDoc.code }
      : null;

  return (
    <div className="overflow-x-clip bg-[#FAF9F5] min-h-[75vh]">
      {/* Documentation Header & Search */}
      <section className="border-b border-[#05070E]/10 bg-[#FAF9F5] py-10 lg:py-14">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <StatusText
              items={['SOPIN Documentation', 'Developer Hub', 'Specification Preview']}
              accentLast
            />
            <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-[#05070E]">
              SOPIN Engineering Documentation
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#5E5E6E] leading-relaxed">
              Specifications for @sopin/sdk, Studio blueprint sync, SOPIN Graph cyclic orchestration, MCP tool scopes, A2A handoffs, SOPIN Decisions contracts, and ML Gateway routing.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              className="w-4 h-4 text-[#5E5E6E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-lg border border-[#05070E]/10 bg-[#FAF9F5] text-base sm:text-sm text-[#05070E] placeholder:text-[#5E5E6E]"
            />
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-5 sm:px-6 lg:px-10 py-8 sm:py-12">
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
            {/* Mobile Collapsible Topic Switcher */}
            <div className="lg:hidden">
              <button
                type="button"
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen((prev) => !prev)}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-[#05070E]/10 bg-[#FAF9F5] flex items-center justify-between text-sm font-semibold text-[#05070E]"
              >
                <span className="truncate">
                  Topic: {activeDoc?.title ?? 'Select documentation'}
                </span>
                {mobileNavOpen ? (
                  <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
              </button>

              {mobileNavOpen && (
                <nav
                  aria-label="Mobile documentation navigation"
                  className="mt-2 rounded-xl border border-[#05070E]/10 bg-[#FAF9F5] p-3 space-y-4"
                >
                  {groupedDocs.map((group) => (
                    <div key={group.group} className="space-y-1">
                      <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#8F00FF]">
                        {group.group}
                      </div>
                      {group.docs.map((doc) => {
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
                              setMobileNavOpen(false);
                            }}
                            className={`block min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-[#8F00FF]/10 text-[#8F00FF] font-semibold'
                                : 'text-[#05070E] hover:bg-[#FAF9F5]'
                            }`}
                          >
                            {doc.title}
                          </a>
                        );
                      })}
                    </div>
                  ))}
                </nav>
              )}
            </div>

            {/* Desktop Grouped Left Sidebar */}
            <aside className="hidden lg:block lg:col-span-3 sticky top-24 min-w-0">
              <nav aria-label="Documentation topics" className="space-y-6 pr-2">
                {groupedDocs.map((group) => (
                  <div key={group.group} className="space-y-1.5">
                    <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#5E5E6E]">
                      {group.group}
                    </div>
                    <ul className="space-y-1">
                      {group.docs.map((doc) => {
                        const isSelected = activeDoc?.id === doc.id;
                        const targetPath = `/docs/${doc.id}` as RoutePath;
                        return (
                          <li key={doc.id}>
                            <a
                              href={targetPath}
                              aria-current={isSelected ? 'page' : undefined}
                              onClick={(e) => {
                                e.preventDefault();
                                onNavigate(targetPath);
                              }}
                              className={`block min-h-[40px] px-3 py-2 rounded-lg text-sm transition-colors ${
                                isSelected
                                  ? 'bg-[#8F00FF]/10 text-[#8F00FF] font-semibold'
                                  : 'text-[#5E5E6E] hover:text-[#05070E] hover:bg-[#FAF9F5]'
                              }`}
                            >
                              {doc.title}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </aside>

            {/* Main Documentation Article */}
            {activeDoc && (
              <article className="lg:col-span-9 xl:col-span-6 space-y-8 min-w-0">
                {/* Breadcrumbs */}
                <nav
                  aria-label="Documentation breadcrumbs"
                  className="flex flex-wrap items-center gap-1.5 text-xs text-[#5E5E6E]"
                >
                  <a
                    href="/docs"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/docs');
                    }}
                    className="hover:text-[#8F00FF] transition-colors"
                  >
                    Docs
                  </a>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{activeDoc.group}</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="font-medium text-[#05070E] truncate">
                    {activeDoc.title}
                  </span>
                </nav>

                {/* Overview Box */}
                <div
                  id="doc-overview"
                  className="scroll-mt-24 rounded-2xl border border-[#05070E]/10 bg-[#FAF9F5] p-6 sm:p-8"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#8F00FF] mb-2">
                    <Book className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {activeDoc.group} · {activeDoc.status}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#05070E] leading-tight">
                    {activeDoc.title}
                  </h2>
                  <p className="mt-3 text-base text-[#05070E] leading-relaxed">
                    {activeDoc.summary}
                  </p>
                  <p className="mt-4 text-sm text-[#5E5E6E] leading-relaxed">
                    {activeDoc.body}
                  </p>
                </div>

                {/* Structured Subsections */}
                {activeDoc.sections.map((sec) => (
                  <section key={sec.id} id={sec.id} className="scroll-mt-24 space-y-3">
                    <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#05070E]">
                      {sec.heading}
                    </h2>
                    {sec.paragraphs.map((p, idx) => (
                      <p
                        key={idx}
                        className="text-sm sm:text-base text-[#5E5E6E] leading-relaxed"
                      >
                        {p}
                      </p>
                    ))}
                  </section>
                ))}

                {/* Code Examples */}
                {displayedCode && (
                  <section id="code-examples" className="scroll-mt-24 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="font-display text-xl font-semibold text-[#05070E]">
                        Code Specification
                      </h2>

                      {activeDoc.secondaryCode && (
                        <div
                          role="tablist"
                          aria-label="Select specification language"
                          className="inline-flex p-1 rounded-lg border border-[#05070E]/10 bg-[#FAF9F5]"
                        >
                          <button
                            type="button"
                            role="tab"
                            aria-selected={codeVariant === 'primary'}
                            onClick={() => setCodeVariant('primary')}
                            className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                              codeVariant === 'primary'
                                ? 'bg-[#000000] text-white'
                                : 'text-[#5E5E6E]'
                            }`}
                          >
                            {activeDoc.codeLabel}
                          </button>
                          <button
                            type="button"
                            role="tab"
                            aria-selected={codeVariant === 'secondary'}
                            onClick={() => setCodeVariant('secondary')}
                            className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                              codeVariant === 'secondary'
                                ? 'bg-[#000000] text-white'
                                : 'text-[#5E5E6E]'
                            }`}
                          >
                            {activeDoc.secondaryCode.label}
                          </button>
                        </div>
                      )}
                    </div>

                    <CodeBlock label={displayedCode.label} code={displayedCode.code} />
                  </section>
                )}

                {/* Parameters Schema Reference */}
                {activeDoc.parameters && activeDoc.parameters.length > 0 && (
                  <section id="schema-reference" className="scroll-mt-24 space-y-3">
                    <h2 className="font-display text-xl font-semibold text-[#05070E]">
                      Configuration Schema Reference
                    </h2>
                    <DataTable
                      caption={`${activeDoc.title} parameters`}
                      columns={paramColumns}
                      rows={activeDoc.parameters}
                      rowKey={(r) => r.name}
                    />
                  </section>
                )}

                {/* Previous / Next Navigation */}
                <nav
                  aria-label="Documentation pagination"
                  className="pt-6 border-t border-[#05070E]/10 grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {prevDoc ? (
                    <a
                      href={`/docs/${prevDoc.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/docs/${prevDoc.id}` as RoutePath);
                      }}
                      className="rounded-xl border border-[#05070E]/10 p-4 hover:border-[#2563EB] transition-colors flex flex-col justify-between gap-1.5"
                    >
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5E5E6E]">
                        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Previous</span>
                      </span>
                      <span className="text-sm font-semibold text-[#05070E]">
                        {prevDoc.title}
                      </span>
                    </a>
                  ) : (
                    <div className="hidden sm:block" />
                  )}

                  {nextDoc && (
                    <a
                      href={`/docs/${nextDoc.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/docs/${nextDoc.id}` as RoutePath);
                      }}
                      className="rounded-xl border border-[#05070E]/10 p-4 hover:border-[#2563EB] transition-colors flex flex-col justify-between gap-1.5 sm:text-right sm:items-end"
                    >
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5E5E6E]">
                        <span>Next</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-semibold text-[#05070E]">
                        {nextDoc.title}
                      </span>
                    </a>
                  )}
                </nav>

                {/* Preview Credentials CTA */}
                <div className="rounded-xl border border-[#05070E]/10 bg-[#FAF9F5] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-[#05070E]">
                      Need early cohort SDK credentials?
                    </h3>
                    <p className="text-sm text-[#5E5E6E]">
                      Request Developer Preview access through the SOPIN engineering intake form.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate('/contact', undefined, { topic: 'Developer Preview & SDK' })
                    }
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-[#000000] hover:bg-[#1F2937] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Request Access</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            )}

            {/* Desktop Right-Hand Table of Contents */}
            {activeDoc && (
              <aside className="hidden xl:block xl:col-span-3 sticky top-24 min-w-0">
                <div className="pl-4 border-l border-[#05070E]/10 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#5E5E6E]">
                    On this page
                  </div>
                  <ul className="space-y-2 text-xs">
                    {tocItems.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => scrollToHeading(item.id)}
                          className="text-left text-[#5E5E6E] hover:text-[#8F00FF] transition-colors leading-snug"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
