import React from 'react';
import { Award, ArrowRight, RotateCcw, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

interface ScoreResultBannerProps {
  score: number;
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  singleCorrect: number;
  multiCorrect: number;
  judgeCorrect: number;
  activeFilter: 'all' | 'wrong' | 'correct';
  onChangeFilter: (filter: 'all' | 'wrong' | 'correct') => void;
  onNextChapter: () => void;
  onRedrawChapter: () => void;
  hasNextChapter: boolean;
  currentChapterId: number;
}

export const ScoreResultBanner: React.FC<ScoreResultBannerProps> = ({
  score,
  totalScore,
  correctCount,
  totalQuestions,
  singleCorrect,
  multiCorrect,
  judgeCorrect,
  activeFilter,
  onChangeFilter,
  onNextChapter,
  onRedrawChapter,
  hasNextChapter,
  currentChapterId,
}) => {
  const wrongCount = totalQuestions - correctCount;

  // Grade classification
  const getGrade = () => {
    if (score >= 90) return { text: '成绩优异', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
    if (score >= 80) return { text: '成绩良好', color: 'text-blue-700 bg-blue-100 border-blue-300' };
    if (score >= 60) return { text: '考核及格', color: 'text-amber-700 bg-amber-100 border-amber-300' };
    return { text: '还需努力', color: 'text-rose-700 bg-rose-100 border-rose-300' };
  };

  const grade = getGrade();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-6 overflow-hidden relative">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500" />

      {/* Main Score & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
        {/* Left: Big Score */}
        <div className="flex items-center gap-4 text-center sm:text-left w-full sm:w-auto justify-center sm:justify-start">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col items-center justify-center shrink-0 shadow-xs">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 leading-none">
              {score}
            </span>
            <span className="text-[11px] font-semibold text-rose-400 mt-0.5">
              满分 {totalScore}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                测验已完成
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${grade.color}`}>
                {grade.text}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              共答对 <strong className="text-emerald-600">{correctCount}</strong> 题，做错{' '}
              <strong className="text-rose-600">{wrongCount}</strong> 题
            </p>
          </div>
        </div>

        {/* Middle: Type breakdown */}
        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 block">单选题 (10题)</span>
            <span className="text-sm font-bold text-slate-800">
              {singleCorrect}/10
            </span>
            <span className="text-[10px] text-slate-400 block">{singleCorrect * 5}分</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 block">多选题 (5题)</span>
            <span className="text-sm font-bold text-slate-800">
              {multiCorrect}/5
            </span>
            <span className="text-[10px] text-slate-400 block">{multiCorrect * 5}分</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 block">判断题 (5题)</span>
            <span className="text-sm font-bold text-slate-800">
              {judgeCorrect}/5
            </span>
            <span className="text-[10px] text-slate-400 block">{judgeCorrect * 5}分</span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Next Chapter / Redraw */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {hasNextChapter ? (
            <button
              id="next-chapter-btn"
              onClick={onNextChapter}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-rose-200 cursor-pointer"
            >
              <span>进入下一章 (第{currentChapterId + 1}章)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onNextChapter}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              <span>已学完最后一章，回到第1章</span>
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            id="redraw-current-chapter-btn"
            onClick={onRedrawChapter}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            title="重新从题库中随机抽取本章20题"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>再做一组</span>
          </button>
        </div>

        {/* Question filter tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => onChangeFilter('all')}
            className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            全部题目 ({totalQuestions})
          </button>
          <button
            onClick={() => onChangeFilter('wrong')}
            className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              activeFilter === 'wrong'
                ? 'bg-white text-rose-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>只看错题 ({wrongCount})</span>
          </button>
          <button
            onClick={() => onChangeFilter('correct')}
            className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              activeFilter === 'correct'
                ? 'bg-white text-emerald-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>只看做对 ({correctCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
