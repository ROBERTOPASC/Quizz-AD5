import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Calculator, CheckCircle, Clock, Download, RotateCcw, Target, Upload, XCircle } from 'lucide-react';
import { lessons, officialSources } from './curriculum';
import { Exercise, Level, formatNumber, generateExercise } from './exercises';
import { Attempt, MathProgress, Mode, STORAGE_KEY, attemptFor, createSession, datedPlan, daysUntil, decodeProgress, expireSession, finishSession, initialProgress, isCorrect, mergeAttempts, parseAnswer, todayInParis, topicStatus, unresolvedMistakes } from './progress';
import './math-course.css';

const f = formatNumber;
const dateLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' });
const elapsedLabel = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.max(0, seconds) % 60).padStart(2, '0')}`;

function readProgress(): { progress: MathProgress; error: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return { progress: raw ? decodeProgress(raw) : initialProgress(), error: null };
  } catch {
    return { progress: initialProgress(), error: 'Le suivi enregistré est illisible ou inaccessible. Il est conservé. Vous pouvez travailler temporairement ou importer une sauvegarde valide.' };
  }
}

function QuestionData({ question }: { question: Exercise }) {
  if (!question.table) return null;
  const table = question.table;
  const max = Math.max(...table.rows.map(row => Number(row[2])));
  return <div className="math-data">
    {question.bars && <figure className="math-chart" aria-label="Dossiers traités en année 2, axe démarrant à zéro">
      <figcaption>Année 2 · dossiers traités · origine à 0</figcaption>
      {table.rows.map(row => <div className="math-bar-row" key={String(row[0])}>
        <span>{row[0]}</span><div className="math-bar-track"><div style={{ width: `${Number(row[2]) / max * 100}%` }} /></div><strong>{f(Number(row[2]))}</strong>
      </div>)}
    </figure>}
    <div className="math-table-scroll"><table><caption>{table.caption}</caption><thead><tr>{table.headers.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>{table.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th scope="row" key={j}>{cell}</th> : <td key={j}>{typeof cell === 'number' ? f(cell) : cell}</td>)}</tr>)}</tbody></table></div>
  </div>;
}

function Solution({ question }: { question: Exercise }) {
  return <div className="math-solution"><strong>Réponse : {f(question.answer)} {question.unit}</strong><ol>{question.steps.map((step, i) => <li key={i}>{step}</li>)}</ol></div>;
}

export default function MathCourse() {
  const [loaded] = useState(readProgress);
  const [progress, setProgress] = useState<MathProgress>(loaded.progress);
  const [storageError, setStorageError] = useState<string | null>(loaded.error);
  const [saveBlocked, setSaveBlocked] = useState(Boolean(loaded.error));
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState<Level>(1);
  const [now, setNow] = useState(Date.now());
  const [filter, setFilter] = useState('');
  const [pendingImport, setPendingImport] = useState<MathProgress | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLInputElement>(null);
  const currentLesson = lessons.find(lesson => lesson.id === progress.selectedLesson) || lessons[0];
  const session = progress.session;
  const active = session && session.finishedAt === null;
  const question = session?.questions[session.index];
  const response = session?.responses[session.index];
  const assessed = session?.mode === 'exam' || session?.mode === 'diagnostic';
  const mistakes = unresolvedMistakes(progress.attempts);
  const solidCount = lessons.filter(lesson => topicStatus(lesson.id, progress.attempts).solid).length;
  const remaining = daysUntil(progress.examDate);
  const today = todayInParis();
  const plan = datedPlan(progress.examDate);
  const todayPlan = plan.find(day => day.date === today) || plan.find(day => day.date > today) || plan[13];
  const recommendation = lessons.find(lesson => topicStatus(lesson.id, progress.attempts).label === 'À renforcer') || lessons.find(lesson => !topicStatus(lesson.id, progress.attempts).solid) || lessons[0];

  useEffect(() => {
    if (saveBlocked) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); setStorageError(null); }
    catch { setStorageError('Le navigateur ne peut pas enregistrer ce suivi. Exportez-le pour conserver votre travail.'); }
  }, [progress, saveBlocked]);

  useEffect(() => {
    if (!active || !session.deadline) return;
    const tick = () => { const time = Date.now(); setNow(time); setProgress(p => expireSession(p, time)); };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [active, session?.id, session?.deadline]);

  useEffect(() => {
    if (progress.view === 'session' && active && !assessed) answerRef.current?.focus();
  }, [session?.index, session?.id, progress.view, active, assessed]);

  const navigate = (view: MathProgress['view']) => {
    setMessage(''); setProgress(p => ({ ...p, view }));
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const openLesson = (id: string) => {
    setMessage(''); setProgress(p => ({ ...p, view: 'lesson', selectedLesson: id }));
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const start = (mode: Mode, topics = [currentLesson.id], chosenLevel = level) => {
    if (active) { navigate('session'); setMessage('Votre séance est conservée. Terminez-la avant de commencer une nouvelle série.'); return; }
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const next = createSession(mode, topics, chosenLevel, seed);
    setNow(Date.now()); setMessage('');
    setProgress(p => ({ ...p, view: 'session', session: next }));
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const changeResponse = (text: string) => setProgress(previous => {
    const p = expireSession(previous);
    const s = p.session;
    if (!s || s.finishedAt !== null || s.responses[s.index].checked) return p;
    return { ...p, session: { ...s, responses: s.responses.map((r, i) => i === s.index ? { ...r, text } : r) } };
  });
  const showHint = () => setProgress(p => {
    const s = p.session;
    if (!s || s.finishedAt !== null) return p;
    return { ...p, session: { ...s, responses: s.responses.map((r, i) => i === s.index ? { ...r, hinted: true } : r) } };
  });
  const check = () => {
    if (!session || !question || !response || response.checked) return;
    if (parseAnswer(response.text) === null || (response.text.trim().endsWith('%') && question.unit !== '%')) { setMessage('Entrez un nombre (ex. 12,5) ou une fraction (ex. 3/4), dans l’unité indiquée.'); return; }
    setMessage('');
    const time = Date.now();
    setProgress(p => {
      const s = p.session;
      if (!s || s.finishedAt !== null || s.responses[s.index].checked) return p;
      const updated = { ...s, responses: s.responses.map((r, i) => i === s.index ? { ...r, checked: true, seconds: r.seconds + Math.max(0, Math.round((time - s.questionStartedAt) / 1000)) } : r) };
      return { ...p, session: updated, attempts: mergeAttempts(p.attempts, [attemptFor(updated, updated.index, time)]) };
    });
  };
  const moveQuestion = (index: number) => {
    const time = Date.now(); setMessage('');
    setProgress(previous => {
      const p = expireSession(previous, time), s = p.session;
      if (!s || s.finishedAt !== null || index < 0 || index >= s.questions.length) return p;
      return { ...p, session: { ...s, index, questionStartedAt: time, responses: s.responses.map((r, i) => i === s.index && !r.checked ? { ...r, seconds: r.seconds + Math.max(0, Math.round((time - s.questionStartedAt) / 1000)) } : r) } };
    });
  };
  const finish = () => { setMessage(''); setProgress(p => finishSession(expireSession(p))); };
  const download = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = `epso-maths-${today}.json`; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error();
      setPendingImport(decodeProgress(await file.text())); setMessage('');
    } catch { setMessage('Ce fichier n’est pas une sauvegarde valide du parcours de maths. Le suivi actuel est conservé.'); }
  };

  const renderOverview = () => <>
    <div className="math-hero">
      <div><span className="math-eyebrow">Objectif · {dateLabel(progress.examDate)} {progress.examDate.slice(0, 4)}</span>
        <h3>Les calculs deviennent<br />des réflexes.</h3>
        <p>Comprendre la méthode, reconnaître l’opération, puis gagner en vitesse. Votre parcours de raisonnement numérique en 18 chapitres.</p>
        <div className="math-actions"><button className="math-primary" onClick={() => active ? navigate('session') : start('diagnostic', ['arithmetic'], 2)}>{active ? 'Reprendre ma séance' : 'Commencer le diagnostic'} <ArrowRight size={18} /></button>
          <button className="math-light" onClick={() => openLesson(recommendation.id)}>Revoir une méthode</button></div>
        <small>Diagnostic : 18 questions, sans limite de temps, correction à la fin.</small>
      </div>
      <div className="math-countdown"><strong>{remaining > 0 ? `J − ${remaining}` : remaining === 0 ? 'Jour J' : 'Révision'}</strong><span>avant votre date cible</span><div className="math-progress-track"><div style={{ width: `${solidCount / lessons.length * 100}%` }} /></div><b>{solidCount} / 18 notions solides</b><span>Les autres restent à travailler ou à confirmer.</span></div>
    </div>
    <div className="math-grid-two">
      <section className="math-card"><h4><Target size={20} /> Votre prochaine étape</h4><p className="math-large">{recommendation.title}</p><p>{recommendation.goal}</p><button className="math-primary" onClick={() => openLesson(recommendation.id)}>Étudier cette méthode <ArrowRight size={17} /></button></section>
      <section className="math-card"><h4><Clock size={20} /> Passer au rythme du test</h4><p className="math-large">10 questions · 20 minutes</p><p>Situations de calcul variées, réponses à choix multiples et correction après la série. Le temps continue si vous quittez cet écran.</p><button className="math-secondary" onClick={() => start('exam')}>Lancer une simulation numérique</button><small>Exercices d’entraînement originaux ; ce n’est pas une épreuve officielle.</small></section>
    </div>
    <section className="math-card"><div className="math-section-heading"><div><span className="math-eyebrow">Tous les outils de calcul</span><h4>Les 18 chapitres du parcours</h4></div><span className="math-badge">À votre rythme</span></div>
      <div className="math-topics">{lessons.map((lesson, index) => {
        const status = topicStatus(lesson.id, progress.attempts);
        return <button className="math-topic" key={lesson.id} onClick={() => openLesson(lesson.id)}><span className="math-topic-number">{String(index + 1).padStart(2, '0')}</span><span><small>{lesson.family}</small><strong>{lesson.title}</strong><span className={`math-status ${status.solid ? 'is-solid' : ''}`}>{status.label}{status.count ? ` · ${status.successes}/${status.count} seul` : ''}</span></span><ArrowRight size={16} /></button>;
      })}</div><details className="math-details"><summary>Comment est évaluée une notion « solide » ?</summary><p>Au moins 4 réussites sans indice parmi les 5 dernières questions différentes, avec au moins 3 types de calcul et une réussite au niveau 2 ou 3. Des réussites dans 2 séances distinctes doivent figurer parmi les 10 dernières questions. Refaire exactement la même question ne renforce pas cet indicateur. Il guide les révisions et ne prédit pas une note au concours.</p></details>
    </section>
    <section className="math-card"><div className="math-section-heading"><div><span className="math-eyebrow">Du {dateLabel(plan[0].date)} au {dateLabel(plan[13].date)}</span><h4>Votre programme sur 14 jours</h4></div><label className="math-field">Temps quotidien<select value={progress.dailyMinutes} onChange={e => setProgress(p => ({ ...p, dailyMinutes: Number(e.target.value) }))}><option value={30}>30 minutes</option><option value={60}>1 heure</option><option value={120}>2 heures</option></select></label></div>
      <p>{progress.dailyMinutes === 30 ? '5 min de rappel, 10 min de méthode, 10 min d’exercices, 5 min de correction.' : progress.dailyMinutes === 60 ? '10 min de rappel, 20 min de méthode, 20 min d’exercices, 10 min de correction.' : '15 min de rappel, 30 min de méthode, 40 min d’exercices, 20 min de correction et 15 min de reprise ciblée.'} Réservez aussi des séances au verbal et à l’abstrait.</p>
      <p className="math-callout">Aujourd’hui : {todayPlan.title}. Si une base reste fragile, reprenez-la avant d’augmenter la difficulté. Ce calendrier est une proposition, pas une liste de compétences déjà acquises.</p>
      <details className="math-details"><summary>Voir les 14 séances</summary><div className="math-plan">{plan.map((day, i) => <div key={day.date} className={day.date === today ? 'is-today' : ''}><span><b>J{i + 1}</b> · {dateLabel(day.date)}</span><strong>{day.title}</strong><div>{day.topics.map(id => <button className="math-link" key={id} onClick={() => openLesson(id)}>{lessons.find(l => l.id === id)?.title}</button>)}</div></div>)}</div></details>
    </section>
    <section className="math-card math-official"><h4>Le cadre de votre préparation</h4><p>AD5 : verbal, 20 questions en 35 minutes ; numérique, 10 en 20 minutes ; abstrait, 10 en 10 minutes. Seuils : 10/20 au verbal et 10/20 pour numérique + abstrait réunis. Ce parcours travaille la partie mathématique ; les deux autres raisonnements demandent leur propre entraînement.</p><p>Votre date cible est le 9 novembre, selon votre indication. La page EPSO affiche une période du 9 au 13 novembre 2026 ; votre convocation fixe votre séance personnelle.</p><div className="math-source-links">{officialSources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</div><small>Sources consultées le 26 octobre 2026. Programme pédagogique et exercices originaux, sans affiliation à EPSO.</small></section>
  </>;

  const renderLesson = () => <>
    <div className="math-section-heading"><label className="math-field">Choisir un chapitre<select value={currentLesson.id} onChange={e => openLesson(e.target.value)}>{lessons.map((lesson, i) => <option key={lesson.id} value={lesson.id}>{i + 1}. {lesson.title}</option>)}</select></label><span className="math-badge">{topicStatus(currentLesson.id, progress.attempts).label}</span></div>
    <article className="math-card math-lesson"><span className="math-eyebrow">{currentLesson.family}</span><h3>{currentLesson.title}</h3><p className="math-lead">{currentLesson.goal}</p>
      <h4>Comment reconnaître le bon calcul ?</h4><p>{currentLesson.when}</p><h4>La méthode à connaître</h4><ol className="math-rules">{currentLesson.rules.map(rule => <li key={rule}>{rule}</li>)}</ol>
      <div className="math-worked"><span className="math-eyebrow">Exemple corrigé</span><h4>{currentLesson.example.question}</h4><ol>{currentLesson.example.steps.map(step => <li key={step}>{step}</li>)}</ol></div>
      <div className="math-trap"><strong>Le piège à repérer</strong><p>{currentLesson.trap}</p></div>
      <div className="math-section-heading"><label className="math-field">Difficulté des nombres<select value={level} onChange={e => setLevel(Number(e.target.value) as Level)}><option value={1}>1 · Nombres simples</option><option value={2}>2 · Nombres variés</option><option value={3}>3 · Nombres plus grands</option></select></label><button className="math-primary" onClick={() => start('practice')}>M’entraîner · 6 questions <ArrowRight size={18} /></button></div>
    </article>
  </>;

  const renderSummary = () => {
    if (!session) return null;
    const tried = session.responses.filter(r => r.checked).length;
    const correct = session.questions.filter((q, i) => session.responses[i].checked && isCorrect(q, session.responses[i].text)).length;
    const autonomous = session.questions.filter((q, i) => session.responses[i].checked && !session.responses[i].hinted && isCorrect(q, session.responses[i].text)).length;
    const weak = [...new Set(session.questions.filter((q, i) => session.responses[i].checked && (!isCorrect(q, session.responses[i].text) || session.responses[i].hinted)).map(q => q.topic))];
    return <><section className="math-card math-result"><span className="math-eyebrow">{session.mode === 'exam' ? 'Simulation numérique terminée' : 'Bilan de la séance'}</span><h3>{correct} / {tried} réponses correctes</h3><p>{autonomous} sans indice · {session.questions.length - tried} question(s) non travaillée(s){session.reason === 'timeout' ? ' · Temps écoulé : les questions sans réponse comptent comme incorrectes.' : ''}</p><p>{weak.length ? `À reprendre : ${weak.map(id => lessons.find(l => l.id === id)?.title).join(' ; ')}.` : tried ? 'Bonne série. Confirmez ces réussites avec de nouvelles questions lors d’une autre séance.' : 'Aucune réponse validée. Vous pouvez reprendre une méthode et commencer une nouvelle série.'}</p><div className="math-actions"><button className="math-primary" onClick={() => weak.length ? openLesson(weak[0]) : navigate('overview')}>{weak.length ? 'Revoir ma première difficulté' : 'Revenir au parcours'} <ArrowRight size={18} /></button><button className="math-secondary" onClick={() => start(session.mode, [...new Set(session.questions.map(q => q.topic))], session.questions[0].level)}>Nouvelle série</button></div><small>Ce score d’entraînement ne vaut pas validation du concours. Le seuil officiel de 10/20 associe numérique et abstrait.</small></section>
      <section className="math-card"><h4>Comprendre chaque réponse</h4>{session.questions.map((q, i) => {
        const r = session.responses[i], good = r.checked && isCorrect(q, r.text);
        return <details className="math-review" key={q.id}><summary>{good ? <CheckCircle size={18} /> : <XCircle size={18} />} <span>Question {i + 1} · {lessons.find(l => l.id === q.topic)?.title} · {good ? 'Correct' : r.checked ? 'À revoir' : 'Non travaillée'}</span></summary><QuestionData question={q} /><p>{q.prompt}</p><p>Votre réponse : <strong>{r.text || 'Sans réponse'}</strong>{r.hinted ? ' · Avec indice' : ''}</p><Solution question={q} /><button className="math-link" onClick={() => openLesson(q.topic)}>Revoir la méthode</button></details>;
      })}</section></>;
  };

  const renderSession = () => {
    if (!session || !question || !response) return <section className="math-card"><h3>À vous de calculer</h3><p>Commencez par le diagnostic pour repérer les bases à travailler.</p><button className="math-primary" onClick={() => start('diagnostic')}>Commencer le diagnostic</button></section>;
    if (session.finishedAt !== null) return renderSummary();
    const currentTopic = lessons.find(l => l.id === question.topic)!;
    const correct = isCorrect(question, response.text);
    const secondsLeft = session.deadline ? Math.max(0, Math.ceil((session.deadline - now) / 1000)) : null;
    return <section className="math-card math-exercise">
      <div className="math-section-heading"><div><span className="math-eyebrow">{session.mode === 'exam' ? 'Simulation numérique' : session.mode === 'diagnostic' ? 'Diagnostic' : session.mode === 'review' ? 'Reprise ciblée' : 'Entraînement'}</span><h3>Question {session.index + 1} sur {session.questions.length}</h3></div>{secondsLeft !== null ? <div className={`math-timer ${secondsLeft <= 120 ? 'is-urgent' : ''}`} role="timer" aria-label="Temps restant"><Clock size={19} /> {elapsedLabel(secondsLeft)}</div> : <span className="math-badge">Sans limite de temps</span>}</div>
      <div className="math-question-nav" aria-label="Navigation entre les questions">{session.questions.map((q, i) => <button key={q.id} disabled={!assessed && i > session.index} className={`${i === session.index ? 'is-current' : ''} ${session.responses[i].text ? 'is-answered' : ''}`} aria-label={`Question ${i + 1}${session.responses[i].text ? ', réponse saisie' : ''}`} aria-current={i === session.index ? 'step' : undefined} onClick={() => moveQuestion(i)}>{i + 1}</button>)}</div>
      {!assessed && <span className="math-eyebrow">{currentTopic.title}</span>}
      <QuestionData question={question} /><p className="math-prompt">{question.prompt}</p>
      <p className="math-answer-note">{assessed ? 'Choisissez la réponse la plus proche.' : 'Saisissez le résultat dans l’unité indiquée. Virgule, point décimal et fraction sont acceptés.'} Arrondir à deux décimales si nécessaire.{question.unit === '%' ? ' Pour 25 %, répondre 25.' : ''}</p>
      {assessed ? <fieldset className="math-options"><legend className="sr-only">Choix de réponse</legend>{question.options.map((value, i) => <label key={value} className={response.text === String(value) ? 'is-selected' : ''}><input type="radio" name={`math-${question.id}`} value={value} checked={response.text === String(value)} onChange={() => changeResponse(String(value))} /><span className="math-option-letter">{String.fromCharCode(65 + i)}</span><span>{f(value)} {question.unit}</span></label>)}</fieldset>
        : <form onSubmit={event => { event.preventDefault(); check(); }}><label className="math-answer-label" htmlFor="math-answer">Votre réponse</label><div className="math-answer-row"><input ref={answerRef} id="math-answer" inputMode="text" autoComplete="off" value={response.text} onChange={event => changeResponse(event.target.value)} disabled={response.checked} placeholder="Ex. 12,5 ou 3/4" aria-describedby="math-input-help" /><span>{question.unit}</span><button className="math-primary" type="submit" disabled={response.checked || !response.text.trim()}>Vérifier</button></div><small id="math-input-help">Écrivez uniquement le nombre ; l’unité est affichée à côté.</small></form>}
      {!assessed && !response.checked && <div className="math-hint">{response.hinted ? <p><strong>Indice :</strong> {question.hint}</p> : <button className="math-link" onClick={showHint}>J’ai besoin d’un indice</button>}</div>}
      {!assessed && response.checked && <div className={`math-feedback ${correct ? 'is-correct' : ''}`} role="status"><h4>{correct ? <CheckCircle size={20} /> : <XCircle size={20} />}{correct ? response.hinted ? 'Correct avec l’indice' : 'Correct, sans aide' : 'Reprenons le calcul'}</h4><Solution question={question} /><p><strong>À retenir :</strong> {currentTopic.trap}</p></div>}
      <div className="math-section-heading math-exercise-bottom"><button className="math-link" onClick={() => navigate('overview')}>Revenir au parcours · séance conservée</button><div className="math-actions">{assessed && session.index > 0 && <button className="math-secondary" onClick={() => moveQuestion(session.index - 1)}>Précédente</button>}{session.index < session.questions.length - 1 ? <button className="math-primary" disabled={!assessed && !response.checked} onClick={() => moveQuestion(session.index + 1)}>{assessed && !response.text ? 'Passer cette question' : 'Question suivante'} <ArrowRight size={18} /></button> : <button className="math-primary" disabled={!assessed && !response.checked} onClick={finish}>Terminer et voir le bilan</button>}</div></div>
      <details className="math-details"><summary>Terminer cette séance maintenant</summary><p>{assessed ? 'Les questions sans réponse compteront comme incorrectes. La correction sera affichée.' : 'Seules les réponses déjà vérifiées seront prises en compte dans le suivi.'}</p><button className="math-secondary" onClick={finish}>Terminer la séance</button></details>
    </section>;
  };

  const renderMistakes = () => <section className="math-card"><div className="math-section-heading"><div><span className="math-eyebrow">Apprendre de ses essais</span><h3>Mon carnet d’erreurs</h3></div><span className="math-badge">{mistakes.length} type(s) à reprendre</span></div><p>Une erreur ou une réponse avec indice revient ici tant que le dernier essai du même type n’est pas réussi seul. Le statut « solide » demande plusieurs réussites variées.</p>{mistakes.length ? <><button className="math-primary" onClick={() => start('review', [...new Set(mistakes.map(a => a.exercise.topic))], 2)}>Reprendre ces notions avec de nouveaux nombres</button><div className="math-mistakes">{mistakes.map((attempt: Attempt) => <details key={attempt.id} className="math-review"><summary>{lessons.find(l => l.id === attempt.exercise.topic)?.title} · {attempt.hinted ? 'Avec aide' : 'Erreur'}</summary><QuestionData question={attempt.exercise} /><p>{attempt.exercise.prompt}</p><p>Votre réponse : {attempt.response || 'Sans réponse'}</p><Solution question={attempt.exercise} /><button className="math-link" onClick={() => openLesson(attempt.exercise.topic)}>Revoir le chapitre</button></details>)}</div></> : <p className="math-callout">{progress.attempts.length ? 'Aucune difficulté non reprise dans le suivi actuel. Continuez avec une série variée.' : 'Votre carnet se remplira au fil de vos réponses. Le diagnostic est un bon point de départ.'}</p>}</section>;

  const renderFormulas = () => <section className="math-card"><span className="math-eyebrow">Un repère pendant les révisions</span><h3>Mon formulaire de calcul</h3><label className="math-field">Rechercher une notion<input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Pourcentage, moyenne, vitesse…" /></label><div className="math-formulas">{lessons.filter(l => `${l.title} ${l.rules.join(' ')}`.toLocaleLowerCase('fr').includes(filter.toLocaleLowerCase('fr'))).map(l => <details className="math-review" key={l.id}><summary>{l.title}</summary><p>{l.when}</p><ul>{l.rules.map(rule => <li key={rule}>{rule}</li>)}</ul><button className="math-link" onClick={() => openLesson(l.id)}>Voir l’exemple et m’entraîner</button></details>)}</div></section>;

  return <div className="math-course" ref={contentRef}>
    <nav className="math-nav" aria-label="Parcours de maths">{([{ view: 'overview', label: 'Mon parcours', icon: Target }, { view: 'lesson', label: 'Apprendre', icon: BookOpen }, { view: 'session', label: 'Ma séance', icon: Calculator }, { view: 'mistakes', label: `Mes erreurs${mistakes.length ? ` (${mistakes.length})` : ''}`, icon: RotateCcw }, { view: 'formulas', label: 'Formulaire', icon: BookOpen }] as const).map(item => <button key={item.view} aria-current={progress.view === item.view ? 'page' : undefined} onClick={() => navigate(item.view)}><item.icon size={17} />{item.label}</button>)}</nav>
    {storageError && <div className="math-alert" role="alert">{storageError} <button className="math-link" onClick={download}>Exporter le suivi de cette session</button></div>}
    {message && <div className="math-alert" role="status">{message}</div>}
    {pendingImport && <section className="math-card" role="alert"><h4>Remplacer le suivi de maths par cette sauvegarde ?</h4><p>Elle contient {pendingImport.attempts.length} réponses enregistrées. Vous pouvez d’abord exporter votre suivi actuel.</p><div className="math-actions"><button className="math-secondary" onClick={download}>Exporter le suivi actuel</button><button className="math-primary" onClick={() => { setProgress(pendingImport); setSaveBlocked(false); setPendingImport(null); setStorageError(null); }}>Utiliser cette sauvegarde</button><button className="math-link" onClick={() => setPendingImport(null)}>Annuler</button></div></section>}
    {progress.view === 'overview' && renderOverview()}{progress.view === 'lesson' && renderLesson()}{progress.view === 'session' && renderSession()}{progress.view === 'mistakes' && renderMistakes()}{progress.view === 'formulas' && renderFormulas()}
    <footer className="math-footer"><p>Progression conservée dans ce navigateur · {progress.attempts.length} réponses enregistrées (1 000 dernières au maximum).</p><div className="math-actions"><button className="math-link" onClick={download}><Download size={16} /> Exporter mon suivi</button><button className="math-link" onClick={() => importRef.current?.click()}><Upload size={16} /> Importer mon suivi</button><input className="sr-only" ref={importRef} type="file" accept=".json,application/json" aria-label="Importer une sauvegarde de maths" onChange={importFile} /></div></footer>
  </div>;
}
