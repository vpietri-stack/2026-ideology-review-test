import React from 'react';
import { X, ListOrdered } from 'lucide-react';
import { Question, QuizMode, UserAnswerValue } from '../types';
import { isAnswerCorrect } from '../utils/quizUtils';

interface QuestionQuickNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: QuizMode;
  questions: Question[];
  userAnswers: Record<string, UserAnswerValue>;
  isSubmitted: boolean;
  onJumpToQuestion: (index: number, questionId: string) => void;
}

const UNANSWERED = 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50';

const buttonStyle = (
  isSubmitted: boolean,
  isAnswered: boolean,
  isCorrect: boolean,
  answeredStyle: string
) => {
  if (isSubmitted) {
    return isCorrect
      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
      : 'bg-rose-500 text-white border-rose-600 shadow-xs';
  }
  if (isAnswered) return answeredStyle;
  return UNANSWERED;
};

export const QuestionQuickNavDrawer: React.FC<QuestionQuickNavDrawerProps> = ({
  isOpen,
  onClose,
  mode,
  questions,
  userAnswers,
  isSubmitted,
  onJumpToQuestion,
}) => {
  if (!isOpen) return null;

  const renderButton = (
    q: Question,
    idx: number,
    answeredStyle: string,
    size: 'chapter' | 'full'
  ) => {
    const ans = userAnswers[q.id];
    const isAnswered =
      ans !== undefined && ans !== null && (Array.isArray(ans) ? ans.length > 0 : true);
    const isCorrect = isSubmitted ? isAnswerCorrect(q, ans) : false;

    return (
      <button
        key={q.id}
        onClick={() => {
          onJumpToQuestion(idx, q.id);
          onClose();
        }}
        className={`rounded-xl border flex items-center justify-center font-bold transition-all cursor-pointer ${
          size === 'full' ? 'h-9 text-xs' : 'h-11 text-sm'
        } ${buttonStyle(isSubmitted, isAnswered, isCorrect, answeredStyle)}`}
      >
        {idx + 1}
      </button>
    );
  };

  const renderSection = (title: string, start: number, end: number, answeredStyle: string) => {
    const slice = questions.slice(start, end);
    if (slice.length === 0) return null;

    return (
      <div>
        <div className="text-xs font-bold text-slate-400 mb-2 flex items-center justify-between">
          <span>{`${title} (第 ${start + 1} ~ ${start + slice.length} 题)`}</span>
        </div>
        <div className="grid grid-cols-5 gap-2.5">
          {slice.map((q, i) => renderButton(q, start + i, answeredStyle, 'chapter'))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="bg-white w-full max-w-md sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ListOrdered className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isSubmitted ? '题卡与对错概览' : '题目答题卡速览'}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === 'full'
                  ? `共 ${questions.length} 题 · 点击题号快速定位`
                  : '点击题号可直接快速定位对应试题'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-around text-xs text-slate-600">
          {isSubmitted ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                <span>回答正确</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500" />
                <span>回答错误/未答</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-800" />
                <span>已作答</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-white border border-slate-300" />
                <span>未作答</span>
              </div>
            </>
          )}
        </div>

        {/* Question Grid */}
        <div className="p-5 overflow-y-auto">
          {mode === 'full' ? (
            // Full-book papers are shuffled across chapters, so the card is one
            // flat list in display order rather than sections by question type.
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
              {questions.map((q, idx) => renderButton(q, idx, 'bg-slate-800 text-white border-slate-800 shadow-xs', 'full'))}
            </div>
          ) : (
            <div className="space-y-4">
              {renderSection('一、单项选择题', 0, 10, 'bg-slate-800 text-white border-slate-800 shadow-xs')}
              {renderSection('二、多项选择题', 10, 15, 'bg-purple-700 text-white border-purple-700 shadow-xs')}
              {renderSection('三、判断题', 15, 20, 'bg-teal-700 text-white border-teal-700 shadow-xs')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            返回试卷
          </button>
        </div>
      </div>
    </div>
  );
};
