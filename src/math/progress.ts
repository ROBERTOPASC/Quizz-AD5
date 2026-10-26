import { lessons, studyPlan } from './curriculum';
import { Exercise, Level, generateExercise, roundAnswer, seededRandom, variantCounts } from './exercises';

export const STORAGE_KEY = 'epso_math_course_v1';
export type Mode = 'practice' | 'diagnostic' | 'exam' | 'review';
export interface Response { text: string; hinted: boolean; checked: boolean; seconds: number }
export interface Session {
  id: string; mode: Mode; questions: Exercise[]; responses: Response[];
  index: number; startedAt: number; questionStartedAt: number; deadline: number | null;
  finishedAt: number | null; reason?: 'submitted' | 'timeout';
}
export interface Attempt {
  id: string; sessionId: string; exercise: Exercise; response: string;
  correct: boolean; hinted: boolean; at: number; seconds: number;
}
export interface MathProgress {
  version: 1; examDate: string; dailyMinutes: number; selectedLesson: string;
  view: 'overview' | 'lesson' | 'session' | 'mistakes' | 'formulas';
  attempts: Attempt[]; session: Session | null;
}
export const initialProgress = (): MathProgress => ({
  version: 1, examDate: '2026-11-09', dailyMinutes: 60, selectedLesson: 'arithmetic',
  view: 'overview', attempts: [], session: null,
});

export function parseAnswer(text: string): number | null {
  const compact = text.trim().replace(/[\s\u00a0\u202f]/g, '').replace(/−/g, '-').replace(/,/g, '.');
  // Aucun calcul arbitraire : seulement un nombre signé, ou une fraction.
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:\/[+-]?(?:\d+(?:\.\d*)?|\.\d+))?%?$/.test(compact)) return null;
  const [numerator, denominator] = compact.replace(/%$/, '').split('/').map(Number);
  if (denominator === 0) return null;
  const result = denominator === undefined ? numerator : numerator / denominator;
  return Number.isFinite(result) ? result : null;
}
export function isCorrect(question: Exercise, text: string) {
  if (text.trim().endsWith('%') && question.unit !== '%') return false;
  const value = parseAnswer(text);
  return value !== null && Math.abs(roundAnswer(value) - question.answer) < 0.000001;
}

export function createSession(mode: Mode, topics: string[], level: Level, seed: number, now = Date.now()): Session {
  const known = topics.filter(id => variantCounts[id]);
  if (!known.length) throw new Error('Choisir au moins une notion');
  const rng = seededRandom(seed);
  const shuffle = <T,>(list: T[]) => list.map(item => ({ item, key: rng() })).sort((a, b) => a.key - b.key).map(entry => entry.item);
  let chosen: string[];
  if (mode === 'exam') {
    // Dix situations appliquées, avec tableaux et plusieurs familles à chaque série.
    chosen = shuffle(['tables', 'tables', 'percent', 'change', 'reverse', 'averages', 'ratios', 'rates', 'currency', 'multi']);
  } else if (mode === 'diagnostic') {
    chosen = lessons.map(lesson => lesson.id);
  } else {
    chosen = Array.from({ length: 6 }, (_, i) => known[i % known.length]);
  }
  const questions = chosen.map((topic, index) => generateExercise(topic, (seed + index * 7919) >>> 0, mode === 'exam' ? 3 : level));
  return {
    id: `math-${now}-${seed}`, mode, questions,
    responses: questions.map(() => ({ text: '', hinted: false, checked: false, seconds: 0 })),
    index: 0, startedAt: now, questionStartedAt: now,
    deadline: mode === 'exam' ? now + 20 * 60 * 1000 : null, finishedAt: null,
  };
}

export function attemptFor(session: Session, index: number, now: number): Attempt {
  const response = session.responses[index];
  return { id: `${session.id}:${index}`, sessionId: session.id, exercise: session.questions[index],
    response: response.text, correct: isCorrect(session.questions[index], response.text), hinted: response.hinted,
    seconds: response.seconds, at: now };
}
export function mergeAttempts(old: Attempt[], incoming: Attempt[]) {
  // Une validation ne peut créditer deux fois la même réponse.
  const unique = new Map(old.map(attempt => [attempt.id, attempt]));
  for (const attempt of incoming) if (!unique.has(attempt.id)) unique.set(attempt.id, attempt);
  return [...unique.values()].slice(-1000);
}
export function finishSession(progress: MathProgress, now = Date.now(), reason: 'submitted' | 'timeout' = 'submitted'): MathProgress {
  const current = progress.session;
  if (!current || current.finishedAt !== null) return progress;
  const stop = current.deadline ? Math.min(now, current.deadline) : now;
  const responses = current.responses.map((response, i) => ({ ...response,
    seconds: response.seconds + (i === current.index && !response.checked ? Math.max(0, Math.round((stop - current.questionStartedAt) / 1000)) : 0),
    checked: current.mode === 'exam' || current.mode === 'diagnostic' ? true : response.checked,
  }));
  const session = { ...current, responses, finishedAt: stop, reason };
  return { ...progress, session, attempts: mergeAttempts(progress.attempts, session.questions.flatMap((_, i) => responses[i].checked ? [attemptFor(session, i, stop)] : [])) };
}
export function expireSession(progress: MathProgress, now = Date.now()) {
  return progress.session?.deadline && progress.session.finishedAt === null && now >= progress.session.deadline
    ? finishSession(progress, now, 'timeout') : progress;
}
export function topicStatus(topic: string, attempts: Attempt[]) {
  const relevant = attempts.filter(attempt => attempt.exercise.topic === topic);
  const unique = new Map<string, Attempt>();
  // Une question déjà rencontrée ne compte qu’une fois dans l’indicateur de maîtrise.
  for (const attempt of relevant) if (!unique.has(attempt.exercise.id)) unique.set(attempt.exercise.id, attempt);
  const recent = [...unique.values()].slice(-5);
  const successes = recent.filter(attempt => attempt.correct && !attempt.hinted);
  const varied = new Set(successes.map(attempt => attempt.exercise.variant)).size >= Math.min(3, variantCounts[topic]);
  const sessions = new Set([...unique.values()].slice(-10).filter(attempt => attempt.correct && !attempt.hinted).map(attempt => attempt.sessionId)).size >= 2;
  const advanced = successes.some(attempt => attempt.exercise.level >= 2);
  const solid = recent.length >= 5 && successes.length >= 4 && varied && sessions && advanced;
  const label = solid ? 'Solide' : relevant.length === 0 ? 'À découvrir' : successes.length >= 3 ? 'À confirmer' : 'À renforcer';
  return { label, solid, count: recent.length, successes: successes.length, total: relevant.length };
}
export function unresolvedMistakes(attempts: Attempt[]) {
  const latest = new Map<string, Attempt>();
  for (const attempt of attempts) latest.set(`${attempt.exercise.topic}:${attempt.exercise.variant}`, attempt);
  return [...latest.values()].filter(attempt => !attempt.correct || attempt.hinted).reverse();
}
export const todayInParis = (now = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(now);
export function daysUntil(date: string, today = todayInParis()) {
  return Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000);
}
export function datedPlan(examDate: string) {
  const date = Date.parse(`${examDate}T12:00:00Z`);
  return studyPlan.map((day, i) => ({ ...day, date: new Date(date - (14 - i) * 86400000).toISOString().slice(0, 10) }));
}

function validExercise(value: unknown): value is Exercise {
  if (!value || typeof value !== 'object') return false;
  const q = value as Exercise;
  if (!variantCounts[q.topic] || !Number.isInteger(q.seed) || q.seed < 0 || q.seed > 0xffffffff || ![1, 2, 3].includes(q.level)) return false;
  // Écarte une sauvegarde altérée ou incompatible avec cette version des exercices.
  return JSON.stringify(q) === JSON.stringify(generateExercise(q.topic, q.seed, q.level));
}
export function decodeProgress(raw: string): MathProgress {
  const p = JSON.parse(raw) as MathProgress;
  if (!p || p.version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(p.examDate) || !Number.isFinite(Date.parse(`${p.examDate}T12:00:00Z`)) || new Date(`${p.examDate}T12:00:00Z`).toISOString().slice(0, 10) !== p.examDate || ![30, 60, 120].includes(p.dailyMinutes) || !variantCounts[p.selectedLesson] || !['overview', 'lesson', 'session', 'mistakes', 'formulas'].includes(p.view) || !Array.isArray(p.attempts) || p.attempts.length > 1000) throw new Error('Sauvegarde de maths invalide');
  if (p.attempts.some(a => !a || typeof a.id !== 'string' || typeof a.sessionId !== 'string' || !validExercise(a.exercise) || typeof a.response !== 'string' || typeof a.hinted !== 'boolean' || typeof a.correct !== 'boolean' || a.correct !== isCorrect(a.exercise, a.response) || !Number.isFinite(a.at) || !Number.isFinite(a.seconds) || a.seconds < 0)) throw new Error('Historique de maths invalide');
  const s = p.session;
  if (s) {
    if (typeof s.id !== 'string' || !['practice', 'diagnostic', 'exam', 'review'].includes(s.mode) || !Array.isArray(s.questions) || !s.questions.length || s.questions.length > 18 || s.questions.some(q => !validExercise(q)) || !Array.isArray(s.responses) || s.responses.length !== s.questions.length || s.responses.some(r => !r || typeof r.text !== 'string' || typeof r.hinted !== 'boolean' || typeof r.checked !== 'boolean' || !Number.isFinite(r.seconds) || r.seconds < 0) || !Number.isInteger(s.index) || s.index < 0 || s.index >= s.questions.length || !Number.isFinite(s.startedAt) || !Number.isFinite(s.questionStartedAt) || (s.finishedAt !== null && !Number.isFinite(s.finishedAt)) || (s.mode === 'exam' ? s.deadline !== s.startedAt + 1200000 : s.deadline !== null)) throw new Error('Séance de maths invalide');
  }
  return expireSession(p);
}
