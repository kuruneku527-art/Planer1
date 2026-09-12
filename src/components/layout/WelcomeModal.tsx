import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Sparkles, ArrowLeft, Check, User, ShieldCheck } from 'lucide-react';

export const WelcomeModal: React.FC = () => {
  const { settings, updateSettings, showToast } = useApp();
  const [name, setName] = useState('');
  const [step, setStep] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [step]);

  if (!settings.isFirstLaunch) return null;

  const handleFinish = () => {
    updateSettings({
      userName: name.trim() || 'کاربر گرامی',
      isFirstLaunch: false,
    });
    showToast(`به پلنر خوش آمدید، ${name.trim() || 'کاربر گرامی'}!`, 'success');
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => updateSettings({ isFirstLaunch: false })}
      title="به پلنر خوش آمدید"
      subtitle="برنامه‌ریزی هوشمند، زندگی بهتر"
      maxWidth="md"
      position="center"
      icon={<Sparkles className="text-purple-400" />}
    >
      <div className="space-y-5 text-center" dir="rtl">
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden bg-slate-950 border border-purple-500/40 shadow-xl shadow-purple-900/50 flex items-center justify-center">
              <img
                src="/logo.jpg"
                alt="لوگوی پلنر"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <h3 className="text-lg font-bold text-slate-100">کنترل کامل زمان و اهداف شما</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              پلنر یک سیستم جامع و آفلاین برای مدیریت وظایف، پروژه‌ها، عادات، تقویم خورشیدی، اهداف و تکنیک پومودورو است.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition shadow-lg shadow-purple-950/40 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <span>شروع شخصی‌سازی</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFinish();
            }}
            className="space-y-4 py-2 text-right"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>نام یا عنوان نمایشی شما چیست؟</span>
                <span className="text-[10px] text-purple-400 font-normal">شخصی‌سازی فضای برنامه</span>
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={(e) => {
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 200);
                  }}
                  placeholder="مثلاً: علی رضایی..."
                  className="w-full h-12 px-4 pr-11 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition shadow-inner"
                />
                <User className="w-5 h-5 text-purple-400 absolute top-3.5 right-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                اطلاعات شما به صورت کاملاً محلی و امن روی دستگاه ذخیره می‌شود. هیچ داده جعلی پیش‌فرضی ثبت نشده تا تقویم و برنامه‌تان را دقیق و واقعی بچینید.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                بازگشت
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition shadow-lg shadow-purple-950/50 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <Check className="w-4 h-4" />
                <span>ورود به داشبورد</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
