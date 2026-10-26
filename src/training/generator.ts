import { formatNumber, generateExercise, seededRandom, variantCounts } from '../math/exercises';
import { digitalQuestions, englishQuestions, euQuestions } from './knowledge';
import { verbalQuestions } from './verbal';
import { Category, Figure, TrainingQuestion } from './types';

export const banks = { verbal: verbalQuestions, eu: euQuestions, digital: digitalQuestions, english: englishQuestions };
export function shuffled<T>(values: T[], seed: number): T[] {
  const random = seededRandom(seed), result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function shuffleOptions(question: TrainingQuestion, seed: number): TrainingQuestion {
  const order = shuffled([0, 1, 2, 3], seed);
  return { ...question, options: order.map(i => question.options[i]), answer: order.indexOf(question.answer),
    ...(question.visual ? { visual: { sequence: question.visual.sequence, choices: order.map(i => question.visual!.choices[i]) } } : {}) };
}

// Six règles visuelles, avec huit positions sur le pourtour et des rotations de 45°.
export function abstractQuestion(seed: number): TrainingQuestion {
  const random = seededRandom(seed), rule = seed % 6;
  const rotation = Math.floor(random() * 8) * 45, position = Math.floor(random() * 8);
  const start = Math.floor(random() * 5), direction = random() < 0.5 ? 1 : -1;
  const shapes: Figure['shape'][] = ['circle', 'square', 'triangle'];
  const at = (i: number): Figure => ({
    shape: rule === 4 ? shapes[(start + i) % 3] : rule === 0 || rule === 5 ? 'arrow' : 'circle',
    rotation: rule === 0 || rule === 5 ? (rotation + 360 + direction * 45 * i) % 360 : 0,
    filled: rule === 3 || rule === 5 ? i % 2 === 0 : true,
    count: rule === 2 ? (start + i) % 5 + 1 : 1,
    position: rule === 1 ? (position + 16 + direction * i) % 8 : position,
  });
  const correct = at(4);
  const choices: Figure[] = [correct];
  if (rule === 0) [45, 90, 180].forEach(delta => choices.push({ ...correct, rotation: (correct.rotation + delta) % 360 }));
  if (rule === 1) [1, 2, 4].forEach(delta => choices.push({ ...correct, position: (correct.position + delta) % 8 }));
  if (rule === 2) [1, 2, 3].forEach(delta => choices.push({ ...correct, count: (correct.count - 1 + delta) % 5 + 1 }));
  if (rule === 3) choices.push({ ...correct, filled: !correct.filled }, { ...correct, filled: !correct.filled, count: 2 }, { ...correct, count: 2 });
  if (rule === 4) choices.push({ ...correct, shape: shapes[(shapes.indexOf(correct.shape) + 1) % 3] }, { ...correct, shape: shapes[(shapes.indexOf(correct.shape) + 2) % 3] }, { ...correct, filled: false });
  if (rule === 5) choices.push({ ...correct, rotation: (correct.rotation + 90) % 360 }, { ...correct, filled: !correct.filled }, { ...correct, rotation: (correct.rotation + 90) % 360, filled: !correct.filled });
  const explanations = [
    `La flèche tourne de 45° à chaque étape, dans le sens ${direction === 1 ? 'des aiguilles d’une montre' : 'inverse des aiguilles d’une montre'}. Le point et le remplissage ne changent pas.`,
    `Le petit point avance d’une position sur les huit positions du pourtour, dans le sens ${direction === 1 ? 'des aiguilles d’une montre' : 'inverse des aiguilles d’une montre'}. La figure centrale reste identique.`,
    'Le nombre de petits traits en bas augmente de un ; après cinq, la suite repart à un. La position du point et la figure centrale ne changent pas.',
    'La figure centrale alterne entre pleine et vide. Le point et le nombre de traits restent fixes.',
    'Les formes suivent le cycle cercle → carré → triangle → cercle. Le remplissage, le point et le nombre de traits restent fixes.',
    `Deux règles s’appliquent ensemble : une rotation de 45° dans le sens ${direction === 1 ? 'des aiguilles d’une montre' : 'inverse des aiguilles d’une montre'} et une alternance plein/vide.`,
  ];
  return { id: `abstract-${seed}`, category: 'abstract', prompt: 'Quelle figure prolonge la suite ? Repérez les éléments qui changent et ceux qui restent fixes.', options: ['A', 'B', 'C', 'D'], answer: 0, explanation: explanations[rule], visual: { sequence: [0, 1, 2, 3].map(at), choices } };
}

export function makeQuestions(category: Category, count: number, seed: number, seen: string[] = [], timed = false): TrainingQuestion[] {
  if (!Number.isInteger(count) || count < 1 || count > 24 || !Number.isSafeInteger(seed) || seed < 0) throw new Error('Séance invalide');
  let questions: TrainingQuestion[];
  if (category === 'numerical') {
    const topics = shuffled(timed ? ['tables', 'percent', 'ratios', 'change', 'averages', 'rates', 'currency', 'indices', 'reverse', 'multi', 'units', 'successive'] : Object.keys(variantCounts), seed);
    questions = Array.from({ length: count }, (_, i) => {
      const exercise = generateExercise(topics[i % topics.length], (seed + i * 997) % 2147483647, 2);
      return { id: `numerical-${exercise.id}`, category, prompt: exercise.prompt, options: exercise.options.map(x => `${formatNumber(x)} ${exercise.unit}`.trim()), answer: exercise.options.indexOf(exercise.answer), explanation: exercise.steps.join('\n'), ...(exercise.table ? { table: exercise.table } : {}) };
    });
  } else if (category === 'abstract') {
    questions = Array.from({ length: count }, (_, i) => abstractQuestion((seed + i * 997) % 2147483647));
  } else {
    const pool = shuffled(banks[category], seed);
    const unseen = pool.filter(q => !seen.includes(q.id)), known = pool.filter(q => seen.includes(q.id));
    questions = [...unseen, ...known].slice(0, count);
  }
  return questions.map((q, i) => shuffleOptions(q, seed + i * 31));
}
