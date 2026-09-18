import React from 'react';
import { BookOpen, Award, RotateCcw, ListFilter, AlertCircle, ChevronRight } from 'lucide-react';
import { ChapterData } from '../types';

interface HeaderProps {
  currentChapter: ChapterData;
  totalChapters: number;
  onOpenChapterSelector: () => void;
  onOpenWrongBook: () => void;
  onOpenQuickNav: () => void;
  onRedraw: () => void;
  answeredCount: number;
  totalQuestions: number;
  isSubmitted: boolean;
  score?: number;
  wrongCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentChapter,
  totalChapters,
  onOpenChapterSelector,
  onOpenWrongBook,
  onOpenQuickNav,
  onRedraw,
  answeredCount,
  totalQuestions,
  isSubmitted,
  score,
  wrongCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-3xl mx-auto px-4 py-2.5">
        {/* Top bar: title and main actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Chapter Selector Pill */}
          <button
            id="chapter-selector-btn"
            onClick={onOpenChapterSelector}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-800 rounded-full text-xs font-semibold transition-colors border border-rose-200/80 cursor-pointer text-left"
            title="点击切换章节"
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0 text-rose-700" />
            <span className="truncate max-w-[170px] sm:max-w-[260px]">
              第 {currentChapter.chapterId} / {totalChapters} 章
            </span>
            <ChevronRight className="w-3 h-3 text-rose-500 shrink-0" />
          </button>

          {/* Action buttons on right */}
          <div className="flex items-center gap-1.5">
            {/* Redraw random button */}
            <button
              id="redraw-btn"
              onClick={onRedraw}
              className="flex items-center gap-1 py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="重新随机抽取本章20题"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">重新抽题</span>
            </button>

            {/* Wrong Question Bank */}
            <button
              id="wrong-bank-btn"
              onClick={onOpenWrongBook}
              className="flex items-center gap-1 py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 rounded-lg text-xs font-medium transition-colors border border-amber-200/70 cursor-pointer"
              title="查看错题本"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">错题本</span>
              {wrongCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                  {wrongCount}
                </span>
              )}
            </button>

            {/* Quick Nav Drawer Button */}
            <button
              id="quick-nav-btn"
              onClick={onOpenQuickNav}
              className="flex items-center gap-1 py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="题号速览"
            >
              <ListFilter className="w-3.5 h-3.5 text-slate-600" />
              <span>{isSubmitted ? '题卡' : `${answeredCount}/${totalQuestions}`}</span>
            </button>
          </div>
        </div>

        {/* Chapter Title Bar */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {currentChapter.title}
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
              <span>随机抽选: 10单选 + 5多选 + 5判断 (共20题)</span>
              {isSubmitted && score !== undefined && (
                <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-sm">
                  <Award className="w-3 h-3" />
                  本次得分: {score}分
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Answer Progress bar (before submission) */}
        {!isSubmitted && (
          <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>
        )}
      </div>
    </header>
  );
};
