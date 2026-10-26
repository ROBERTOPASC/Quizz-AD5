import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons, studyPlan } from '../src/math/curriculum';
import { generateExercise, variantCounts } from '../src/math/exercises';
import { Attempt, createSession, datedPlan, daysUntil, decodeProgress, expireSession, finishSession, initialProgress, isCorrect, mergeAttempts, parseAnswer, todayInParis, topicStatus, unresolvedMistakes } from '../src/math/progress';

// Résultats recalculés à partir des énoncés fixes, dont les pièges usuels.
const expected: Record<string, number[]> = {
  arithmetic: [7.75, -2, 0.4, 10, 20, 77], fractions: [0.7, 0.65, 0.27, 3.33, 780],
  powers: [500000, 9, 2500, 3600], proportion: [20, 9, 2.5], percent: [104, 35, 1400],
  ratios: [10, 18, 33.33], change: [1404, -35, 252], successive: [1375.92, -12.25, 2300.24],
  reverse: [1300, 2000, 21.95], points: [5, 90, 2.5], averages: [7, 15, 1410],
  units: [500, 2.15, 10000, 1000, 17], rates: [20, 4.5, 53.33, 7], currency: [1560, 2000, 1400, 7.41],
  indices: [1404, 9.17, 4], equations: [13, 24, 347], tables: [33.33, 20, 1100], multi: [2808, 1400, 1180.8],
};

for (const [topic, answers] of Object.entries(expected)) {
  test(`Calculs de référence : ${topic}`, () => answers.forEach((answer, seed) => assert.equal(generateExercise(topic, seed, 2).answer, answer)));
}

test('Les 18 notions sont enseignées, exercées et planifiées', () => {
  assert.equal(lessons.length, 18);
  assert.equal(new Set(lessons.map(l => l.id)).size, 18);
  assert.deepEqual(lessons.map(l => l.id).sort(), Object.keys(variantCounts).sort());
  assert.deepEqual([...new Set(studyPlan.flatMap(d => d.topics))].sort(), lessons.map(l => l.id).sort());
  for (const lesson of lessons) assert.ok(lesson.rules.length >= 4 && lesson.example.steps.length >= 2 && lesson.trap);
});

test('8 100 exercices : résultat fini, 4 choix distincts et une seule bonne réponse', () => {
  for (const lesson of lessons) for (const level of [1, 2, 3] as const) for (let seed = 0; seed < 150; seed++) {
    const q = generateExercise(lesson.id, seed, level);
    assert.ok(Number.isFinite(q.answer), q.id);
    assert.equal(q.options.length, 4, q.id);
    assert.equal(new Set(q.options).size, 4, q.id);
    assert.equal(q.options.filter(option => isCorrect(q, String(option))).length, 1, q.id);
    assert.ok(q.steps.length >= 2 && q.hint && q.prompt, q.id);
    assert.deepEqual(q, generateExercise(lesson.id, seed, level));
    if (q.unit === 'dossiers' && q.topic !== 'averages') assert.equal(q.answer % 1, 0, q.id);
  }
});

test('Les tableaux utilisent les bonnes colonnes et les bons totaux', () => {
  for (let seed = 0; seed < 100; seed++) {
    const q = generateExercise('tables', seed, 3), rows = q.table!.rows;
    const before = rows.reduce((sum, row) => sum + Number(row[1]), 0);
    const after = rows.reduce((sum, row) => sum + Number(row[2]), 0);
    const oracle = q.variant === 0 ? (after - before) / before * 100 : q.variant === 1 ? Number(rows[1][2]) / after * 100 : Number(rows[0][2]) + Number(rows[1][2]) - Number(rows[2][2]);
    assert.ok(isCorrect(q, String(oracle)));
  }
});

test('Saisie française, fractions, zéro et valeurs invalides', () => {
  for (const [text, expected] of [['1 234,50', 1234.5], ['1\u202f234,5', 1234.5], ['−2,5', -2.5], ['3/4', .75], ['25 %', 25], ['0', 0], ['.5', .5]] as const) assert.equal(parseAnswer(text), expected);
  for (const invalid of ['', '1/0', '1,2,3', '2+2', 'Infinity', 'NaN', '1;alert(1)', '12 euros']) assert.equal(parseAnswer(invalid), null);
  assert.ok(isCorrect(generateExercise('fractions', 2, 2), '4/15'));
  assert.ok(!isCorrect(generateExercise('arithmetic', 4, 2), '20%'));
  assert.ok(!isCorrect(generateExercise('arithmetic', 4, 2), '19,99'));
});

test('Diagnostic complet et simulation au format numérique, avec variations entre séries', () => {
  const diagnostic = createSession('diagnostic', ['arithmetic'], 2, 42, 100);
  assert.equal(diagnostic.questions.length, 18);
  assert.equal(new Set(diagnostic.questions.map(q => q.topic)).size, 18);
  assert.equal(diagnostic.deadline, null);
  const exam = createSession('exam', ['arithmetic'], 2, 42, 100);
  assert.equal(exam.questions.length, 10);
  assert.equal(exam.deadline, 1200100);
  assert.ok(exam.questions.filter(q => q.table).length >= 2);
  assert.notDeepEqual(exam.questions, createSession('exam', ['arithmetic'], 2, 43, 100).questions);
  for (const id of ['equations', 'rates', 'currency']) {
    const answers = new Set(Array.from({ length: 100 }, (_, i) => generateExercise(id, i * 12 + (id === 'equations' ? 1 : 3), 2).answer));
    assert.ok(answers.size >= 4, id);
  }
});

test('Une simulation expirée au rechargement est corrigée une seule fois', () => {
  const p = initialProgress(); p.session = createSession('exam', ['percent'], 2, 42, 1000);
  p.session.responses[0].text = String(p.session.questions[0].answer);
  assert.strictEqual(expireSession(p, 1200999), p);
  const expired = expireSession(p, 1202000);
  assert.equal(expired.session!.finishedAt, 1201000);
  assert.equal(expired.session!.reason, 'timeout');
  assert.equal(expired.attempts.length, 10);
  assert.equal(expired.attempts.filter(a => a.correct).length, 1);
  assert.equal(expired.attempts[0].seconds, 1200);
  assert.strictEqual(expireSession(expired, 1203000), expired);
  assert.equal(finishSession(expired).attempts.length, 10);
  assert.equal(decodeProgress(JSON.stringify(p)).attempts.length, 10);
});

test('Une séance interrompue ne pénalise pas les exercices non travaillés', () => {
  const p = initialProgress(); p.session = createSession('practice', ['percent'], 2, 42, 1000);
  p.session.responses[0] = { text: String(p.session.questions[0].answer), checked: true, hinted: false, seconds: 12 };
  const ended = finishSession(p, 13000);
  assert.equal(ended.attempts.length, 1);
  assert.equal(ended.attempts[0].correct, true);
  assert.equal(ended.session!.responses.filter(r => r.checked).length, 1);
});

const attempt = (seed: number, sessionId: string, correct = true, hinted = false): Attempt => {
  const exercise = generateExercise('percent', seed, 2);
  return { id: `${sessionId}:${seed}`, sessionId, exercise, response: correct ? String(exercise.answer) : '', correct, hinted, at: seed * 1000, seconds: 20 };
};
test('La maîtrise exige des réussites variées, autonomes et dans plusieurs séances', () => {
  const independent = [0, 1, 2, 3, 4].map((seed, i) => attempt(seed, i < 3 ? 'one' : 'two'));
  assert.equal(topicStatus('percent', independent).solid, true);
  assert.equal(topicStatus('percent', independent.map(a => ({ ...a, hinted: true }))).solid, false);
  assert.equal(topicStatus('percent', independent.map(a => ({ ...a, sessionId: 'one' }))).solid, false);
  assert.equal(topicStatus('percent', [0, 3, 6, 9, 12].map(s => attempt(s, String(s)))).solid, false);
  assert.equal(topicStatus('percent', [attempt(0, 'a'), attempt(0, 'b'), attempt(0, 'c'), attempt(0, 'd'), attempt(0, 'e')]).solid, false);
  assert.equal(topicStatus('percent', [...independent, attempt(5, 'three', false), attempt(6, 'three', false)]).solid, false);
  const twoFullSessions = Array.from({ length: 12 }, (_, seed) => attempt(seed, seed < 6 ? 'first' : 'second'));
  assert.equal(topicStatus('percent', twoFullSessions).solid, true);
});

test('Le carnet conserve une difficulté jusqu’à une réussite sans indice du même type', () => {
  assert.equal(unresolvedMistakes([attempt(0, 'a', false)]).length, 1);
  assert.equal(unresolvedMistakes([attempt(0, 'a', false), attempt(3, 'b', true, true)]).length, 1);
  assert.equal(unresolvedMistakes([attempt(0, 'a', false), attempt(3, 'b', true)]).length, 0);
  assert.equal(unresolvedMistakes([attempt(0, 'a', false), attempt(1, 'b', true)]).length, 1);
  assert.equal(mergeAttempts([attempt(0, 'a')], [attempt(0, 'a')]).length, 1);
});

test('Sauvegarde valide, import refusé si incohérent, dates parisiennes et calendrier', () => {
  const p = initialProgress(); p.attempts = [attempt(0, 'one')];
  p.session = createSession('practice', ['arithmetic'], 1, 42);
  assert.deepEqual(decodeProgress(JSON.stringify(p)), JSON.parse(JSON.stringify(p)));
  assert.throws(() => decodeProgress('{broken'));
  assert.throws(() => decodeProgress(JSON.stringify({ ...p, examDate: '2026-02-31' })));
  assert.throws(() => decodeProgress(JSON.stringify({ ...p, attempts: [{ ...p.attempts[0], correct: false }] })));
  const wrong = structuredClone(p); wrong.session!.questions[0].answer = 999999;
  assert.throws(() => decodeProgress(JSON.stringify(wrong)));
  assert.equal(daysUntil('2026-11-09', '2026-10-26'), 14);
  assert.equal(daysUntil('2026-11-09', '2026-11-09'), 0);
  assert.equal(daysUntil('2026-11-09', '2026-11-10'), -1);
  assert.equal(todayInParis(new Date('2026-10-26T23:30:00Z')), '2026-10-27');
  assert.equal(datedPlan('2026-11-09')[0].date, '2026-10-26');
  assert.equal(datedPlan('2026-11-09')[13].date, '2026-11-08');
});
