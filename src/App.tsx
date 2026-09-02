import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';

// Global Modals & Notifications
import { QuickAddModal } from './components/layout/QuickAddModal';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { NotificationCenterModal } from './components/layout/NotificationCenterModal';
import { WelcomeModal } from './components/layout/WelcomeModal';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { ActiveAlarmBanner } from './components/common/ActiveAlarmBanner';
import { PermissionSetupModal } from './components/common/PermissionSetupModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { DailyPlannerView } from './components/views/DailyPlannerView';
import { WeeklyPlannerView } from './components/views/WeeklyPlannerView';
import { TasksView } from './components/views/TasksView';
import { ProjectsView } from './components/views/ProjectsView';
import { CalendarView } from './components/views/CalendarView';
import { TimeManagementView } from './components/views/TimeManagementView';
import { GoalsView } from './components/views/GoalsView';
import { HabitsView } from './components/views/HabitsView';
import { NotesView } from './components/views/NotesView';
import { RemindersView } from './components/views/RemindersView';
import { PomodoroView } from './components/views/PomodoroView';
import { ReportsView } from './components/views/ReportsView';
import { FilesView } from './components/views/FilesView';
import { TemplatesView } from './components/views/TemplatesView';
import { SyncView } from './components/views/SyncView';
import { BackupView } from './components/views/BackupView';
import { SettingsView } from './components/views/SettingsView';

const MainLayout: React.FC = () => {
  const { activeView, pomodoroStrictLock, pomodoroIsRunning, unlockPomodoroFocus, pausePomodoro } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const isLockActive = pomodoroStrictLock && pomodoroIsRunning;

  const renderCurrentView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'daily_planner':
        return <DailyPlannerView />;
      case 'weekly_planner':
        return <WeeklyPlannerView />;
      case 'tasks':
        return <TasksView />;
      case 'projects':
        return <ProjectsView />;
      case 'calendar':
        return <CalendarView />;
      case 'time_management':
        return <TimeManagementView />;
      case 'goals':
        return <GoalsView />;
      case 'habits':
        return <HabitsView />;
      case 'notes':
        return <NotesView />;
      case 'reminders':
        return <RemindersView />;
      case 'pomodoro':
        return <PomodoroView />;
      case 'reports':
        return <ReportsView />;
      case 'files':
        return <FilesView />;
      case 'templates':
        return <TemplatesView />;
      case 'sync':
        return <SyncView />;
      case 'backup':
        return <BackupView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div id="planner-root" className="fixed inset-0 w-full h-full flex bg-slate-950 text-slate-100 font-sans overflow-hidden" dir="rtl">
      {/* Persistent Desktop & Tablet Sidebar (Hidden when strict lock is active) */}
      {!isLockActive && (
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top App Header (Hidden when strict lock is active) */}
        {!isLockActive ? (
          <Header onMobileMenuToggle={() => setDrawerOpen(true)} />
        ) : (
          <header
            className="h-14 sm:h-16 px-4 sm:px-6 bg-slate-900/95 border-b border-rose-900/40 flex items-center justify-between shrink-0 z-30"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-black text-sm text-slate-100">حالت تمرکز عمیق (قفل شده)</span>
            </div>
            <button
              type="button"
              onClick={() => {
                pausePomodoro();
                unlockPomodoroFocus();
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 text-xs font-bold hover:bg-rose-900 transition cursor-pointer"
            >
              خروج اضطراری و باز کردن قفل
            </button>
          </header>
        )}

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-32 sm:pb-8">
          {renderCurrentView()}
        </main>
      </div>

      {/* Mobile Drawer & Bottom Navigation Bar (Hidden when strict lock is active) */}
      {!isLockActive && (
        <MobileNav drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
      )}

      {/* Active High-Priority Alarm Alert Banner */}
      <ActiveAlarmBanner />

      {/* Global Modals */}
      <PermissionSetupModal />
      <QuickAddModal />
      <GlobalSearchModal />
      <NotificationCenterModal />
      <WelcomeModal />

      {/* Global Confirmation Modal */}
      <ConfirmationModal />

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
