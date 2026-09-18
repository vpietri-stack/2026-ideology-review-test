import { ChapterData, Question, QuizSession, UserAnswerValue, ChapterProgress } from '../types';

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
 * Generates a quiz session for a chapter according to the exact rules:
 * - 10 randomly picked out of 25 "单项选择题"
 * - 5 randomly picked out of 10 "多项选择题"
 * - 5 randomly picked out of 10 "判断题"
 * Total = 20 questions
 */
export function generateChapterQuiz(chapter: ChapterData): QuizSession {
  const selectedSingle = sampleRandom(chapter.singleQuestions, 10);
  const selectedMulti = sampleRandom(chapter.multiQuestions, 5);
  const selectedJudge = sampleRandom(chapter.judgeQuestions, 5);

  const questions: Question[] = [
    ...selectedSingle,
    ...selectedMulti,
    ...selectedJudge,
  ];

  return {
    chapterId: chapter.chapterId,
    questions,
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
 * Computes scores:
 * Total: 100 points (5 points per question * 20 questions)
 */
export function calculateQuizResult(session: QuizSession) {
  let correctCount = 0;
  let singleCorrect = 0;
  let multiCorrect = 0;
  let judgeCorrect = 0;

  const questionResults: Record<string, boolean> = {};

  session.questions.forEach((q) => {
    const isCorrect = isAnswerCorrect(q, session.userAnswers[q.id]);
    questionResults[q.id] = isCorrect;
    if (isCorrect) {
      correctCount += 1;
      if (q.type === 'single') singleCorrect += 1;
      if (q.type === 'multi') multiCorrect += 1;
      if (q.type === 'judge') judgeCorrect += 1;
    }
  });

  const totalScore = correctCount * 5; // 20 questions * 5 = 100 points

  return {
    totalScore,
    correctCount,
    totalQuestions: session.questions.length,
    singleCorrect,
    singleTotal: 10,
    multiCorrect,
    multiTotal: 5,
    judgeCorrect,
    judgeTotal: 5,
    questionResults,
  };
}

const STORAGE_KEY_PROGRESS = 'quiz_chapter_progress';
const STORAGE_KEY_WRONG_QUESTIONS = 'quiz_wrong_questions';

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
