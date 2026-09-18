export type QuestionType = 'single' | 'multi' | 'judge';

export interface OptionItem {
  key: string;
  text: string;
}

export interface Question {
  id: string;
  chapterId: number;
  num: number;
  type: QuestionType;
  prompt: string;
  options?: OptionItem[];
  answer: string | string[] | boolean;
}

export interface ChapterData {
  chapterId: number;
  title: string;
  singleQuestions: Question[];
  multiQuestions: Question[];
  judgeQuestions: Question[];
}

export type UserAnswerValue = string | string[] | boolean | undefined;

export interface QuizSession {
  chapterId: number;
  questions: Question[]; // 10 single + 5 multi + 5 judge = 20 questions
  userAnswers: Record<string, UserAnswerValue>;
  submitted: boolean;
  score: number;
  submittedAt?: number;
}

export interface ChapterProgress {
  chapterId: number;
  completedTimes: number;
  lastScore: number;
  bestScore: number;
  lastCompletedAt: number;
}
