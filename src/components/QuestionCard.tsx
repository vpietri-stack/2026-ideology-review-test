import React from 'react';
import { Check, X, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { Question, UserAnswerValue } from '../types';
import { isAnswerCorrect } from '../utils/quizUtils';

interface QuestionCardProps {
  question: Question;
  index: number;
  userAnswer: UserAnswerValue;
  isSubmitted: boolean;
  onSelectAnswer: (questionId: string, answer: UserAnswerValue) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  userAnswer,
  isSubmitted,
  onSelectAnswer,
}) => {
  const isCorrect = isSubmitted ? isAnswerCorrect(question, userAnswer) : false;
  const isAnswered =
    userAnswer !== undefined &&
    userAnswer !== null &&
    (Array.isArray(userAnswer) ? userAnswer.length > 0 : true);

  // Handle single choice option click
  const handleSingleSelect = (key: string) => {
    if (isSubmitted) return;
    onSelectAnswer(question.id, key);
  };

  // Handle multiple choice option toggle
  const handleMultiToggle = (key: string) => {
    if (isSubmitted) return;
    const currentList: string[] = Array.isArray(userAnswer) ? [...userAnswer] : [];
    const exists = currentList.includes(key);
    let updated: string[];
    if (exists) {
      updated = currentList.filter((k) => k !== key);
    } else {
      updated = [...currentList, key].sort();
    }
    onSelectAnswer(question.id, updated);
  };

  // Handle true/false click
  const handleJudgeSelect = (val: boolean) => {
    if (isSubmitted) return;
    onSelectAnswer(question.id, val);
  };

  // Format reference answer display
  const renderCorrectAnswerText = () => {
    if (question.type === 'judge') {
      return question.answer === true ? '正确 (√)' : '错误 (×)';
    }
    if (question.type === 'multi') {
      return Array.isArray(question.answer) ? question.answer.join('') : String(question.answer);
    }
    return String(question.answer);
  };

  // Format user answer display
  const renderUserAnswerText = () => {
    if (!isAnswered) return '未作答';
    if (question.type === 'judge') {
      return userAnswer === true ? '正确 (√)' : '错误 (×)';
    }
    if (question.type === 'multi') {
      return Array.isArray(userAnswer) ? userAnswer.join('') : String(userAnswer);
    }
    return String(userAnswer);
  };

  return (
    <div
      id={`question-card-${question.id}`}
      className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all duration-200 ${
        isSubmitted
          ? isCorrect
            ? 'border-emerald-200 shadow-xs'
            : 'border-rose-300 ring-1 ring-rose-100 shadow-xs'
          : isAnswered
          ? 'border-slate-300 shadow-xs'
          : 'border-slate-200'
      }`}
    >
      {/* Question Header: Type Badge & Status */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-800 text-sm sm:text-base">
            第 {index + 1} 题
          </span>

          {question.type === 'single' && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
              单选题
            </span>
          )}
          {question.type === 'multi' && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200/80">
              多选题
            </span>
          )}
          {question.type === 'judge' && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-teal-50 text-teal-700 border border-teal-200/80">
              判断题
            </span>
          )}
          <span className="text-[11px] text-slate-400">
            (5分)
          </span>
        </div>

        {/* Result Tag (when submitted) */}
        {isSubmitted && (
          <div>
            {isCorrect ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                回答正确
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                回答错误
              </span>
            )}
          </div>
        )}
      </div>

      {/* Question Prompt */}
      <div className="text-slate-900 font-medium text-sm sm:text-base leading-relaxed tracking-wide mb-4">
        {question.prompt}
      </div>

      {/* Multi-choice reminder prompt if applicable */}
      {question.type === 'multi' && !isSubmitted && (
        <div className="mb-3 text-xs text-purple-600 bg-purple-50/70 border border-purple-100 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
          <span>多项选择：点击可勾选多个选项，确认无误后继续</span>
        </div>
      )}

      {/* Options for Choice Questions (Single & Multi) */}
      {(question.type === 'single' || question.type === 'multi') && question.options && (
        <div className="space-y-2.5">
          {question.options.map((opt) => {
            const isSingleSelected = question.type === 'single' && userAnswer === opt.key;
            const isMultiSelected =
              question.type === 'multi' &&
              Array.isArray(userAnswer) &&
              userAnswer.includes(opt.key);
            const isSelected = isSingleSelected || isMultiSelected;

            // In submitted mode: is this option part of the correct answer?
            const isCorrectOption =
              question.type === 'single'
                ? question.answer === opt.key
                : Array.isArray(question.answer) && question.answer.includes(opt.key);

            // Styling determination
            let optionStyle =
              'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 active:bg-slate-100';

            if (isSubmitted) {
              if (isCorrectOption) {
                optionStyle = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-medium';
              } else if (isSelected && !isCorrectOption) {
                optionStyle = 'border-rose-400 bg-rose-50/80 text-rose-950';
              } else {
                optionStyle = 'border-slate-200 bg-slate-50/50 text-slate-500 opacity-80';
              }
            } else {
              if (isSelected) {
                optionStyle =
                  question.type === 'single'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-950 font-medium ring-1 ring-blue-400'
                    : 'border-purple-500 bg-purple-50/70 text-purple-950 font-medium ring-1 ring-purple-400';
              }
            }

            return (
              <button
                key={opt.key}
                type="button"
                disabled={isSubmitted}
                onClick={() =>
                  question.type === 'single'
                    ? handleSingleSelect(opt.key)
                    : handleMultiToggle(opt.key)
                }
                className={`w-full text-left p-3 sm:p-3.5 rounded-xl border flex items-start gap-3 transition-all min-h-[46px] select-none ${optionStyle} ${
                  !isSubmitted ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                {/* Indicator Badge (Radio / Checkbox) */}
                <div
                  className={`w-6 h-6 rounded-${
                    question.type === 'single' ? 'full' : 'md'
                  } shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 transition-colors ${
                    isSubmitted
                      ? isCorrectOption
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isSelected
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-600'
                      : isSelected
                      ? question.type === 'single'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}
                >
                  {isSubmitted && isCorrectOption ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : isSubmitted && isSelected && !isCorrectOption ? (
                    <X className="w-3.5 h-3.5" />
                  ) : (
                    opt.key
                  )}
                </div>

                {/* Option Text */}
                <span className="text-sm leading-relaxed pt-0.5 break-words">
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Options for Judge Questions (True / False) */}
      {question.type === 'judge' && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '正确 ( √ )', value: true },
            { label: '错误 ( × )', value: false },
          ].map((item) => {
            const isSelected = userAnswer === item.value;
            const isCorrectOption = question.answer === item.value;

            let judgeStyle =
              'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 active:bg-slate-100';

            if (isSubmitted) {
              if (isCorrectOption) {
                judgeStyle = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-medium';
              } else if (isSelected && !isCorrectOption) {
                judgeStyle = 'border-rose-400 bg-rose-50/80 text-rose-950';
              } else {
                judgeStyle = 'border-slate-200 bg-slate-50/50 text-slate-500 opacity-70';
              }
            } else {
              if (isSelected) {
                judgeStyle =
                  'border-teal-500 bg-teal-50/70 text-teal-950 font-semibold ring-1 ring-teal-400';
              }
            }

            return (
              <button
                key={String(item.value)}
                type="button"
                disabled={isSubmitted}
                onClick={() => handleJudgeSelect(item.value)}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all min-h-[46px] text-sm select-none ${judgeStyle} ${
                  !isSubmitted ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    isSubmitted
                      ? isCorrectOption
                        ? 'bg-emerald-600 text-white'
                        : isSelected
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                      : isSelected
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isSubmitted && isCorrectOption ? (
                    <Check className="w-3 h-3" />
                  ) : isSubmitted && isSelected && !isCorrectOption ? (
                    <X className="w-3 h-3" />
                  ) : item.value ? (
                    '√'
                  ) : (
                    '×'
                  )}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Answer Evaluation / Review (Visible after submission) */}
      {isSubmitted && (
        <div
          className={`mt-4 pt-3.5 border-t ${
            isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/40'
          } -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 sm:p-5 rounded-b-2xl`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-4">
              <span className="text-slate-600">
                你的选择:{' '}
                <strong
                  className={
                    !isAnswered
                      ? 'text-amber-600 font-bold'
                      : isCorrect
                      ? 'text-emerald-700 font-bold'
                      : 'text-rose-600 font-bold'
                  }
                >
                  {renderUserAnswerText()}
                </strong>
              </span>

              <span className="text-slate-600">
                参考答案:{' '}
                <strong className="text-emerald-700 font-bold">
                  {renderCorrectAnswerText()}
                </strong>
              </span>
            </div>

            {!isCorrect && (
              <span className="text-xs text-rose-600 font-medium">
                {isAnswered ? '本题回答不正确，请对照答案加深记忆' : '本题未作答'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
