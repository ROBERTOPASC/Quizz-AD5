type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type Operator = '+' | '-' | '*' | '/';
export type CalculatorKey = Digit | Operator | '.' | '=' | 'clear' | 'backspace' | 'sign' | '%';

export interface CalculatorState {
  display: string;
  expression: string;
  error: string | null;
  accumulator: number | null;
  operator: Operator | null;
  waitingForOperand: boolean;
  replaceDisplay: boolean;
  lastOperator: Operator | null;
  lastOperand: number | null;
  percentApplied: boolean;
}

export const initialCalculatorState: CalculatorState = {
  display: '0', expression: '', error: null, accumulator: null, operator: null,
  waitingForOperand: false, replaceDisplay: false, lastOperator: null, lastOperand: null,
  percentApplied: false,
};

const symbols: Record<Operator, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };
const french = (value: string) => value.replace('.', ',');
// Fourteen significant digits keep ordinary decimal calculations readable and bounded.
const numberText = (value: number) => {
  const rounded = Number(value.toPrecision(14));
  return String(Number.isFinite(rounded) ? rounded : value);
};
const inputDigitLimit = 14;

export function formatCalculatorDisplay(state: CalculatorState): string {
  return state.error ? 'Erreur' : french(state.display);
}

function failed(expression: string, error: string): CalculatorState {
  return { ...initialCalculatorState, expression, error, replaceDisplay: true };
}

function calculate(left: number, operator: Operator, right: number): number {
  if (operator === '+') return left + right;
  if (operator === '-') return left - right;
  if (operator === '*') return left * right;
  return left / right;
}

function result(left: number, operator: Operator, right: number): { value: number; error: null } | { value: null; error: string } {
  if (operator === '/' && right === 0) return { value: null, error: 'Division par zéro impossible.' };
  const value = calculate(left, operator, right);
  if (!Number.isFinite(value)) return { value: null, error: 'Résultat trop grand. Effacez et recommencez.' };
  return { value: Number(numberText(value)), error: null };
}

/** A pocket calculator: each operation is performed as soon as the next operator is pressed. */
export function calculatorReducer(state: CalculatorState, key: CalculatorKey): CalculatorState {
  if (key === 'clear') return { ...initialCalculatorState };
  if (/^[0-9]$/.test(key) || key === '.') {
    const fresh = state.error || (state.replaceDisplay && !state.operator);
    const base = fresh ? { ...initialCalculatorState } : state;
    let display = base.replaceDisplay ? '0' : base.display;
    if (key === '.') {
      if (display.includes('.')) return base;
      display += '.';
    } else {
      if (display.replace(/\D/g, '').length >= inputDigitLimit && display !== '0' && display !== '-0') return base;
      display = display === '0' ? key : display === '-0' ? `-${key}` : display + key;
    }
    const expression = base.operator && base.accumulator !== null
      ? `${french(numberText(base.accumulator))} ${symbols[base.operator]}` : '';
    return { ...base, display, expression, replaceDisplay: false, waitingForOperand: false, percentApplied: false, lastOperator: null, lastOperand: null };
  }
  if (state.error) return key === 'backspace' ? { ...initialCalculatorState } : state;

  if (key === 'backspace') {
    if (state.replaceDisplay) return state;
    const shortened = state.display.slice(0, -1);
    return { ...state, display: shortened && shortened !== '-' ? shortened : '0', percentApplied: false };
  }
  if (key === 'sign') {
    if (state.waitingForOperand) return { ...state, display: '-0', waitingForOperand: false, replaceDisplay: false };
    return { ...state, display: state.display.startsWith('-') ? state.display.slice(1) : `-${state.display}` };
  }
  if (key === '%') {
    if (state.percentApplied || state.waitingForOperand) return state;
    const current = Number(state.display);
    const value = (state.operator === '+' || state.operator === '-') && state.accumulator !== null
      ? state.accumulator * (current / 100)
      : current / 100;
    const expression = state.operator && state.accumulator !== null
      ? `${french(numberText(state.accumulator))} ${symbols[state.operator]} ${french(state.display)} %`
      : `${french(state.display)} %`;
    if (!Number.isFinite(value)) return failed(expression, 'Résultat trop grand. Effacez et recommencez.');
    return { ...state, display: numberText(value), expression, replaceDisplay: true, percentApplied: true, lastOperator: null, lastOperand: null };
  }
  if (key === '=') {
    const operator = state.operator ?? state.lastOperator;
    const left = state.operator ? state.accumulator! : Number(state.display);
    const right = state.operator
      ? state.waitingForOperand ? left : Number(state.display)
      : state.lastOperand;
    if (!operator || right === null) return { ...state, display: numberText(Number(state.display)), expression: `${french(state.display)} =`, replaceDisplay: true, percentApplied: false };
    const expression = `${french(numberText(left))} ${symbols[operator]} ${french(numberText(right))} =`;
    const calculated = result(left, operator, right);
    if (calculated.error) return failed(expression, calculated.error);
    return { ...initialCalculatorState, display: numberText(calculated.value!), expression, replaceDisplay: true, lastOperator: operator, lastOperand: right };
  }

  // A second operator before entering a number replaces the pending operation.
  if (state.operator && state.waitingForOperand) {
    return { ...state, operator: key as Operator, expression: `${french(numberText(state.accumulator!))} ${symbols[key as Operator]}` };
  }
  let value = Number(state.display);
  if (state.operator && state.accumulator !== null) {
    const expression = `${french(numberText(state.accumulator))} ${symbols[state.operator]} ${french(state.display)} =`;
    const calculated = result(state.accumulator, state.operator, value);
    if (calculated.error) return failed(expression, calculated.error);
    value = calculated.value!;
  }
  return {
    ...initialCalculatorState, display: numberText(value), accumulator: value, operator: key as Operator,
    expression: `${french(numberText(value))} ${symbols[key as Operator]}`, waitingForOperand: true, replaceDisplay: true,
  };
}
