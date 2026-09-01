import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings as SettingsIcon,
  User,
  Moon,
  Sun,
  Volume2,
  Bell,
  Timer,
  Hash,
  Save,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, showToast } = useApp();

  const [userName, setUserName] = useState(settings.userName || '');
  const [theme, setTheme] = useState(settings.theme || 'dark');

  React.useEffect(() => {
    setTheme(settings.theme || 'dark');
  }, [settings.theme]);
  const [persianDigits, setPersianDigits] = useState(settings.persianDigits ?? true);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(settings.soundEffectsEnabled ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled ?? true);
  const [pomodoroFocusMinutes, setPomodoroFocusMinutes] = useState(settings.pomodoroFocusMinutes || 25);
  const [pomodoroShortBreakMinutes, setPomodoroShortBreakMinutes] = useState(settings.pomodoroShortBreakMinutes || 5);
  const [pomodoroLongBreakMinutes, setPomodoroLongBreakMinutes] = useState(settings.pomodoroLongBreakMinutes || 15);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      userName,
      theme,
      persianDigits,
      soundEffectsEnabled,
      notificationsEnabled,
      pomodoroFocusMinutes: Number(pomodoroFocusMinutes),
      pomodoroShortBreakMinutes: Number(pomodoroShortBreakMinutes),
      pomodoroLongBreakMinutes: Number(pomodoroLongBreakMinutes),
    });
    showToast('تنظیمات با موفقیت ذخیره شد.', 'success');
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-purple-400" />
          <span>تنظیمات و شخصی‌سازی پلنر</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          تنظیم مشخصات کاربری، ترجیحات نمایش ارقام فارسی، صداها و تایمر تمرکز
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Theme & Appearance Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-sm">تم و حالت نمایشی (تاریک و روشن)</h3>
          </div>

          <p className="text-xs text-slate-400">
            تم مورد نظر خود را انتخاب کنید. تغییرات بلافاصله در تمام بخش‌های برنامه اعمال می‌شوند.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Dark Theme Option */}
            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                updateSettings({ theme: 'dark' });
              }}
              className={`p-4 rounded-xl border flex items-center gap-3.5 text-right transition cursor-pointer ${
                theme === 'dark'
                  ? 'bg-purple-950/70 border-purple-500 ring-2 ring-purple-500/50'
                  : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-purple-400 flex-shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-100">تم تاریک (Dark Mode)</span>
                  {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  پس‌زمینه تیره مناسب برای شب، استراحت چشم‌ها و مصرف بهینه باتری
                </p>
              </div>
            </button>

            {/* Light Theme Option */}
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                updateSettings({ theme: 'light' });
              }}
              className={`p-4 rounded-xl border flex items-center gap-3.5 text-right transition cursor-pointer ${
                theme === 'light'
                  ? 'bg-purple-950/70 border-purple-500 ring-2 ring-purple-500/50'
                  : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-100">تم روشن (Light Mode)</span>
                  {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  طراحی شفاف، خوانایی بالا در محیط‌های پرنور و کنتراست شفاف
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <User className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm">مشخصات کاربری</h3>
          </div>

          <div className="max-w-md">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              نام یا عنوان نمایشی شما
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="مثلاً: علی رضایی"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Display & Localization Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Hash className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-slate-100 text-sm">بومی‌سازی و ارقام</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 cursor-pointer">
              <div>
                <span className="text-sm font-bold text-slate-200 block">نمایش ارقام به صورت فارسی</span>
                <span className="text-xs text-slate-400">تبدیل خودکار تمامی اعداد، تاریخ‌ها و ساعت‌ها به حروف فارسی (۱۲۳۴۵۶۷۸۹۰)</span>
              </div>
              <input
                type="checkbox"
                checked={persianDigits}
                onChange={(e) => setPersianDigits(e.target.checked)}
                className="w-5 h-5 rounded text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 cursor-pointer">
              <div>
                <span className="text-sm font-bold text-slate-200 block">پخش افکت‌های صوتی</span>
                <span className="text-xs text-slate-400">پخش صدا هنگام اتمام تایمر پومودورو یا انجام تسک</span>
              </div>
              <input
                type="checkbox"
                checked={soundEffectsEnabled}
                onChange={(e) => setSoundEffectsEnabled(e.target.checked)}
                className="w-5 h-5 rounded text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500"
              />
            </label>
          </div>
        </div>

        {/* Pomodoro Timer Configuration */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Timer className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">پیکربندی زمان‌های پومودورو (دقیقه)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                مدت زمان تمرکز (دقیقه)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={pomodoroFocusMinutes}
                onChange={(e) => setPomodoroFocusMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                استراحت کوتاه (دقیقه)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={pomodoroShortBreakMinutes}
                onChange={(e) => setPomodoroShortBreakMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                استراحت بلند (دقیقه)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={pomodoroLongBreakMinutes}
                onChange={(e) => setPomodoroLongBreakMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md shadow-purple-950/40 transition cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره تنظیمات</span>
          </button>
        </div>
      </form>
    </div>
  );
};
