import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  Database,
  Grid,
  Home,
  Layers,
  Moon,
  Play,
  Plus,
  Scale,
  Sun,
  User,
} from 'lucide-react';
import { RoutePath } from '../types/navigation';
import { ThemeMode } from '../hooks/useTheme';
import { SopinLogo } from '../components/brand/SopinLogo';
import { BottomSheet } from '../components/ui/BottomSheet';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { AppTabId } from './types';
import { useAppWorkspaceStore } from './useAppWorkspaceStore';
import { AppHomeView } from './views/AppHomeView';
import { AppBuildView } from './views/AppBuildView';
import { AppDecisionsView } from './views/AppDecisionsView';
import { AppRunView } from './views/AppRunView';
import { AppKnowledgeView } from './views/AppKnowledgeView';
import { AppMoreView } from './views/AppMoreView';
import { DecisionsWorkspaceSlice } from '../decisions/types';

interface SopinAppShellProps {
  onNavigate: (path: RoutePath, sectionId?: string) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const NAV_TABS: {
  id: AppTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'build', label: 'Build', icon: Layers },
  { id: 'decisions', label: 'Decisions', icon: Scale },
  { id: 'run', label: 'Run', icon: Play },
  { id: 'knowledge', label: 'Knowledge', icon: Database },
  { id: 'more', label: 'More', icon: Grid },
];

export const SopinAppShell: React.FC<SopinAppShellProps> = ({
  onNavigate,
  theme,
  onToggleTheme,
}) => {
  const {
    state,
    activeWorkspace,
    switchWorkspace,
    createWorkspace,
    markAllNotificationsRead,
    saveAgent,
    saveWorkflow,
    validateWorkflowForPublish,
    startPrototypeRun,
    advanceRunToApprovalOrComplete,
    updateRunAction,
    addDocument,
    updateDocument,
    deleteDocument,
    toggleTool,
    updateWorkspaceBudget,
    updateSettings,
    saveDecisionRule,
    saveDecisionTable,
    saveRuleset,
    saveRuleChain,
    saveScorecard,
    recordDecisionExecution,
    updateDecisionSettings,
    resetWorkspacePrototype,
  } = useAppWorkspaceStore();

  const [activeTab, setActiveTab] = useState<AppTabId>('home');
  const [selectedRunId, setSelectedRunId] = useState<string>(state.runs[0]?.id || 'run-481');
  const [workspaceSheetOpen, setWorkspaceSheetOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [workspaceBanner, setWorkspaceBanner] = useState('');

  // Scope workspace state strictly to the currently selected workspace
  const wsAgents = useMemo(
    () => state.agents.filter((a) => a.workspaceId === activeWorkspace.id),
    [state.agents, activeWorkspace.id]
  );
  const wsWorkflows = useMemo(
    () => state.workflows.filter((w) => w.workspaceId === activeWorkspace.id),
    [state.workflows, activeWorkspace.id]
  );
  const wsGraphs = useMemo(
    () => state.multiAgentGraphs.filter((g) => g.workspaceId === activeWorkspace.id),
    [state.multiAgentGraphs, activeWorkspace.id]
  );
  const wsRuns = useMemo(
    () => state.runs.filter((r) => r.workspaceId === activeWorkspace.id),
    [state.runs, activeWorkspace.id]
  );
  const wsDocs = useMemo(
    () => state.documents.filter((d) => d.workspaceId === activeWorkspace.id),
    [state.documents, activeWorkspace.id]
  );
  const wsAuditLog = useMemo(
    () => state.auditLog.filter((e) => !e.workspaceId || e.workspaceId === activeWorkspace.id),
    [state.auditLog, activeWorkspace.id]
  );
  const wsNotifications = useMemo(
    () =>
      state.notifications.filter((n) => !n.workspaceId || n.workspaceId === activeWorkspace.id),
    [state.notifications, activeWorkspace.id]
  );
  const wsDecisions = useMemo<DecisionsWorkspaceSlice>(
    () => ({
      rules: state.decisions.rules.filter((r) => r.workspaceId === activeWorkspace.id),
      tables: state.decisions.tables.filter((t) => t.workspaceId === activeWorkspace.id),
      rulesets: state.decisions.rulesets.filter((rs) => rs.workspaceId === activeWorkspace.id),
      chains: state.decisions.chains.filter((c) => c.workspaceId === activeWorkspace.id),
      scorecards: state.decisions.scorecards.filter((sc) => sc.workspaceId === activeWorkspace.id),
      executions: state.decisions.executions.filter((ex) => ex.workspaceId === activeWorkspace.id),
      settings: state.decisions.settings,
    }),
    [state.decisions, activeWorkspace.id]
  );

  const effectiveSelectedRunId = wsRuns.some((r) => r.id === selectedRunId)
    ? selectedRunId
    : wsRuns[0]?.id || '';

  const unreadCount = wsNotifications.filter((n) => !n.read).length;
  const activeRun = wsRuns.find(
    (r) => r.status === 'running' || r.status === 'awaiting-approval'
  );

  // Advance simulated running tasks cleanly so multi-tab users see live status updates
  useEffect(() => {
    const runningTask = state.runs.find((r) => r.status === 'running');
    if (!runningTask) return;
    const timer = window.setTimeout(() => {
      advanceRunToApprovalOrComplete(runningTask.id);
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [state.runs, advanceRunToApprovalOrComplete]);

  useEffect(() => {
    if (!workspaceBanner) return;
    const t = window.setTimeout(() => setWorkspaceBanner(''), 2600);
    return () => window.clearTimeout(t);
  }, [workspaceBanner]);

  const handleSelectWorkspace = (wsId: string) => {
    const target = state.workspaces.find((w) => w.id === wsId);
    switchWorkspace(wsId);
    const firstRun = state.runs.find((r) => r.workspaceId === wsId);
    setSelectedRunId(firstRun?.id || '');
    setWorkspaceSheetOpen(false);
    if (target) {
      setWorkspaceBanner(`Switched workspace to ${target.name}`);
    }
  };

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    const createdId = createWorkspace(newWorkspaceName);
    if (!createdId) return;
    setSelectedRunId('');
    setWorkspaceBanner(`Created & switched to ${newWorkspaceName.trim()}`);
    setNewWorkspaceName('');
    setWorkspaceSheetOpen(false);
  };

  const handleOpenRun = (runId: string) => {
    setSelectedRunId(runId);
    setActiveTab('run');
  };

  const handleTestRunTarget = (
    name: string,
    type: 'Agent' | 'Workflow' | 'Graph',
    prompt: string,
    workflowInputPayload?: Record<string, unknown>
  ) => {
    const id = startPrototypeRun({
      title: `Dry-Run · ${name}`,
      prompt,
      targetName: name,
      targetType: type,
      workflowInputPayload,
    });
    setSelectedRunId(id);
    setActiveTab('run');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7FA] dark:bg-[#101014] text-[#101014] dark:text-white">
      {/* Compact Mobile/App Header Bar */}
      <header className="sticky top-0 z-40 pt-safe border-b border-[#101014]/10 dark:border-white/10 bg-[#FFFFFF]/95 dark:bg-[#101126]/95 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto h-14 px-2.5 sm:px-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              aria-label="Back to SOPIN public website"
              className="w-10 h-10 rounded-lg inline-flex items-center justify-center text-[#5E5E6E] dark:text-[#A4A4B5] hover:bg-[#F7F7FA] dark:hover:bg-white/10 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceSheetOpen(true)}
              aria-label={`Switch workspace, current: ${activeWorkspace.name}`}
              aria-haspopup="dialog"
              aria-expanded={workspaceSheetOpen}
              className="min-h-[40px] max-w-full px-2.5 py-1 rounded-xl border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] hover:border-[#6252E8] flex items-center gap-2 min-w-0 transition-colors"
            >
              <SopinLogo size="sm" showWordmark={false} />
              <span className="w-2 h-2 rounded-full bg-[#6252E8] dark:bg-[#965BFF] shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold text-[#101014] dark:text-white truncate max-w-[140px] sm:max-w-[240px]">
                {activeWorkspace.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#5E5E6E] dark:text-[#A4A4B5] shrink-0" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen(true);
                markAllNotificationsRead();
              }}
              aria-label="Open notifications"
              className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg inline-flex items-center justify-center text-[#101014] dark:text-white hover:bg-[#F7F7FA] dark:hover:bg-white/10"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#965BFF]" />
              )}
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg inline-flex items-center justify-center text-[#5E5E6E] dark:text-[#A4A4B5] hover:bg-[#F7F7FA] dark:hover:bg-white/10"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Sun className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="Workspace profile & account"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg inline-flex items-center justify-center text-[#101014] dark:text-white hover:bg-[#F7F7FA] dark:hover:bg-white/10"
            >
              <User className="w-4 h-4 text-[#6252E8] dark:text-[#B894FF]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Layout: Bottom Tab Bar on Mobile/Tablet (<lg), Left Sidebar on lg+ */}
      <div className="flex-1 max-w-[1280px] w-full mx-auto flex flex-col lg:flex-row">
        {/* Desktop Navigation Rail */}
        <aside
          aria-label="Workspace navigation"
          className="hidden lg:flex flex-col justify-between w-60 shrink-0 border-r border-[#101014]/10 dark:border-white/10 bg-white dark:bg-[#101126]/60 p-4"
        >
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setWorkspaceSheetOpen(true)}
              className="w-full text-left rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] p-3 hover:border-[#6252E8] transition-colors"
            >
              <div className="text-[10px] font-mono uppercase text-[#6252E8] dark:text-[#B894FF]">
                Active Workspace
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold truncate">{activeWorkspace.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#5E5E6E] shrink-0" aria-hidden="true" />
              </div>
            </button>

            <div className="space-y-1.5">
              <div className="px-3 pb-1 text-[11px] font-mono font-semibold text-[#5E5E6E] dark:text-[#9A9AB0]">
                SOPIN WORKSPACE
              </div>
              {NAV_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full min-h-[44px] px-3.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-[#6252E8] text-white'
                        : 'text-[#5E5E6E] dark:text-[#B5B5C5] hover:bg-[#F7F7FA] dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#101014]/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#101014]/15 dark:border-white/15 text-xs font-semibold text-[#101014] dark:text-white flex items-center justify-center gap-2 hover:bg-[#F7F7FA] dark:hover:bg-white/5"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Public Website (sopin.ai)</span>
            </button>
          </div>
        </aside>

        {/* Scrollable Workspace Content */}
        <main id="main-content" className="flex-1 min-w-0 px-3.5 sm:px-6 lg:px-8 py-4 sm:py-5 pb-28 lg:pb-10">
          {/* Workspace Switch Feedback Notice */}
          {workspaceBanner && (
            <div
              role="status"
              className="mb-3 rounded-xl border border-[#6252E8]/40 bg-[#6252E8] text-white px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs font-semibold shadow-sm"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{workspaceBanner}</span>
              </span>
              <span className="font-mono text-[10px] opacity-85 shrink-0">
                {wsAgents.length} agents · {wsRuns.length} runs
              </span>
            </div>
          )}

          {/* Persistent Background Execution Status Strip */}
          {activeRun && activeTab !== 'run' && (
            <button
              type="button"
              onClick={() => handleOpenRun(activeRun.id)}
              className="mb-4 w-full min-h-[44px] rounded-xl border border-[#965BFF]/40 bg-[#101126] text-white px-3.5 py-2.5 flex items-center justify-between gap-2 text-left"
            >
              <div className="min-w-0">
                <span className="font-mono text-[10px] uppercase text-[#B894FF] block">
                  {activeRun.status === 'awaiting-approval'
                    ? 'Approval Gate Waiting'
                    : 'Local Prototype Run Active'}
                </span>
                <span className="text-xs font-semibold truncate block">{activeRun.title}</span>
              </div>
              <span className="text-xs font-semibold text-[#B894FF] shrink-0">Inspect →</span>
            </button>
          )}

          {activeTab === 'home' && (
            <AppHomeView
              key={`home-${activeWorkspace.id}`}
              workspace={activeWorkspace}
              agents={wsAgents}
              workflows={wsWorkflows}
              runs={wsRuns}
              onSwitchTab={setActiveTab}
              onSelectRun={handleOpenRun}
              onStartQuickTask={() => setActiveTab('run')}
              onStartNewAgent={() => setActiveTab('build')}
              onApproveRun={(runId) => updateRunAction(runId, 'approve')}
            />
          )}

          {activeTab === 'build' && (
            <AppBuildView
              key={`build-${activeWorkspace.id}`}
              workspaceId={activeWorkspace.id}
              agents={wsAgents}
              workflows={wsWorkflows}
              multiAgentGraphs={wsGraphs}
              tools={state.tools}
              documents={wsDocs}
              decisions={wsDecisions}
              onOpenDecisions={() => setActiveTab('decisions')}
              onSaveAgent={saveAgent}
              onSaveWorkflow={saveWorkflow}
              onValidateWorkflow={validateWorkflowForPublish}
              onTestRunTarget={handleTestRunTarget}
            />
          )}

          {activeTab === 'decisions' && (
            <AppDecisionsView
              key={`decisions-${activeWorkspace.id}`}
              workspaceId={activeWorkspace.id}
              decisions={wsDecisions}
              onSaveRule={saveDecisionRule}
              onSaveTable={saveDecisionTable}
              onSaveRuleset={saveRuleset}
              onSaveChain={saveRuleChain}
              onSaveScorecard={saveScorecard}
              onRecordExecution={recordDecisionExecution}
              onUpdateSettings={updateDecisionSettings}
            />
          )}

          {activeTab === 'run' && (
            <AppRunView
              key={`run-${activeWorkspace.id}`}
              runs={wsRuns}
              selectedRunId={effectiveSelectedRunId}
              agents={wsAgents}
              workflows={wsWorkflows}
              multiAgentGraphs={wsGraphs}
              documents={wsDocs}
              decisionExecutions={wsDecisions.executions}
              onSelectRun={setSelectedRunId}
              onStartRun={(payload) => {
                const id = startPrototypeRun(payload);
                setSelectedRunId(id);
              }}
              onRunAction={updateRunAction}
            />
          )}

          {activeTab === 'knowledge' && (
            <AppKnowledgeView
              key={`kb-${activeWorkspace.id}`}
              workspaceId={activeWorkspace.id}
              documents={wsDocs}
              onAddDocument={addDocument}
              onUpdateDocument={updateDocument}
              onDeleteDocument={deleteDocument}
            />
          )}

          {activeTab === 'more' && (
            <AppMoreView
              key={`more-${activeWorkspace.id}`}
              workspace={activeWorkspace}
              agents={wsAgents}
              runs={wsRuns}
              tools={state.tools}
              auditLog={wsAuditLog}
              decisionExecutions={wsDecisions.executions}
              settings={state.settings}
              theme={theme}
              onToggleTheme={onToggleTheme}
              onToggleTool={toggleTool}
              onUpdateBudget={updateWorkspaceBudget}
              onUpdateSettings={updateSettings}
              onRunAction={updateRunAction}
              onResetPrototype={resetWorkspacePrototype}
            />
          )}
        </main>
      </div>

      <OfflineBanner hasBottomBar />

      {/* Mobile & Tablet Thumb-Friendly Bottom Navigation (6 Core Tabs) */}
      <nav
        aria-label="Mobile workspace bottom navigation"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 pb-safe border-t border-[#101014]/10 dark:border-white/10 bg-[#FFFFFF]/95 dark:bg-[#101126]/95 backdrop-blur-md"
      >
        <div className="grid grid-cols-6 h-16 max-w-lg mx-auto">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 px-0.5 text-[10px] sm:text-[11px] font-semibold transition-colors ${
                  active
                    ? 'text-[#6252E8] dark:text-[#B894FF]'
                    : 'text-[#5E5E6E] dark:text-[#A4A4B5]'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                <span className="truncate max-w-full">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Workspace Switcher Bottom Sheet */}
      <BottomSheet
        open={workspaceSheetOpen}
        onClose={() => setWorkspaceSheetOpen(false)}
        title="Switch Workspace"
        subtitle="Each workspace isolates its own agents, workflows, runs, and context index."
      >
        <div className="space-y-4">
          <div className="space-y-2.5">
            {state.workspaces.map((ws) => {
              const isSelected = ws.id === activeWorkspace.id;
              const agCount = state.agents.filter((a) => a.workspaceId === ws.id).length;
              const wfCount = state.workflows.filter((w) => w.workspaceId === ws.id).length;
              const runCount = state.runs.filter((r) => r.workspaceId === ws.id).length;
              const docCount = state.documents.filter((d) => d.workspaceId === ws.id).length;
              const pct = Math.min(100, Math.round((ws.tokensUsed / ws.tokenBudgetMonthly) * 100));

              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => handleSelectWorkspace(ws.id)}
                  className={`w-full min-h-[68px] text-left rounded-xl border p-3.5 transition-colors space-y-2 ${
                    isSelected
                      ? 'border-[#6252E8] bg-[#6252E8]/10 dark:bg-[#6252E8]/20'
                      : 'border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] hover:border-[#6252E8]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#101014] dark:text-white truncate">
                        {ws.name}
                      </div>
                      <div className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5] mt-0.5">
                        {ws.role} · {ws.environment}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#6252E8] dark:text-[#B894FF] shrink-0">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#5E5E6E] dark:text-[#A4A4B5]">
                    <span>
                      {agCount} agents · {wfCount} flows · {runCount} runs · {docCount} docs
                    </span>
                    <span>{pct}% budget</span>
                  </div>
                </button>
              );
            })}
          </div>

          <form
            onSubmit={handleCreateWorkspace}
            className="pt-3 border-t border-[#101014]/10 dark:border-white/10 space-y-2.5"
          >
            <label
              htmlFor="new-workspace-name"
              className="block text-xs font-semibold text-[#101014] dark:text-white"
            >
              Create New Local Workspace
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="new-workspace-name"
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="e.g., Security Compliance Sandbox"
                className="flex-1 min-h-[44px] px-3.5 py-2 rounded-lg border border-[#101014]/15 dark:border-white/15 bg-[#F7F7FA] dark:bg-[#101014] text-base sm:text-sm text-[#101014] dark:text-white"
              />
              <button
                type="submit"
                disabled={!newWorkspaceName.trim()}
                className="min-h-[44px] px-4 rounded-lg bg-[#6252E8] disabled:opacity-40 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Create</span>
              </button>
            </div>
          </form>
        </div>
      </BottomSheet>

      {/* Notifications Bottom Sheet */}
      <BottomSheet
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Workspace Notifications"
        subtitle={`Alerts scoped to ${activeWorkspace.name}.`}
      >
        <div className="space-y-2.5">
          {wsNotifications.length === 0 ? (
            <p className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5] py-2">
              No notifications in {activeWorkspace.name}.
            </p>
          ) : (
            wsNotifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setActiveTab(n.targetTab);
                  setNotificationsOpen(false);
                }}
                className="w-full text-left rounded-xl border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">{n.title}</span>
                  <span className="text-[11px] text-[#5E5E6E] dark:text-[#9A9AB0]">{n.timeLabel}</span>
                </div>
                <p className="mt-1 text-xs text-[#5E5E6E] dark:text-[#A4A4B5]">{n.detail}</p>
              </button>
            ))
          )}
        </div>
      </BottomSheet>

      {/* Profile Bottom Sheet */}
      <BottomSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Workspace Profile"
        subtitle={`Alex Rivera · ${activeWorkspace.role}`}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-[#F7F7FA] dark:bg-[#101014] border border-[#101014]/10 dark:border-white/10 p-3.5 text-xs space-y-1">
            <div><strong>Active Workspace:</strong> {activeWorkspace.name}</div>
            <div><strong>Runtime Mode:</strong> Local Interactive Prototype</div>
            <div><strong>Organization:</strong> SONIL Group · sopin.ai</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setProfileOpen(false);
              onNavigate('/');
            }}
            className="w-full min-h-[44px] rounded-xl border border-[#101014]/15 dark:border-white/15 text-xs font-semibold"
          >
            Return to Public Website (sopin.ai)
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
