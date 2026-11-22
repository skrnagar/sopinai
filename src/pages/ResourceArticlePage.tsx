import React from 'react';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { ResourceArticle } from '../data/contentCatalog';
import { RoutePath } from '../types/navigation';
import { CodeBlock, StatusText } from '../components/ui/EditorialPrimitives';

interface ResourceArticlePageProps {
  article: ResourceArticle;
  basePath?: '/research' | '/resources';
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

export const ResourceArticlePage: React.FC<ResourceArticlePageProps> = ({
  article,
  basePath = '/resources',
  onNavigate,
}) => {
  const isResearch = basePath === '/research';
  const backLabel = isResearch ? 'Back to Research & Insights' : 'Back to All Resources';

  return (
    <div className="overflow-x-clip bg-[#FAF9F5] dark:bg-[#080D18]">
      <section className="border-b border-[#E5E7EB] dark:border-white/10 py-12 lg:py-16">
        <div className="max-w-[920px] mx-auto px-6 lg:px-10">
          <a
            href={basePath}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(basePath);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{backLabel}</span>
          </a>

          <StatusText
            items={[
              isResearch ? article.researchCategory : article.category,
              article.pillar,
              article.readTime,
              article.status,
            ]}
            accentLast={article.status !== 'Available'}
          />

          <h1 className="mt-4 font-display text-3xl sm:text-5xl font-bold tracking-[-0.02em] text-[#111827] dark:text-white text-balance">
            {article.title}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#667085] dark:text-[#CBD5E1] leading-relaxed">
            {article.summary}
          </p>

          <div className="mt-6 pt-5 border-t border-[#E5E7EB] dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#667085] dark:text-[#94A3B8]">
            <span>By {article.author}</span>
            <span>
              {article.publishedDate} · {article.dateLabel} · SOPIN Engineering
            </span>
          </div>
        </div>
      </section>

      <article className="max-w-[920px] mx-auto px-6 lg:px-10 py-12 lg:py-16 space-y-10">
        {article.sections.map((sec) => (
          <section key={sec.heading} className="space-y-4">
            <h2 className="font-display text-2xl font-semibold text-[#111827] dark:text-white">
              {sec.heading}
            </h2>
            {sec.paragraphs.map((p, idx) => (
              <p
                key={idx}
                className="text-base text-[#111827]/90 dark:text-[#CBD5E1] leading-relaxed"
              >
                {p}
              </p>
            ))}
          </section>
        ))}

        {article.codeSnippet && (
          <div className="pt-2">
            <CodeBlock label={article.codeLabel || 'example.ts'} code={article.codeSnippet} />
          </div>
        )}

        <div className="rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-[#FBF7F0] dark:bg-[#101D35]/60 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span>Related Platform Destinations</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {article.relatedLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(link.href);
                }}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-[#FAF9F5] dark:bg-[#080D18] border border-[#E5E7EB] dark:border-white/15 text-xs font-semibold text-[#111827] dark:text-white hover:border-[#2563EB] transition-colors"
              >
                <span>{link.label}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
};
