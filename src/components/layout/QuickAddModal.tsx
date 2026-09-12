import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Modal } from '../common/Modal';
import { Priority, RecurrenceType, GoalType, TimeCategory } from '../../types';
import { toGregorianIsoDate, toPersianDigits } from '../../utils/jalali';
import { PersianDatePicker, PersianTimePicker } from '../common/PersianDateTimePicker';
import { CustomSelect } from '../common/CustomSelect';
import { PrioritySelector } from '../common/PrioritySelector';
import { ProjectSelector } from '../common/ProjectSelector';
import { TimeOfDaySelector, TimeOfDayOption } from '../common/TimeOfDaySelector';
import {
  CheckSquare,
  Calendar as CalendarIcon,
  FolderKanban,
  Target,
  Flame,
  FileText,
  Bell,
  Plus,
  Minus,
  Hash,
  Check,
  Trash2,
} from 'lucide-react';

export const QuickAddModal: React.FC = () => {
  const { quickAddOpen, setQuickAddOpen, quickAddDefaultTab, quickAddInitialData, showToast, refreshDb, settings } = useApp();
  const [activeTab, setActiveTab] = useState(quickAddDefaultTab || 'task');

  // Form states
  // Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskDueDate, setTaskDueDate] = useState(toGregorianIsoDate());
  const [taskDueTime, setTaskDueTime] = useState('12:00');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskCategory, setTaskCategory] = useState('');
  const [taskTags, setTaskTags] = useState('');
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);

  useEffect(() => {
    if (quickAddOpen) {
      if (quickAddDefaultTab) {
        setActiveTab(quickAddDefaultTab);
      }
      if (quickAddInitialData) {
        if (quickAddInitialData.dueDate) setTaskDueDate(quickAddInitialData.dueDate);
        if (quickAddInitialData.projectId) setTaskProjectId(quickAddInitialData.projectId);
        if (quickAddInitialData.category) setTaskCategory(quickAddInitialData.category);
      }
      const allHabits = db.getHabits();
      const nextOrder = allHabits.length > 0 ? Math.max(...allHabits.map((h) => h.order || 1)) + 1 : 1;
      setHabitOrder(nextOrder);
    }
  }, [quickAddOpen, quickAddDefaultTab, quickAddInitialData]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Event
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState(toGregorianIsoDate());
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventLocation, setEventLocation] = useState('');
  const [eventColor, setEventColor] = useState('#8b5cf6');

  // Project
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectColor, setProjectColor] = useState('#8b5cf6');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [projectPriority, setProjectPriority] = useState<Priority>('medium');

  // Goal
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('short_term');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalMilestones, setGoalMilestones] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  // Habit
  const [habitTitle, setHabitTitle] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [habitColor, setHabitColor] = useState('#8b5cf6');
  const [habitTimeOfDay, setHabitTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('morning');
  const [habitTargetDays, setHabitTargetDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [habitOrder, setHabitOrder] = useState<number>(1);

  // Note
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('#1e293b');
  const [noteCategory, setNoteCategory] = useState('');
  const [noteTags, setNoteTags] = useState('');

  // Reminder
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState(toGregorianIsoDate());
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderType, setReminderType] = useState<RecurrenceType>('none');
  const [reminderPriority, setReminderPriority] = useState<Priority>('medium');

  // Inline Validation Errors
  const [taskTitleError, setTaskTitleError] = useState('');
  const [eventTitleError, setEventTitleError] = useState('');
  const [projectNameError, setProjectNameError] = useState('');
  const [goalTitleError, setGoalTitleError] = useState('');
  const [habitTitleError, setHabitTitleError] = useState('');
  const [noteTitleError, setNoteTitleError] = useState('');
  const [reminderTitleError, setReminderTitleError] = useState('');

  const existingProjects = db.getProjects();

  const resetForms = () => {
    setTaskTitle('');
    setTaskDesc('');
    setSubtasks([]);
    setTaskTags('');
    setEventTitle('');
    setEventDesc('');
    setProjectName('');
    setProjectDesc('');
    setGoalTitle('');
    setGoalDesc('');
    setGoalMilestones([]);
    setHabitTitle('');
    setHabitDesc('');
    setHabitColor('#8b5cf6');
    setHabitTimeOfDay('morning');
    setHabitTargetDays([0, 1, 2, 3, 4, 5, 6]);
    const allHabits = db.getHabits();
    const nextOrder = allHabits.length > 0 ? Math.max(...allHabits.map((h) => h.order || 1)) + 1 : 1;
    setHabitOrder(nextOrder);
    setNoteTitle('');
    setNoteContent('');
    setNoteTags('');
    setReminderTitle('');
    setTaskTitleError('');
    setEventTitleError('');
    setProjectNameError('');
    setGoalTitleError('');
    setHabitTitleError('');
    setNoteTitleError('');
    setReminderTitleError('');
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`, title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle('');
  };

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    setGoalMilestones((prev) => [
      ...prev,
      { id: `ms_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`, title: newMilestoneTitle.trim(), completed: false },
    ]);
    setNewMilestoneTitle('');
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setTaskTitleError('لطفاً عنوان وظیفه را وارد کنید.');
      return;
    }
    const tagsArray = taskTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    db.saveTask({
      id: `task_${Date.now()}`,
      title: taskTitle.trim(),
      description: taskDesc.trim() || undefined,
      priority: taskPriority,
      status: 'todo',
      dueDate: taskDueDate || undefined,
      dueTime: taskDueTime || undefined,
      projectId: taskProjectId || undefined,
      category: taskCategory.trim() || undefined,
      tags: tagsArray,
      subtasks,
      repeat: 'none',
      createdAt: new Date().toISOString(),
    });

    showToast('وظیفه جدید با موفقیت ذخیره شد.', 'success');
    resetForms();
    refreshDb();
    setQuickAddOpen(false);
  };

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      setEventTitleError('لطفاً عنوان رویداد را وارد کنید.');
      return;
    }
    if (!eventDate) {
      setEventTitleError('لطفاً تاریخ رویداد را مشخص کنید.');
      return;
    }
    db.saveEvent({
      id: `event_${Date.now()}`,
      title: eventTitle.trim(),
      description: eventDesc.trim() || undefined,
      startDate: eventDate,
      startTime: eventStartTime,
      endDate: eventDate,
      endTime: eventEndTime,
      isAllDay: false,
      color: eventColor,
      location: eventLocation.trim() || undefined,
      recurrence: 'none',
      createdAt: new Date().toISOString(),
    });

    showToast('رویداد جدید با موفقیت به تقویم اضافه شد.', 'success');
    resetForms();
    refreshDb();
    setQuickAddOpen(false);
  };

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setProjectNameError('لطفاً نام پروژه را وارد کنید.');
      return;
    }
    db.saveProject({
      id: `proj_${Date.now()}`,
      name: projectName.trim(),
      description: projectDesc.trim() || undefined,
      color: projectColor,
      icon: 'FolderKanban',
      startDate: toGregorianIsoDate(),
      deadline: projectDeadline || undefined,
      status: 'planning',
      priority: projectPriority,
      createdAt: new Date().toISOString(),
    });

    showToast('پروژه جدید با موفقیت تعریف شد.', 'success');
    resetForms();
    refreshDb();
    setQuickAddOpen(false);
  };

  const handleSubmitGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) {
      setGoalTitleError('لطفاً عنوان هدف را وارد کنید.');
      return;
    }
    db.saveGoal({
      id: `goal_${Date.now()}`,
      title: goalTitle.trim(),
      description: goalDesc.trim() || undefined,
      type: goalType,
      status: 'in_progress',
      targetDate: goalTargetDate || undefined,
      milestones: goalMilestones,
      linkedTasks: [],
      createdAt: new Date().toISOString(),
    });

    showToast('هدف جدید با موفقیت ثبت شد.', 'success');
    resetForms();
    refreshDb();
    setQuickAddOpen(false);
  };

  const handleSubmitHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) {
      setHabitTitleError('لطفاً عنوان عادت را وارد کنید.');
      return;
    }
    const days = habitTargetDays.length > 0 ? habitTargetDays : [0, 1, 2, 3, 4, 5, 6];
    db.saveHabit({
      id: `habit_${Date.now()}`,
      title: habitTitle.trim(),
      description: habitDesc.trim() || undefined,
      color: habitColor,
      icon: 'Flame',
      targetDaysPerWeek: days.length,
      targetDays: days,
      timeOfDay: habitTimeOfDay,
      order: Math.max(1, Number(habitOrder) || 1),
      createdAt: new Date().toISOString(),
    });

    showToast('عادت جدید با موفقیت ایجاد شد.', 'success');
    resetForms();
    refreshDb();
    setQuickAddOpen(false);
  };

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) {
      setNoteTitleError('لطفاً عنوان یادداشت را وارد کنید.');
      return;
    }
    const tagsArray = noteTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    db.saveNote({
      id: `note_${Date.now()}`,
      title: noteTitle.trim(),
      content: noteContent.trim(),
      color: noteColor,
      category: noteCategory.trim() || undefined,
      tags: tagsArray,
      isPinned: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    showToast('یادداشت جدید با موفقیت ذخیره شد.', 'success');
    resetForms();
    refreshDb();
    setQuickAddOpen(false);
  };

  const handleSubmitReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim()) {
      setReminderTitleError('لطفاً عنوان یادآور را وارد کنید.');
      return;
    }
    db.saveReminder({
      id: `rem_${Date.now()}`,
      title: reminderTitle.trim(),
      date: reminderDate,
      time: reminderTime,
      type: reminderType,
      isCompleted: false,
      priority: reminderPriority,
      createdAt: new Date().toISOString(),
    });

    showToast('یادآور جدید تنظیم شد.', 'success');
    resetForms();
    refreshDb();
    setQuickAddOpen(false);
  };

  const tabs = [
    { id: 'task', label: 'وظیفه', icon: CheckSquare },
    { id: 'event', label: 'رویداد', icon: CalendarIcon },
    { id: 'project', label: 'پروژه', icon: FolderKanban },
    { id: 'goal', label: 'هدف', icon: Target },
    { id: 'habit', label: 'عادت', icon: Flame },
    { id: 'note', label: 'یادداشت', icon: FileText },
    { id: 'reminder', label: 'یادآور', icon: Bell },
  ];

  const fieldInputClass =
    'h-11 w-full px-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-purple-500 transition';
  const labelClass = 'block text-xs font-semibold text-slate-300 mb-1.5';

  return (
    <Modal
      isOpen={quickAddOpen}
      onClose={() => setQuickAddOpen(false)}
      title="ایجاد سریع آیتم جدید"
      subtitle="آیتم مورد نظرتان را به سرعت به برنامه‌ریزی خود اضافه کنید"
      maxWidth="2xl"
    >
      <div className="space-y-5" dir="rtl">
        {/* Equal-sized Navigation Tabs on Desktop */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 p-1 rounded-2xl bg-slate-800/40 border border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-xs font-medium transition cursor-pointer w-full text-center ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Task */}
        {activeTab === 'task' && (
          <form onSubmit={handleSubmitTask} className="space-y-4">
            <div>
              <label className={labelClass}>عنوان وظیفه *</label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="مثلاً: طراحی اولیه صفحه اصلی..."
                className={fieldInputClass}
              />
            </div>

            <PrioritySelector
              value={taskPriority}
              onChange={setTaskPriority}
              label="اولویت وظیفه"
            />

            <ProjectSelector
              projects={existingProjects}
              value={taskProjectId}
              onChange={setTaskProjectId}
              label="پروژه مرتبط"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <PersianDatePicker
                label="تاریخ سررسید (مهلت)"
                value={taskDueDate}
                onChange={setTaskDueDate}
              />
              <PersianTimePicker
                label="ساعت مشخص"
                value={taskDueTime}
                onChange={setTaskDueTime}
              />
            </div>

            <div>
              <label className={labelClass}>توضیحات تکمیلی</label>
              <textarea
                rows={2}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="توضیحات و جزئیات انجام وظیفه..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-purple-500 transition resize-none"
              />
            </div>

            {/* Subtasks */}
            <div>
              <label className={labelClass}>زیر‌کارها (Checklist)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="افزودن زیروظیفه..."
                  className="h-10 flex-1 px-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="h-10 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن</span>
                </button>
              </div>

              {subtasks.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {subtasks.map((st, idx) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200"
                    >
                      <span>{st.title}</span>
                      <button
                        type="button"
                        onClick={() => setSubtasks(subtasks.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="h-11 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-purple-950/40 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت وظیفه</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Event */}
        {activeTab === 'event' && (
          <form onSubmit={handleSubmitEvent} className="space-y-4">
            <div>
              <label className={labelClass}>عنوان رویداد یا جلسه *</label>
              <input
                type="text"
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="مثلاً: جلسه هفتگی تیم محصول..."
                className={fieldInputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <PersianDatePicker
                label="تاریخ رویداد"
                value={eventDate}
                onChange={setEventDate}
                required
              />
              <PersianTimePicker
                label="ساعت شروع"
                value={eventStartTime}
                onChange={setEventStartTime}
                required
              />
              <PersianTimePicker
                label="ساعت پایان"
                value={eventEndTime}
                onChange={setEventEndTime}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={labelClass}>مکان یا لینک جلسه</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="اتاق جلسات / Google Meet / تلفنی..."
                  className={fieldInputClass}
                />
              </div>

              <div>
                <label className={labelClass}>رنگ رویداد</label>
                <div className="h-11 px-3.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                  {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEventColor(c)}
                      className={`w-6 h-6 rounded-full transition cursor-pointer ${
                        eventColor === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>توضیحات یا دستور جلسه</label>
              <textarea
                rows={2}
                value={eventDesc}
                onChange={(e) => setEventDesc(e.target.value)}
                placeholder="یادداشت‌ها و نکات مربوط به رویداد..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-purple-500 transition resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="h-11 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-purple-950/40 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>افزودن به تقویم</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Project */}
        {activeTab === 'project' && (
          <form onSubmit={handleSubmitProject} className="space-y-4">
            <div>
              <label className={labelClass}>نام پروژه *</label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="مثلاً: راه‌اندازی کمپین تبلیغاتی..."
                className={fieldInputClass}
              />
            </div>

            <div className="space-y-3.5">
              <PersianDatePicker
                label="مهلت پایان (Deadline)"
                value={projectDeadline}
                onChange={setProjectDeadline}
              />
              <PrioritySelector
                value={projectPriority}
                onChange={setProjectPriority}
                label="اولویت پروژه"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={labelClass}>رنگ مشخصه پروژه</label>
                <div className="h-11 px-3.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                  {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setProjectColor(c)}
                      className={`w-6 h-6 rounded-full transition cursor-pointer ${
                        projectColor === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>وضعیت اولیه</label>
                <div className="h-11 px-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs flex items-center justify-between">
                  <span>برنامه‌ریزی اولیه</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>توضیحات و اهداف پروژه</label>
              <textarea
                rows={2}
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="شرح کوتاه درباره پروژه..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="h-11 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-purple-950/40 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FolderKanban className="w-4 h-4" />
                <span>ایجاد پروژه</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Goal */}
        {activeTab === 'goal' && (
          <form onSubmit={handleSubmitGoal} className="space-y-4">
            <div>
              <label className={labelClass}>عنوان هدف *</label>
              <input
                type="text"
                required
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="مثلاً: مطالعه ۲۴ کتاب در سال..."
                className={fieldInputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <CustomSelect
                label="نوع هدف"
                value={goalType}
                onChange={(val) => setGoalType(val as GoalType)}
                options={[
                  { value: 'short_term', label: 'کوتاه‌مدت (ماهانه/فصلی)', description: 'اهداف فوری و دست‌یافتنی' },
                  { value: 'long_term', label: 'بلندمدت (سالانه/چند ساله)', description: 'اهداف استراتژیک و کلان' },
                ]}
              />
              <PersianDatePicker
                label="تاریخ تحقق مورد نظر"
                value={goalTargetDate}
                onChange={setGoalTargetDate}
              />
            </div>

            <div>
              <label className={labelClass}>توضیحات هدف</label>
              <textarea
                rows={2}
                value={goalDesc}
                onChange={(e) => setGoalDesc(e.target.value)}
                placeholder="علت انتخاب هدف و نتیجه مورد انتظار..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Milestones */}
            <div>
              <label className={labelClass}>نشانه‌های پیشرفت (Milestones)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMilestone();
                    }
                  }}
                  placeholder="افزودن مرحله..."
                  className="h-10 flex-1 px-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="h-10 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن</span>
                </button>
              </div>

              {goalMilestones.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {goalMilestones.map((ms, idx) => (
                    <div
                      key={ms.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200"
                    >
                      <span>{ms.title}</span>
                      <button
                        type="button"
                        onClick={() => setGoalMilestones(goalMilestones.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="h-11 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-purple-950/40 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Target className="w-4 h-4" />
                <span>ثبت هدف</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 5: Habit */}
        {activeTab === 'habit' && (
          <form onSubmit={handleSubmitHabit} className="space-y-4" dir="rtl">
            {/* Habit Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                عنوان عادت <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={habitTitle}
                onChange={(e) => {
                  setHabitTitle(e.target.value);
                  if (habitTitleError) setHabitTitleError('');
                }}
                placeholder="مثلاً: ۳۰ دقیقه ورزش و نرمش / خواندن کتاب / نوشیدن آب..."
                className={`w-full h-11 px-3.5 rounded-xl border text-xs sm:text-sm text-slate-100 bg-slate-800 focus:outline-none transition ${
                  habitTitleError ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-700 focus:border-purple-500'
                }`}
              />
              {habitTitleError && <p className="text-[11px] text-rose-400 mt-1 font-medium">{habitTitleError}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">توضیحات و انگیزه (اختیاری)</label>
              <input
                type="text"
                value={habitDesc}
                onChange={(e) => setHabitDesc(e.target.value)}
                placeholder="انگیزه یا یادداشت درباره نحوه انجام این عادت..."
                className="w-full h-10 px-3.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Time of Day - Beautiful App-styled Selector matching HabitsView */}
            <TimeOfDaySelector
              value={habitTimeOfDay as TimeOfDayOption}
              onChange={(val) => setHabitTimeOfDay(val)}
              label="بازه زمانی ترجیحی برای انجام"
            />

            {/* Numeric Priority Stepper */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-purple-400" />
                  <span>اولویت نمایش در لیست</span>
                </label>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-800/50 text-purple-300 font-bold">
                  اولویت {settings.persianDigits ? toPersianDigits(habitOrder || 1) : (habitOrder || 1)}
                  {habitOrder === 1 ? ' (بالاترین)' : ''}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setHabitOrder((prev) => Math.max(1, (Number(prev) || 1) - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
                  title="کاهش عدد اولویت (اولویت بالاتر)"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="relative flex-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="1"
                    step="1"
                    value={habitOrder}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setHabitOrder(isNaN(val) ? 1 : Math.max(1, val));
                    }}
                    placeholder="1"
                    className="w-full h-10 px-3 text-center rounded-xl border border-slate-700 bg-slate-900 text-sm font-bold text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setHabitOrder((prev) => (Number(prev) || 1) + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
                  title="افزایش عدد اولویت"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                عادت‌ها بر اساس عدد اولویت کمتر در بالای صفحه قرار می‌گیرند. عدد ۱ بالاترین اولویت است.
              </p>
            </div>

            {/* Target Days with Quick Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  روزهای تکرار در هفته <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setHabitTargetDays([0, 1, 2, 3, 4, 5, 6])}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 cursor-pointer text-[10px]"
                  >
                    همه روزها
                  </button>
                  <button
                    type="button"
                    onClick={() => setHabitTargetDays([0, 1, 2, 3, 4])}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer text-[10px]"
                  >
                    روزهای کاری
                  </button>
                  <button
                    type="button"
                    onClick={() => setHabitTargetDays([5, 6])}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer text-[10px]"
                  >
                    آخر هفته
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {[
                  { day: 0, label: 'ش', name: 'شنبه' },
                  { day: 1, label: 'ی', name: 'یکشنبه' },
                  { day: 2, label: 'د', name: 'دوشنبه' },
                  { day: 3, label: 'س', name: 'سه‌شنبه' },
                  { day: 4, label: 'چ', name: 'چهارشنبه' },
                  { day: 5, label: 'پ', name: 'پنج‌شنبه' },
                  { day: 6, label: 'ج', name: 'جمعه' },
                ].map((item) => {
                  const isSelected = habitTargetDays.includes(item.day);
                  return (
                    <button
                      key={item.day}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          if (habitTargetDays.length > 1) {
                            setHabitTargetDays(habitTargetDays.filter((d) => d !== item.day));
                          } else {
                            showToast('حداقل یک روز باید انتخاب شده باشد.', 'warning');
                          }
                        } else {
                          setHabitTargetDays([...habitTargetDays, item.day].sort());
                        }
                      }}
                      className={`h-10 rounded-xl text-xs font-bold transition cursor-pointer border flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm shadow-purple-950/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                      title={item.name}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                عادت فقط در روزهای انتخاب شده موعد انجام خواهد داشت و عدم انجام در سایر روزها زنجیره استمرار را قطع نمی‌کند.
              </p>
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">رنگ نشانه</label>
              <div className="flex items-center gap-3">
                {['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#06b6d4'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setHabitColor(c)}
                    className={`w-7 h-7 rounded-full transition cursor-pointer flex items-center justify-center ${
                      habitColor === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {habitColor === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-xs font-medium cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-950/50 cursor-pointer active:scale-98 flex items-center gap-1.5"
              >
                <Flame className="w-4 h-4" />
                <span>ثبت عادت</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 6: Note */}
        {activeTab === 'note' && (
          <form onSubmit={handleSubmitNote} className="space-y-4">
            <div>
              <label className={labelClass}>عنوان یادداشت *</label>
              <input
                type="text"
                required
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="عنوان یادداشت یا ایده..."
                className={fieldInputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={labelClass}>برچسب‌ها (با کاما جدا کنید)</label>
                <input
                  type="text"
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                  placeholder="ایده, کار, مطالعه..."
                  className={fieldInputClass}
                />
              </div>

              <div>
                <label className={labelClass}>رنگ پس‌زمینه کارت</label>
                <div className="h-11 px-3.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                  {['#1e293b', '#2e1065', '#0f172a', '#1e1b4b', '#064e3b', '#7c2d12'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNoteColor(c)}
                      className={`w-6 h-6 rounded-full border border-slate-600 transition cursor-pointer ${
                        noteColor === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>متن یادداشت</label>
              <textarea
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="ایده‌ها، نکات کلیدی، یادداشت‌های جلسه یا خلاصه کتاب..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="h-11 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-purple-950/40 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>ذخیره یادداشت</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 7: Reminder */}
        {activeTab === 'reminder' && (
          <form onSubmit={handleSubmitReminder} className="space-y-4">
            <div>
              <label className={labelClass}>عنوان یادآور *</label>
              <input
                type="text"
                required
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                placeholder="مثلاً: پرداخت قبض اینترنت / تماس با مشاور مالی..."
                className={fieldInputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <PersianDatePicker
                label="تاریخ یادآوری"
                value={reminderDate}
                onChange={setReminderDate}
                required
              />
              <PersianTimePicker
                label="ساعت یادآوری"
                value={reminderTime}
                onChange={setReminderTime}
                required
              />
            </div>

            <div className="space-y-3.5">
              <CustomSelect
                label="نوع تکرار"
                value={reminderType}
                onChange={(val) => setReminderType(val as RecurrenceType)}
                options={[
                  { value: 'none', label: 'یک‌بار مصرف', description: 'فقط در تاریخ و ساعت مشخص شده' },
                  { value: 'daily', label: 'روزانه', description: 'تکرار هر روز در ساعت معین' },
                  { value: 'weekly', label: 'هفتگی', description: 'تکرار هر هفته در همین روز' },
                  { value: 'monthly', label: 'ماهانه', description: 'تکرار در همین روز از ماه' },
                ]}
              />

              <PrioritySelector
                value={reminderPriority}
                onChange={setReminderPriority}
                label="اولویت یادآور"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                className="h-11 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-purple-950/40 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Bell className="w-4 h-4" />
                <span>ثبت یادآور</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
