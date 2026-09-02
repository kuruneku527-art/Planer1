import {
  Task,
  Project,
  Goal,
  Habit,
  HabitLog,
  Note,
  CalendarEvent,
  Reminder,
  PomodoroSession,
  TimeEntry,
  FileAttachment,
  Template,
  NotificationItem,
  UserSettings,
  DailyPlan,
} from '../types';

const STORAGE_KEYS = {
  TASKS: 'planner_tasks_v1',
  PROJECTS: 'planner_projects_v1',
  GOALS: 'planner_goals_v1',
  HABITS: 'planner_habits_v1',
  HABIT_LOGS: 'planner_habit_logs_v1',
  NOTES: 'planner_notes_v1',
  EVENTS: 'planner_events_v1',
  REMINDERS: 'planner_reminders_v1',
  POMODORO_SESSIONS: 'planner_pomodoro_v1',
  TIME_ENTRIES: 'planner_time_entries_v1',
  FILES: 'planner_files_v1',
  TEMPLATES: 'planner_templates_v1',
  NOTIFICATIONS: 'planner_notifications_v1',
  SETTINGS: 'planner_settings_v1',
  DAILY_PLANS: 'planner_daily_plans_v1',
};

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  persianDigits: true,
  calendarType: 'jalali',
  weekStartsOn: 'saturday',
  pomodoro: {
    focusDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    soundEnabled: true,
  },
  pomodoroFocusMinutes: 25,
  pomodoroShortBreakMinutes: 5,
  pomodoroLongBreakMinutes: 15,
  soundVolume: 0.5,
  soundEnabled: true,
  soundEffectsEnabled: true,
  notificationsEnabled: true,
  syncEnabled: false,
  userName: '',
  isFirstLaunch: true,
};

class DatabaseService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Dispatch custom event for cross-component reactive updates
      window.dispatchEvent(new CustomEvent('planner_db_updated', { detail: { key } }));
    } catch (e) {
      console.error(`Error saving to localStorage key: ${key}`, e);
    }
  }

  // --- SETTINGS ---
  getSettings(): UserSettings {
    return this.get<UserSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  updateSettings(partial: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    this.set(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // --- TASKS ---
  getTasks(): Task[] {
    return this.get<Task[]>(STORAGE_KEYS.TASKS, []);
  }

  getTask(id: string): Task | undefined {
    return this.getTasks().find((t) => t.id === id);
  }

  saveTask(task: Task): void {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = task;
    } else {
      tasks.unshift(task);
    }
    this.set(STORAGE_KEYS.TASKS, tasks);

    // Sync Reminder & Notification scheduling (Zero Duplicate Guaranteed)
    const remId = `rem_task_${task.id}`;
    if (typeof window !== 'undefined') {
      import('./notificationService').then(({ notificationService }) => {
        if (task.status === 'completed' || task.status === 'cancelled' || !task.dueDate) {
          notificationService.cancelNotification(remId);
          const rems = this.getReminders().filter((r) => r.id !== remId);
          this.set(STORAGE_KEYS.REMINDERS, rems);
        } else if (task.dueDate) {
          const dueTime = task.dueTime || '09:00';
          notificationService.scheduleNotification({
            id: remId,
            title: `موعد انجام وظیفه: ${task.title}`,
            message: task.description || `ساعت سررسید: ${dueTime}`,
            scheduledDate: task.dueDate,
            scheduledTime: dueTime,
            type: 'task',
            targetView: 'tasks',
            sourceId: task.id,
          });

          // Sync into reminders collection
          const rems = this.getReminders().filter((r) => r.id !== remId);
          res: rems.unshift({
            id: remId,
            title: `موعد انجام وظیفه: ${task.title}`,
            description: task.description,
            date: task.dueDate,
            time: dueTime,
            type: 'none',
            priority: task.priority,
            isCompleted: false,
            createdAt: task.createdAt,
          });
          this.set(STORAGE_KEYS.REMINDERS, rems);
        }
      });
    }
  }

  deleteTask(id: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    this.set(STORAGE_KEYS.TASKS, tasks);

    const remId = `rem_task_${id}`;
    const rems = this.getReminders().filter((r) => r.id !== remId);
    this.set(STORAGE_KEYS.REMINDERS, rems);

    if (typeof window !== 'undefined') {
      import('./notificationService').then(({ notificationService }) => {
        notificationService.cancelNotification(remId);
      });
    }
  }

  toggleTaskStatus(id: string): Task | undefined {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === id);
    if (task) {
      const isCompleted = task.status === 'completed';
      task.status = isCompleted ? 'todo' : 'completed';
      task.completedAt = isCompleted ? undefined : new Date().toISOString();
      this.set(STORAGE_KEYS.TASKS, tasks);

      const remId = `rem_task_${id}`;
      if (typeof window !== 'undefined') {
        import('./notificationService').then(({ notificationService }) => {
          if (task.status === 'completed') {
            notificationService.cancelNotification(remId);
            const rems = this.getReminders().map((r) =>
              r.id === remId ? { ...r, isCompleted: true } : r
            );
            this.set(STORAGE_KEYS.REMINDERS, rems);
          } else if (task.dueDate) {
            notificationService.scheduleNotification({
              id: remId,
              title: `موعد انجام وظیفه: ${task.title}`,
              message: task.description || `ساعت سررسید: ${task.dueTime || '09:00'}`,
              scheduledDate: task.dueDate,
              scheduledTime: task.dueTime || '09:00',
              type: 'task',
              targetView: 'tasks',
              sourceId: task.id,
            });
            const rems = this.getReminders().map((r) =>
              r.id === remId ? { ...r, isCompleted: false } : r
            );
            this.set(STORAGE_KEYS.REMINDERS, rems);
          }
        });
      }
      return task;
    }
    return undefined;
  }

  // --- PROJECTS ---
  getProjects(): Project[] {
    return this.get<Project[]>(STORAGE_KEYS.PROJECTS, []);
  }

  getProject(id: string): Project | undefined {
    return this.getProjects().find((p) => p.id === id);
  }

  saveProject(project: Project): void {
    const projects = this.getProjects();
    const idx = projects.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      projects[idx] = project;
    } else {
      projects.unshift(project);
    }
    this.set(STORAGE_KEYS.PROJECTS, projects);
  }

  deleteProject(id: string): void {
    const projects = this.getProjects().filter((p) => p.id !== id);
    this.set(STORAGE_KEYS.PROJECTS, projects);
    // Unlink tasks
    const tasks = this.getTasks().map((t) => (t.projectId === id ? { ...t, projectId: undefined } : t));
    this.set(STORAGE_KEYS.TASKS, tasks);
  }

  getProjectProgress(projectId: string): { total: number; completed: number; percentage: number } {
    const tasks = this.getTasks().filter((t) => t.projectId === projectId);
    if (tasks.length === 0) return { total: 0, completed: 0, percentage: 0 };
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return {
      total: tasks.length,
      completed,
      percentage: Math.round((completed / tasks.length) * 100),
    };
  }

  // --- GOALS ---
  getGoals(): Goal[] {
    return this.get<Goal[]>(STORAGE_KEYS.GOALS, []);
  }

  getGoal(id: string): Goal | undefined {
    return this.getGoals().find((g) => g.id === id);
  }

  saveGoal(goal: Goal): void {
    const goals = this.getGoals();
    const idx = goals.findIndex((g) => g.id === goal.id);
    if (idx >= 0) {
      goals[idx] = goal;
    } else {
      goals.unshift(goal);
    }
    this.set(STORAGE_KEYS.GOALS, goals);
  }

  deleteGoal(id: string): void {
    const goals = this.getGoals().filter((g) => g.id !== id);
    this.set(STORAGE_KEYS.GOALS, goals);
  }

  getGoalProgress(goal: Goal): number {
    if (!goal.milestones || goal.milestones.length === 0) {
      return goal.status === 'completed' || goal.status === 'achieved' ? 100 : 0;
    }
    const completed = goal.milestones.filter((m) => m.completed).length;
    return Math.round((completed / goal.milestones.length) * 100);
  }

  // --- HABITS & HABIT LOGS ---
  getHabits(): Habit[] {
    return this.get<Habit[]>(STORAGE_KEYS.HABITS, []);
  }

  saveHabit(habit: Habit): void {
    const habits = this.getHabits();
    const idx = habits.findIndex((h) => h.id === habit.id);
    if (idx >= 0) {
      habits[idx] = habit;
    } else {
      habits.unshift(habit);
    }
    this.set(STORAGE_KEYS.HABITS, habits);
  }

  deleteHabit(id: string): void {
    const habits = this.getHabits().filter((h) => h.id !== id);
    this.set(STORAGE_KEYS.HABITS, habits);
    // Delete logs
    const logs = this.getHabitLogs().filter((l) => l.habitId !== id);
    this.set(STORAGE_KEYS.HABIT_LOGS, logs);
  }

  getHabitLogs(): HabitLog[] {
    return this.get<HabitLog[]>(STORAGE_KEYS.HABIT_LOGS, []);
  }

  toggleHabitLog(habitId: string, date: string): boolean {
    const logs = this.getHabitLogs();
    const existingIdx = logs.findIndex((l) => l.habitId === habitId && l.date === date);
    let isDone = false;
    if (existingIdx >= 0) {
      logs[existingIdx].completed = !logs[existingIdx].completed;
      isDone = logs[existingIdx].completed;
    } else {
      logs.push({
        id: `hlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        habitId,
        date,
        completed: true,
      });
      isDone = true;
    }
    this.set(STORAGE_KEYS.HABIT_LOGS, logs);
    return isDone;
  }

  getHabitStreak(habitId: string): number {
    const logs = this.getHabitLogs().filter((l) => l.habitId === habitId && l.completed);
    if (logs.length === 0) return 0;
    
    const sortedDates = Array.from(new Set(logs.map((l) => l.date))).sort().reverse();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) {
      return 0;
    }

    let streak = 0;
    let checkDate = sortedDates.includes(todayStr) ? today : yesterday;

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (sortedDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // --- NOTES ---
  getNotes(): Note[] {
    return this.get<Note[]>(STORAGE_KEYS.NOTES, []);
  }

  saveNote(note: Note): void {
    const notes = this.getNotes();
    const idx = notes.findIndex((n) => n.id === note.id);
    if (idx >= 0) {
      notes[idx] = note;
    } else {
      notes.unshift(note);
    }
    this.set(STORAGE_KEYS.NOTES, notes);
  }

  deleteNote(id: string): void {
    const notes = this.getNotes().filter((n) => n.id !== id);
    this.set(STORAGE_KEYS.NOTES, notes);
  }

  toggleNotePin(id: string): void {
    const notes = this.getNotes();
    const note = notes.find((n) => n.id === id);
    if (note) {
      note.isPinned = !note.isPinned;
      this.set(STORAGE_KEYS.NOTES, notes);
    }
  }

  // --- DAILY PLANS ---
  getDailyPlans(): DailyPlan[] {
    return this.get<DailyPlan[]>(STORAGE_KEYS.DAILY_PLANS, []);
  }

  getDailyPlan(date: string): DailyPlan | undefined {
    return this.getDailyPlans().find((p) => p.date === date);
  }

  saveDailyPlan(plan: DailyPlan): void {
    const plans = this.getDailyPlans();
    const idx = plans.findIndex((p) => p.date === plan.date);
    if (idx >= 0) {
      plans[idx] = plan;
    } else {
      plans.unshift(plan);
    }
    this.set(STORAGE_KEYS.DAILY_PLANS, plans);
  }

  // --- EVENTS ---
  getEvents(): CalendarEvent[] {
    return this.get<CalendarEvent[]>(STORAGE_KEYS.EVENTS, []);
  }

  saveEvent(event: CalendarEvent): void {
    const events = this.getEvents();
    const idx = events.findIndex((e) => e.id === event.id);
    if (idx >= 0) {
      events[idx] = event;
    } else {
      events.push(event);
    }
    this.set(STORAGE_KEYS.EVENTS, events);

    if (typeof window !== 'undefined' && event.startDate) {
      import('./notificationService').then(({ notificationService }) => {
        const remKey = `rem_event_${event.id}`;
        notificationService.scheduleNotification({
          id: remKey,
          title: `رویداد تقویم: ${event.title}`,
          message: event.location ? `مکان: ${event.location} - زمان: ${event.startTime || '09:00'}` : `زمان برگزاری: ${event.startTime || '09:00'}`,
          scheduledDate: event.startDate,
          scheduledTime: event.startTime || '09:00',
          type: 'calendar',
          targetView: 'calendar',
          sourceId: event.id,
        });
      });
    }
  }

  deleteEvent(id: string): void {
    const events = this.getEvents().filter((e) => e.id !== id);
    this.set(STORAGE_KEYS.EVENTS, events);

    if (typeof window !== 'undefined') {
      import('./notificationService').then(({ notificationService }) => {
        notificationService.cancelNotification(`rem_event_${id}`);
      });
    }
  }

  // --- REMINDERS ---
  getReminders(): Reminder[] {
    return this.get<Reminder[]>(STORAGE_KEYS.REMINDERS, []);
  }

  saveReminder(reminder: Reminder): void {
    const reminders = this.getReminders();
    const idx = reminders.findIndex((r) => r.id === reminder.id);
    if (idx >= 0) {
      reminders[idx] = reminder;
    } else {
      reminders.unshift(reminder);
    }
    this.set(STORAGE_KEYS.REMINDERS, reminders);

    if (typeof window !== 'undefined') {
      import('./notificationService').then(({ notificationService }) => {
        const remKey = reminder.id.startsWith('rem_') ? reminder.id : `rem_${reminder.id}`;
        if (reminder.isCompleted) {
          notificationService.cancelNotification(remKey);
        } else {
          notificationService.scheduleNotification({
            id: remKey,
            title: `یادآور: ${reminder.title}`,
            message: reminder.description || `زمان تنظیم شده: ${reminder.time}`,
            scheduledDate: reminder.date,
            scheduledTime: reminder.time,
            type: 'reminder',
            targetView: 'reminders',
            sourceId: reminder.id,
          });
        }
      });
    }
  }

  deleteReminder(id: string): void {
    const reminders = this.getReminders().filter((r) => r.id !== id);
    this.set(STORAGE_KEYS.REMINDERS, reminders);

    if (typeof window !== 'undefined') {
      import('./notificationService').then(({ notificationService }) => {
        notificationService.cancelNotification(`rem_${id}`);
        notificationService.cancelNotification(id);
      });
    }
  }

  toggleReminder(id: string): void {
    const reminders = this.getReminders();
    const reminder = reminders.find((r) => r.id === id);
    if (reminder) {
      reminder.isCompleted = !reminder.isCompleted;
      this.set(STORAGE_KEYS.REMINDERS, reminders);

      if (typeof window !== 'undefined') {
        import('./notificationService').then(({ notificationService }) => {
          const remKey = reminder.id.startsWith('rem_') ? reminder.id : `rem_${reminder.id}`;
          if (reminder.isCompleted) {
            notificationService.cancelNotification(remKey);
          } else {
            notificationService.scheduleNotification({
              id: remKey,
              title: `یادآور: ${reminder.title}`,
              message: reminder.description || `زمان تنظیم شده: ${reminder.time}`,
              scheduledDate: reminder.date,
              scheduledTime: reminder.time,
              type: 'reminder',
              targetView: 'reminders',
              sourceId: reminder.id,
            });
          }
        });
      }
    }
  }

  // --- POMODORO SESSIONS ---
  getPomodoroSessions(): PomodoroSession[] {
    return this.get<PomodoroSession[]>(STORAGE_KEYS.POMODORO_SESSIONS, []);
  }

  savePomodoroSession(session: PomodoroSession): void {
    const sessions = this.getPomodoroSessions();
    sessions.unshift(session);
    this.set(STORAGE_KEYS.POMODORO_SESSIONS, sessions);
  }

  // --- TIME ENTRIES ---
  getTimeEntries(): TimeEntry[] {
    return this.get<TimeEntry[]>(STORAGE_KEYS.TIME_ENTRIES, []);
  }

  saveTimeEntry(entry: TimeEntry): void {
    const entries = this.getTimeEntries();
    const idx = entries.findIndex((e) => e.id === entry.id);
    if (idx >= 0) {
      entries[idx] = entry;
    } else {
      entries.unshift(entry);
    }
    this.set(STORAGE_KEYS.TIME_ENTRIES, entries);
  }

  deleteTimeEntry(id: string): void {
    const entries = this.getTimeEntries().filter((e) => e.id !== id);
    this.set(STORAGE_KEYS.TIME_ENTRIES, entries);
  }

  // --- FILES ---
  getFiles(): FileAttachment[] {
    return this.get<FileAttachment[]>(STORAGE_KEYS.FILES, []);
  }

  saveFile(file: FileAttachment): void {
    const files = this.getFiles();
    files.unshift(file);
    this.set(STORAGE_KEYS.FILES, files);
  }

  deleteFile(id: string): void {
    const files = this.getFiles().filter((f) => f.id !== id);
    this.set(STORAGE_KEYS.FILES, files);
  }

  // --- TEMPLATES ---
  getTemplates(): Template[] {
    return this.get<Template[]>(STORAGE_KEYS.TEMPLATES, []);
  }

  saveTemplate(template: Template): void {
    const templates = this.getTemplates();
    const idx = templates.findIndex((t) => t.id === template.id);
    if (idx >= 0) {
      templates[idx] = template;
    } else {
      templates.unshift(template);
    }
    this.set(STORAGE_KEYS.TEMPLATES, templates);
  }

  deleteTemplate(id: string): void {
    const templates = this.getTemplates().filter((t) => t.id !== id);
    this.set(STORAGE_KEYS.TEMPLATES, templates);
  }

  // --- NOTIFICATIONS ---
  getNotifications(): NotificationItem[] {
    return this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  saveNotification(notification: NotificationItem): void {
    const notifications = this.getNotifications();
    notifications.unshift(notification);
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  markNotificationAsRead(id: string): void {
    const notifications = this.getNotifications().map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  markAllNotificationsAsRead(): void {
    const notifications = this.getNotifications().map((n) => ({ ...n, read: true }));
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  clearAllNotifications(): void {
    this.set(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  // --- GLOBAL SEARCH ---
  globalSearch(query: string): {
    tasks: Task[];
    projects: Project[];
    goals: Goal[];
    habits: Habit[];
    notes: Note[];
    events: CalendarEvent[];
    reminders: Reminder[];
  } {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        tasks: [],
        projects: [],
        goals: [],
        habits: [],
        notes: [],
        events: [],
        reminders: [],
      };
    }

    const tasks = this.getTasks().filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
    );

    const projects = this.getProjects().filter(
      (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    );

    const goals = this.getGoals().filter(
      (g) => g.title.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)
    );

    const habits = this.getHabits().filter(
      (h) => h.title.toLowerCase().includes(q) || h.description?.toLowerCase().includes(q)
    );

    const notes = this.getNotes().filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags?.some((tag) => tag.toLowerCase().includes(q))
    );

    const events = this.getEvents().filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
    );

    const reminders = this.getReminders().filter(
      (r) => r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
    );

    return {
      tasks,
      projects,
      goals,
      habits,
      notes,
      events,
      reminders,
    };
  }

  // --- BACKUP & EXPORT / IMPORT ---
  exportBackupData(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks: this.getTasks(),
      projects: this.getProjects(),
      goals: this.getGoals(),
      habits: this.getHabits(),
      habitLogs: this.getHabitLogs(),
      notes: this.getNotes(),
      events: this.getEvents(),
      reminders: this.getReminders(),
      pomodoroSessions: this.getPomodoroSessions(),
      timeEntries: this.getTimeEntries(),
      files: this.getFiles(),
      templates: this.getTemplates(),
      dailyPlans: this.getDailyPlans(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  }

  exportDatabaseJSON(): string {
    return this.exportBackupData();
  }

  importBackupData(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'فایل پشتیبان نامعتبر است.' };
      }

      if (Array.isArray(data.tasks)) this.set(STORAGE_KEYS.TASKS, data.tasks);
      if (Array.isArray(data.projects)) this.set(STORAGE_KEYS.PROJECTS, data.projects);
      if (Array.isArray(data.goals)) this.set(STORAGE_KEYS.GOALS, data.goals);
      if (Array.isArray(data.habits)) this.set(STORAGE_KEYS.HABITS, data.habits);
      if (Array.isArray(data.habitLogs)) this.set(STORAGE_KEYS.HABIT_LOGS, data.habitLogs);
      if (Array.isArray(data.notes)) this.set(STORAGE_KEYS.NOTES, data.notes);
      if (Array.isArray(data.events)) this.set(STORAGE_KEYS.EVENTS, data.events);
      if (Array.isArray(data.reminders)) this.set(STORAGE_KEYS.REMINDERS, data.reminders);
      if (Array.isArray(data.pomodoroSessions)) this.set(STORAGE_KEYS.POMODORO_SESSIONS, data.pomodoroSessions);
      if (Array.isArray(data.timeEntries)) this.set(STORAGE_KEYS.TIME_ENTRIES, data.timeEntries);
      if (Array.isArray(data.files)) this.set(STORAGE_KEYS.FILES, data.files);
      if (Array.isArray(data.templates)) this.set(STORAGE_KEYS.TEMPLATES, data.templates);
      if (Array.isArray(data.dailyPlans)) this.set(STORAGE_KEYS.DAILY_PLANS, data.dailyPlans);
      if (data.settings) this.set(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...data.settings });

      return { success: true, message: 'اطلاعات با موفقیت بازیابی شد.' };
    } catch {
      return { success: false, message: 'خطا در خواندن فایل پشتیبان (فرمت نامعتبر).' };
    }
  }

  importDatabaseJSON(jsonString: string): boolean {
    const res = this.importBackupData(jsonString);
    return res.success;
  }

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(new CustomEvent('planner_db_updated', { detail: { key: 'all' } }));
  }

  clearDatabase(): void {
    this.clearAllData();
  }
}

export const db = new DatabaseService();
