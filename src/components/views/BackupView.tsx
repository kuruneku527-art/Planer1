import React, { useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { formatToJalali, toPersianDigits, toGregorianIsoDate } from '../../utils/jalali';
import {
  Download,
  Upload,
  HardDrive,
  AlertTriangle,
  RefreshCw,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export const BackupView: React.FC = () => {
  const { refreshTrigger, refreshDb, settings, showToast, showConfirm } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    return {
      tasks: db.getTasks().length,
      projects: db.getProjects().length,
      habits: db.getHabits().length,
      notes: db.getNotes().length,
      goals: db.getGoals().length,
      reminders: db.getReminders().length,
      files: db.getFiles().length,
    };
  }, [refreshTrigger]);

  const totalRecords = Object.values(stats).reduce((a: number, b: number) => a + b, 0);

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = db.exportDatabaseJSON();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planner_backup_${toGregorianIsoDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('فایل پشتیبان JSON با موفقیت دانلود شد.', 'success');
  };

  // Export CSV of Tasks
  const handleExportTasksCSV = () => {
    const tasks = db.getTasks();
    if (tasks.length === 0) {
      showToast('هیچ وظیفه‌ای برای دریافت خروجی اکسل/CSV وجود ندارد.', 'warning');
      return;
    }
    const headers = ['شناسه', 'عنوان', 'اولویت', 'وضعیت', 'سررسید', 'تاریخ_ایجاد'];
    const rows = tasks.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.priority,
      t.status,
      t.dueDate || '',
      t.createdAt,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planner_tasks_${toGregorianIsoDate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('خروجی CSV وظایف با موفقیت دانلود شد.', 'success');
  };

  // Import JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const success = db.importDatabaseJSON(jsonStr);
        if (success) {
          showToast('پایگاه داده با موفقیت از فایل پشتیبان بازیابی شد.', 'success');
          refreshDb();
        } else {
          showToast('ساختار فایل پشتیبان نامعتبر است.', 'error');
        }
      } catch (err) {
        showToast('خطا در پردازش فایل پشتیبان.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset database completely
  const handleResetDatabase = () => {
    showConfirm({
      title: 'پاکسازی و ریست کامل پایگاه داده',
      message:
        'هشدار: تمام اطلاعات شما شامل وظایف، پروژه‌ها، عادات، یادداشت‌ها و اهداف به طور دائمی پاک خواهند شد. آیا مطمئن هستید؟',
      onConfirm: () => {
        db.clearDatabase();
        showToast('پایگاه داده به حالت اولیه و خالی بازنشانی شد.', 'info');
        refreshDb();
      },
    });
  };

  return (
    <div id="backup-view" className="space-y-6 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <HardDrive className="w-6 h-6 text-purple-400" />
          <span>پشتیبان‌گیری، بازیابی و خروجی داده‌ها</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          مدیریت امنیت اطلاعات، دریافت نسخه پشتیبان آفلاین و ایمپورت/اکسپورت آسان
        </p>
      </div>

      {/* Database Statistics Card */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>خلاصه رکوردهای ذخیره‌شده در پایگاه داده محلی</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-center">
            <span className="text-xs text-slate-400">وظایف</span>
            <p className="text-xl font-bold text-slate-100 font-mono mt-1">
              {settings.persianDigits ? toPersianDigits(stats.tasks) : stats.tasks}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-center">
            <span className="text-xs text-slate-400">پروژه‌ها</span>
            <p className="text-xl font-bold text-slate-100 font-mono mt-1">
              {settings.persianDigits ? toPersianDigits(stats.projects) : stats.projects}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-center">
            <span className="text-xs text-slate-400">عادت‌ها</span>
            <p className="text-xl font-bold text-slate-100 font-mono mt-1">
              {settings.persianDigits ? toPersianDigits(stats.habits) : stats.habits}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-center">
            <span className="text-xs text-slate-400">یادداشت‌ها</span>
            <p className="text-xl font-bold text-slate-100 font-mono mt-1">
              {settings.persianDigits ? toPersianDigits(stats.notes) : stats.notes}
            </p>
          </div>
        </div>
      </div>

      {/* Export & Import Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Download className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-slate-100 text-sm">دریافت نسخه پشتیبان (Export)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mt-3">
              تمام اطلاعات و تنظیمات شما در قالب یک فایل استاندارد JSON ذخیره می‌شود تا در هر زمان بتوانید آن را بازیابی کنید.
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <button
              type="button"
              onClick={handleExportJSON}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-purple-950/40 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <FileJson className="w-4 h-4" />
              <span>دانلود فایل کامل پشتیبان (JSON)</span>
            </button>

            <button
              type="button"
              onClick={handleExportTasksCSV}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>خروجی جدول وظایف (اکسل / CSV)</span>
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Upload className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-slate-100 text-sm">بازیابی نسخه پشتیبان (Import)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mt-3">
              فایل پشتیبان JSON قبلی خود را انتخاب کنید تا تمامی سوابق به صورت خودکار به اپلیکیشن اضافه شوند.
            </p>
          </div>

          <div className="pt-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>انتخاب و بارگذاری فایل پشتیبان (JSON)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Clear Database */}
      <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-800/40 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <h3 className="font-bold text-rose-300 text-sm">منطقه حساس و پاکسازی داده‌ها</h3>
        </div>
        <p className="text-xs text-rose-300/80 leading-relaxed">
          در صورت نیاز به شروع مجدد از صفر، می‌توانید تمام داده‌های آزمایشی یا قبلی را با یک کلیک پاک کنید.
        </p>

        <button
          type="button"
          onClick={handleResetDatabase}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/50 transition cursor-pointer flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>پاکسازی تمام داده‌ها و ریست کامل</span>
        </button>
      </div>
    </div>
  );
};
