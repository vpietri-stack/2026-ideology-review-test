import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Award,
  BookOpen,
  RotateCcw,
  Send,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Share2,
} from 'lucide-react';
import { CHAPTERS_DATA } from './data/chapters';
import { Question, UserAnswerValue, QuizSession, ChapterProgress } from './types';
import {
  generateChapterQuiz,
  calculateQuizResult,
  getStoredProgress,
  saveChapterResult,
  recordWrongQuestions,
  getStoredWrongQuestions,
} from './utils/quizUtils';
import { Header } from './components/Header';
import { QuestionCard } from './components/QuestionCard';
import { ScoreResultBanner } from './components/ScoreResultBanner';
import { ChapterSelectorModal } from './components/ChapterSelectorModal';
import { SubmitConfirmModal } from './components/SubmitConfirmModal';
import { QuestionQuickNavDrawer } from './components/QuestionQuickNavDrawer';
import { WrongQuestionsModal } from './components/WrongQuestionsModal';

export default function App() {
  const [currentChapterId, setCurrentChapterId] = useState<number>(1);
  const [session, setSession] = useState<QuizSession>(() => {
    const ch = CHAPTERS_DATA[0];
    return generateChapterQuiz(ch);
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'wrong' | 'correct'>('all');
  const [isChapterModalOpen, setIsChapterModalOpen] = useState<boolean>(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isQuickNavOpen, setIsQuickNavOpen] = useState<boolean>(false);
  const [isWrongModalOpen, setIsWrongModalOpen] = useState<boolean>(false);

  const [progressMap, setProgressMap] = useState<Record<number, ChapterProgress>>(() =>
    getStoredProgress()
  );
  const [wrongQuestionsList, setWrongQuestionsList] = useState<Question[]>(() =>
    getStoredWrongQuestions()
  );

  const topRef = useRef<HTMLDivElement>(null);

  // Current chapter metadata
  const currentChapter = useMemo(() => {
    return (
      CHAPTERS_DATA.find((c) => c.chapterId === currentChapterId) || CHAPTERS_DATA[0]
    );
  }, [currentChapterId]);

  // Load / Redraw chapter questions
  const loadChapterQuiz = (chapterId: number) => {
    const targetChapter =
      CHAPTERS_DATA.find((c) => c.chapterId === chapterId) || CHAPTERS_DATA[0];
    setCurrentChapterId(chapterId);
    const newSession = generateChapterQuiz(targetChapter);
    setSession(newSession);
    setActiveFilter('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Re-draw random 20 questions for the current chapter
  const handleRedrawCurrentChapter = () => {
    if (
      !session.submitted &&
      Object.keys(session.userAnswers).length > 0 &&
      !window.confirm('重新抽题将放弃当前已作答内容，确定重新抽题吗？')
    ) {
      return;
    }
    loadChapterQuiz(currentChapterId);
  };

  // Switch to specific chapter
  const handleSelectChapter = (chapterId: number) => {
    loadChapterQuiz(chapterId);
  };

  // Handle single question answer change
  const handleSelectAnswer = (questionId: string, answer: UserAnswerValue) => {
    setSession((prev) => ({
      ...prev,
      userAnswers: {
        ...prev.userAnswers,
        [questionId]: answer,
      },
    }));
  };

  // Number of answered questions
  const answeredCount = useMemo(() => {
    return session.questions.filter((q) => {
      const val = session.userAnswers[q.id];
      if (val === undefined || val === null) return false;
      if (Array.isArray(val)) return val.length > 0;
      return true;
    }).length;
  }, [session.questions, session.userAnswers]);

  // Find unanswered question indexes
  const unansweredIndexes = useMemo(() => {
    const list: number[] = [];
    session.questions.forEach((q, idx) => {
      const val = session.userAnswers[q.id];
      const isAns =
        val !== undefined &&
        val !== null &&
        (Array.isArray(val) ? val.length > 0 : true);
      if (!isAns) list.push(idx);
    });
    return list;
  }, [session.questions, session.userAnswers]);

  // Submit test
  const handleConfirmSubmit = () => {
    const result = calculateQuizResult(session);

    // Save chapter progress
    saveChapterResult(currentChapterId, result.totalScore);
    setProgressMap(getStoredProgress());

    // Record wrong questions
    const wrongQs = session.questions.filter(
      (q) => !result.questionResults[q.id]
    );
    if (wrongQs.length > 0) {
      recordWrongQuestions(wrongQs);
      setWrongQuestionsList(getStoredWrongQuestions());
    }

    setSession((prev) => ({
      ...prev,
      submitted: true,
      score: result.totalScore,
      submittedAt: Date.now(),
    }));

    // Scroll to top to see score
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Advance to next chapter
  const handleNextChapter = () => {
    if (currentChapterId < 8) {
      loadChapterQuiz(currentChapterId + 1);
    } else {
      // Loop back to chapter 1
      loadChapterQuiz(1);
    }
  };

  // Results calculation
  const quizResult = useMemo(() => {
    if (!session.submitted) return null;
    return calculateQuizResult(session);
  }, [session]);

  // Filter questions for display
  const displayedQuestions = useMemo(() => {
    if (!session.submitted || activeFilter === 'all' || !quizResult) {
      return session.questions.map((q, idx) => ({ q, originalIndex: idx }));
    }
    return session.questions
      .map((q, idx) => ({ q, originalIndex: idx }))
      .filter(({ q }) => {
        const isCorrect = quizResult.questionResults[q.id];
        return activeFilter === 'wrong' ? !isCorrect : isCorrect;
      });
  }, [session.questions, session.submitted, activeFilter, quizResult]);

  // Scroll to a specific question
  const handleJumpToQuestion = (index: number, questionId: string) => {
    const el = document.getElementById(`question-card-${questionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 pb-28">
      {/* Top Anchor */}
      <div ref={topRef} />

      {/* Header */}
      <Header
        currentChapter={currentChapter}
        totalChapters={CHAPTERS_DATA.length}
        onOpenChapterSelector={() => setIsChapterModalOpen(true)}
        onOpenWrongBook={() => setIsWrongModalOpen(true)}
        onOpenQuickNav={() => setIsQuickNavOpen(true)}
        onRedraw={handleRedrawCurrentChapter}
        answeredCount={answeredCount}
        totalQuestions={session.questions.length}
        isSubmitted={session.submitted}
        score={session.score}
        wrongCount={wrongQuestionsList.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 sm:py-6">
        {/* Intro Chapter Card */}
        <div className="bg-gradient-to-br from-rose-900 via-rose-800 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm mb-5 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-rose-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-rose-300" />
              <span>章节自测系统 · 题库随机抽取</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold leading-snug">
              第{currentChapter.chapterId}章 {currentChapter.title.replace(/^第[一二三四五六七八]章\s*/, '')}
            </h2>
            <div className="mt-2 text-xs text-rose-200/90 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>单选 10 题 (每题5分)</span>
              <span>•</span>
              <span>多选 5 题 (每题5分)</span>
              <span>•</span>
              <span>判断 5 题 (每题5分)</span>
              <span>•</span>
              <span>共 20 题 / 100 分</span>
            </div>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-white pointer-events-none">
            <BookOpen className="w-36 h-36" />
          </div>
        </div>

        {/* Score & Review Banner (Shown after submission) */}
        {session.submitted && quizResult && (
          <ScoreResultBanner
            score={quizResult.totalScore}
            totalScore={100}
            correctCount={quizResult.correctCount}
            totalQuestions={quizResult.totalQuestions}
            singleCorrect={quizResult.singleCorrect}
            multiCorrect={quizResult.multiCorrect}
            judgeCorrect={quizResult.judgeCorrect}
            activeFilter={activeFilter}
            onChangeFilter={setActiveFilter}
            onNextChapter={handleNextChapter}
            onRedrawChapter={handleRedrawCurrentChapter}
            hasNextChapter={currentChapterId < 8}
            currentChapterId={currentChapterId}
          />
        )}

        {/* Questions Section */}
        <div className="space-y-4">
          {displayedQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-base">本分类下暂无题目</h3>
              <p className="text-xs text-slate-500 mt-1">
                {activeFilter === 'wrong'
                  ? '太棒了！本套测验您没有答错任何题目！'
                  : '您尚未有回答正确的题目。'}
              </p>
              <button
                onClick={() => setActiveFilter('all')}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                查看全部 20 道题目
              </button>
            </div>
          ) : (
            displayedQuestions.map(({ q, originalIndex }) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={originalIndex}
                userAnswer={session.userAnswers[q.id]}
                isSubmitted={session.submitted}
                onSelectAnswer={handleSelectAnswer}
              />
            ))
          )}
        </div>

        {/* Bottom Submission / Next Chapter Card in Page flow */}
        <div className="mt-8 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              {session.submitted ? '已完成本章复习' : '已核对作答情况？'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {session.submitted
                ? currentChapterId < 8
                  ? `点击即可进入第 ${currentChapterId + 1} 章继续挑战`
                  : '您已完成全部 8 个章节的自测！可重新抽题或回顾错题本。'
                : `当前已完成 ${answeredCount} / ${session.questions.length} 题，点击交卷立即核验对错。`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {session.submitted ? (
              <button
                onClick={handleNextChapter}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-6 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold text-sm shadow-sm shadow-rose-200 transition-all cursor-pointer"
              >
                <span>{currentChapterId < 8 ? `进入第${currentChapterId + 1}章` : '重新自测第1章'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="page-submit-btn"
                onClick={() => setIsSubmitModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-8 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold text-sm shadow-sm shadow-rose-200 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>提交试卷</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer info & GitHub Pages static note */}
        <footer className="mt-10 mb-4 text-center text-xs text-slate-400 space-y-1">
          <p>思想道德与法治 · 8章随机抽题考核练习系统</p>
          <p className="text-[11px] text-slate-400">
            支持离线运行与微信/Safari浏览器访问 · GitHub Pages 纯静态友好
          </p>
        </footer>
      </main>

      {/* Floating Bottom Bar for WeChat and Mobile Safari */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-lg safe-bottom">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          {/* Quick status on left */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsQuickNavOpen(true)}
              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span>题卡 ({answeredCount}/20)</span>
            </button>

            <span className="text-xs text-slate-500 truncate hidden sm:inline">
              {session.submitted
                ? `得分: ${session.score}分`
                : unansweredIndexes.length > 0
                ? `还剩 ${unansweredIndexes.length} 题未做`
                : '全部题目已填完'}
            </span>
          </div>

          {/* Primary Action Button on right */}
          <div className="flex items-center gap-2">
            {session.submitted ? (
              <>
                <button
                  onClick={handleRedrawCurrentChapter}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  重抽本章
                </button>
                <button
                  onClick={handleNextChapter}
                  className="py-2 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>{currentChapterId < 8 ? `下一章 (${currentChapterId + 1})` : '回第1章'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                id="floating-submit-btn"
                onClick={() => setIsSubmitModalOpen(true)}
                className="py-2.5 px-6 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-sm font-bold shadow-sm shadow-rose-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>提交试卷</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Selector Modal */}
      <ChapterSelectorModal
        isOpen={isChapterModalOpen}
        onClose={() => setIsChapterModalOpen(false)}
        chapters={CHAPTERS_DATA}
        currentChapterId={currentChapterId}
        onSelectChapter={handleSelectChapter}
        progressMap={progressMap}
      />

      {/* Submit Confirmation Modal */}
      <SubmitConfirmModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        unansweredIndexes={unansweredIndexes}
        totalQuestions={session.questions.length}
      />

      {/* Quick Nav Drawer */}
      <QuestionQuickNavDrawer
        isOpen={isQuickNavOpen}
        onClose={() => setIsQuickNavOpen(false)}
        questions={session.questions}
        userAnswers={session.userAnswers}
        isSubmitted={session.submitted}
        onJumpToQuestion={handleJumpToQuestion}
      />

      {/* Wrong Questions Book Modal */}
      <WrongQuestionsModal
        isOpen={isWrongModalOpen}
        onClose={() => setIsWrongModalOpen(false)}
        wrongQuestions={wrongQuestionsList}
        onRefresh={() => setWrongQuestionsList(getStoredWrongQuestions())}
      />
    </div>
  );
}
