import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Task, Priority, TaskStatus } from '../../types';
import { formatToJalali, toPersianDigits } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Kanban,
  List,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  Trash2,
  Edit2,
  Tag,
  FolderKanban,
  Clock,
  ChevronDown,
  Check,
  AlignRight,
  Sparkles,
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const { openQuickAdd, refreshTrigger, refreshDb, settings, showToast, showConfirm } = useApp();

  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);

  // Queries
  const allTasks = useMemo(() => db.getTasks(), [refreshTrigger]);
  const allProjects = useMemo(() => db.getProjects(), [refreshTrigger]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        const matchTag = task.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTag) return false;
      }

      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterProject !== 'all') {
        if (filterProject === 'none' && task.projectId) return false;
        if (filterProject !== 'none' && task.projectId !== filterProject) return false;
      }

      return true;
    });
  }, [allTasks, searchQuery, filterPriority, filterStatus, filterProject]);

  const handleToggleTask = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    db.toggleTaskStatus(id);
    refreshDb();
    if (selectedTaskForDetail && selectedTaskForDetail.id === id) {
      const updated = db.getTask(id);
      setSelectedTaskForDetail(updated || null);
    }
  };

  const handleDeleteTask = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    showConfirm({
      title: 'حذف وظیفه',
      message: `آیا از حذف وظیفه «${task.title}» مطمئن هستید؟ این عملیات غیرقابل بازگشت است.`,
      onConfirm: () => {
        db.deleteTask(task.id);
        showToast('وظیفه با موفقیت حذف شد.', 'info');
        if (selectedTaskForDetail?.id === task.id) {
          setSelectedTaskForDetail(null);
        }
        refreshDb();
      },
    });
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    db.saveTask(editingTask);
    showToast('تغییرات وظیفه ذخیره شد.', 'success');
    if (selectedTaskForDetail?.id === editingTask.id) {
      setSelectedTaskForDetail(editingTask);
    }
    setEditingTask(null);
    refreshDb();
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const task = db.getTask(taskId);
    if (!task) return;
    const subtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    const updated = { ...task, subtasks };
    db.saveTask(updated);
    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail(updated);
    }
    refreshDb();
  };

  const kanbanColumns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'todo', title: 'انجام نشده', color: 'border-blue-500/50' },
    { id: 'in_progress', title: 'در حال انجام', color: 'border-purple-500/50' },
    { id: 'completed', title: 'تکمیل شده', color: 'border-emerald-500/50' },
  ];

  return (
    <div id="tasks-view" className="space-y-4 sm:space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            <span>مدیریت وظایف</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ایجاد، دسته‌بندی و اولویت‌بندی کارهای شخصی و پروژه‌ای
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>لیست</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'board' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>کانبان</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => openQuickAdd('task')}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-purple-950/40 transition cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>وظیفه جدید</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در وظایف..."
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {/* Priority */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="all">همه اولویت‌ها</option>
            <option value="urgent">بحرانی</option>
            <option value="high">زیاد</option>
            <option value="medium">متوسط</option>
            <option value="low">کم</option>
          </select>

          {/* Status */}
          {viewMode === 'list' && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="todo">انجام نشده</option>
              <option value="in_progress">در حال انجام</option>
              <option value="completed">تکمیل شده</option>
            </select>
          )}

          {/* Project */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="col-span-2 sm:col-span-1 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="all">همه پروژه‌ها</option>
            <option value="none">بدون پروژه</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content: List or Kanban */}
      {allTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="هنوز وظیفه‌ای ایجاد نشده است"
          description="کارهای روزمره، اهداف پروژه‌ای و تسک‌های خود را ثبت کنید تا هیچ کاری فراموش نشود."
          actionText="ایجاد اولین وظیفه"
          onAction={() => openQuickAdd('task')}
        />
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-10 sm:py-12 text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <Filter className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <p className="text-xs sm:text-sm font-medium">هیچ وظیفه‌ای با فیلترهای انتخابی مطابقت ندارد</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterPriority('all');
              setFilterStatus('all');
              setFilterProject('all');
            }}
            className="mt-2.5 text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
          >
            پاک کردن فیلترها
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="space-y-2 sm:space-y-2.5">
          {filteredTasks.map((task) => {
            const project = allProjects.find((p) => p.id === task.projectId);
            const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0;
            const totalSubtasks = task.subtasks?.length || 0;

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskForDetail(task)}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition group cursor-pointer ${
                  task.status === 'completed'
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
                    : 'bg-slate-900/90 border-slate-800 hover:border-purple-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleTask(task.id, e)}
                      className="mt-0.5 text-slate-400 hover:text-purple-400 transition cursor-pointer flex-shrink-0"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 group-hover:text-purple-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate ${
                            task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-100'
                          }`}
                        >
                          {task.title}
                        </h4>
                        <Badge priority={task.priority} size="sm" />
                        {project && (
                          <span
                            className="hidden sm:inline-flex text-[11px] px-2 py-0.5 rounded-md text-slate-300 font-medium items-center gap-1 border border-slate-700"
                            style={{ backgroundColor: `${project.color}15` }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                            <span>{project.name}</span>
                          </span>
                        )}
                      </div>

                      {/* Desktop Description */}
                      {task.description && (
                        <p className="hidden sm:block text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Subtasks Progress on Desktop */}
                      {totalSubtasks > 0 && (
                        <div className="hidden sm:block mt-2.5 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>چک‌لیست زیروظایف:</span>
                            <span>
                              {settings.persianDigits
                                ? `${toPersianDigits(completedSubtasks)} از ${toPersianDigits(totalSubtasks)}`
                                : `${completedSubtasks} of ${totalSubtasks}`}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-purple-500 h-full rounded-full transition-all"
                              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Tags & Dates */}
                      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-1.5 sm:mt-2.5 text-[11px] sm:text-xs text-slate-400">
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-purple-300">
                            <CalendarIcon className="w-3.5 h-3.5 text-purple-400" />
                            <span>
                              {formatToJalali(task.dueDate, 'date_only', settings.persianDigits)}
                            </span>
                          </div>
                        )}
                        {task.dueTime && (
                          <div className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{settings.persianDigits ? toPersianDigits(task.dueTime) : task.dueTime}</span>
                          </div>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="hidden sm:flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-amber-400" />
                            <div className="flex gap-1">
                              {task.tags.map((t, idx) => (
                                <span key={idx} className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {totalSubtasks > 0 && (
                          <span className="sm:hidden text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-purple-300">
                            {completedSubtasks}/{totalSubtasks} زیروظیفه
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTask(task);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition cursor-pointer"
                      title="ویرایش"
                    >
                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTask(task, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col min-h-[380px] sm:min-h-[450px]"
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between pb-2.5 sm:pb-3 mb-2.5 sm:mb-3 border-b-2 ${col.color}`}>
                  <h3 className="font-bold text-slate-100 text-xs sm:text-sm">{col.title}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold font-mono">
                    {settings.persianDigits ? toPersianDigits(colTasks.length) : colTasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex-1 space-y-2 sm:space-y-2.5 overflow-y-auto max-h-[600px]">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-600 text-xs">
                      هیچ وظیفه‌ای در این ستون نیست
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskForDetail(task)}
                        className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-purple-600/50 transition cursor-pointer group shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <Badge priority={task.priority} size="sm" />
                          <button
                            type="button"
                            onClick={(e) => handleToggleTask(task.id, e)}
                            className="text-slate-400 hover:text-purple-400 transition cursor-pointer"
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <h4 className="text-xs font-bold text-slate-100 leading-snug line-clamp-2">
                          {task.title}
                        </h4>

                        {task.dueDate && (
                          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3 text-purple-400" />
                            <span>{formatToJalali(task.dueDate, 'date_only', settings.persianDigits)}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail View Modal / Bottom Sheet */}
      {selectedTaskForDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTaskForDetail(null)}
          title="جزئیات وظیفه"
          maxWidth="lg"
          icon={<CheckSquare className="text-purple-400" />}
        >
          <div className="space-y-4" dir="rtl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleTask(selectedTaskForDetail.id)}
                  className="mt-0.5 text-slate-400 hover:text-purple-400 transition cursor-pointer"
                >
                  {selectedTaskForDetail.status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-500" />
                  )}
                </button>
                <div>
                  <h3
                    className={`text-base font-bold ${
                      selectedTaskForDetail.status === 'completed'
                        ? 'line-through text-slate-400'
                        : 'text-slate-100'
                    }`}
                  >
                    {selectedTaskForDetail.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge priority={selectedTaskForDetail.priority} />
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                      {selectedTaskForDetail.status === 'completed'
                        ? 'تکمیل شده'
                        : selectedTaskForDetail.status === 'in_progress'
                        ? 'در حال انجام'
                        : 'انجام نشده'}
                    </span>
                    {selectedTaskForDetail.projectId && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 text-xs font-medium border border-purple-800/40">
                        {allProjects.find((p) => p.id === selectedTaskForDetail.projectId)?.name || 'پروژه'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {selectedTaskForDetail.description && (
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <AlignRight className="w-3.5 h-3.5" />
                  <span>توضیحات</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedTaskForDetail.description}
                </p>
              </div>
            )}

            {/* Subtasks */}
            {selectedTaskForDetail.subtasks && selectedTaskForDetail.subtasks.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>زیروظایف و چک‌لیست:</span>
                  <span>
                    {selectedTaskForDetail.subtasks.filter((s) => s.completed).length} از{' '}
                    {selectedTaskForDetail.subtasks.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {selectedTaskForDetail.subtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => handleToggleSubtask(selectedTaskForDetail.id, st.id)}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800 transition cursor-pointer text-xs"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          st.completed
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'border-slate-600'
                        }`}
                      >
                        {st.completed && <Check className="w-3 h-3" />}
                      </div>
                      <span className={st.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dates and Tags */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              {selectedTaskForDetail.dueDate && (
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-[10px] text-slate-400">تاریخ سررسید</div>
                    <div>{formatToJalali(selectedTaskForDetail.dueDate, 'date_only', settings.persianDigits)}</div>
                  </div>
                </div>
              )}
              {selectedTaskForDetail.dueTime && (
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="text-[10px] text-slate-400">ساعت</div>
                    <div className="font-mono">
                      {settings.persianDigits
                        ? toPersianDigits(selectedTaskForDetail.dueTime)
                        : selectedTaskForDetail.dueTime}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedTaskForDetail.tags && selectedTaskForDetail.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedTaskForDetail.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const toDelete = selectedTaskForDetail;
                  handleDeleteTask(toDelete);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 text-xs font-medium transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف وظیفه</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForDetail(null)}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium cursor-pointer"
                >
                  بستن
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(selectedTaskForDetail);
                    setSelectedTaskForDetail(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>ویرایش</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <Modal
          isOpen={true}
          onClose={() => setEditingTask(null)}
          title="ویرایش وظیفه"
          maxWidth="lg"
          icon={<Edit2 className="text-purple-400" />}
        >
          <form onSubmit={handleUpdateTask} className="space-y-4" dir="rtl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان وظیفه *</label>
              <input
                type="text"
                required
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">وضعیت</label>
                <select
                  value={editingTask.status}
                  onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="todo">انجام نشده</option>
                  <option value="in_progress">در حال انجام</option>
                  <option value="completed">تکمیل شده</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اولویت</label>
                <select
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Priority })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="low">کم</option>
                  <option value="medium">متوسط</option>
                  <option value="high">زیاد</option>
                  <option value="urgent">بحرانی</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">تاریخ سررسید</label>
                <input
                  type="date"
                  value={editingTask.dueDate || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">پروژه</label>
                <select
                  value={editingTask.projectId || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, projectId: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="">بدون پروژه</option>
                  {allProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">توضیحات</label>
              <textarea
                rows={3}
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md shadow-purple-950/40 cursor-pointer"
              >
                ذخیره تغییرات
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
