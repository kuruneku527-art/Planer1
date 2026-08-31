import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Project, Priority, ProjectStatus } from '../../types';
import { formatToJalali, toPersianDigits } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  FolderKanban,
  Plus,
  Search,
  CheckCircle2,
  Calendar as CalendarIcon,
  Trash2,
  Edit2,
  CheckSquare,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const { openQuickAdd, refreshTrigger, refreshDb, settings, showToast, showConfirm, setActiveView } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const allProjects = useMemo(() => db.getProjects(), [refreshTrigger]);
  const allTasks = useMemo(() => db.getTasks(), [refreshTrigger]);

  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      return true;
    });
  }, [allProjects, searchQuery, filterStatus]);

  const handleDeleteProject = (proj: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    showConfirm({
      title: 'حذف پروژه',
      message: `آیا از حذف پروژه «${proj.name}» اطمینان دارید؟ وظایف مرتبط حفظ خواهند شد اما از این پروژه جدا می‌شوند.`,
      onConfirm: () => {
        db.deleteProject(proj.id);
        if (selectedProject?.id === proj.id) setSelectedProject(null);
        showToast('پروژه با موفقیت حذف شد.', 'info');
        refreshDb();
      },
    });
  };

  const handleUpdateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    db.saveProject(editingProject);
    showToast('اطلاعات پروژه به‌روزرسانی شد.', 'success');
    if (selectedProject?.id === editingProject.id) {
      setSelectedProject(editingProject);
    }
    setEditingProject(null);
    refreshDb();
  };

  return (
    <div id="projects-view" className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-indigo-400" />
            <span>پروژه‌ها و مدیریت عملیات</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            سازماندهی وظایف در قالب پروژه‌های ساختاریافته و پیگیری درصد پیشرفت
          </p>
        </div>

        <button
          type="button"
          onClick={() => openQuickAdd('project')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-purple-950/40 transition cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>پروژه جدید</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در نام و مشخصات پروژه..."
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="planning">در حال برنامه‌ریزی</option>
          <option value="in_progress">در حال اجرا</option>
          <option value="on_hold">متوقف شده</option>
          <option value="completed">تکمیل شده</option>
        </select>
      </div>

      {/* Project Cards Grid */}
      {allProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="هنوز پروژه‌ای ثبت نشده است"
          description="پروژه‌های کاری، شخصی، تیمی یا تحصیلی خود را دسته‌بندی و مرحله‌بندی کنید."
          actionText="ایجاد اولین پروژه"
          onAction={() => openQuickAdd('project')}
        />
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-sm font-medium">پروژه‌ای با فیلترهای انتخابی یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const projectTasks = allTasks.filter((t) => t.projectId === project.id);
            const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
            const progress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

            const statusLabels: Record<ProjectStatus, { text: string; color: string }> = {
              planning: { text: 'برنامه‌ریزی', color: 'bg-blue-950 text-blue-300 border-blue-800/40' },
              in_progress: { text: 'در حال اجرا', color: 'bg-purple-950 text-purple-300 border-purple-800/40' },
              on_hold: { text: 'متوقف', color: 'bg-amber-950 text-amber-300 border-amber-800/40' },
              completed: { text: 'تکمیل شده', color: 'bg-emerald-950 text-emerald-300 border-emerald-800/40' },
              cancelled: { text: 'لغو شده', color: 'bg-rose-950 text-rose-300 border-rose-800/40' },
              archived: { text: 'بایگانی‌شده', color: 'bg-slate-800 text-slate-400 border-slate-700/40' },
            };

            const currentStatus = statusLabels[project.status];

            return (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-800/50 transition cursor-pointer flex flex-col justify-between group shadow-sm"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color || '#8b5cf6' }}
                      />
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${currentStatus.color}`}>
                        {currentStatus.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(project);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProject(project, e)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-100 text-base mb-1 group-hover:text-purple-300 transition">
                    {project.name}
                  </h3>

                  {project.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>پیشرفت وظایف:</span>
                      <span className="font-bold text-slate-200 font-mono">
                        {settings.persianDigits ? toPersianDigits(progress) : progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: project.color || '#8b5cf6',
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Tasks count & Deadline */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <CheckSquare className="w-3 h-3 text-purple-400" />
                      <span>
                        {settings.persianDigits
                          ? `${toPersianDigits(completedCount)} از ${toPersianDigits(projectTasks.length)}`
                          : `${completedCount} / ${projectTasks.length}`}{' '}
                        وظیفه
                      </span>
                    </div>

                    {project.deadline && (
                      <div className="flex items-center gap-1 font-mono">
                        <CalendarIcon className="w-3 h-3 text-indigo-400" />
                        <span>{formatToJalali(project.deadline, 'date_only', settings.persianDigits)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedProject(null)}
          title={`پروژه: ${selectedProject.name}`}
          maxWidth="2xl"
          icon={<FolderKanban className="text-indigo-400" />}
        >
          <div className="space-y-5" dir="rtl">
            {selectedProject.description && (
              <p className="text-xs text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 leading-relaxed">
                {selectedProject.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-purple-400" />
                <span>وظایف این پروژه</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setSelectedProject(null);
                  openQuickAdd('task');
                }}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
              >
                + افزودن وظیفه جدید به این پروژه
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allTasks.filter((t) => t.projectId === selectedProject.id).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  هنوز هیچ وظیفه‌ای به این پروژه اختصاص داده نشده است.
                </p>
              ) : (
                allTasks
                  .filter((t) => t.projectId === selectedProject.id)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs"
                    >
                      <span className={task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}>
                        {task.title}
                      </span>
                      <Badge priority={task.priority} size="sm" />
                    </div>
                  ))
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <Modal
          isOpen={true}
          onClose={() => setEditingProject(null)}
          title="ویرایش پروژه"
          maxWidth="md"
          icon={<Edit2 className="text-indigo-400" />}
        >
          <form onSubmit={handleUpdateProject} className="space-y-4" dir="rtl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">نام پروژه *</label>
              <input
                type="text"
                required
                value={editingProject.name}
                onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">وضعیت</label>
                <select
                  value={editingProject.status}
                  onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as ProjectStatus })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="planning">برنامه‌ریزی</option>
                  <option value="in_progress">در حال اجرا</option>
                  <option value="on_hold">متوقف</option>
                  <option value="completed">تکمیل شده</option>
                  <option value="cancelled">لغو شده</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">مهلت (Deadline)</label>
                <input
                  type="date"
                  value={editingProject.deadline || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, deadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">توضیحات</label>
              <textarea
                rows={3}
                value={editingProject.description || ''}
                onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingProject(null)}
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
