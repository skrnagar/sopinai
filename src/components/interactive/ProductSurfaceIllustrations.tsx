import React from 'react';
import { ProductSurfaceSummary } from '../../data/sopinData';

interface ProductSurfaceIllustrationProps {
  surfaceId: ProductSurfaceSummary['id'];
}

/**
 * Ten distinct, original interface & architectural illustrations tailored to the exact
 * engineering purpose of each SOPIN product surface.
 */
export const ProductSurfaceIllustration: React.FC<ProductSurfaceIllustrationProps> = ({
  surfaceId,
}) => {
  return (
    <div className="w-full rounded-xl border border-[#E5E7EB] bg-[#080D18] text-white overflow-hidden shadow-[0_8px_28px_-10px_rgba(8,13,24,0.35)]">
      {/* Minimal Workspace Window Bar */}
      <div className="px-4 py-2.5 border-b border-white/10 bg-[#101D35]/70 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-[#93C5FD] truncate">
          sopin / {surfaceId}
        </span>
        <span className="font-mono text-[10px] text-[#94A3B8] shrink-0">
          spec.v1
        </span>
      </div>

      <div className="p-4 sm:p-5 sopin-grid-dark min-h-[210px] flex flex-col justify-center">
        {surfaceId === 'studio' && (
          <div className="grid grid-cols-12 gap-3 text-[11px]">
            <div className="col-span-5 rounded-lg border border-white/10 bg-[#0B1325] p-3 space-y-2">
              <div className="font-mono text-[10px] text-[#60A5FA]">BLUEPRINT CANVAS</div>
              <div className="rounded border border-[#2563EB]/60 bg-[#2563EB]/15 px-2.5 py-1.5 font-medium">
                1. Intake Trigger
              </div>
              <div className="h-3 w-px bg-[#2563EB]/60 mx-auto" />
              <div className="rounded border border-white/15 bg-white/[0.04] px-2.5 py-1.5 font-medium">
                2. Researcher Agent
              </div>
              <div className="h-3 w-px bg-[#2563EB]/60 mx-auto" />
              <div className="rounded border border-white/15 bg-white/[0.04] px-2.5 py-1.5 font-medium">
                3. Verify Output
              </div>
            </div>
            <div className="col-span-7 rounded-lg border border-white/10 bg-[#0B1325] p-3 font-mono text-[10.5px] leading-relaxed text-[#CBD5E1] overflow-hidden">
              <div className="text-[#60A5FA] mb-1">// 1:1 Bidirectional SDK Sync</div>
              <div>
                <span className="text-[#93C5FD]">export const</span> triage = defineAgent(&#123;
              </div>
              <div className="pl-3">
                name: <span className="text-[#7DD3FC]">&quot;compliance-auditor&quot;</span>,
              </div>
              <div className="pl-3">
                schema: <span className="text-[#4ADE80]">AuditReportSchema</span>,
              </div>
              <div className="pl-3">
                tools: [<span className="text-[#7DD3FC]">&quot;context.query&quot;</span>]
              </div>
              <div>&#125;);</div>
            </div>
          </div>
        )}

        {surfaceId === 'flow' && (
          <div className="space-y-3 text-[11px]">
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="rounded-lg border border-white/15 bg-[#0B1325] p-2.5">
                <div className="font-mono text-[10px] text-[#60A5FA]">TRIGGER</div>
                <div className="mt-1 font-medium">Invoice Webhook</div>
              </div>
              <div className="rounded-lg border border-[#3B82F6] bg-[#101D35] p-2.5">
                <div className="font-mono text-[10px] text-[#93C5FD]">DECISION NODE</div>
                <div className="mt-1 font-medium">amount &lt; 50k?</div>
              </div>
              <div className="space-y-1.5">
                <div className="rounded border border-[#2563EB]/60 bg-[#2563EB]/15 px-2.5 py-1.5 font-mono text-[10px]">
                  true -&gt; auto_post
                </div>
                <div className="rounded border border-white/15 bg-[#0B1325] px-2.5 py-1.5 font-mono text-[10px] text-[#CBD5E1]">
                  false -&gt; human_gate
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0B1325] px-3 py-2 font-mono text-[10.5px] text-[#94A3B8] flex items-center justify-between">
              <span>retry: exponential(3)</span>
              <span className="text-[#60A5FA]">checkpoint: persisted</span>
            </div>
          </div>
        )}

        {surfaceId === 'context' && (
          <div className="space-y-2 text-[11px]">
            {[
              { tier: 'Tier 01 · Working', scope: 'run:audit-409', info: 'Purged cleanly on completion' },
              { tier: 'Tier 02 · Episodic', scope: 'workspace:finance', info: 'Scoped operational memory' },
              { tier: 'Tier 03 · Corpus', scope: 'adr-index · sha256:81e9', info: 'ACL-filtered citation spans' },
            ].map((row, idx) => (
              <div
                key={row.tier}
                className={`rounded-lg border px-3 py-2.5 flex items-center justify-between gap-2 ${
                  idx === 2
                    ? 'border-[#3B82F6] bg-[#101D35]'
                    : 'border-white/10 bg-[#0B1325]'
                }`}
              >
                <div>
                  <div className="font-mono text-[10px] text-[#60A5FA]">{row.tier}</div>
                  <div className="font-medium text-white">{row.info}</div>
                </div>
                <span className="font-mono text-[10px] text-[#93C5FD] shrink-0">{row.scope}</span>
              </div>
            ))}
          </div>
        )}

        {surfaceId === 'graph' && (
          <div className="space-y-3 text-[11px]">
            <svg viewBox="0 0 360 120" className="w-full h-28" aria-hidden="true">
              <path
                d="M 70 46 L 180 46 L 290 46"
                stroke="#3B82F6"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M 290 68 C 290 105, 180 105, 180 68"
                stroke="#60A5FA"
                strokeWidth="1.3"
                strokeDasharray="4 3"
                fill="none"
              />
              {[
                { x: 20, title: 'Planner', sub: 'decompose' },
                { x: 130, title: 'Researcher', sub: 'retrieve' },
                { x: 240, title: 'Verifier', sub: 'a2a.audit' },
              ].map((n) => (
                <g key={n.title} transform={`translate(${n.x}, 24)`}>
                  <rect width="100" height="44" rx="8" fill="#101D35" stroke="#3B82F6" strokeOpacity="0.6" />
                  <text x="12" y="20" fill="#FFFFFF" fontSize="11" fontWeight="600" fontFamily="Outfit, sans-serif">
                    {n.title}
                  </text>
                  <text x="12" y="34" fill="#93C5FD" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                    {n.sub}
                  </text>
                </g>
              ))}
              <text x="182" y="108" fill="#94A3B8" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                retry loop [when: !verified &amp;&amp; step &lt; maxSteps]
              </text>
            </svg>
            <div className="rounded-lg border border-white/10 bg-[#0B1325] px-3 py-2 font-mono text-[10.5px] text-[#CBD5E1] flex justify-between">
              <span>stateSchema: VerifiedBrief</span>
              <span className="text-[#60A5FA]">maxSteps: 6</span>
            </div>
          </div>
        )}

        {surfaceId === 'runtime' && (
          <div className="space-y-2.5 text-[11px] font-mono">
            <div className="rounded-lg border border-[#3B82F6]/60 bg-[#101D35] p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-[#93C5FD]">
                <span>EPHEMERAL SANDBOX · sbx-py-92</span>
                <span>ISOLATED</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                <div className="rounded bg-[#080D18] border border-white/10 p-2">
                  <div className="text-[#94A3B8]">networkEgress</div>
                  <div className="text-white mt-0.5">&quot;disabled&quot;</div>
                </div>
                <div className="rounded bg-[#080D18] border border-white/10 p-2">
                  <div className="text-[#94A3B8]">filesystem</div>
                  <div className="text-white mt-0.5">&quot;readonly-root&quot;</div>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0B1325] px-3 py-2 text-[10.5px] text-[#CBD5E1] flex justify-between">
              <span>checkpoint: step_04_verified</span>
              <span className="text-[#4ADE80]">idempotent</span>
            </div>
          </div>
        )}

        {surfaceId === 'gateway' && (
          <div className="space-y-2.5 text-[11px]">
            <div className="rounded-lg border border-white/10 bg-[#0B1325] p-2.5 flex items-center justify-between font-mono text-[10.5px]">
              <span className="text-[#94A3B8]">PII Redaction:</span>
              <span className="text-[#60A5FA]">[tax_id, iban, email] -&gt; masked</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10.5px]">
              <div className="rounded-lg border border-[#3B82F6] bg-[#101D35] p-2.5">
                <div className="font-mono text-[10px] text-[#93C5FD]">PRIMARY</div>
                <div className="font-semibold mt-1">Reasoning LLM</div>
              </div>
              <div className="rounded-lg border border-white/12 bg-[#0B1325] p-2.5">
                <div className="font-mono text-[10px] text-[#94A3B8]">FALLBACK</div>
                <div className="font-semibold mt-1">Open-Weight</div>
              </div>
              <div className="rounded-lg border border-white/12 bg-[#0B1325] p-2.5">
                <div className="font-mono text-[10px] text-[#94A3B8]">REGISTRY</div>
                <div className="font-semibold mt-1">Custom ML v3</div>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#0B1325] px-3 py-2 font-mono text-[10.5px] text-[#4ADE80]">
              schemaLock: strict JSON + 1x repair bound
            </div>
          </div>
        )}

        {surfaceId === 'observe' && (
          <div className="space-y-2 text-[11px] font-mono">
            {[
              { name: 'flow.intake', left: '0%', width: '18%', status: 'ok' },
              { name: 'context.retrieve', left: '16%', width: '26%', status: 'sha256:81e9' },
              { name: 'decision.ruleTable', left: '42%', width: '14%', status: 'row #1' },
              { name: 'gateway.classify', left: '56%', width: '28%', status: 'schema ok' },
              { name: 'control.humanGate', left: '84%', width: '16%', status: 'signed' },
            ].map((span) => (
              <div key={span.name} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#CBD5E1]">{span.name}</span>
                  <span className="text-[#93C5FD]">{span.status}</span>
                </div>
                <div className="h-2 rounded bg-white/10 relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 rounded bg-[#3B82F6]"
                    style={{ left: span.left, width: span.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {surfaceId === 'evaluate' && (
          <div className="space-y-2 text-[11px] font-mono">
            <div className="flex items-center justify-between text-[10px] text-[#93C5FD] pb-1 border-b border-white/10">
              <span>GOLDEN SUITE · regression-v4.jsonl</span>
              <span className="text-[#4ADE80]">RELEASE GATE</span>
            </div>
            {[
              { test: 'verify.schemaStrict("ContractRisk")', state: 'PASS' },
              { test: 'verify.noUngroundedClaims()', state: 'PASS' },
              { test: 'verify.maxLatencyMs(3200)', state: 'PASS' },
            ].map((item) => (
              <div
                key={item.test}
                className="rounded-lg border border-white/10 bg-[#0B1325] px-3 py-2 flex items-center justify-between gap-2"
              >
                <span className="text-[#E2E8F0] truncate">{item.test}</span>
                <span className="text-[#4ADE80] shrink-0">{item.state}</span>
              </div>
            ))}
          </div>
        )}

        {surfaceId === 'control' && (
          <div className="space-y-2.5 text-[11px]">
            <div className="rounded-lg border border-white/10 bg-[#0B1325] p-3 flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] text-[#60A5FA]">RBAC + TOOL POLICY</div>
                <div className="font-medium mt-0.5">erp.postJournalEntry -&gt; Require Controller</div>
              </div>
              <span className="font-mono text-[10px] text-[#93C5FD]">OUT-OF-BAND</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[10.5px]">
              <div className="rounded-lg border border-white/10 bg-[#0B1325] p-2.5">
                <div className="text-[#94A3B8]">Spend Ceiling</div>
                <div className="text-white mt-0.5">Workspace Enforced</div>
              </div>
              <div className="rounded-lg border border-[#3B82F6]/60 bg-[#101D35] p-2.5">
                <div className="text-[#93C5FD]">Audit Stream</div>
                <div className="text-white mt-0.5">SIEM + Hash Chain</div>
              </div>
            </div>
          </div>
        )}

        {surfaceId === 'decisions' && (
          <div className="space-y-2.5 text-[11px] font-mono">
            <div className="rounded-lg border border-white/10 bg-[#0B1325] overflow-hidden">
              <div className="grid grid-cols-4 px-3 py-1.5 border-b border-white/10 text-[10px] text-[#94A3B8]">
                <span>ROW</span>
                <span>AMOUNT</span>
                <span>KYB</span>
                <span>OUTCOME</span>
              </div>
              <div className="grid grid-cols-4 px-3 py-2 bg-[#101D35] border-b border-white/10 text-white">
                <span>#1</span>
                <span>&lt; 50000</span>
                <span>true</span>
                <span className="text-[#4ADE80]">approved</span>
              </div>
              <div className="grid grid-cols-4 px-3 py-2 text-[#CBD5E1]">
                <span>#2</span>
                <span>&gt;= 50000</span>
                <span>*</span>
                <span className="text-[#93C5FD]">manual_review</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10.5px] text-[#94A3B8] px-1">
              <span>Hit Policy: First-Match</span>
              <span className="text-[#60A5FA]">Deterministic · 0 LLM Calls</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
