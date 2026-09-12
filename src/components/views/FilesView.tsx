import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { FileAttachment } from '../../types';
import { formatToJalali, toPersianDigits } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';
import {
  Paperclip,
  Upload,
  File,
  Image as ImageIcon,
  Trash2,
  Download,
  Search,
} from 'lucide-react';

export const FilesView: React.FC = () => {
  const { refreshTrigger, refreshDb, settings, showToast, showConfirm } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const allFiles = useMemo(() => db.getFiles(), [refreshTrigger]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return allFiles;
    return allFiles.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allFiles, searchQuery]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: globalThis.File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
        const newAttachment: FileAttachment = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: base64Url,
          createdAt: new Date().toISOString(),
        };
        db.saveFile(newAttachment);
        refreshDb();
      };
      reader.readAsDataURL(file);
    });

    showToast('فایل(ها) با موفقیت آپلود و ذخیره شدند.', 'success');
  };

  const handleDeleteFile = (file: FileAttachment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    showConfirm({
      title: 'حذف فایل',
      message: `آیا از حذف فایل «${file.name}» اطمینان دارید؟`,
      onConfirm: () => {
        db.deleteFile(file.id);
        showToast('فایل حذف شد.', 'info');
        refreshDb();
      },
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div id="files-view" className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Paperclip className="w-6 h-6 text-purple-400" />
            <span>مدیریت فایل‌ها و پیوست‌ها</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            آپلود اسناد، مدارک، تصاویر و پیوست‌های مربوط به کارها به صورت ذخیره‌سازی محلی و امن
          </p>
        </div>

        {/* Upload Trigger Button */}
        <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-purple-950/40 transition cursor-pointer active:scale-98">
          <Upload className="w-4 h-4" />
          <span>آپلود فایل جدید</span>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در نام فایل‌های ذخیره‌شده..."
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>
      </div>

      {allFiles.length === 0 ? (
        <EmptyState
          icon={Paperclip}
          title="هنوز فایلی آپلود نشده است"
          description="اسناد، تصاویر یا فایل‌های مورد نیاز پروژه‌های خود را آپلود کنید تا همیشه در دسترس شما باشند."
          actionText="انتخاب و آپلود فایل"
          onAction={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.onchange = (e: any) => handleFileUpload(e);
            input.click();
          }}
        />
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-sm font-medium">فایلی با این نام یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => {
            const isImage = file.type.startsWith('image/');

            return (
              <div
                key={file.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-800/50 transition flex flex-col justify-between group shadow-sm overflow-hidden"
              >
                <div>
                  {/* Preview or Icon */}
                  {isImage && file.url ? (
                    <div className="h-32 rounded-xl overflow-hidden mb-3 bg-slate-950 border border-slate-800">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </div>
                  ) : (
                    <div className="h-32 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-center mb-3 text-purple-400">
                      <File className="w-12 h-12 stroke-[1.5]" />
                    </div>
                  )}

                  <h3 className="font-bold text-slate-100 text-xs truncate mb-1" title={file.name}>
                    {file.name}
                  </h3>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatToJalali(file.createdAt, 'date_only', settings.persianDigits)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800">
                  <a
                    href={file.url}
                    download={file.name}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition flex items-center gap-1 text-xs"
                    title="دانلود فایل"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود</span>
                  </a>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteFile(file, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="حذف فایل"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
