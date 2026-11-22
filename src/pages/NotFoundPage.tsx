import React from 'react';
import { ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { RoutePath } from '../types/navigation';
import { StatusText } from '../components/ui/EditorialPrimitives';

interface NotFoundPageProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  return (
    <section className="py-20 sm:py-28 bg-[#FFFFFF]">
      <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
        <div className="w-12 h-12 rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] mx-auto flex items-center justify-center">
          <Compass className="w-6 h-6 text-[#2563EB]" aria-hidden="true" />
        </div>
        <StatusText items={['HTTP 404', 'Route Not Found', 'SOPIN']} accentLast className="justify-center" />
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111827]">
          This route does not exist on sopin.ai
        </h1>
        <p className="text-base text-[#667085] leading-relaxed">
          The page you requested may have moved or is not part of the active SOPIN public documentation and workspace routes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Home</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/app')}
            className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-lg border border-[#E5E7EB] text-[#111827] hover:bg-[#F7F8FA] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <span>Try SOPIN</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};
