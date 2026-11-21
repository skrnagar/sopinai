import React from 'react';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { ResourceArticle } from '../data/contentCatalog';
import { RoutePath } from '../types/navigation';
import { CodeBlock, StatusText } from '../components/ui/EditorialPrimitives';

interface ResourceArticlePageProps {
  article: ResourceArticle;
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

export const ResourceArticlePage: React.FC<ResourceArticlePageProps> = ({ article, onNavigate }) => {
  return (
    <div className="overflow-x-clip bg-[#FFFFFF] dark:bg-[#101014]">
      <section className="border-b border-[#101014]/[0.08] dark:border-white/10 py-12 lg:py-16">
        <div className="max-w-[920px] mx-auto px-6 lg:px-10">
          <a
            href="/resources"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/resources');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6252E8] dark:text-[#965BFF] hover:underline mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to All Resources</span>
          </a>

          <StatusText
            items={[article.category, article.pillar, article.readTime, article.status]}
            accentLast={article.status !== 'Available'}
          />

          <h1 className="mt-4 font-display text-3xl sm:text-5xl font-bold tracking-[-0.02em] text-[#101014] dark:text-white text-balance">
            {article.title}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
            {article.summary}
          </p>

          <div className="mt-6 pt-5 border-t border-[#101014]/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#5E5E6E] dark:text-[#9A9AB0]">
            <span>By {article.author}</span>
            <span>{article.dateLabel} · SOPIN Engineering</span>
          </div>
        </div>
      </section>

      <article className="max-w-[920px] mx-auto px-6 lg:px-10 py-12 lg:py-16 space-y-10">
        {article.sections.map((sec) => (
          <section key={sec.heading} className="space-y-4">
            <h2 className="font-display text-2xl font-semibold text-[#101014] dark:text-white">
              {sec.heading}
            </h2>
            {sec.paragraphs.map((p, idx) => (
              <p
                key={idx}
                className="text-base text-[#101014]/90 dark:text-[#D8D8E6] leading-relaxed"
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

        <div className="rounded-2xl border border-[#101014]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6252E8] dark:text-[#965BFF]">
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
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-white dark:bg-[#101014] border border-[#101014]/15 dark:border-white/15 text-xs font-semibold text-[#101014] dark:text-white hover:border-[#6252E8] transition-colors"
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
