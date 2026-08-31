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
  const { activeView } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

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
    <div id="planner-root" className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden" dir="rtl">
      {/* Persistent Desktop & Tablet Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top App Header */}
        <Header onMobileMenuToggle={() => setDrawerOpen(true)} />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {renderCurrentView()}
        </main>
      </div>

      {/* Mobile Drawer & Bottom Navigation Bar */}
      <MobileNav drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />

      {/* Global Modals */}
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
