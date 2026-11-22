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
    <div className="overflow-x-clip bg-[#FAF9F5]">
      <section className="border-b border-[#05070E]/10 py-12 lg:py-16">
        <div className="max-w-[920px] mx-auto px-6 lg:px-10">
          <a
            href={basePath}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(basePath);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline mb-6"
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

          <h1 className="mt-4 font-display text-3xl sm:text-5xl font-bold tracking-[-0.02em] text-[#05070E] text-balance">
            {article.title}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#5E5E6E] leading-relaxed">
            {article.summary}
          </p>

          <div className="mt-6 pt-5 border-t border-[#05070E]/10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#5E5E6E]">
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
            <h2 className="font-display text-2xl font-semibold text-[#05070E]">
              {sec.heading}
            </h2>
            {sec.paragraphs.map((p, idx) => (
              <p
                key={idx}
                className="text-base text-[#05070E]/90 leading-relaxed"
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

        <div className="rounded-2xl border border-[#05070E]/10 bg-[#FBF7F0] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
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
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-[#FAF9F5] border border-[#05070E]/10 text-xs font-semibold text-[#05070E] hover:border-[#2563EB] transition-colors"
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
