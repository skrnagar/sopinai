import React, { useState } from 'react';
import {
  Activity,
  FlaskConical,
  GitBranch,
  History,
  Layers,
  LayoutGrid,
  Scale,
  Settings,
  Sliders,
  Table2,
} from 'lucide-react';
import {
  DecisionExecutionSpec,
  DecisionSectionId,
  DecisionSettings,
  DecisionTableSpec,
  DecisionsWorkspaceSlice,
  RuleChainSpec,
  RuleSpec,
  RulesetSpec,
  ScorecardSpec,
} from '../../decisions/types';
import { DecisionsOverview } from '../../decisions/components/DecisionsOverview';
import { RuleBuilderEditor } from '../../decisions/components/RuleBuilderEditor';
import { DecisionTableEditor } from '../../decisions/components/DecisionTableEditor';
import { RulesetsChainsScorecards } from '../../decisions/components/RulesetsChainsScorecards';
import { SimulationAndMonitoring } from '../../decisions/components/SimulationAndMonitoring';

interface AppDecisionsViewProps {
  workspaceId: string;
  workspaceRole?: string;
  decisions: DecisionsWorkspaceSlice;
  onSaveRule: (rule: RuleSpec, note?: string) => void;
  onSaveTable: (table: DecisionTableSpec, note?: string) => void;
  onSaveRuleset: (rs: RulesetSpec, note?: string) => void;
  onSaveChain: (chain: RuleChainSpec, note?: string) => void;
  onSaveScorecard: (sc: ScorecardSpec, note?: string) => void;
  onRecordExecution: (exec: DecisionExecutionSpec) => void;
  onUpdateSettings: (partial: Partial<DecisionSettings>) => void;
}

const DECISIONS_TABS: {
  id: DecisionSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'rules', label: 'Rules', icon: Sliders },
  { id: 'tables', label: 'Decision Tables', icon: Table2 },
  { id: 'rulesets', label: 'Rulesets', icon: Layers },
  { id: 'chains', label: 'Rule Chains', icon: GitBranch },
  { id: 'scorecards', label: 'Scorecards', icon: Scale },
  { id: 'testing', label: 'Test & Sim', icon: FlaskConical },
  { id: 'executions', label: 'Executions', icon: Activity },
  { id: 'versions', label: 'Versions & Env', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AppDecisionsView: React.FC<AppDecisionsViewProps> = ({
  workspaceId,
  workspaceRole = 'Workspace Maintainer',
  decisions,
  onSaveRule,
  onSaveTable,
  onSaveRuleset,
  onSaveChain,
  onSaveScorecard,
  onRecordExecution,
  onUpdateSettings,
}) => {
  const [section, setSection] = useState<DecisionSectionId>('overview');
  const [selectedRuleId, setSelectedRuleId] = useState<string | undefined>(decisions.rules[0]?.id);
  const [selectedTableId, setSelectedTableId] = useState<string | undefined>(decisions.tables[0]?.id);
  const [openAiOnMount, setOpenAiOnMount] = useState(false);

  return (
    <div className="space-y-4">
      {/* 10-Section Horizontally Scrollable Mobile-First Decisions Navigation */}
      <div
        role="tablist"
        aria-label="SOPIN Decisions workspace sections"
        className="flex overflow-x-auto no-scrollbar gap-2 pb-1"
      >
        {DECISIONS_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                if (tab.id !== 'rules') setOpenAiOnMount(false);
                setSection(tab.id);
              }}
              className={`min-h-[44px] px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'border-[#6252E8] bg-[#6252E8] text-white'
                  : 'border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126] text-[#5E5E6E] dark:text-[#B5B5C5] hover:border-[#6252E8]/40'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {section === 'overview' && (
        <DecisionsOverview
          rules={decisions.rules}
          tables={decisions.tables}
          rulesets={decisions.rulesets}
          chains={decisions.chains}
          scorecards={decisions.scorecards}
          executions={decisions.executions}
          onSwitchSection={(s) => setSection(s)}
          onSelectRule={(id) => {
            setSelectedRuleId(id);
            setOpenAiOnMount(false);
            setSection('rules');
          }}
          onSelectTable={(id) => {
            setSelectedTableId(id);
            setSection('tables');
          }}
          onOpenAiAssist={() => {
            setOpenAiOnMount(true);
            setSection('rules');
          }}
        />
      )}

      {section === 'rules' && (
        <RuleBuilderEditor
          workspaceId={workspaceId}
          workspaceRole={workspaceRole}
          rules={decisions.rules}
          selectedRuleId={selectedRuleId}
          requireTestPassBeforePublish={decisions.settings.requireTestPassBeforePublish}
          settings={decisions.settings}
          aiDrawerDefaultOpen={openAiOnMount}
          onSaveRule={onSaveRule}
          onRecordExecution={onRecordExecution}
        />
      )}

      {section === 'tables' && (
        <DecisionTableEditor
          workspaceId={workspaceId}
          workspaceRole={workspaceRole}
          tables={decisions.tables}
          selectedTableId={selectedTableId}
          settings={decisions.settings}
          onSaveTable={onSaveTable}
          onRecordExecution={onRecordExecution}
        />
      )}

      {(section === 'rulesets' || section === 'chains' || section === 'scorecards') && (
        <RulesetsChainsScorecards
          mode={section}
          workspaceId={workspaceId}
          workspaceRole={workspaceRole}
          rules={decisions.rules}
          tables={decisions.tables}
          rulesets={decisions.rulesets}
          chains={decisions.chains}
          scorecards={decisions.scorecards}
          settings={decisions.settings}
          onSaveRuleset={onSaveRuleset}
          onSaveChain={onSaveChain}
          onSaveScorecard={onSaveScorecard}
          onRecordExecution={onRecordExecution}
        />
      )}

      {(section === 'testing' ||
        section === 'executions' ||
        section === 'versions' ||
        section === 'settings') && (
        <SimulationAndMonitoring
          mode={section}
          workspaceRole={workspaceRole}
          rules={decisions.rules}
          tables={decisions.tables}
          rulesets={decisions.rulesets}
          chains={decisions.chains}
          scorecards={decisions.scorecards}
          executions={decisions.executions}
          settings={decisions.settings}
          onUpdateRule={onSaveRule}
          onUpdateTable={onSaveTable}
          onUpdateRuleset={onSaveRuleset}
          onUpdateChain={onSaveChain}
          onUpdateScorecard={onSaveScorecard}
          onUpdateSettings={onUpdateSettings}
        />
      )}
    </div>
  );
};
