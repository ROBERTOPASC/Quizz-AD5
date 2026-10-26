import { makeQuestions } from './generator';
import { Category, categories, TrainingQuestion } from './types';

export const TRAINING_KEY = 'epso_ready_tests_v1';
export type TestMode = 'practice' | 'timed' | 'review';
export interface TestSession {
  id: string; category: Category; mode: TestMode; questions: TrainingQuestion[];
  answers: (number | null)[]; checked: boolean[]; index: number;
  startedAt: number; deadline: number | null; finishedAt: number | null; expired: boolean;
}
export interface TestResult { id: string; category: Category; mode: TestMode; date: number; correct: number; total: number; seconds: number }
export interface TrainingState {
  version: 1; session: TestSession | null; history: TestResult[]; seen: string[];
  mistakes: TrainingQuestion[];
}
export const emptyTraining = (): TrainingState => ({ version: 1, session: null, history: [], seen: [], mistakes: [] });
export function startTest(category: Category, mode: 'practice' | 'timed', count: number, seed: number, seen: string[], now = Date.now()): TestSession {
  const info = categories.find(c => c.id === category)!;
  const size = mode === 'timed' ? info.count ?? 20 : count;
  const questions = makeQuestions(category, size, seed, seen, mode === 'timed');
  return { id: `${now}-${seed}`, category, mode, questions, answers: questions.map(() => null), checked: questions.map(() => false), index: 0, startedAt: now, deadline: mode === 'timed' ? now + (info.minutes ?? 20) * 60000 : null, finishedAt: null, expired: false };
}
export function reviewTest(questions: TrainingQuestion[], now = Date.now()): TestSession {
  if (!questions.length) throw new Error('Aucune erreur à revoir');
  return { id: `review-${now}`, category: questions[0].category, mode: 'review', questions: questions.slice(0, 24), answers: questions.slice(0, 24).map(() => null), checked: questions.slice(0, 24).map(() => false), index: 0, startedAt: now, deadline: null, finishedAt: null, expired: false };
}
export function finishTest(state: TrainingState, now = Date.now(), expired = false): TrainingState {
  const session = state.session;
  if (!session || session.finishedAt !== null) return state;
  const finished = { ...session, finishedAt: now, expired };
  const tested = session.questions.filter((_, i) => session.mode === 'timed' || session.checked[i]);
  const correct = session.questions.filter((q, i) => (session.mode === 'timed' || session.checked[i]) && session.answers[i] === q.answer).length;
  const mistakes = new Map(state.mistakes.map(q => [q.id, q]));
  session.questions.forEach((q, i) => {
    if (session.mode !== 'timed' && !session.checked[i]) return;
    if (session.answers[i] === q.answer) mistakes.delete(q.id); else mistakes.set(q.id, q);
  });
  const result: TestResult = { id: session.id, category: session.category, mode: session.mode, date: now, correct, total: tested.length, seconds: Math.max(0, Math.floor(((expired ? session.deadline! : now) - session.startedAt) / 1000)) };
  return { ...state, session: finished, mistakes: [...mistakes.values()].slice(-200), seen: [...new Set([...state.seen, ...tested.map(q => q.id)])].slice(-2000), history: tested.length ? [...state.history.filter(r => r.id !== session.id), result].slice(-120) : state.history };
}
export function expireTest(state: TrainingState, now = Date.now()): TrainingState {
  return state.session?.finishedAt === null && state.session.deadline !== null && now >= state.session.deadline ? finishTest(state, now, true) : state;
}

const obj = (x: unknown): x is Record<string, any> => Boolean(x && typeof x === 'object' && !Array.isArray(x));
const integer = (x: unknown, min: number, max: number): x is number => Number.isInteger(x) && Number(x) >= min && Number(x) <= max;
const str = (x: unknown, max = 20000): x is string => typeof x === 'string' && x.length > 0 && x.length <= max;
const isCategory = (x: unknown): x is Category => categories.some(c => c.id === x);
const isMode = (x: unknown): x is TestMode => ['practice', 'timed', 'review'].includes(String(x));
function validQuestion(q: unknown): q is TrainingQuestion {
  if (!obj(q) || !str(q.id, 200) || !isCategory(q.category) || !str(q.prompt) || !str(q.explanation) || !Array.isArray(q.options) || q.options.length !== 4 || !q.options.every(x => str(x, 2000)) || new Set(q.options).size !== 4 || !integer(q.answer, 0, 3)) return false;
  if (q.context !== undefined && !str(q.context)) return false;
  if (q.source !== undefined && (!obj(q.source) || !str(q.source.title, 200) || !str(q.source.url, 2000) || !/^https:\/\//.test(q.source.url))) return false;
  if (q.table !== undefined && (!obj(q.table) || !str(q.table.caption, 1000) || !Array.isArray(q.table.headers) || !q.table.headers.length || q.table.headers.length > 10 || !q.table.headers.every(h => str(h, 300)) || !Array.isArray(q.table.rows) || q.table.rows.length > 30 || !q.table.rows.every(row => Array.isArray(row) && row.length === q.table.headers.length && row.every(cell => typeof cell === 'number' ? Number.isFinite(cell) : str(cell, 300))))) return false;
  if (q.visual !== undefined) {
    if (!obj(q.visual) || !Array.isArray(q.visual.sequence) || q.visual.sequence.length !== 4 || !Array.isArray(q.visual.choices) || q.visual.choices.length !== 4) return false;
    if (![...q.visual.sequence, ...q.visual.choices].every(f => obj(f) && ['arrow', 'circle', 'square', 'triangle'].includes(f.shape) && integer(f.rotation, 0, 359) && typeof f.filled === 'boolean' && integer(f.count, 1, 5) && integer(f.position, 0, 7))) return false;
  }
  return q.category !== 'abstract' || Boolean(q.visual);
}
export function decodeTraining(raw: string): TrainingState {
  if (raw.length > 5_000_000) throw new Error('Sauvegarde trop volumineuse');
  const state: unknown = JSON.parse(raw);
  if (!obj(state) || state.version !== 1 || !Array.isArray(state.history) || state.history.length > 120 || !Array.isArray(state.seen) || state.seen.length > 2000 || !state.seen.every(id => str(id, 200)) || !Array.isArray(state.mistakes) || state.mistakes.length > 200 || !state.mistakes.every(validQuestion)) throw new Error('Sauvegarde de tests non reconnue');
  if (!state.history.every(r => obj(r) && str(r.id, 200) && isCategory(r.category) && isMode(r.mode) && integer(r.total, 1, 24) && integer(r.correct, 0, r.total) && integer(r.date, 0, Number.MAX_SAFE_INTEGER) && integer(r.seconds, 0, Number.MAX_SAFE_INTEGER))) throw new Error('Historique invalide');
  const s = state.session;
  if (s !== null) {
    if (!obj(s) || !str(s.id, 200) || !isCategory(s.category) || !isMode(s.mode) || !Array.isArray(s.questions) || s.questions.length < 1 || s.questions.length > 24 || !s.questions.every(validQuestion) || new Set(s.questions.map(q => q.id)).size !== s.questions.length || !Array.isArray(s.answers) || s.answers.length !== s.questions.length || !s.answers.every(a => a === null || integer(a, 0, 3)) || !Array.isArray(s.checked) || s.checked.length !== s.questions.length || !s.checked.every(c => typeof c === 'boolean') || !integer(s.index, 0, s.questions.length - 1) || !integer(s.startedAt, 0, Number.MAX_SAFE_INTEGER) || !(s.deadline === null || integer(s.deadline, s.startedAt + 1, Number.MAX_SAFE_INTEGER)) || !(s.finishedAt === null || integer(s.finishedAt, s.startedAt, Number.MAX_SAFE_INTEGER)) || typeof s.expired !== 'boolean') throw new Error('Séance invalide');
    if ((s.mode === 'timed') !== (s.deadline !== null) || s.checked.some((checked, i) => checked && s.answers[i] === null)) throw new Error('Réponses invalides');
  }
  return state as unknown as TrainingState;
}
