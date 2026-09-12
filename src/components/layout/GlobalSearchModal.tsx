import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Modal } from '../common/Modal';
import { formatToJalali } from '../../utils/jalali';
import {
  Search,
  CheckSquare,
  FolderKanban,
  Target,
  Flame,
  FileText,
  Calendar as CalendarIcon,
  Bell,
  ArrowRight,
} from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const { globalSearchOpen, setGlobalSearchOpen, setActiveView, settings } = useApp();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (globalSearchOpen) {
      setQuery('');
      setFilterType('all');
    }
  }, [globalSearchOpen]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    return db.globalSearch(query);
  }, [query]);

  const handleSelectResult = (view: any) => {
    setActiveView(view);
    setGlobalSearchOpen(false);
  };

  const totalResultsCount = searchResults
    ? searchResults.tasks.length +
      searchResults.projects.length +
      searchResults.goals.length +
      searchResults.habits.length +
      searchResults.notes.length +
      searchResults.events.length +
      searchResults.reminders.length
    : 0;

  return (
    <Modal
      isOpen={globalSearchOpen}
      onClose={() => setGlobalSearchOpen(false)}
      title="جستجوی سراسری"
      subtitle="در تمام وظایف، پروژه‌ها، یادداشت‌ها، اهداف و تقویم جستجو کنید"
      maxWidth="2xl"
    >
      <div className="space-y-4" dir="rtl">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="عبارت مورد نظر خود را تایپ کنید..."
            className="w-full pl-4 pr-11 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-purple-500 transition shadow-inner"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'همه' },
            { id: 'tasks', label: 'وظایف' },
            { id: 'projects', label: 'پروژه‌ها' },
            { id: 'notes', label: 'یادداشت‌ها' },
            { id: 'goals', label: 'اهداف' },
            { id: 'events', label: 'تقویم' },
            { id: 'reminders', label: 'یادآورها' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                filterType === f.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="max-h-[380px] overflow-y-auto space-y-3 pt-2">
          {!query.trim() && (
            <div className="text-center py-10 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-2 text-slate-700" />
              <p className="text-sm">برای شروع جستجو، متنی را تایپ کنید.</p>
              <p className="text-xs text-slate-500 mt-1">کلید میانبر Ctrl + K برای دسترسی سریع</p>
            </div>
          )}

          {query.trim() && totalResultsCount === 0 && (
            <div className="text-center py-10 text-slate-400">
              <p className="text-sm font-medium text-slate-300">موردی یافت نشد</p>
              <p className="text-xs text-slate-500 mt-1">
                هیچ نتیجه‌ای متناسب با «{query}» در پایگاه داده وجود ندارد.
              </p>
            </div>
          )}

          {searchResults && (
            <div className="space-y-4">
              {/* Tasks */}
              {(filterType === 'all' || filterType === 'tasks') && searchResults.tasks.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 px-1 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>وظایف ({searchResults.tasks.length})</span>
                  </h4>
                  {searchResults.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleSelectResult('tasks')}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 transition cursor-pointer"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-200">{task.title}</div>
                        {task.dueDate && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            سررسید: {formatToJalali(task.dueDate, 'date_only', settings.persianDigits)}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {(filterType === 'all' || filterType === 'projects') && searchResults.projects.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 px-1 flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
                    <span>پروژه‌ها ({searchResults.projects.length})</span>
                  </h4>
                  {searchResults.projects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => handleSelectResult('projects')}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: proj.color }} />
                        <div className="text-sm font-medium text-slate-200">{proj.name}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              {(filterType === 'all' || filterType === 'notes') && searchResults.notes.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 px-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>یادداشت‌ها ({searchResults.notes.length})</span>
                  </h4>
                  {searchResults.notes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => handleSelectResult('notes')}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 transition cursor-pointer"
                    >
                      <div className="truncate max-w-[85%]">
                        <div className="text-sm font-medium text-slate-200 truncate">{note.title}</div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">{note.content}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Goals */}
              {(filterType === 'all' || filterType === 'goals') && searchResults.goals.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 px-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    <span>اهداف ({searchResults.goals.length})</span>
                  </h4>
                  {searchResults.goals.map((g) => (
                    <div
                      key={g.id}
                      onClick={() => handleSelectResult('goals')}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 transition cursor-pointer"
                    >
                      <div className="text-sm font-medium text-slate-200">{g.title}</div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Habits */}
              {(filterType === 'all' || filterType === 'habits') && searchResults.habits.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 px-1 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>عادت‌ها ({searchResults.habits.length})</span>
                  </h4>
                  {searchResults.habits.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => handleSelectResult('habits')}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 transition cursor-pointer"
                    >
                      <div className="text-sm font-medium text-slate-200">{h.title}</div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Calendar Events */}
              {(filterType === 'all' || filterType === 'events') && searchResults.events.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 px-1 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>رویدادهای تقویم ({searchResults.events.length})</span>
                  </h4>
                  {searchResults.events.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => handleSelectResult('calendar')}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 transition cursor-pointer"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-200">{e.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {formatToJalali(e.startDate, 'weekday_date', settings.persianDigits)} — {e.startTime}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Reminders */}
              {(filterType === 'all' || filterType === 'reminders') && searchResults.reminders.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 px-1 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    <span>یادآورها ({searchResults.reminders.length})</span>
                  </h4>
                  {searchResults.reminders.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleSelectResult('reminders')}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 transition cursor-pointer"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-200">{r.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{r.time}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
