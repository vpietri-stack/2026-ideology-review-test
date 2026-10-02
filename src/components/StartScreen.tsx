import React, { useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Layers, Sparkles } from 'lucide-react';
import { ChapterData, ChapterProgress, FullBookProgress, QuizMode } from '../types';
import { QUIZ_RULES } from '../utils/quizUtils';

interface StartScreenProps {
  chapters: ChapterData[];
  initialMode: QuizMode | null;
  progressMap: Record<number, ChapterProgress>;
  fullProgress: FullBookProgress | null;
  onStart: (mode: QuizMode) => void;
}

const perChapter = QUIZ_RULES.single + QUIZ_RULES.multi + QUIZ_RULES.judge;

export const StartScreen: React.FC<StartScreenProps> = ({
  chapters,
  initialMode,
  progressMap,
  fullProgress,
  onStart,
}) => {
  const [selected, setSelected] = useState<QuizMode>(initialMode ?? 'chapter');

  const practicedChapters = Object.values(progressMap).filter((p) => p.completedTimes > 0).length;
  const fullTotal = chapters.length * perChapter;
  const bankSize = chapters.reduce(
    (sum, c) =>
      sum + c.singleQuestions.length + c.multiQuestions.length + c.judgeQuestions.length,
    0
  );

  const options: {
    mode: QuizMode;
    icon: React.ReactNode;
    title: string;
    meta: string;
    description: string;
  }[] = [
    {
      mode: 'chapter',
      icon: <BookOpen className="w-5 h-5" />,
      title: '章节模式',
      meta: `单章 ${perChapter} 题 · 100 分`,
      description: '每次只练一个章节，随机抽取 10 单选 + 5 多选 + 5 判断，可按章节切换。',
    },
    {
      mode: 'full',
      icon: <Layers className="w-5 h-5" />,
      title: '全书模式',
      meta: `${fullTotal} 题 · 按正确率计分`,
      description: `8 个章节同时练，每章随机抽 ${perChapter} 题共 ${fullTotal} 题，全部打乱顺序出题（第 1 题可能来自任意一章）。`,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900">
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12">
        {/* Title */}
        <div className="bg-gradient-to-br from-rose-900 via-rose-800 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-sm mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-rose-200 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-300" />
              <span>思想道德与法治 · 随机抽题自测</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold leading-snug">请选择练习模式</h1>
            <p className="mt-2 text-xs sm:text-sm text-rose-200/90 leading-relaxed">
              共 {chapters.length} 个章节、{bankSize} 道题库题目。两种模式的题目都从题库随机抽取，
              每次进入都是全新的一套。
            </p>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-white pointer-events-none">
            <BookOpen className="w-40 h-40" />
          </div>
        </div>

        {/* Mode options */}
        <div className="space-y-3">
          {options.map((option) => {
            const isActive = selected === option.mode;
            return (
              <button
                key={option.mode}
                type="button"
                id={`start-mode-${option.mode}`}
                onClick={() => setSelected(option.mode)}
                aria-pressed={isActive}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                  isActive
                    ? 'bg-white border-rose-300 ring-2 ring-rose-200 shadow-sm'
                    : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {option.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-base">{option.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        isActive ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {option.meta}
                    </span>
                    {isActive && (
                      <span className="ml-auto text-rose-600" aria-label="已选中">
                        <CheckCircle2 className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5 leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* History hints */}
        <div className="mt-5 grid grid-cols-2 gap-3 text-center">
          <div className="bg-white rounded-2xl border border-slate-200 p-3">
            <span className="text-[11px] text-slate-500 block">章节模式已练</span>
            <span className="text-lg font-bold text-slate-800">{practicedChapters} 章</span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-3">
            <span className="text-[11px] text-slate-500 block">全书模式最佳正确率</span>
            <span className="text-lg font-bold text-slate-800">
              {fullProgress ? `${fullProgress.bestScore}%` : '—'}
            </span>
          </div>
        </div>

        {/* Start */}
        <button
          type="button"
          id="start-quiz-btn"
          onClick={() => onStart(selected)}
          className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-2xl font-bold text-base shadow-sm shadow-rose-200 transition-all cursor-pointer"
        >
          <span>{selected === 'full' ? `开始全书自测 (${fullTotal} 题)` : '开始章节自测'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <footer className="mt-8 text-center text-xs text-slate-400 space-y-1">
          <p>思想道德与法治 · 8章随机抽题考核练习系统</p>
          <p className="text-[11px]">支持离线运行与微信/Safari浏览器访问 · GitHub Pages 纯静态友好</p>
        </footer>
      </main>
    </div>
  );
};
