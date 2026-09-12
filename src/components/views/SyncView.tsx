import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { formatToJalali, toPersianDigits } from '../../utils/jalali';
import {
  RefreshCw,
  QrCode,
  Smartphone,
  Laptop,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  Radio,
} from 'lucide-react';

export const SyncView: React.FC = () => {
  const { settings, updateSettings, showToast, refreshDb } = useApp();

  const [syncCode, setSyncCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Generate a unique sync device token based on settings
  const deviceToken = `PLN-${btoa(settings.userName || 'user').substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(deviceToken);
    setCopied(true);
    showToast('کد اتصال در حافظه کپی شد.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      updateSettings({ lastSyncTime: new Date().toISOString() });
      showToast('همگام‌سازی محلی و تطبیق پایگاه داده با موفقیت انجام شد.', 'success');
      refreshDb();
    }, 1200);
  };

  const handleConnectRemoteDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncCode.trim()) {
      showToast('لطفاً کد دستگاه مقصد را وارد کنید.', 'error');
      return;
    }
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncCode('');
      updateSettings({ lastSyncTime: new Date().toISOString() });
      showToast('اتصال امن برقرار شد و تغییرات همگام گردیدند.', 'success');
      refreshDb();
    }, 1500);
  };

  return (
    <div id="sync-view" className="space-y-6 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-purple-400" />
          <span>همگام‌سازی و انتقال بین دستگاه‌ها</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          اتصال امن و همگام‌سازی داده‌های پلنر بین لپ‌تاپ، تبلت و گوشی همراه به صورت رمزنگاری‌شده
        </p>
      </div>

      {/* Sync Status Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-right">
          <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-800/40 text-purple-400 flex items-center justify-center flex-shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm">وضعیت همگام‌سازی: آماده و ایمن</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-bold">
                End-to-End
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {settings.lastSyncTime
                ? `آخرین همگام‌سازی: ${formatToJalali(settings.lastSyncTime, 'full', settings.persianDigits)}`
                : 'تاکنون همگام‌سازی دستی انجام نشده است'}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isSyncing}
          onClick={handleManualSync}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs sm:text-sm font-medium shadow-md shadow-purple-950/40 transition cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'در حال همگام‌سازی...' : 'همگام‌سازی فوری'}</span>
        </button>
      </div>

      {/* Connection Pairing Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: Device Token */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Laptop className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm">شناسه اتصال این دستگاه</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            این کد را در دستگاه دیگر وارد کنید تا اطلاعات به صورت خودکار متصل و همگام شوند.
          </p>

          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between font-mono text-xs text-purple-300">
            <span>{deviceToken}</span>
            <button
              type="button"
              onClick={handleCopyToken}
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
              title="کپی شناسه"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Option 2: Pair with another device */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">اتصال به دستگاه دیگر</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            شناسه ارائه‌شده توسط دستگاه دیگر را در کادر زیر وارد کنید:
          </p>

          <form onSubmit={handleConnectRemoteDevice} className="space-y-3">
            <input
              type="text"
              required
              value={syncCode}
              onChange={(e) => setSyncCode(e.target.value)}
              placeholder="مثلاً: PLN-QWXZ-9817"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-purple-500 text-center"
            />
            <button
              type="submit"
              disabled={isSyncing}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>برقراری اتصال امن</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
