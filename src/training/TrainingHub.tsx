import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Brain, Calculator, CheckCircle, Clock, Download, Globe, Languages, Monitor, Play, RotateCcw, Upload, XCircle } from 'lucide-react';
import { decodeProgress, STORAGE_KEY } from '../math/progress';
import { Category, categories, Figure, TrainingQuestion } from './types';
import { decodeTraining, emptyTraining, expireTest, finishTest, reviewTest, startTest, TRAINING_KEY, TrainingState } from './state';
import TabletPanel from './TabletPanel';
import './training.css';

const titleFor = (category: Category) => categories.find(c => c.id === category)!.title;
const icons = { numerical: Calculator, verbal: BookOpen, abstract: Brain, eu: Globe, digital: Monitor, english: Languages };
const letters = ['A', 'B', 'C', 'D'];
const timeLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const modeLabel = (mode: string) => mode === 'timed' ? 'Chronométré' : mode === 'review' ? 'Révision des erreurs' : 'Entraînement';

function readState() {
  try { const raw = localStorage.getItem(TRAINING_KEY); return { state: raw ? expireTest(decodeTraining(raw)) : emptyTraining(), error: '' }; }
  catch { return { state: emptyTraining(), error: 'Le suivi enregistré est inaccessible ou illisible. Il est conservé. Vous pouvez exporter cette séance ou importer une sauvegarde valide.' }; }
}

export function PatternFigure({ figure, label }: { figure: Figure; label: string }) {
  const angle = (figure.position * 45 - 90) * Math.PI / 180;
  const color = '#183e48', fill = figure.filled ? color : '#fff';
  return <svg viewBox="0 0 100 112" role="img" aria-label={label} className="tests-figure">
    <rect x="1" y="1" width="98" height="110" rx="10" fill="#fff" stroke="#becbce" />
    <circle cx="50" cy="46" r="37" fill="none" stroke="#e2e8ea" strokeDasharray="2 5" />
    <circle cx={50 + 37 * Math.cos(angle)} cy={46 + 37 * Math.sin(angle)} r="4" fill="#ba6c20" />
    <g transform={`translate(50 46) rotate(${figure.rotation})`} stroke={color} strokeWidth="2.5" fill={fill} strokeLinejoin="round">
      {figure.shape === 'arrow' && <path d="M 0 -22 L 17 -4 L 7 -4 L 7 20 L -7 20 L -7 -4 L -17 -4 Z" />}
      {figure.shape === 'circle' && <circle r="19" />}
      {figure.shape === 'square' && <rect x="-18" y="-18" width="36" height="36" />}
      {figure.shape === 'triangle' && <path d="M 0 -22 L 21 17 L -21 17 Z" />}
    </g>
    {Array.from({ length: figure.count }, (_, i) => <rect key={i} x={50 - figure.count * 5 + i * 10} y="96" width="6" height="5" rx="1" fill={color} />)}
  </svg>;
}

function QuestionMaterial({ question }: { question: TrainingQuestion }) {
  return <>
    {question.context && <div className="tests-passage"><span>Texte de référence · situation fictive</span><p>{question.context}</p></div>}
    {question.table && <div className="tests-table-scroll"><table><caption>{question.table.caption}</caption><thead><tr>{question.table.headers.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{question.table.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th scope="row" key={j}>{cell}</th> : <td key={j}>{typeof cell === 'number' ? new Intl.NumberFormat('fr-FR').format(cell) : cell}</td>)}</tr>)}</tbody></table></div>}
    {question.visual && <div className="tests-sequence" aria-label="Suite de quatre figures à prolonger">{question.visual.sequence.map((figure, i) => <PatternFigure key={i} figure={figure} label={`Figure ${i + 1}`} />)}<div className="tests-unknown" aria-label="Figure suivante à trouver">?</div></div>}
  </>;
}
function Explanation({ question, answer }: { question: TrainingQuestion; answer: number | null }) {
  const correct = answer === question.answer;
  return <div className={`tests-explanation ${correct ? 'correct' : 'incorrect'}`}>
    <strong>{correct ? <CheckCircle size={20} /> : <XCircle size={20} />}{correct ? 'Bonne réponse' : answer === null ? 'Sans réponse' : 'À revoir'} · réponse {letters[question.answer]}</strong>
    {!question.visual && <p className="tests-answer-text">{question.options[question.answer]}</p>}
    {question.visual && <div className="tests-correct-figure"><PatternFigure figure={question.visual.choices[question.answer]} label="Figure attendue" /></div>}
    {question.explanation.split('\n').map((line, i) => <p key={i}>{line}</p>)}
    {question.source && <a href={question.source.url} target="_blank" rel="noreferrer">Source : {question.source.title}</a>}
  </div>;
}

export default function TrainingHub() {
  const [loaded] = useState(readState);
  const [state, setState] = useState<TrainingState>(loaded.state);
  const [storageError, setStorageError] = useState(loaded.error);
  const [blocked, setBlocked] = useState(Boolean(loaded.error));
  const [showSession, setShowSession] = useState(Boolean(loaded.state.session));
  const [now, setNow] = useState(Date.now());
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingImport, setPendingImport] = useState<{ tests: TrainingState; math?: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const sessionTop = useRef<HTMLDivElement>(null);
  const importConfirmation = useRef<HTMLDivElement>(null);
  const s = state.session, active = Boolean(s && s.finishedAt === null);

  useEffect(() => { const timer = window.setInterval(() => { const time = Date.now(); setNow(time); setState(old => expireTest(old, time)); }, 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (blocked) return;
    try { localStorage.setItem(TRAINING_KEY, JSON.stringify(state)); setStorageError(''); }
    catch { setStorageError('La sauvegarde automatique n’a pas pu aboutir. Exportez votre suivi avant de quitter.'); }
  }, [state, blocked]);
  useEffect(() => { sessionTop.current?.scrollIntoView({ block: 'start' }); questionHeading.current?.focus({ preventScroll: true }); }, [s?.id, s?.index, showSession]);
  useEffect(() => { if (pendingImport) { importConfirmation.current?.scrollIntoView({ block: 'center' }); importConfirmation.current?.focus({ preventScroll: true }); } }, [pendingImport]);

  const changeSession = (change: (session: NonNullable<TrainingState['session']>) => NonNullable<TrainingState['session']>) => setState(old => {
    const current = expireTest(old);
    if (!current.session || current.session.finishedAt !== null) return current;
    return { ...current, session: change(current.session) };
  });
  const start = (category: Category, mode: 'practice' | 'timed') => {
    if (active) { setShowSession(true); return; }
    const seed = crypto.getRandomValues(new Uint32Array(1))[0] % 2147483647;
    setState(old => ({ ...old, session: startTest(category, mode, 10, seed, old.seen) }));
    setConfirmFinish(false); setShowSession(true); setMessage('');
  };
  const finish = () => { setState(old => finishTest(expireTest(old))); setConfirmFinish(false); };
  const exportProgress = () => {
    try {
      const math = localStorage.getItem(STORAGE_KEY);
      if (math) decodeProgress(math);
      const blob = new Blob([JSON.stringify({ kind: 'epso-tablette', version: 1, tests: state, ...(math ? { math: JSON.parse(math) } : {}) }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `epso-suivi-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Sauvegarde téléchargée : tests prêts et parcours de maths, si déjà commencé.');
    } catch { setMessage('Export impossible : le suivi de maths est illisible. Conservez les données existantes et vérifiez sa sauvegarde dans le parcours de maths.'); }
  };
  const importProgress = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 10_000_000) throw new Error();
      const parsed = JSON.parse(await file.text());
      if (parsed.kind !== 'epso-tablette' || parsed.version !== 1) throw new Error();
      const tests = expireTest(decodeTraining(JSON.stringify(parsed.tests)));
      const math = parsed.math ? JSON.stringify(decodeProgress(JSON.stringify(parsed.math))) : undefined;
      setPendingImport({ tests, math }); setMessage('');
    } catch { setMessage('Sauvegarde non reconnue. Aucun suivi n’a été remplacé. Choisissez un export « epso-suivi ».'); }
    if (input.current) input.current.value = '';
  };
  const applyImport = () => {
    if (!pendingImport) return;
    // Keep both prior values so a storage failure can be rolled back.
    let oldTests: string | null, oldMath: string | null;
    try {
      oldTests = localStorage.getItem(TRAINING_KEY); oldMath = localStorage.getItem(STORAGE_KEY);
      if (pendingImport.math) localStorage.setItem(STORAGE_KEY, pendingImport.math);
      localStorage.setItem(TRAINING_KEY, JSON.stringify(pendingImport.tests));
      setState(pendingImport.tests); setBlocked(false); setStorageError(''); setShowSession(Boolean(pendingImport.tests.session)); setPendingImport(null); setMessage('Suivi importé.');
    } catch {
      try { if (oldTests !== undefined) oldTests === null ? localStorage.removeItem(TRAINING_KEY) : localStorage.setItem(TRAINING_KEY, oldTests); if (oldMath !== undefined) oldMath === null ? localStorage.removeItem(STORAGE_KEY) : localStorage.setItem(STORAGE_KEY, oldMath); } catch { /* Export remains available if storage is unavailable. */ }
      setMessage('L’import n’a pas pu être enregistré. Exportez votre suivi actuel avant de réessayer.');
    }
  };

  const q = s?.questions[s.index];
  const remaining = s?.deadline ? Math.max(0, Math.ceil((s.deadline - Math.max(now, s.startedAt)) / 1000)) : 0;
  const tested = s?.questions.filter((_, i) => s.mode === 'timed' || s.checked[i]).length ?? 0;
  const correct = s?.questions.filter((item, i) => (s.mode === 'timed' || s.checked[i]) && s.answers[i] === item.answer).length ?? 0;

  return <section className="tests-app" aria-label="Tests prêts à lancer">
    <header className="tests-hero"><div><span className="tests-eyebrow">VOTRE SALLE D’ENTRAÎNEMENT</span><h1>Un peu chaque jour.<br /><em>Prêt pour le 9 novembre.</em></h1><p>Six domaines, des corrections expliquées et vos erreurs à retravailler. Choisissez une série et commencez.</p></div><div className="tests-hero-stamp"><span>06</span><strong>domaines</strong><small>sans clé IA</small></div></header>
    <TabletPanel inSession={active && showSession} />
    {storageError && <p className="tests-alert" role="alert">{storageError}</p>}
    {message && <p className="tests-message" role="status">{message}</p>}
    {pendingImport && <div className="tests-confirm" ref={importConfirmation} tabIndex={-1} role="alertdialog" aria-label="Confirmer l’import du suivi"><p>Remplacer le suivi de ces tests{pendingImport.math ? ' et du parcours de maths' : ''} par cette sauvegarde ? Elle contient {pendingImport.tests.history.length} séance(s) terminée(s).</p><button onClick={applyImport}>Remplacer le suivi</button><button onClick={() => setPendingImport(null)}>Annuler</button></div>}

    {!showSession || !s ? <>
      {active && <div className="tests-resume"><div><strong>Séance en cours · {titleFor(s!.category)}</strong><p>{modeLabel(s!.mode)} · question {s!.index + 1} sur {s!.questions.length}{s!.deadline && ' · le chronomètre continue'}</p></div><button className="tests-primary" onClick={() => setShowSession(true)}><Play size={18} /> Reprendre</button></div>}
      <div className="tests-section-heading"><div><span className="tests-eyebrow">PRIORITÉ DU 9 NOVEMBRE</span><h2>Les trois raisonnements</h2></div><span>10 questions pour s’entraîner</span></div>
      <div className="tests-grid">{categories.filter(c => c.priority).map(c => { const Icon = icons[c.id]; return <article className="tests-card" key={c.id}><div className="tests-card-icon"><Icon size={25} /></div><h3>{c.title}</h3><p>{c.description}</p><small>{c.count} questions · {c.minutes} minutes en chronométré</small><button disabled={active} className="tests-primary" onClick={() => start(c.id, 'practice')}>S’entraîner <ArrowRight size={17} /></button><button disabled={active} className="tests-secondary" onClick={() => start(c.id, 'timed')}><Clock size={17} /> Test chronométré</button></article>; })}</div>
      <div className="tests-section-heading"><div><span className="tests-eyebrow">POUR COMPLÉTER</span><h2>Connaissances et pratique</h2></div><span>24 questions par domaine</span></div>
      <div className="tests-grid">{categories.filter(c => !c.priority).map(c => { const Icon = icons[c.id]; return <article className="tests-card tests-card-light" key={c.id}><div className="tests-card-icon"><Icon size={25} /></div><h3>{c.title}</h3><p>{c.description}</p><button disabled={active} className="tests-primary" onClick={() => start(c.id, 'practice')}>S’entraîner <ArrowRight size={17} /></button><button disabled={active} className="tests-secondary" onClick={() => start(c.id, 'timed')}><Clock size={17} /> Défi · 20 questions / 20 min</button></article>; })}</div>
      <div className="tests-bottom-grid"><article className="tests-review-card"><RotateCcw size={25} /><h3>Reprendre mes erreurs</h3><p>{state.mistakes.length ? `${state.mistakes.length} question(s) à revoir, toutes matières confondues.` : 'Les questions manquées apparaîtront ici après une séance terminée.'}</p><button disabled={active || !state.mistakes.length} onClick={() => { setState(old => ({ ...old, session: reviewTest(old.mistakes) })); setShowSession(true); setConfirmFinish(false); }}>Réviser mes erreurs</button></article><article className="tests-history"><h3>Mes dernières séances</h3>{state.history.length ? <ul>{[...state.history].reverse().slice(0, 5).map(r => <li key={r.id}><div><strong>{r.mode === 'review' ? 'Révision des erreurs' : titleFor(r.category)}</strong><small>{new Date(r.date).toLocaleDateString('fr-FR')} · {modeLabel(r.mode)}</small></div><b>{r.correct}/{r.total}</b></li>)}</ul> : <p>Votre première séance sera enregistrée ici.</p>}</article></div>
      {s?.finishedAt !== null && s && <button className="tests-secondary" onClick={() => setShowSession(true)}>Revoir le dernier corrigé</button>}
      <p className="tests-disclaimer">Exercices originaux d’entraînement, sans affiliation à EPSO. Les durées des trois raisonnements reprennent l’avis AD5/427/26 ; les autres défis sont des formats de révision. Les textes verbaux sont fictifs. Les séries privilégient les questions encore non vues, puis les réutilisent.</p>
      <a className="tests-source" href="https://selection.eu-careers.europa.eu/system/files/2026-07/Notice-of-open-competition-EPSO-AD-427-26_consolidated-version.pdf" target="_blank" rel="noreferrer">Avis de concours EPSO · formats des raisonnements</a>
    </> : s.finishedAt !== null ? <>
      <div className="tests-results"><span className="tests-eyebrow">{s.expired ? 'TEMPS ÉCOULÉ' : 'SÉANCE TERMINÉE'}</span><h2>{tested ? `${correct} bonne${correct > 1 ? 's' : ''} réponse${correct > 1 ? 's' : ''} sur ${tested}` : 'Séance arrêtée sans réponse validée'}</h2><p>{s.mode === 'timed' ? 'Les questions sans réponse sont comptées comme incorrectes.' : 'Seules les réponses validées sont comptées.'} Retrouvez chaque explication ci-dessous.</p><button className="tests-primary" onClick={() => setShowSession(false)}><ArrowLeft size={18} /> Choisir une nouvelle série</button></div>
      <div className="tests-corrections">{s.questions.map((item, i) => (s.mode === 'timed' || s.checked[i]) && <details key={item.id}><summary><span>{i + 1}. {item.prompt}</span><b>{s.answers[i] === item.answer ? 'Correct' : 'À revoir'}</b></summary><QuestionMaterial question={item} /><p>Votre réponse : {s.answers[i] === null ? 'aucune' : `${letters[s.answers[i]!]}${item.visual ? '' : ` · ${item.options[s.answers[i]!]}`}`}</p><Explanation question={item} answer={s.answers[i]} /></details>)}</div>
    </> : q && <>
      <div className="tests-session-top" ref={sessionTop}><button onClick={() => { setShowSession(false); setConfirmFinish(false); }}><ArrowLeft size={17} /> {s.mode === 'timed' ? 'Quitter l’écran' : 'Mettre en pause'}</button><strong>{s.mode === 'review' ? 'Révision des erreurs' : titleFor(s.category)}</strong>{s.deadline ? <span className={`tests-clock ${remaining < 60 ? 'urgent' : ''}`} aria-label={`Temps restant ${timeLabel(remaining)}`}><Clock size={18} /> {timeLabel(remaining)}</span> : <span>À votre rythme</span>}</div>
      {s.mode === 'timed' && <p className="tests-timer-note">Le chronomètre continue si vous quittez l’écran ou fermez l’application. Les corrections apparaissent à la fin.</p>}
      <div className="tests-progress"><span style={{ width: `${(s.index + 1) / s.questions.length * 100}%` }} /></div>
      <article className="tests-question" lang={q.category === 'english' ? 'en' : 'fr'}><div className="tests-question-label" lang="fr"><span>QUESTION {s.index + 1} / {s.questions.length}</span><span>{modeLabel(s.mode)}</span></div><QuestionMaterial question={q} /><h2 ref={questionHeading} tabIndex={-1}>{q.prompt}</h2>{q.category === 'numerical' && <p className="tests-timer-note">Si nécessaire, arrondissez à deux décimales.</p>}
        <div className={`tests-options ${q.visual ? 'visual' : ''}`} role="group" aria-label="Réponses proposées">{q.options.map((option, i) => <button key={i} aria-pressed={s.answers[s.index] === i} disabled={s.checked[s.index]} className={`${s.answers[s.index] === i ? 'selected' : ''} ${s.checked[s.index] && i === q.answer ? 'correct' : ''} ${s.checked[s.index] && s.answers[s.index] === i && i !== q.answer ? 'incorrect' : ''}`} onClick={() => changeSession(session => ({ ...session, answers: session.answers.map((a, j) => j === session.index ? i : a) }))}><span className="tests-option-letter">{letters[i]}</span>{q.visual ? <PatternFigure figure={q.visual.choices[i]} label={`Proposition ${letters[i]}`} /> : <span>{option}</span>}</button>)}</div>
        {s.checked[s.index] && <div role="status"><Explanation question={q} answer={s.answers[s.index]} /></div>}
        <div className="tests-question-actions"><button disabled={s.index === 0} onClick={() => changeSession(session => ({ ...session, index: session.index - 1 }))}><ArrowLeft size={18} /> Précédente</button>{s.mode !== 'timed' && !s.checked[s.index] ? <button className="tests-primary" disabled={s.answers[s.index] === null} onClick={() => changeSession(session => ({ ...session, checked: session.checked.map((c, j) => j === session.index ? true : c) }))}>Vérifier ma réponse</button> : s.index < s.questions.length - 1 ? <button className="tests-primary" onClick={() => changeSession(session => ({ ...session, index: session.index + 1 }))}>Suivante <ArrowRight size={18} /></button> : <button className="tests-primary" onClick={() => setConfirmFinish(true)}>Voir mon bilan</button>}</div>
      </article>
      <nav className="tests-question-nav" aria-label="Aller à une question">{s.questions.map((_, i) => <button key={i} aria-label={`Question ${i + 1}${s.answers[i] !== null ? ', réponse choisie' : ', sans réponse'}`} aria-current={i === s.index ? 'step' : undefined} className={s.answers[i] !== null ? 'answered' : ''} onClick={() => changeSession(session => ({ ...session, index: i }))}>{i + 1}</button>)}</nav>
      <div className="tests-end"><span>{s.answers.filter(a => a !== null).length} réponse(s) choisie(s) sur {s.questions.length}</span><button onClick={() => setConfirmFinish(true)}>Terminer la séance</button></div>
      {confirmFinish && <div className="tests-confirm" role="alertdialog" aria-label="Terminer la séance"><p>{s.mode === 'timed' ? 'Valider définitivement cette séance ? Les réponses manquantes seront comptées comme incorrectes.' : 'Terminer et enregistrer le bilan des réponses déjà vérifiées ?'}</p><button className="tests-primary" onClick={finish}>Terminer et voir le corrigé</button><button onClick={() => setConfirmFinish(false)}>Continuer</button></div>}
    </>}
    <footer className="tests-backup"><div><strong>Mon suivi, sur ma tablette</strong><p>Les tests et le parcours de maths sont inclus dans cette sauvegarde.</p></div><div><button onClick={exportProgress}><Download size={17} /> Exporter mon suivi</button><button onClick={() => input.current?.click()}><Upload size={17} /> Importer un suivi</button><input ref={input} type="file" accept=".json,application/json" hidden onChange={e => void importProgress(e.target.files?.[0])} /></div></footer>
  </section>;
}
