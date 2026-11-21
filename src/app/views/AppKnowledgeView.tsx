import React, { useMemo, useRef, useState } from 'react';
import {
  Camera,
  FileText,
  Globe,
  Image as ImageIcon,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { KnowledgeDocument, MemoryTier } from '../types';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { StateDisplay, StatusText } from '../../components/ui/EditorialPrimitives';

interface AppKnowledgeViewProps {
  workspaceId: string;
  documents: KnowledgeDocument[];
  onAddDocument: (doc: KnowledgeDocument) => void;
  onUpdateDocument: (doc: KnowledgeDocument) => void;
  onDeleteDocument: (docId: string) => void;
}

function detectDocType(fileName: string, mime: string): KnowledgeDocument['sourceType'] {
  const lower = fileName.toLowerCase();
  if (mime.startsWith('image/')) return 'Image';
  if (lower.endsWith('.pdf')) return 'PDF';
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'DOCX';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'XLSX';
  if (lower.endsWith('.csv')) return 'CSV';
  if (lower.endsWith('.md')) return 'MD';
  return 'TXT';
}

export const AppKnowledgeView: React.FC<AppKnowledgeViewProps> = ({
  workspaceId,
  documents,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | MemoryTier>('all');
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<KnowledgeDocument | null>(null);
  const [urlSheetOpen, setUrlSheetOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return documents.filter((doc) => {
      const tierMatch = tierFilter === 'all' || doc.memoryTier === tierFilter;
      const qMatch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.excerpt.toLowerCase().includes(q) ||
        doc.sourceType.toLowerCase().includes(q);
      return tierMatch && qMatch;
    });
  }, [documents, searchQuery, tierFilter]);

  const processSelectedFile = (file: File, replaceId?: string | null) => {
    const type = detectDocType(file.name, file.type);
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const sizeLabel = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

    const commitDoc = (excerpt: string, imagePreviewUrl?: string) => {
      const targetExisting = replaceId ? documents.find((d) => d.id === replaceId) : null;
      const nextDoc: KnowledgeDocument = {
        id: targetExisting ? targetExisting.id : `doc-${Date.now()}`,
        workspaceId,
        title: file.name,
        sourceType: type,
        sizeLabel,
        status: 'Local Preview',
        memoryTier: targetExisting ? targetExisting.memoryTier : 'corpus',
        accessScope: targetExisting ? targetExisting.accessScope : 'Workspace Read-Only',
        checksum: `local:${Math.random().toString(16).slice(2, 10)}`,
        chunksCount: Math.max(1, Math.ceil(excerpt.length / 220)),
        excerpt,
        imagePreviewUrl,
        updatedAt: 'Just now',
      };
      if (targetExisting) {
        onUpdateDocument(nextDoc);
        setSelectedDoc(nextDoc);
      } else {
        onAddDocument(nextDoc);
      }
      setReplacingDocId(null);
    };

    if (type === 'Image') {
      const reader = new FileReader();
      reader.onload = () => {
        commitDoc(
          `Image capture stored locally (${file.type || 'image'}, ${sizeLabel}). Available for multimodal inspection preview.`,
          typeof reader.result === 'string' ? reader.result : undefined
        );
      };
      reader.readAsDataURL(file);
    } else if (type === 'MD' || type === 'TXT' || type === 'CSV') {
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === 'string' ? reader.result : '';
        commitDoc(text.slice(0, 1200) || `Empty text document (${sizeLabel}).`);
      };
      reader.readAsText(file);
    } else {
      commitDoc(
        `Binary document "${file.name}" (${type}, ${sizeLabel}) loaded in browser metadata preview. Full binary chunking connects when backend ingestion is attached.`
      );
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    let formattedUrl = urlInput.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }
    const newDoc: KnowledgeDocument = {
      id: `doc-${Date.now()}`,
      workspaceId,
      title: urlTitle.trim() || formattedUrl.replace(/^https?:\/\//, ''),
      sourceType: 'URL',
      sizeLabel: 'Web Ref',
      status: 'Local Preview',
      memoryTier: 'corpus',
      accessScope: 'Workspace Read-Only',
      checksum: `url:${Math.random().toString(16).slice(2, 10)}`,
      chunksCount: 1,
      sourceUrl: formattedUrl,
      excerpt: `Registered web source reference: ${formattedUrl}. Live server-side crawling requires remote connector attachment.`,
      updatedAt: 'Just now',
    };
    onAddDocument(newDoc);
    setUrlInput('');
    setUrlTitle('');
    setUrlSheetOpen(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-[#05070E] dark:text-white">
          Context &amp; Knowledge
        </h2>
        <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">
          Attach local files, images, or URLs and manage scoped memory tiers.
        </p>
      </div>

      {/* Hidden Real File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.md,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) processSelectedFile(f);
          e.target.value = '';
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) processSelectedFile(f);
          e.target.value = '';
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.md,.txt,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && replacingDocId) processSelectedFile(f, replacingDocId);
          e.target.value = '';
        }}
      />

      {/* One-Tap Mobile Ingestion Triggers */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="min-h-[56px] rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-2.5 py-2 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold"
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          <span>Upload File</span>
        </button>
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="min-h-[56px] rounded-xl border border-[#05070E]/15 dark:border-white/15 bg-white dark:bg-[#0A1226] text-[#05070E] dark:text-white px-2.5 py-2 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold"
        >
          <Camera className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" aria-hidden="true" />
          <span>Photo / Image</span>
        </button>
        <button
          type="button"
          onClick={() => setUrlSheetOpen(true)}
          className="min-h-[56px] rounded-xl border border-[#05070E]/15 dark:border-white/15 bg-white dark:bg-[#0A1226] text-[#05070E] dark:text-white px-2.5 py-2 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold"
        >
          <Globe className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" aria-hidden="true" />
          <span>Add URL</span>
        </button>
      </div>

      {/* Search + Memory Tier Filter */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search
            className="w-4 h-4 text-[#5E5E6E] dark:text-[#A4A4B5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            inputMode="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search knowledge docs, CSV, PDF, URLs..."
            aria-label="Search knowledge sources"
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[#05070E]/15 dark:border-white/15 bg-white dark:bg-[#0A1226] text-base sm:text-sm text-[#05070E] dark:text-white"
          />
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-1.5">
          {(['all', 'corpus', 'episodic', 'ephemeral'] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setTierFilter(tier)}
              className={`min-h-[40px] px-3.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap shrink-0 ${
                tierFilter === tier
                  ? 'bg-[#05070E] dark:bg-[#2563EB] text-white'
                  : 'bg-white dark:bg-[#0A1226] text-[#5E5E6E] dark:text-[#B5B5C5] border border-[#05070E]/10 dark:border-white/10'
              }`}
            >
              {tier === 'all' ? 'All Tiers' : `${tier} tier`}
            </button>
          ))}
        </div>
      </div>

      {/* Indexed Knowledge Cards */}
      {filteredDocs.length === 0 ? (
        <StateDisplay
          mode="empty"
          title="No matching knowledge sources"
          description="Upload a document (PDF, DOCX, XLSX, CSV, MD, TXT), capture an image, or reset your filter."
          actionLabel="Clear Search"
          onAction={() => {
            setSearchQuery('');
            setTierFilter('all');
          }}
        />
      ) : (
        <div className="space-y-2.5">
          {filteredDocs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => setSelectedDoc(doc)}
              className="w-full text-left rounded-2xl border border-[#05070E]/10 dark:border-white/10 bg-white dark:bg-[#0A1226] p-4 hover:border-[#2563EB] transition-colors flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F7F7FA] dark:bg-[#05070E] border border-[#05070E]/10 dark:border-white/10 flex items-center justify-center shrink-0">
                {doc.sourceType === 'Image' ? (
                  <ImageIcon className="w-5 h-5 text-[#60A5FA]" aria-hidden="true" />
                ) : doc.sourceType === 'URL' ? (
                  <Globe className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
                ) : (
                  <FileText className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-semibold text-[#05070E] dark:text-white truncate">
                    {doc.title}
                  </span>
                  <span className="font-mono text-[11px] text-[#2563EB] dark:text-[#7EC8FF] shrink-0">
                    {doc.sourceType} · {doc.sizeLabel}
                  </span>
                </div>
                <div className="mt-1">
                  <StatusText
                    items={[doc.status, `Tier: ${doc.memoryTier}`, `${doc.chunksCount} chunks`]}
                    accentLast={doc.status === 'Local Preview'}
                  />
                </div>
                <p className="mt-1.5 text-xs text-[#5E5E6E] dark:text-[#A4A4B5] line-clamp-2">
                  {doc.excerpt}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Document Inspector & Permissions Bottom Sheet */}
      <BottomSheet
        open={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.title || 'Knowledge Source'}
        subtitle={
          selectedDoc
            ? `${selectedDoc.sourceType} · ${selectedDoc.checksum} · ${selectedDoc.updatedAt}`
            : undefined
        }
      >
        {selectedDoc && (
          <div className="space-y-4">
            {selectedDoc.imagePreviewUrl && (
              <img
                src={selectedDoc.imagePreviewUrl}
                alt={selectedDoc.title}
                className="w-full max-h-56 object-contain rounded-xl border border-[#05070E]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#05070E]"
              />
            )}

            <div>
              <div className="text-xs font-semibold mb-1.5">Extracted Preview / Content</div>
              <pre className="whitespace-pre-wrap font-mono text-xs bg-[#F7F7FA] dark:bg-[#05070E] border border-[#05070E]/10 dark:border-white/10 rounded-xl p-3.5 max-h-48 overflow-y-auto leading-relaxed">
                {selectedDoc.excerpt}
              </pre>
            </div>

            <div>
              <div className="text-xs font-semibold mb-1.5">Memory Tier Scope</div>
              <div className="grid grid-cols-3 gap-2">
                {(['ephemeral', 'episodic', 'corpus'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => {
                      const updated = { ...selectedDoc, memoryTier: tier };
                      onUpdateDocument(updated);
                      setSelectedDoc(updated);
                    }}
                    className={`min-h-[44px] rounded-lg border text-xs font-semibold capitalize ${
                      selectedDoc.memoryTier === tier
                        ? 'border-[#2563EB] bg-[#2563EB] text-white'
                        : 'border-[#05070E]/15 dark:border-white/15'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold mb-1.5">Access Boundary</div>
              <div className="grid grid-cols-2 gap-2">
                {(['Workspace Read-Only', 'Restricted Governance'] as const).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => {
                      const updated = { ...selectedDoc, accessScope: scope };
                      onUpdateDocument(updated);
                      setSelectedDoc(updated);
                    }}
                    className={`min-h-[44px] px-2 rounded-lg border text-xs font-semibold ${
                      selectedDoc.accessScope === scope
                        ? 'border-[#2563EB] bg-[#2563EB] text-white'
                        : 'border-[#05070E]/15 dark:border-white/15'
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#05070E]/10 dark:border-white/10 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setReplacingDocId(selectedDoc.id);
                  replaceInputRef.current?.click();
                }}
                className="min-h-[44px] rounded-lg border border-[#05070E]/15 dark:border-white/15 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Replace File</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteDoc(selectedDoc)}
                className="min-h-[44px] rounded-lg border border-red-500/40 text-red-600 dark:text-red-400 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Delete Source</span>
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Add URL Bottom Sheet */}
      <BottomSheet
        open={urlSheetOpen}
        onClose={() => setUrlSheetOpen(false)}
        title="Attach Website URL Reference"
        subtitle="Registers URL scope for local prototype citation testing."
      >
        <form onSubmit={handleAddUrl} className="space-y-4">
          <div>
            <label htmlFor="kb-url" className="block text-xs font-semibold mb-1.5">
              Source URL
            </label>
            <input
              id="kb-url"
              type="url"
              inputMode="url"
              required
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://docs.example.org/spec"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-base sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="kb-url-title" className="block text-xs font-semibold mb-1.5">
              Display Label (Optional)
            </label>
            <input
              id="kb-url-title"
              type="text"
              value={urlTitle}
              onChange={(e) => setUrlTitle(e.target.value)}
              placeholder="e.g., External API Security Spec"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#05070E]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#05070E] text-base sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!urlInput.trim()}
            className="w-full min-h-[48px] rounded-xl bg-[#2563EB] disabled:opacity-40 text-white text-sm font-semibold"
          >
            Add URL to Context
          </button>
        </form>
      </BottomSheet>

      {/* Confirm Delete Source Sheet */}
      <BottomSheet
        open={Boolean(confirmDeleteDoc)}
        onClose={() => setConfirmDeleteDoc(null)}
        title="Delete Knowledge Source?"
        subtitle={confirmDeleteDoc?.title}
      >
        <div className="space-y-4">
          <p className="text-xs text-[#5E5E6E] dark:text-[#B5B5C5]">
            This removes the source from your local prototype context index and logs a governance audit entry.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfirmDeleteDoc(null)}
              className="min-h-[44px] rounded-lg border border-[#05070E]/15 dark:border-white/15 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirmDeleteDoc) {
                  onDeleteDocument(confirmDeleteDoc.id);
                }
                setConfirmDeleteDoc(null);
                setSelectedDoc(null);
              }}
              className="min-h-[44px] rounded-lg bg-red-600 text-white text-xs font-semibold"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
