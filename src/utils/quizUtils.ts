import {
  ChapterData,
  Question,
  QuizMode,
  QuizSession,
  UserAnswerValue,
  ChapterProgress,
  FullBookProgress,
} from '../types';

/**
 * Fisher-Yates shuffle algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Sample n items from an array without replacement
 */
export function sampleRandom<T>(array: T[], count: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * How many questions of each type a single chapter contributes to a paper.
 * Chapter mode draws this once (20 questions); full-book mode draws it from
 * every chapter and then shuffles the combined result.
 */
export const QUIZ_RULES = { single: 10, multi: 5, judge: 5 } as const;

/**
 * Draws one chapter's worth of questions according to QUIZ_RULES:
 * 10 of the 25 "单项选择题", 5 of the 10 "多项选择题", 5 of the 10 "判断题".
 */
export function pickChapterQuestions(chapter: ChapterData): Question[] {
  return [
    ...sampleRandom(chapter.singleQuestions, QUIZ_RULES.single),
    ...sampleRandom(chapter.multiQuestions, QUIZ_RULES.multi),
    ...sampleRandom(chapter.judgeQuestions, QUIZ_RULES.judge),
  ];
}

export function generateChapterQuiz(chapter: ChapterData): QuizSession {
  return {
    mode: 'chapter',
    chapterId: chapter.chapterId,
    questions: pickChapterQuestions(chapter),
    userAnswers: {},
    submitted: false,
    score: 0,
  };
}

/**
 * Full-book paper: QUIZ_RULES applied to every chapter (8 x 20 = 160 questions),
 * then shuffled as one list so consecutive questions are unrelated chapters.
 */
export function generateFullBookQuiz(chapters: ChapterData[]): QuizSession {
  const combined = chapters.flatMap(pickChapterQuestions);

  return {
    mode: 'full',
    chapterId: 0,
    questions: shuffleArray(combined),
    userAnswers: {},
    submitted: false,
    score: 0,
  };
}

/**
 * Checks if a user's answer is correct for a given question
 */
export function isAnswerCorrect(question: Question, userAnswer: UserAnswerValue): boolean {
  if (userAnswer === undefined || userAnswer === null) {
    return false;
  }

  if (question.type === 'single') {
    return userAnswer === question.answer;
  }

  if (question.type === 'judge') {
    return userAnswer === question.answer;
  }

  if (question.type === 'multi') {
    if (!Array.isArray(userAnswer) || !Array.isArray(question.answer)) {
      return false;
    }
    if (userAnswer.length !== question.answer.length) {
      return false;
    }
    const sortedUser = [...userAnswer].sort();
    const sortedCorrect = [...question.answer].sort();
    return sortedUser.every((val, idx) => val === sortedCorrect[idx]);
  }

  return false;
}

/**
 * totalScore is always on a 0-100 scale so the grade bands mean the same thing in
 * both modes: points (5 per question) for a 20-question chapter paper, percentage
 * correct for a 160-question full-book paper.
 */
export function calculateQuizResult(session: QuizSession) {
  let correctCount = 0;
  let singleCorrect = 0;
  let multiCorrect = 0;
  let judgeCorrect = 0;
  let singleTotal = 0;
  let multiTotal = 0;
  let judgeTotal = 0;

  const questionResults: Record<string, boolean> = {};

  session.questions.forEach((q) => {
    if (q.type === 'single') singleTotal += 1;
    if (q.type === 'multi') multiTotal += 1;
    if (q.type === 'judge') judgeTotal += 1;

    const isCorrect = isAnswerCorrect(q, session.userAnswers[q.id]);
    questionResults[q.id] = isCorrect;
    if (isCorrect) {
      correctCount += 1;
      if (q.type === 'single') singleCorrect += 1;
      if (q.type === 'multi') multiCorrect += 1;
      if (q.type === 'judge') judgeCorrect += 1;
    }
  });

  const totalQuestions = session.questions.length;
  const percent =
    totalQuestions === 0
      ? 0
      : Math.round((correctCount / totalQuestions) * 1000) / 10;

  return {
    totalScore: session.mode === 'chapter' ? correctCount * 5 : percent,
    scoreIsPercent: session.mode === 'full',
    percent,
    correctCount,
    totalQuestions,
    singleCorrect,
    singleTotal,
    multiCorrect,
    multiTotal,
    judgeCorrect,
    judgeTotal,
    questionResults,
  };
}

const STORAGE_KEY_PROGRESS = 'quiz_chapter_progress';
const STORAGE_KEY_WRONG_QUESTIONS = 'quiz_wrong_questions';
const STORAGE_KEY_FULL_PROGRESS = 'quiz_full_book_progress';
const STORAGE_KEY_MODE = 'quiz_study_mode';

export function getStoredMode(): QuizMode | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MODE);
    return saved === 'chapter' || saved === 'full' ? saved : null;
  } catch (e) {
    console.error('Failed to load stored study mode', e);
    return null;
  }
}

export function saveMode(mode: QuizMode) {
  try {
    localStorage.setItem(STORAGE_KEY_MODE, mode);
  } catch (e) {
    console.error('Failed to store study mode', e);
  }
}

export function getFullBookProgress(): FullBookProgress | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY_FULL_PROGRESS);
    return data ? (JSON.parse(data) as FullBookProgress) : null;
  } catch (e) {
    console.error('Failed to load full-book progress', e);
    return null;
  }
}

export function saveFullBookResult(percent: number) {
  try {
    const current = getFullBookProgress();
    localStorage.setItem(
      STORAGE_KEY_FULL_PROGRESS,
      JSON.stringify({
        completedTimes: (current?.completedTimes ?? 0) + 1,
        lastScore: percent,
        bestScore: Math.max(current?.bestScore ?? 0, percent),
        lastCompletedAt: Date.now(),
      })
    );
  } catch (e) {
    console.error('Failed to save full-book progress', e);
  }
}

export function getStoredProgress(): Record<number, ChapterProgress> {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PROGRESS);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Failed to load stored progress', e);
    return {};
  }
}

export function saveChapterResult(chapterId: number, score: number) {
  try {
    const progress = getStoredProgress();
    const current = progress[chapterId] || {
      chapterId,
      completedTimes: 0,
      lastScore: 0,
      bestScore: 0,
      lastCompletedAt: 0,
    };

    progress[chapterId] = {
      chapterId,
      completedTimes: current.completedTimes + 1,
      lastScore: score,
      bestScore: Math.max(current.bestScore, score),
      lastCompletedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save chapter progress', e);
  }
}

export function recordWrongQuestions(wrongQuestions: Question[]) {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY_WRONG_QUESTIONS);
    const existing: Record<string, Question> = existingStr ? JSON.parse(existingStr) : {};
    wrongQuestions.forEach((q) => {
      existing[q.id] = q;
    });
    localStorage.setItem(STORAGE_KEY_WRONG_QUESTIONS, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to record wrong questions', e);
  }
}

export function removeWrongQuestion(questionId: string) {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY_WRONG_QUESTIONS);
    if (!existingStr) return;
    const existing: Record<string, Question> = JSON.parse(existingStr);
    delete existing[questionId];
    localStorage.setItem(STORAGE_KEY_WRONG_QUESTIONS, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to remove wrong question', e);
  }
}

export function getStoredWrongQuestions(): Question[] {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY_WRONG_QUESTIONS);
    if (!existingStr) return [];
    const existing: Record<string, Question> = JSON.parse(existingStr);
    return Object.values(existing);
  } catch (e) {
    console.error('Failed to get wrong questions', e);
    return [];
  }
}
