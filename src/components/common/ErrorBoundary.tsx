import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Planner ErrorBoundary Caught Runtime Exception]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const text = `خطای پلنر هوشمند:\nپیام: ${error?.message || 'نامشخص'}\nکد: ${error?.stack || ''}\nپشته کامپوننت: ${errorInfo?.componentStack || ''}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 3000);
      });
    }
  };

  public render() {
    if (this.state.hasError) {
      const { error, copied, showDetails } = this.state;

      return (
        <div
          id="planner-error-boundary-screen"
          dir="rtl"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100 font-sans select-none overflow-y-auto"
          style={{ minHeight: '100dvh' }}
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
            {/* Warning Icon with Glow */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-100 mb-2">
              مشکلی در اجرای پلنر رخ داد
            </h1>

            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              نگران نباشید؛ تمام اطلاعات، وظایف و برنامه‌ریزی‌های شما کاملاً محفوظ و ایمن هستند.
            </p>

            {/* Error Message Box */}
            <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 mb-5 text-right overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>پیام خطا:</span>
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !showDetails })}
                  className="text-purple-400 hover:text-purple-300 transition text-xs cursor-pointer"
                >
                  {showDetails ? 'مخفی کردن جزئیات' : 'مشاهده جزئیات فنی'}
                </button>
              </div>
              <p className="text-xs text-rose-400 font-mono break-words select-text">
                {error?.message || 'خطای نامشخص در رندرینگ کامپوننت‌ها'}
              </p>

              {showDetails && error?.stack && (
                <pre className="mt-2 text-[10px] text-slate-400 font-mono overflow-x-auto max-h-40 p-2 bg-slate-900 rounded-lg select-text text-left ltr">
                  {error.stack}
                </pre>
              )}
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                id="error-boundary-retry-btn"
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-purple-900/30 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                تلاش مجدد
              </button>

              <button
                type="button"
                id="error-boundary-reload-btn"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer border border-slate-700 active:scale-95"
              >
                بارگذاری صفحه
              </button>
            </div>

            <button
              type="button"
              onClick={this.handleCopyError}
              className="mt-4 text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">متن خطا کپی شد</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی متن خطا برای گزارش</span>
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
