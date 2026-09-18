import React, { useState } from 'react';
import { X, Trash2, CheckCircle2, BookOpen, AlertTriangle } from 'lucide-react';
import { Question } from '../types';
import { removeWrongQuestion } from '../utils/quizUtils';

interface WrongQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wrongQuestions: Question[];
  onRefresh: () => void;
}

export const WrongQuestionsModal: React.FC<WrongQuestionsModalProps> = ({
  isOpen,
  onClose,
  wrongQuestions,
  onRefresh,
}) => {
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<number | 'all'>('all');

  if (!isOpen) return null;

  const filteredQuestions =
    selectedChapterFilter === 'all'
      ? wrongQuestions
      : wrongQuestions.filter((q) => q.chapterId === selectedChapterFilter);

  const handleRemove = (id: string) => {
    removeWrongQuestion(id);
    onRefresh();
  };

  const handleClearAll = () => {
    if (window.confirm('确定要清空错题本中的所有记录吗？')) {
      wrongQuestions.forEach((q) => removeWrongQuestion(q.id));
      onRefresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">错题巩固本</h3>
              <p className="text-xs text-slate-500">
                已收录 {wrongQuestions.length} 道错题，随时随地查漏补缺
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {wrongQuestions.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-rose-600 hover:text-rose-700 py-1.5 px-2.5 rounded-lg hover:bg-rose-50 transition-colors"
              >
                清空错题
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chapter filter selector */}
        {wrongQuestions.length > 0 && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-400 shrink-0">章节筛选:</span>
            <button
              onClick={() => setSelectedChapterFilter('all')}
              className={`py-1 px-2.5 rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
                selectedChapterFilter === 'all'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              全部 ({wrongQuestions.length})
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((chNum) => {
              const count = wrongQuestions.filter((q) => q.chapterId === chNum).length;
              if (count === 0) return null;
              return (
                <button
                  key={chNum}
                  onClick={() => setSelectedChapterFilter(chNum)}
                  className={`py-1 px-2.5 rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
                    selectedChapterFilter === chNum
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  第{chNum}章 ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* List of wrong questions */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 divide-y divide-slate-100">
          {filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-70" />
              <p className="text-sm font-semibold text-slate-700">暂无错题记录</p>
              <p className="text-xs text-slate-400 mt-1">在测验中做错的题目会自动收录至此，方便随时复习。</p>
            </div>
          ) : (
            filteredQuestions.map((q, idx) => (
              <div key={q.id} className="pt-3.5 first:pt-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">
                      第 {q.chapterId} 章
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                        q.type === 'single'
                          ? 'bg-blue-50 text-blue-700'
                          : q.type === 'multi'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-teal-50 text-teal-700'
                      }`}
                    >
                      {q.type === 'single' ? '单选题' : q.type === 'multi' ? '多选题' : '判断题'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemove(q.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="从错题本移出"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm font-medium text-slate-900 leading-relaxed mb-2.5">
                  {idx + 1}. {q.prompt}
                </p>

                {/* Options if choice */}
                {q.options && (
                  <div className="space-y-1.5 mb-2.5">
                    {q.options.map((opt) => {
                      const isCorrect =
                        q.type === 'single'
                          ? q.answer === opt.key
                          : Array.isArray(q.answer) && q.answer.includes(opt.key);
                      return (
                        <div
                          key={opt.key}
                          className={`text-xs p-2 rounded-lg border ${
                            isCorrect
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="font-bold mr-1.5">{opt.key}.</span>
                          <span>{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Answer row */}
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    正确答案:{' '}
                    <strong className="text-emerald-700 font-bold ml-1">
                      {q.type === 'judge'
                        ? q.answer === true
                          ? '正确 (√)'
                          : '错误 (×)'
                        : Array.isArray(q.answer)
                        ? q.answer.join('')
                        : String(q.answer)}
                    </strong>
                  </span>

                  <button
                    onClick={() => handleRemove(q.id)}
                    className="text-emerald-700 hover:underline font-medium"
                  >
                    已掌握，移出错题本
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-2 px-5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
