import { CHAPTERS_DATA } from '../src/data/chapters';
import {
  QUIZ_RULES,
  calculateQuizResult,
  generateChapterQuiz,
  generateFullBookQuiz,
} from '../src/utils/quizUtils';
import type { Question } from '../src/types';

const PER_CHAPTER_TOTAL = QUIZ_RULES.single + QUIZ_RULES.multi + QUIZ_RULES.judge;
const EXPECTED_CHAPTERS = 8;

function countByType(questions: Question[]) {
  return {
    single: questions.filter((q) => q.type === 'single').length,
    multi: questions.filter((q) => q.type === 'multi').length,
    judge: questions.filter((q) => q.type === 'judge').length,
  };
}

let failures = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ok    ${label}`);
    return;
  }
  console.error(`  FAIL  ${label}`);
  failures += 1;
}

console.log('Question bank shape');
assert(CHAPTERS_DATA.length === EXPECTED_CHAPTERS, `${EXPECTED_CHAPTERS} chapters present`);
CHAPTERS_DATA.forEach((chapter) => {
  assert(
    chapter.singleQuestions.length === 25 &&
      chapter.multiQuestions.length === 10 &&
      chapter.judgeQuestions.length === 10,
    `chapter ${chapter.chapterId} bank is 25 single + 10 multi + 10 judge`
  );
});

console.log('\nChapter mode (20 questions)');
{
  const session = generateChapterQuiz(CHAPTERS_DATA[5]);
  const ids = new Set(session.questions.map((q) => q.id));
  assert(session.questions.length === PER_CHAPTER_TOTAL, 'paper draws exactly 20 questions');
  assert(ids.size === PER_CHAPTER_TOTAL, 'no duplicate question on the paper');
  assert(
    JSON.stringify(countByType(session.questions)) ===
      JSON.stringify({ single: 10, multi: 5, judge: 5 }),
    'mix is 10 single + 5 multi + 5 judge'
  );
  assert(
    session.questions.every((q) => q.chapterId === session.chapterId),
    'all questions come from the selected chapter'
  );
}

console.log('\nFull-book mode (160 questions)');
for (let run = 1; run <= 20; run += 1) {
  const session = generateFullBookQuiz(CHAPTERS_DATA);
  const ids = new Set(session.questions.map((q) => q.id));

  assert(session.questions.length === 160, `run ${run} yields 160 questions`);
  assert(ids.size === 160, `run ${run} has no duplicate question`);

  if (run === 1) {
    assert(
      JSON.stringify(countByType(session.questions)) ===
        JSON.stringify({ single: 80, multi: 40, judge: 40 }),
      'mix is 80 single + 40 multi + 40 judge'
    );

    let balanced = true;
    for (let chapterId = 1; chapterId <= EXPECTED_CHAPTERS; chapterId += 1) {
      const fromChapter = session.questions.filter((q) => q.chapterId === chapterId);
      const mix = countByType(fromChapter);
      if (
        fromChapter.length !== PER_CHAPTER_TOTAL ||
        mix.single !== QUIZ_RULES.single ||
        mix.multi !== QUIZ_RULES.multi ||
        mix.judge !== QUIZ_RULES.judge
      ) {
        balanced = false;
      }
    }
    assert(balanced, 'every chapter contributes 10 single + 5 multi + 5 judge');

    const chapterOrder = session.questions.map((q) => q.chapterId);
    const groupedCopy = [...chapterOrder].sort((a, b) => a - b);
    assert(
      JSON.stringify(chapterOrder) !== JSON.stringify(groupedCopy),
      'questions are not left grouped by chapter'
    );

    // A chapter's 20 questions placed randomly in 160 slots forms ~17 separate
    // runs, so a low run count means the shuffle never happened.
    let spreadOut = true;
    for (let chapterId = 1; chapterId <= EXPECTED_CHAPTERS; chapterId += 1) {
      const positions = chapterOrder
        .map((id, idx) => (id === chapterId ? idx : -1))
        .filter((idx) => idx >= 0);
      const runs = positions.filter((idx, i) => i === 0 || idx !== positions[i - 1] + 1).length;
      if (runs < 8) spreadOut = false;
    }
    assert(spreadOut, "each chapter's questions are scattered across the paper");
  }
}

const openingChapters = new Set(
  Array.from({ length: 30 }, () => generateFullBookQuiz(CHAPTERS_DATA).questions[0].chapterId)
);
assert(
  openingChapters.size >= 4,
  `question 1 varies between runs (${openingChapters.size} different opening chapters seen)`
);

console.log('\nScoring');
const scored = generateFullBookQuiz(CHAPTERS_DATA);
scored.questions.forEach((q, idx) => {
  if (idx % 2 === 0) {
    scored.userAnswers[q.id] = q.answer;
  }
});
const half = calculateQuizResult(scored);
assert(half.totalScore === 50, `50% of a full-book paper scores 50 (got ${half.totalScore})`);
assert(half.scoreIsPercent, 'full-book score reads as a percentage');
assert(half.totalQuestions === 160, 'result reports 160 questions');
assert(
  half.singleTotal === 80 && half.multiTotal === 40 && half.judgeTotal === 40,
  'per-type totals are counted from the paper, not hardcoded'
);

const chapterPaper = generateChapterQuiz(CHAPTERS_DATA[3]);
chapterPaper.questions.forEach((q) => {
  chapterPaper.userAnswers[q.id] = q.answer;
});
const perfect = calculateQuizResult(chapterPaper);
assert(perfect.totalScore === 100, 'a perfect chapter paper still scores 100 points');
assert(!perfect.scoreIsPercent, 'chapter score reads as points');

console.log('\nAnswer sanity');
const unusable = CHAPTERS_DATA.flatMap((chapter) =>
  [...chapter.singleQuestions, ...chapter.judgeQuestions].filter(
    (q) => !(typeof q.answer === 'boolean' || (typeof q.answer === 'string' && q.answer.length > 0))
  )
);
assert(unusable.length === 0, 'every single/judge question has a usable answer');
const badMulti = CHAPTERS_DATA.flatMap((chapter) =>
  chapter.multiQuestions.filter((q) => !Array.isArray(q.answer) || q.answer.length === 0)
);
assert(badMulti.length === 0, 'every multi question has a non-empty answer array');

if (failures > 0) {
  throw new Error(`${failures} check(s) failed`);
}
console.log('\nAll checks passed.');
