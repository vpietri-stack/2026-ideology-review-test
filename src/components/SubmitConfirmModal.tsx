import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  unansweredIndexes: number[];
  totalQuestions: number;
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  unansweredIndexes,
  totalQuestions,
}) => {
  if (!isOpen) return null;

  const hasUnanswered = unansweredIndexes.length > 0;
  const answeredCount = totalQuestions - unansweredIndexes.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-5 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                hasUnanswered ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {hasUnanswered ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {hasUnanswered ? '尚有题目未作答' : '确认提交答卷'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-3 text-sm text-slate-600 leading-relaxed">
          {hasUnanswered ? (
            <div>
              <p>
                当前共完成 <strong className="text-slate-900">{answeredCount}</strong> 题，仍有{' '}
                <strong className="text-rose-600 font-bold">{unansweredIndexes.length}</strong>{' '}
                道题未填写。
              </p>
              <div className="mt-2.5 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 max-h-24 overflow-y-auto">
                <span className="font-semibold block mb-1">未答题号：</span>
                <span className="leading-normal">
                  {unansweredIndexes.map((idx) => `第${idx + 1}题`).join('、')}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                未作答的题目在提交后将被直接判定为错误并计0分。
              </p>
            </div>
          ) : (
            <p>
              您已完成本章全部 <strong className="text-emerald-700">20</strong> 道题目！
              提交后将立即计算得分，并为您展示错题答案与详细对比。
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            {hasUnanswered ? '继续答题' : '检查一下'}
          </button>
          <button
            type="button"
            id="confirm-submit-btn"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white transition-all cursor-pointer shadow-sm ${
              hasUnanswered
                ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-200'
                : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-200'
            }`}
          >
            确认交卷
          </button>
        </div>
      </div>
    </div>
  );
};
