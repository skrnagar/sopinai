import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Database,
  Grid,
  Home,
  Layers,
  Moon,
  Play,
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
import { AppRunView } from './views/AppRunView';
import { AppKnowledgeView } from './views/AppKnowledgeView';
import { AppMoreView } from './views/AppMoreView';

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
    markAllNotificationsRead,
    saveAgent,
    saveWorkflow,
    startPrototypeRun,
    advanceRunToApprovalOrComplete,
    updateRunAction,
    addDocument,
    updateDocument,
    deleteDocument,
    toggleTool,
    updateWorkspaceBudget,
    updateSettings,
    resetWorkspacePrototype,
  } = useAppWorkspaceStore();

  const [activeTab, setActiveTab] = useState<AppTabId>('home');
  const [selectedRunId, setSelectedRunId] = useState<string>(state.runs[0]?.id || 'run-481');
  const [workspaceSheetOpen, setWorkspaceSheetOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const unreadCount = state.notifications.filter((n) => !n.read).length;
  const activeRun = state.runs.find(
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

  const handleOpenRun = (runId: string) => {
    setSelectedRunId(runId);
    setActiveTab('run');
  };

  const handleTestRunTarget = (name: string, type: 'Agent' | 'Workflow', prompt: string) => {
    const id = startPrototypeRun({
      title: `Dry-Run · ${name}`,
      prompt,
      targetName: name,
      targetType: type,
    });
    setSelectedRunId(id);
    setActiveTab('run');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7FA] dark:bg-[#101014] text-[#101014] dark:text-white">
      {/* Compact Mobile/App Header Bar */}
      <header className="sticky top-0 z-40 h-14 pt-safe border-b border-[#101014]/10 dark:border-white/10 bg-[#FFFFFF]/95 dark:bg-[#101126]/95 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto h-full px-3 sm:px-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
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
              className="min-h-[40px] px-2.5 py-1 rounded-lg border border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101014] flex items-center gap-2 min-w-0"
            >
              <SopinLogo size="sm" showWordmark={false} />
              <span className="text-xs font-semibold text-[#101014] dark:text-white truncate max-w-[130px] sm:max-w-[220px]">
                {activeWorkspace.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#5E5E6E] shrink-0" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen(true);
                markAllNotificationsRead();
              }}
              aria-label="Open notifications"
              className="relative w-11 h-11 rounded-lg inline-flex items-center justify-center text-[#101014] dark:text-white hover:bg-[#F7F7FA] dark:hover:bg-white/10"
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
              className="w-11 h-11 rounded-lg inline-flex items-center justify-center text-[#5E5E6E] dark:text-[#A4A4B5] hover:bg-[#F7F7FA] dark:hover:bg-white/10"
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
              className="w-11 h-11 rounded-lg inline-flex items-center justify-center text-[#101014] dark:text-white hover:bg-[#F7F7FA] dark:hover:bg-white/10"
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
          <div className="space-y-1.5">
            <div className="px-3 pb-2 text-[11px] font-mono font-semibold text-[#5E5E6E] dark:text-[#9A9AB0]">
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
        <main id="main-content" className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-5 pb-28 lg:pb-10">
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
              workspace={activeWorkspace}
              agents={state.agents}
              workflows={state.workflows}
              runs={state.runs}
              onSwitchTab={setActiveTab}
              onSelectRun={handleOpenRun}
              onStartQuickTask={() => setActiveTab('run')}
              onStartNewAgent={() => setActiveTab('build')}
              onApproveRun={(runId) => updateRunAction(runId, 'approve')}
            />
          )}

          {activeTab === 'build' && (
            <AppBuildView
              workspaceId={activeWorkspace.id}
              agents={state.agents}
              workflows={state.workflows}
              tools={state.tools}
              documents={state.documents}
              onSaveAgent={saveAgent}
              onSaveWorkflow={saveWorkflow}
              onTestRunTarget={handleTestRunTarget}
            />
          )}

          {activeTab === 'run' && (
            <AppRunView
              runs={state.runs}
              selectedRunId={selectedRunId}
              agents={state.agents}
              workflows={state.workflows}
              documents={state.documents}
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
              workspaceId={activeWorkspace.id}
              documents={state.documents}
              onAddDocument={addDocument}
              onUpdateDocument={updateDocument}
              onDeleteDocument={deleteDocument}
            />
          )}

          {activeTab === 'more' && (
            <AppMoreView
              workspace={activeWorkspace}
              agents={state.agents}
              runs={state.runs}
              tools={state.tools}
              auditLog={state.auditLog}
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

      {/* Mobile & Tablet Thumb-Friendly Bottom Navigation (5 Core Tabs) */}
      <nav
        aria-label="Mobile workspace bottom navigation"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 pb-safe border-t border-[#101014]/10 dark:border-white/10 bg-[#FFFFFF]/95 dark:bg-[#101126]/95 backdrop-blur-md"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                  active
                    ? 'text-[#6252E8] dark:text-[#B894FF]'
                    : 'text-[#5E5E6E] dark:text-[#A4A4B5]'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span>{tab.label}</span>
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
        subtitle="Select active project context in local browser storage."
      >
        <div className="space-y-2.5">
          {state.workspaces.map((ws) => (
            <button
              key={ws.id}
              type="button"
              onClick={() => {
                switchWorkspace(ws.id);
                setWorkspaceSheetOpen(false);
              }}
              className={`w-full min-h-[56px] text-left rounded-xl border p-3.5 ${
                ws.id === activeWorkspace.id
                  ? 'border-[#6252E8] bg-[#6252E8]/10'
                  : 'border-[#101014]/10 dark:border-white/10'
              }`}
            >
              <div className="text-sm font-semibold">{ws.name}</div>
              <div className="text-xs text-[#5E5E6E] dark:text-[#A4A4B5] mt-0.5">
                {ws.role} · {ws.environment}
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Notifications Bottom Sheet */}
      <BottomSheet
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Workspace Notifications"
        subtitle="Approvals, retries, and run state transitions."
      >
        <div className="space-y-2.5">
          {state.notifications.map((n) => (
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
          ))}
        </div>
      </BottomSheet>

      {/* Profile Bottom Sheet */}
      <BottomSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Workspace Profile"
        subtitle="Alex Rivera · Workspace Maintainer"
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
