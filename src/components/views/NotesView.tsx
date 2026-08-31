import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Note } from '../../types';
import { formatToJalali, toPersianDigits } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit2,
  Tag,
  Calendar as CalendarIcon,
} from 'lucide-react';

export const NotesView: React.FC = () => {
  const { openQuickAdd, refreshTrigger, refreshDb, settings, showToast, showConfirm } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const allNotes = useMemo(() => db.getNotes(), [refreshTrigger]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allNotes.forEach((n) => n.tags.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [allNotes]);

  const filteredNotes = useMemo(() => {
    return allNotes
      .filter((note) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = note.title.toLowerCase().includes(q);
          const matchContent = note.content.toLowerCase().includes(q);
          const matchTag = note.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchContent && !matchTag) return false;
        }
        if (selectedTag !== 'all' && !note.tags.includes(selectedTag)) return false;
        return true;
      })
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [allNotes, searchQuery, selectedTag]);

  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    db.toggleNotePin(id);
    refreshDb();
  };

  const handleDeleteNote = (note: Note, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    showConfirm({
      title: 'حذف یادداشت',
      message: `آیا از حذف یادداشت «${note.title}» مطمئن هستید؟`,
      onConfirm: () => {
        db.deleteNote(note.id);
        showToast('یادداشت حذف شد.', 'info');
        refreshDb();
      },
    });
  };

  const handleUpdateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    db.saveNote({ ...editingNote, updatedAt: new Date().toISOString() });
    showToast('یادداشت با موفقیت به‌روزرسانی شد.', 'success');
    setEditingNote(null);
    refreshDb();
  };

  return (
    <div id="notes-view" className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-400" />
            <span>دفترچه یادداشت‌ها و ایده‌ها</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ثبت نکات، ایده‌های خلاقانه، چکیده‌ها و مستندسازی کارها
          </p>
        </div>

        <button
          type="button"
          onClick={() => openQuickAdd('note')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-purple-950/40 transition cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>یادداشت جدید</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان یا متن یادداشت‌ها..."
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedTag === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              همه
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTag(t)}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  selectedTag === t
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      {allNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="هنوز یادداشتی ایجاد نکرده‌اید"
          description="ایده‌ها، صورت‌جلسات، خلاصه کتاب‌ها یا فهرست‌های شخصی خود را ثبت کنید."
          actionText="ایجاد اولین یادداشت"
          onAction={() => openQuickAdd('note')}
        />
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-sm font-medium">یادداشتی با متن جستجو شده یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => setEditingNote(note)}
              className="p-5 rounded-2xl border border-slate-800 hover:border-purple-800/50 transition cursor-pointer flex flex-col justify-between group shadow-sm relative overflow-hidden"
              style={{ backgroundColor: note.color || '#1e293b' }}
            >
              <div>
                {/* Top Action Bar */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatToJalali(note.createdAt, 'date_only', settings.persianDigits)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleTogglePin(note.id, e)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        note.isPinned
                          ? 'text-amber-400 bg-amber-950/60'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title={note.isPinned ? 'برداشتن سنجاق' : 'سنجاق کردن به بالا'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteNote(note, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-100 text-base mb-2">{note.title}</h3>
                <p className="text-xs text-slate-300 whitespace-pre-wrap line-clamp-4 leading-relaxed font-sans">
                  {note.content}
                </p>
              </div>

              {/* Tags Footer */}
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-3 mt-3 border-t border-slate-800/60">
                  {note.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-900/60 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/40"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <Modal
          isOpen={true}
          onClose={() => setEditingNote(null)}
          title="ویرایش یادداشت"
          maxWidth="lg"
          icon={<Edit2 className="text-amber-400" />}
        >
          <form onSubmit={handleUpdateNote} className="space-y-4" dir="rtl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان یادداشت *</label>
              <input
                type="text"
                required
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">متن یادداشت</label>
              <textarea
                rows={6}
                value={editingNote.content}
                onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500 resize-none font-sans leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingNote(null)}
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
