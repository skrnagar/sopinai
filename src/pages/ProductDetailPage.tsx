import React from 'react';
import { ArrowRight, CheckCircle2, Layers, Shield, Workflow } from 'lucide-react';
import { ProductDetailSpec } from '../data/productsData';
import { RoutePath } from '../types/navigation';
import { ProductPreviews } from '../components/interactive/ProductPreviews';
import { CodeBlock, SectionHeader, StatusText } from '../components/ui/EditorialPrimitives';

interface ProductDetailPageProps {
  spec: ProductDetailSpec;
  onNavigate: (path: RoutePath, sectionId?: string, queryParams?: Record<string, string>) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ spec, onNavigate }) => {
  const isPlannedOrRoadmap = spec.status !== 'Core Architecture (Preview)';

  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="border-b border-[#05070E]/[0.08] dark:border-white/10 bg-[#FFFFFF] dark:bg-[#05070E] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <StatusText items={[spec.layer, spec.status]} accentLast={isPlannedOrRoadmap} />
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-[-0.02em] text-[#05070E] dark:text-white text-balance">
              {spec.name}: {spec.tagline}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
              {spec.summary}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate(spec.primaryCta.href, undefined, spec.primaryCta.query)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[44px] px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>{spec.primaryCta.label}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate(spec.secondaryCta.href, undefined, spec.secondaryCta.query)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[44px] px-5 py-2.5 rounded-lg border border-[#05070E]/15 dark:border-white/15 text-sm font-semibold text-[#05070E] dark:text-white hover:bg-[#F7F7FA] dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
              >
                <span>{spec.secondaryCta.label}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Audience */}
      <section className="py-16 bg-[#F7F7FA] dark:bg-[#0A1226]/40 border-b border-[#05070E]/[0.08] dark:border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 rounded-2xl border border-[#05070E]/[0.08] dark:border-white/10 bg-white dark:bg-[#05070E] p-7 shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
            <div className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
              Architectural Problem Solved
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-[#05070E] dark:text-white">
              Why {spec.name} exists in the SOPIN stack
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
              {spec.problemItSolves}
            </p>
            <div className="mt-6 pt-5 border-t border-[#05070E]/10 dark:border-white/10">
              <div className="text-xs font-semibold text-[#05070E] dark:text-white mb-2">
                Primary Users
              </div>
              <StatusText items={spec.whoUsesIt} />
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-[#05070E]/[0.08] dark:border-white/10 bg-white dark:bg-[#05070E] p-7 shadow-[0_1px_2px_rgba(16,16,20,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                <Shield className="w-4 h-4" aria-hidden="true" />
                <span>Security &amp; Governance Boundary</span>
              </div>
              <p className="mt-3 text-sm text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                {spec.securityGuarantee}
              </p>
            </div>
            <div className="mt-6 pt-5 border-t border-[#05070E]/10 dark:border-white/10">
              <div className="text-xs font-semibold text-[#05070E] dark:text-white mb-2">
                Compatible Integrations
              </div>
              <StatusText items={spec.integrations} />
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-16 lg:py-20 bg-[#FFFFFF] dark:bg-[#05070E] border-b border-[#05070E]/[0.08] dark:border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-10">
          <SectionHeader
            kicker="Core Capabilities"
            title={`What ${spec.name} provides across the execution lifecycle.`}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {spec.capabilities.map((cap, idx) => (
              <div
                key={cap.title}
                className="rounded-2xl border border-[#05070E]/[0.08] dark:border-white/10 bg-[#F7F7FA] dark:bg-[#0A1226] p-6 shadow-[0_1px_2px_rgba(16,16,20,0.04)]"
              >
                <div className="font-mono text-xs text-[#2563EB] dark:text-[#60A5FA]">
                  0{idx + 1}.
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold text-[#05070E] dark:text-white">
                  {cap.title}
                </h3>
                <p className="mt-2 text-sm text-[#5E5E6E] dark:text-[#B5B5C5] leading-relaxed">
                  {cap.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow & Code Contract */}
      <section className="py-16 lg:py-20 bg-[#F7F7FA] dark:bg-[#0A1226]/40 border-b border-[#05070E]/[0.08] dark:border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-6 min-w-0">
            <SectionHeader
              kicker="Operational Workflow"
              title="Typical execution sequence & applied use cases."
            />
            <ol className="space-y-3">
              {spec.workflowSteps.map((step, idx) => (
                <li
                  key={step}
                  className="flex items-start gap-3 rounded-xl border border-[#05070E]/[0.08] dark:border-white/10 bg-white dark:bg-[#05070E] p-4 text-sm text-[#05070E] dark:text-[#E8E8F2]"
                >
                  <span className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] mt-0.5 shrink-0">
                    0{idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <div className="rounded-xl border border-[#05070E]/[0.08] dark:border-white/10 bg-white dark:bg-[#05070E] p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#05070E] dark:text-white">
                <Workflow className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" aria-hidden="true" />
                <span>Applied Use Cases</span>
              </div>
              <ul className="space-y-2">
                {spec.useCases.map((uc) => (
                  <li key={uc} className="flex items-start gap-2 text-xs sm:text-sm text-[#5E5E6E] dark:text-[#B5B5C5]">
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{uc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7 min-w-0">
            <CodeBlock label={spec.codeLabel} code={spec.codeExample} />
          </div>
        </div>
      </section>

      {/* Interactive Surface Preview */}
      {spec.previewSurface && (
        <section className="py-16 lg:py-20 bg-[#FFFFFF] dark:bg-[#05070E] border-b border-[#05070E]/[0.08] dark:border-white/10">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10 space-y-8">
            <SectionHeader
              kicker="Interactive Software Preview"
              title={`Inspect ${spec.name} inside the SOPIN workbench.`}
              description="Explore the interactive interface below or launch the mobile-first /app workspace to test workflows interactively."
            />
            <ProductPreviews initialTab={spec.previewSurface} />
          </div>
        </section>
      )}

      {/* Related Modules */}
      <section className="py-14 bg-[#F7F7FA] dark:bg-[#0A1226]/60">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
              <Layers className="w-4 h-4" aria-hidden="true" />
              <span>Connected SOPIN Modules</span>
            </div>
            <h2 className="mt-1 font-display text-xl font-semibold text-[#05070E] dark:text-white">
              Continue exploring related architecture layers
            </h2>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {spec.relatedProducts.map((rel) => (
              <a
                key={rel.href}
                href={rel.href}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(rel.href);
                }}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-white dark:bg-[#05070E] text-xs font-semibold text-[#05070E] dark:text-white hover:border-[#2563EB] transition-colors"
              >
                <span>{rel.name}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
