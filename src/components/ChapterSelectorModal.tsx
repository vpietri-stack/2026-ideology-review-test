import React from 'react';
import { X, CheckCircle2, Award, ChevronRight, BookOpen } from 'lucide-react';
import { ChapterData, ChapterProgress } from '../types';

interface ChapterSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterData[];
  currentChapterId: number;
  onSelectChapter: (chapterId: number) => void;
  progressMap: Record<number, ChapterProgress>;
}

export const ChapterSelectorModal: React.FC<ChapterSelectorModalProps> = ({
  isOpen,
  onClose,
  chapters,
  currentChapterId,
  onSelectChapter,
  progressMap,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="bg-white w-full max-w-xl rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">选择练习章节</h2>
              <p className="text-xs text-slate-500">共 8 个章节，点击立即开启抽题测验</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chapter List */}
        <div className="p-4 overflow-y-auto space-y-2.5 divide-y divide-slate-100">
          {chapters.map((chapter) => {
            const isCurrent = chapter.chapterId === currentChapterId;
            const progress = progressMap[chapter.chapterId];
            const hasCompleted = progress && progress.completedTimes > 0;

            return (
              <button
                key={chapter.chapterId}
                onClick={() => {
                  onSelectChapter(chapter.chapterId);
                  onClose();
                }}
                className={`w-full text-left pt-2.5 first:pt-0 p-3 rounded-xl transition-all flex items-center justify-between gap-3 border ${
                  isCurrent
                    ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-200 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${
                      isCurrent
                        ? 'bg-rose-600 text-white shadow-xs'
                        : hasCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {chapter.chapterId}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">
                        {chapter.title}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-medium">
                          当前章节
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>题库: 25单选 + 10多选 + 10判断</span>
                      {hasCompleted && (
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          最高 {progress.bestScore} 分 (已测{progress.completedTimes}次)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center text-slate-400">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <span>每次进入章节均会自动重新随机抽取 20 题</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 rounded-lg font-medium transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
