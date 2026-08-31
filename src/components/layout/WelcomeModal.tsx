import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Sparkles, ArrowLeft, Check } from 'lucide-react';

export const WelcomeModal: React.FC = () => {
  const { settings, updateSettings, showToast } = useApp();
  const [name, setName] = useState('');
  const [step, setStep] = useState(1);

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
      icon={<Sparkles className="text-purple-400" />}
    >
      <div className="space-y-5 text-center" dir="rtl">
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-900/50">
              <Sparkles className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-100">کنترل کامل زمان و اهداف شما</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              پلنر یک سیستم جامع و آفلاین برای مدیریت وظایف، پروژه‌ها، عادات، تقویم خورشیدی، اهداف و تکنیک پومودورو است.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition shadow-lg shadow-purple-950/40 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>شروع شخصی‌سازی</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2 text-right">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                نام شما چیست؟
              </label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً: علی رضایی..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 text-xs text-purple-300">
              <p className="leading-relaxed">
                اطلاعات شما به صورت محلی و امن روی همین دستگاه ذخیره می‌شود و هیچ داده جعلی اولیه‌ای وجود ندارد تا بتوانید تقویم و برنامه‌تان را تمیز و واقعی بچینید.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition shadow-lg shadow-purple-950/40 cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>ورود به داشبورد</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
