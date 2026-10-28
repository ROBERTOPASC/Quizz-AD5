import { useEffect, useReducer, useRef, useState, type KeyboardEvent } from 'react';
import { Calculator, Delete, X } from 'lucide-react';
import { calculatorReducer, formatCalculatorDisplay, initialCalculatorState, type CalculatorKey } from './engine';
import './calculator.css';

const keys: { key: CalculatorKey; text: string; label?: string; kind?: string }[] = [
  { key: 'clear', text: 'C', label: 'Tout effacer', kind: 'utility' },
  { key: 'backspace', text: '⌫', label: 'Effacer le dernier chiffre', kind: 'utility' },
  { key: '%', text: '%', label: 'Pourcentage', kind: 'utility' },
  { key: '/', text: '÷', label: 'Diviser', kind: 'operator' },
  { key: '7', text: '7' }, { key: '8', text: '8' }, { key: '9', text: '9' },
  { key: '*', text: '×', label: 'Multiplier', kind: 'operator' },
  { key: '4', text: '4' }, { key: '5', text: '5' }, { key: '6', text: '6' },
  { key: '-', text: '−', label: 'Soustraire', kind: 'operator' },
  { key: '1', text: '1' }, { key: '2', text: '2' }, { key: '3', text: '3' },
  { key: '+', text: '+', label: 'Additionner', kind: 'operator' },
  { key: 'sign', text: '+/−', label: 'Changer le signe', kind: 'utility' },
  { key: '0', text: '0' }, { key: '.', text: ',', label: 'Virgule décimale' },
  { key: '=', text: '=', label: 'Calculer', kind: 'equals' },
];

export default function BasicCalculator() {
  const [open, setOpen] = useState(false);
  const [state, dispatch] = useReducer(calculatorReducer, initialCalculatorState);
  const launcher = useRef<HTMLButtonElement>(null);
  const screen = useRef<HTMLOutputElement>(null);
  useEffect(() => { if (open) screen.current?.focus({ preventScroll: true }); }, [open]);
  const close = () => { setOpen(false); requestAnimationFrame(() => launcher.current?.focus({ preventScroll: true })); };
  const handleKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
    // Keep native activation available on buttons and on the help disclosure.
    if (event.key === 'Enter' && event.target instanceof HTMLElement && event.target.closest('button, summary')) return;
    const key: CalculatorKey | undefined = /^[0-9+*/%=.-]$/.test(event.key) ? event.key as CalculatorKey
      : event.key === ',' ? '.' : event.key === 'Enter' ? '='
      : event.key === 'Backspace' ? 'backspace' : ['Delete', 'c', 'C'].includes(event.key) ? 'clear' : undefined;
    if (key) { event.preventDefault(); event.stopPropagation(); dispatch(key); }
  };

  return <div className="epso-calculator">
    <button ref={launcher} type="button" className="epso-calculator-launch" hidden={open} aria-expanded={open} aria-controls="epso-calculator-panel" onClick={() => setOpen(true)}><Calculator size={21} aria-hidden="true" /> Calculatrice</button>
    {open && <section id="epso-calculator-panel" className="epso-calculator-panel" role="dialog" aria-labelledby="epso-calculator-title" onKeyDown={handleKey}>
      <header><div><h2 id="epso-calculator-title">Calculatrice</h2><p>Disponible hors connexion</p></div><button type="button" className="epso-calculator-close" aria-label="Fermer la calculatrice" onClick={close}><X size={22} aria-hidden="true" /></button></header>
      <div className="epso-calculator-screen"><p className="epso-calculator-expression" aria-label="Calcul en cours">{state.expression || '\u00a0'}</p><output ref={screen} tabIndex={0} aria-label="Résultat" aria-live="polite" aria-atomic="true">{state.error ? 'Erreur' : formatCalculatorDisplay(state)}</output>{state.error && <p className="epso-calculator-error" role="alert">{state.error}</p>}</div>
      <div className="epso-calculator-keys">{keys.map(({ key, text, label, kind }) => <button key={key} type="button" className={kind ? `epso-calculator-${kind}` : undefined} aria-label={label} onClick={() => dispatch(key)}>{key === 'backspace' ? <Delete size={21} aria-hidden="true" /> : text}</button>)}</div>
      <details className="epso-calculator-help"><summary>Touches et méthode de calcul</summary><p>Calculs de gauche à droite : 2 + 3 × 4 = 20. Pour les pourcentages : 200 × 10 % = 20 et 200 + 10 % = 220.</p><p>Clavier : chiffres, virgule ou point, +, −, *, / et Entrée. Échap ferme la calculatrice. Fermer conserve le calcul jusqu’au rechargement de l’application.</p></details>
    </section>}
  </div>;
}
