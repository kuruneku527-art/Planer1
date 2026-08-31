import React from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { toGregorianIsoDate } from '../../utils/jalali';
import {
  BookmarkPlus,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Briefcase,
  Dumbbell,
  Laptop,
  Flame,
  ArrowLeft,
} from 'lucide-react';

interface PredefinedTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  tasks: { title: string; priority: 'urgent' | 'high' | 'medium' | 'low'; subtasks?: string[] }[];
  habits?: { title: string; timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime' }[];
}

export const TemplatesView: React.FC = () => {
  const { showToast, refreshDb, setActiveView } = useApp();

  const templates: PredefinedTemplate[] = [
    {
      id: 'morning_routine',
      title: 'روتین صبحگاهی پرانرژی و تمرکز',
      category: 'توسعه فردی',
      description: 'مجموعه کارهای اساسی برای شروع روز با انگیزه و نظم بالا',
      icon: Flame,
      color: '#f59e0b',
      tasks: [
        {
          title: 'نوشیدن یک لیوان آب و کشش بدنی',
          priority: 'medium',
          subtasks: ['نوشیدن آب ولرم', '۵ دقیقه نرمش سبک'],
        },
        {
          title: 'مرور ۳ اولویت اصلی روز در پلنر',
          priority: 'high',
        },
        {
          title: '۲۰ دقیقه مطالعه کتاب یا گوش دادن به پادکست',
          priority: 'medium',
        },
      ],
      habits: [
        { title: 'بیدار شدن قبل از ساعت ۷:۰۰', timeOfDay: 'morning' },
        { title: 'نرمش و مدیتیشن صبحگاهی', timeOfDay: 'morning' },
      ],
    },
    {
      id: 'project_kickoff',
      title: 'چک‌لیست راه‌اندازی پروژه کاری / استارتاپ',
      category: 'کسب‌وکار',
      description: 'ساختار استاندارد برای تعریف دامنه، مراحل فنی، اهداف و هماهنگی‌ها',
      icon: Laptop,
      color: '#8b5cf6',
      tasks: [
        {
          title: 'تعریف دقیق مسئله و شاخص‌های کلیدی موفقیت (KPIs)',
          priority: 'urgent',
        },
        {
          title: 'طراحی معماری سیستم و بررسی نیازمندی‌ها',
          priority: 'high',
          subtasks: ['تهیه مستندات فنی', 'انتخاب ابزارها و لایه‌ها'],
        },
        {
          title: 'برگزاری جلسه شروع پروژه با اعضای تیم',
          priority: 'high',
        },
        {
          title: 'تنظیم تسک‌های اسپرینت اول در کانبان',
          priority: 'medium',
        },
      ],
    },
    {
      id: 'study_sprint',
      title: 'برنامه مطالعه عمیق و آمادگی آزمون',
      category: 'آموزش و یادگیری',
      description: 'مدیریت سرفصل‌ها، خلاصه‌نویسی و آزمون‌های آزمایشی',
      icon: BookOpen,
      color: '#3b82f6',
      tasks: [
        {
          title: 'مطالعه فصل جدید با تکنیک پومودورو (۴ سشن)',
          priority: 'high',
        },
        {
          title: 'خلاصه‌نویسی نکات کلیدی در بخش یادداشت‌های پلنر',
          priority: 'medium',
        },
        {
          title: 'حل تست‌ها و تحلیل خطاهای پاسخ‌نامه',
          priority: 'high',
        },
      ],
      habits: [
        { title: 'مطالعه روزانه حداقل ۲ ساعت', timeOfDay: 'afternoon' },
        { title: 'مرور فلش‌کارت‌ها', timeOfDay: 'evening' },
      ],
    },
    {
      id: 'health_wellness',
      title: 'سبک زندگی سالم، تناسب اندام و ورزش',
      category: 'سلامت',
      description: 'پیگیری تمرینات ورزشی، نوشیدن آب و خواب منظم',
      icon: Dumbbell,
      color: '#10b981',
      tasks: [
        {
          title: 'جلسه تمرین ورزشی و هوازی (۴۵ دقیقه)',
          priority: 'high',
        },
        {
          title: 'برنامه‌ریزی وعده‌های غذایی سالم و مغذی',
          priority: 'medium',
        },
      ],
      habits: [
        { title: 'نوشیدن ۸ لیوان آب در طول روز', timeOfDay: 'anytime' },
        { title: 'پیاده‌روی روزانه ۴۰۰۰ قدم', timeOfDay: 'afternoon' },
        { title: 'خوابیدن قبل از ۱۱:۳۰ شب', timeOfDay: 'evening' },
      ],
    },
  ];

  const handleApplyTemplate = (template: PredefinedTemplate) => {
    const todayIso = toGregorianIsoDate();

    // Create a new Project for this template
    const projectId = `proj_tpl_${Date.now()}`;
    db.saveProject({
      id: projectId,
      name: template.title,
      description: template.description,
      color: template.color,
      icon: 'FolderKanban',
      startDate: todayIso,
      status: 'in_progress',
      priority: 'high',
      createdAt: new Date().toISOString(),
    });

    // Create Tasks
    template.tasks.forEach((t, idx) => {
      const subtasks = t.subtasks?.map((st, sIdx) => ({
        id: `st_${Date.now()}_${idx}_${sIdx}`,
        title: st,
        completed: false,
      })) || [];

      db.saveTask({
        id: `task_tpl_${Date.now()}_${idx}`,
        title: t.title,
        priority: t.priority,
        status: 'todo',
        dueDate: todayIso,
        projectId,
        tags: [],
        subtasks,
        repeat: 'none',
        createdAt: new Date().toISOString(),
      });
    });

    // Create Habits if any
    if (template.habits) {
      template.habits.forEach((h, idx) => {
        db.saveHabit({
          id: `habit_tpl_${Date.now()}_${idx}`,
          title: h.title,
          color: template.color,
          icon: 'Flame',
          targetDaysPerWeek: 7,
          targetDays: [0, 1, 2, 3, 4, 5, 6],
          timeOfDay: h.timeOfDay,
          createdAt: new Date().toISOString(),
        });
      });
    }

    refreshDb();
    showToast(`قالب «${template.title}» با موفقیت در پروژه‌ها و وظایف شما اعمال شد.`, 'success');
    setActiveView('projects');
  };

  return (
    <div id="templates-view" className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <BookmarkPlus className="w-6 h-6 text-purple-400" />
          <span>قالب‌های آماده برنامه‌ریزی (Templates)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          الگوهای استاندارد و حرفه‌ای برای راه‌اندازی سریع پروژه‌ها، روتین‌ها و برنامه‌های مطالعاتی
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <div
              key={tpl.id}
              className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-800/50 transition flex flex-col justify-between shadow-sm space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: tpl.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                    {tpl.category}
                  </span>
                </div>

                <h3 className="font-bold text-slate-100 text-base mb-1">{tpl.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{tpl.description}</p>

                {/* Preview Tasks Included */}
                <div className="space-y-1.5 pt-3 border-t border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400">آیتم‌های موجود در این قالب:</span>
                  {tpl.tasks.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                  {tpl.habits && tpl.habits.length > 0 && (
                    <div className="text-[11px] text-amber-400 pt-1">
                      + {tpl.habits.length} عادت پیشنهادی متصل
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-purple-950/40 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>اعمال این قالب به برنامه من</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
