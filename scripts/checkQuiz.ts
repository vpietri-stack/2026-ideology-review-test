import { CHAPTERS_DATA } from '../src/data/chapters';
import {
  QUIZ_RULES,
  calculateQuizResult,
  generateChapterQuiz,
  generateFullBookQuiz,
  shuffleQuestionOptions,
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

console.log('\nOption order');
const bankById = new Map<string, { letters: string; texts: string[]; answerKeys: string[]; answerTexts: string[]; type: string }>();
CHAPTERS_DATA.forEach((chapter) => {
  [...chapter.singleQuestions, ...chapter.multiQuestions, ...chapter.judgeQuestions].forEach((q) => {
    const answerKeys = Array.isArray(q.answer)
      ? q.answer
      : typeof q.answer === 'string'
      ? [q.answer]
      : [];
    bankById.set(q.id, {
      letters: (q.options || []).map((o) => o.key).join(''),
      texts: (q.options || []).map((o) => o.text),
      answerKeys,
      answerTexts: answerKeys.map((k) => (q.options || []).find((o) => o.key === k)!.text),
      type: q.type,
    });
  });
});

// 1) The shuffle must never mutate the module-level bank, or every later draw
//    inherits one order and the whole question set gets corrupted for the page.
const bankSnapshot = JSON.stringify(
  CHAPTERS_DATA.map((c) => [
    c.singleQuestions,
    c.multiQuestions,
    c.judgeQuestions,
  ])
);
for (let i = 0; i < 15; i += 1) {
  generateFullBookQuiz(CHAPTERS_DATA);
  generateChapterQuiz(CHAPTERS_DATA[i % EXPECTED_CHAPTERS]);
}
assert(
  JSON.stringify(
    CHAPTERS_DATA.map((c) => [c.singleQuestions, c.multiQuestions, c.judgeQuestions])
  ) === bankSnapshot,
  'question bank is unchanged after generating papers (no in-place mutation)'
);

// 2) Every drawn question keeps the same option texts, just in a new order,
//    and its answer points at the text that was correct in the bank.
const paper = generateFullBookQuiz(CHAPTERS_DATA).questions;
let textsPreserved = true;
let answersStillCorrect = true;
let keysRekeyed = true;
let judgeUntouched = true;
let multiShapeKept = true;

paper.forEach((q) => {
  const origin = bankById.get(q.id);
  if (!origin) return;

  if (q.type === 'judge') {
    if (q.options !== undefined || typeof q.answer !== 'boolean') judgeUntouched = false;
    return;
  }

  const drawnKeys = q.options!.map((o) => o.key);
  if (drawnKeys.join('') !== 'ABCD') keysRekeyed = false;
  if (JSON.stringify([...q.options!].map((o) => o.text).sort()) !== JSON.stringify([...origin.texts].sort())) {
    textsPreserved = false;
  }

  const answerList = Array.isArray(q.answer) ? q.answer : [q.answer];
  if (Array.isArray(q.answer) && q.answer.length !== origin.answerKeys.length) multiShapeKept = false;
  if (Array.isArray(q.answer) && q.answer.join('') !== [...q.answer].sort().join('')) multiShapeKept = false;

  const drawnAnswerTexts = answerList.map((k) => q.options!.find((o) => o.key === k)!.text);
  if (JSON.stringify(drawnAnswerTexts.sort()) !== JSON.stringify([...origin.answerTexts].sort())) {
    answersStillCorrect = false;
  }
});

assert(textsPreserved, 'no option text is lost or duplicated by the shuffle');
assert(keysRekeyed, 'options are re-labelled A/B/C/D in the new order');
assert(answersStillCorrect, 'the answer letter still points at the correct text');
assert(multiShapeKept, 'multi answers keep their count and stay alphabetical');
assert(judgeUntouched, 'judge questions keep a boolean answer and gain no options');

// 3) The order must actually vary.
const oneQuestion = CHAPTERS_DATA[0].singleQuestions[0];
const ordersSeen = new Set<string>();
const answerLettersSeen = new Set<string>();
for (let i = 0; i < 200; i += 1) {
  const shuffled = shuffleQuestionOptions(oneQuestion);
  ordersSeen.add(shuffled.options!.map((o) => o.text).join('|'));
  answerLettersSeen.add(String(shuffled.answer));
}
assert(ordersSeen.size >= 12, `option order varies between draws (${ordersSeen.size} of 24 permutations seen)`);
assert(answerLettersSeen.size >= 3, `correct option moves position (${answerLettersSeen.size} different letters seen)`);

// 4) Multi-question option shuffle behaves the same way.
const multiBank = CHAPTERS_DATA.flatMap((c) => c.multiQuestions);
const twoAnswerMulti = multiBank.find(
  (q): q is Question & { answer: string[] } => Array.isArray(q.answer) && q.answer.length === 2
);
assert(!!twoAnswerMulti, 'found a two-answer multi question to test with');
if (twoAnswerMulti) {
  const originalCorrectTexts = twoAnswerMulti.options
    .map((o) => (twoAnswerMulti.answer.includes(o.key) ? o.text : null))
    .filter((t): t is string => t !== null)
    .sort();

  const answerStrings = new Set<string>();
  let multiStayedCorrect = true;
  for (let i = 0; i < 200; i += 1) {
    const shuffled = shuffleQuestionOptions(twoAnswerMulti);
    const answer = shuffled.answer;
    if (!Array.isArray(answer)) {
      multiStayedCorrect = false;
      continue;
    }
    answerStrings.add(answer.join(''));
    if (answer.length !== 2 || answer.join('') !== [...answer].sort().join('')) {
      multiStayedCorrect = false;
    }
    const texts = shuffled.options
      .filter((o) => answer.includes(o.key))
      .map((o) => o.text)
      .sort();
    if (JSON.stringify(texts) !== JSON.stringify(originalCorrectTexts)) multiStayedCorrect = false;
  }
  assert(multiStayedCorrect, 'multi answers stay a 2-letter alphabetical set pointing at the same texts');
  assert(
    answerStrings.size >= 4,
    `both correct options move together (${answerStrings.size} distinct answer strings seen)`
  );
}

// 5) A question with all four options correct stays all four correct.
const allCorrect = CHAPTERS_DATA.flatMap((c) => c.multiQuestions).find(
  (q): q is Question & { answer: string[] } =>
    Array.isArray(q.answer) && q.answer.join('') === 'ABCD'
);
if (allCorrect) {
  let stillAll = true;
  for (let i = 0; i < 50; i += 1) {
    const answer = shuffleQuestionOptions(allCorrect).answer;
    if (!Array.isArray(answer) || answer.join('') !== 'ABCD') stillAll = false;
  }
  assert(stillAll, 'an "all options correct" question still answers ABCD');
}

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
