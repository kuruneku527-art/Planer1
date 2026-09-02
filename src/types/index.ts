export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'archived';
export type GoalType = 'short_term' | 'long_term';
export type GoalStatus = 'in_progress' | 'completed' | 'achieved' | 'paused';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type PomodoroMode = 'focus' | 'short_break' | 'long_break';
export type TimeCategory = 'work' | 'study' | 'meeting' | 'exercise' | 'reading' | 'break' | 'personal' | 'health' | 'waste' | 'other';
export type ThemeMode = 'dark' | 'light' | 'system';
export type CalendarType = 'jalali' | 'gregorian';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string; // YYYY-MM-DD in Gregorian, formatted on display
  startDate?: string;
  endDate?: string;
  dueTime?: string; // HH:mm
  reminderTime?: string;
  category?: string;
  projectId?: string;
  tags: string[];
  subtasks: Subtask[];
  attachments?: string[];
  repeat: RecurrenceType;
  estimatedMinutes?: number;
  actualMinutes?: number;
  createdAt: string;
  completedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  startDate?: string;
  deadline?: string;
  status: ProjectStatus;
  priority: Priority;
  category?: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  category?: string;
  type: GoalType;
  status: GoalStatus;
  milestones: Milestone[];
  linkedTasks: string[];
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  color: string;
  icon: string;
  targetDaysPerWeek: number; // 1 to 7
  targetDays: number[]; // 0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  note?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  category?: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  isAllDay: boolean;
  color: string;
  location?: string;
  reminderMinutes?: number;
  recurrence: RecurrenceType;
  linkedTaskId?: string;
  linkedProjectId?: string;
  category?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: RecurrenceType;
  isCompleted: boolean;
  priority: Priority;
  linkedEntityType?: 'task' | 'goal' | 'event' | 'project';
  linkedEntityId?: string;
  createdAt: string;
}

export interface PomodoroSession {
  id: string;
  mode: PomodoroMode;
  durationMinutes: number;
  completedAt: string;
  taskId?: string;
  taskTitle?: string;
  note?: string;
}

export interface TimeEntry {
  id: string;
  title: string;
  category: TimeCategory;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  durationMinutes: number;
  linkedTaskId?: string;
  linkedProjectId?: string;
  note?: string;
  createdAt: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: 'work' | 'study' | 'personal' | 'health';
  completed: boolean;
}

export interface DailyPlan {
  id: string;
  date: string; // YYYY-MM-DD
  topPriorities: { id: string; text: string; completed: boolean }[];
  timeBlocks: TimeBlock[];
  notes?: string;
  productivityScore?: number;
  createdAt: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  dataUrl?: string;
  linkedType?: 'task' | 'project' | 'note' | 'general';
  linkedId?: string;
  createdAt: string;
  uploadedAt?: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  category: 'daily' | 'weekly' | 'project' | 'study' | 'workout' | 'work';
  itemsCount: number;
  data: {
    tasks?: Partial<Task>[];
    events?: Partial<CalendarEvent>[];
    notes?: Partial<Note>[];
    habits?: Partial<Habit>[];
  };
  createdAt: string;
}

export type NotificationCategory =
  | 'task'
  | 'habit'
  | 'goal'
  | 'calendar'
  | 'daily_planner'
  | 'reminder'
  | 'deadline'
  | 'system';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationCategory;
  read: boolean;
  targetView?: string;
  timestamp: string;
  timeStr?: string;
  dateStr?: string;
  sourceId?: string;
}

export interface PomodoroSettings {
  focusDuration: number; // minutes
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  soundEnabled: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  reminders: boolean;
  habits: boolean;
  tasks: boolean;
  calendar: boolean;
  goals: boolean;
}

export interface UserSettings {
  theme: ThemeMode;
  persianDigits: boolean;
  calendarType: CalendarType;
  weekStartsOn: 'saturday' | 'monday' | 'sunday';
  pomodoro: PomodoroSettings;
  pomodoroFocusMinutes: number;
  pomodoroShortBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  soundVolume: number;
  soundEnabled: boolean;
  soundEffectsEnabled: boolean;
  notificationsEnabled: boolean;
  notificationPreferences?: NotificationPreferences;
  syncEnabled: boolean;
  lastSyncTime?: string;
  userName: string;
  userEmail?: string;
  userBio?: string;
  pinLock?: string;
  isFirstLaunch: boolean;
}

export type ActiveView =
  | 'dashboard'
  | 'tasks'
  | 'projects'
  | 'calendar'
  | 'daily_planner'
  | 'weekly_planner'
  | 'goals'
  | 'habits'
  | 'notes'
  | 'reminders'
  | 'pomodoro'
  | 'time_management'
  | 'reports'
  | 'files'
  | 'templates'
  | 'backup'
  | 'sync'
  | 'settings';
