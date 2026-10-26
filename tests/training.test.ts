import test from 'node:test';
import assert from 'node:assert/strict';
import { abstractQuestion, banks, makeQuestions, shuffleOptions } from '../src/training/generator';
import { categories, Figure } from '../src/training/types';
import { decodeTraining, emptyTraining, expireTest, finishTest, reviewTest, startTest } from '../src/training/state';

test('96 questions éditoriales : quatre choix, explication et identifiants distincts', () => {
  const all = Object.values(banks).flat();
  assert.equal(all.length, 96);
  for (const bank of Object.values(banks)) assert.equal(bank.length, 24);
  assert.equal(new Set(all.map(q => q.id)).size, 96);
  for (const q of all) {
    assert.equal(new Set(q.options).size, 4); assert.ok(q.options[q.answer]); assert.ok(q.explanation.length > 30);
    if (q.category === 'verbal') assert.ok(q.context!.length > 300);
    if (q.category === 'eu') assert.ok(q.source?.url.startsWith('https://'));
  }
});

test('Les séries ne répètent aucune question et donnent priorité aux non vues', () => {
  const first = makeQuestions('verbal', 10, 51), seen = first.map(q => q.id);
  const second = makeQuestions('verbal', 10, 51, seen);
  assert.ok(second.every(q => !seen.includes(q.id)));
  assert.equal(new Set(makeQuestions('verbal', 20, 52, [...seen, ...second.map(q => q.id)]).map(q => q.id)).size, 20);
  assert.deepEqual(makeQuestions('english', 10, 77), makeQuestions('english', 10, 77));
  for (const category of categories) {
    const questions = makeQuestions(category.id, 20, 111);
    assert.equal(questions.length, 20); assert.equal(new Set(questions.map(q => q.id)).size, 20);
  }
});

test('Le mélange préserve la bonne réponse et la figure correspondante', () => {
  for (let seed = 0; seed < 300; seed++) {
    const original = abstractQuestion(seed), q = shuffleOptions(original, seed);
    assert.deepEqual(q.visual!.choices[q.answer], original.visual!.choices[0]);
    const text = banks.eu[seed % 24], mixed = shuffleOptions(text, seed);
    assert.equal(mixed.options[mixed.answer], text.options[text.answer]);
  }
});

test('600 suites visuelles : les choix sont distincts et la règle prédit la cinquième figure', () => {
  const shapeCycle = ['circle', 'square', 'triangle'];
  for (let seed = 0; seed < 600; seed++) {
    const q = abstractQuestion(seed), frames = q.visual!.sequence, expected: Figure = { ...frames[3] };
    assert.equal(new Set(q.visual!.choices.map(f => JSON.stringify(f))).size, 4);
    const rule = seed % 6;
    if (rule === 0 || rule === 5) expected.rotation = (2 * frames[3].rotation - frames[2].rotation + 360) % 360;
    if (rule === 1) expected.position = (2 * frames[3].position - frames[2].position + 8) % 8;
    if (rule === 2) expected.count = frames[3].count % 5 + 1;
    if (rule === 3 || rule === 5) expected.filled = !frames[3].filled;
    if (rule === 4) expected.shape = shapeCycle[(shapeCycle.indexOf(frames[3].shape) + 1) % 3] as Figure['shape'];
    assert.deepEqual(q.visual!.choices[q.answer], expected);
  }
});

test('Séances chronométrées : formats, échéance absolue et correction unique après fermeture', () => {
  const now = 1_800_000_000_000;
  for (const [category, count, minutes] of [['verbal', 20, 35], ['numerical', 10, 20], ['abstract', 10, 10]] as const) {
    const session = startTest(category, 'timed', 10, 45, [], now);
    assert.equal(session.questions.length, count); assert.equal(session.deadline, now + minutes * 60000);
    session.answers[0] = session.questions[0].answer;
    const before = { ...emptyTraining(), session };
    assert.equal(expireTest(before, session.deadline! - 1), before);
    const after = expireTest(decodeTraining(JSON.stringify(before)), session.deadline! + 50000);
    assert.equal(after.history[0].correct, 1); assert.equal(after.history[0].total, count);
    assert.equal(after.history[0].seconds, minutes * 60); assert.equal(after.mistakes.length, count - 1);
    assert.deepEqual(expireTest(after, session.deadline! + 100000), after);
  }
});

test('Un arrêt libre ne compte que les réponses vérifiées et les erreurs se révisent', () => {
  const session = startTest('digital', 'practice', 10, 88, [], 1000);
  session.answers[0] = session.questions[0].answer; session.checked[0] = true;
  session.answers[1] = (session.questions[1].answer + 1) % 4; session.checked[1] = true;
  session.answers[2] = session.questions[2].answer;
  const result = finishTest({ ...emptyTraining(), session }, 61000);
  assert.equal(result.history[0].total, 2); assert.equal(result.history[0].correct, 1);
  assert.equal(result.seen.length, 2); assert.equal(result.mistakes.length, 1);
  const review = reviewTest(result.mistakes, 65000);
  review.answers[0] = review.questions[0].answer; review.checked[0] = true;
  const revised = finishTest({ ...result, session: review }, 100000);
  assert.equal(revised.mistakes.length, 0); assert.equal(revised.history.length, 2);
  assert.deepEqual(finishTest(revised, 150000), revised);
});

test('Reprise et import : conservation des réponses, refus des données incohérentes', () => {
  const session = startTest('abstract', 'practice', 10, 33, [], 1000);
  session.answers[0] = 2; session.checked[0] = true; session.index = 1;
  const valid = { ...emptyTraining(), session };
  assert.deepEqual(decodeTraining(JSON.stringify(valid)), valid);
  for (const change of [
    (x: any) => { x.version = 2; }, (x: any) => { x.session.questions[0].answer = 4; },
    (x: any) => { x.session.questions[0].visual.choices[0].count = 100; },
    (x: any) => { x.session.answers.pop(); }, (x: any) => { x.session.index = 10; },
    (x: any) => { x.session.checked[2] = true; }, (x: any) => { x.session.deadline = 10000; },
    (x: any) => { x.session.questions[0].source = { title: 'Source', url: 'javascript:alert(1)' }; },
  ]) { const bad = structuredClone(valid); change(bad); assert.throws(() => decodeTraining(JSON.stringify(bad))); }
});
