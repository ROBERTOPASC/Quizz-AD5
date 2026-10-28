import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatorReducer, CalculatorKey, CalculatorState, formatCalculatorDisplay, initialCalculatorState } from '../src/calculator/engine';

const press = (keys: CalculatorKey[], initial: CalculatorState = initialCalculatorState) => keys.reduce(calculatorReducer, initial);
const type = (input: string) => input.split('') as CalculatorKey[];

test('Calculatrice : quatre opérations et virgule française, sans réseau', () => {
  const examples: [string, string][] = [
    ['17+25=', '42'], ['100-37=', '63'], ['12*8=', '96'], ['144/12=', '12'],
    ['12.5+2.75=', '15,25'], ['0.1+0.2=', '0,3'], ['.5*.2=', '0,1'], ['5-8=', '-3'],
  ];
  for (const [keys, expected] of examples) {
    const state = press(type(keys));
    assert.equal(state.error, null, keys);
    assert.equal(formatCalculatorDisplay(state), expected, keys);
  }
});

test('Calculatrice : opérations successives et remplacement de l’opérateur', () => {
  assert.equal(press(type('2+3*4=')).display, '20');
  assert.equal(press(type('10/2+7=')).display, '12');
  assert.equal(press(type('12+*3=')).display, '36');
  assert.equal(press(type('12*+3=')).display, '15');
  assert.equal(press(type('5+=' )).display, '10');
  assert.equal(press(type('9/=' )).display, '1');
});

test('Calculatrice : pourcentages usuels et seconde pression sans effet', () => {
  const examples: [string, string][] = [
    ['200+10%=', '220'], ['200-10%=', '180'], ['200*10%=', '20'], ['200/10%=', '2000'],
    ['50%=', '0.5'], ['200+10%%=', '220'], ['200*10%+5=', '25'], ['200+0%=', '200'],
  ];
  for (const [keys, expected] of examples) assert.equal(press(type(keys)).display, expected, keys);
  assert.equal(press([...type('20+10'), 'sign', '%', '=']).display, '18');
  const replacement = press(type('200+10%2'));
  assert.equal(replacement.expression, '200 +');
  assert.equal(calculatorReducer(replacement, '=').display, '202');
});

test('Calculatrice : signe, saisie négative et correction de la saisie', () => {
  assert.equal(press(['sign', '2', '*', '3', '=']).display, '-6');
  assert.equal(press(['5', '+', 'sign', '2', '=']).display, '3');
  assert.equal(press(['sign', '.', '5', '*', '2', '=']).display, '-1');
  assert.equal(press(['2', 'sign', 'sign']).display, '2');
  assert.equal(press([...type('12.35'), 'backspace', '4']).display, '12.34');
  assert.equal(press(['sign', '2', 'backspace']).display, '0');
  assert.equal(press([...type('5+23'), 'backspace', '=']).display, '7');
});

test('Calculatrice : résultat réutilisable, égal répété et nouveau calcul', () => {
  assert.equal(press(type('10+2===')).display, '16');
  assert.equal(press(type('2*3===')).display, '54');
  assert.equal(press(type('200+10%==')).display, '240');
  assert.equal(press(type('2+3=*4=')).display, '20');
  assert.equal(press(type('2+3=7')).display, '7');
  assert.equal(press(type('2+3=.5')).display, '0.5');
  assert.equal(press(type('2+3=10=')).display, '10');
  assert.equal(press(type('2+3=%=')).display, '0.05');
});

test('Calculatrice : division par zéro signalée et reprise par un chiffre', () => {
  const zero = press(type('12/0='));
  assert.match(zero.error!, /zéro/);
  assert.equal(formatCalculatorDisplay(zero), 'Erreur');
  assert.equal(press(type('3+4='), zero).display, '7');
  assert.equal(press(['backspace'], zero).error, null);
  assert.equal(press(['clear'], zero).display, '0');
  assert.match(press(type('0/0=')).error!, /zéro/);
  assert.match(press(type('5/0+')).error!, /zéro/);
  assert.match(press(['5', '/', 'sign', '0', '=']).error!, /zéro/);
});

test('Calculatrice : saisie bornée, point unique et dépassement contrôlé', () => {
  assert.equal(press(type('12345678901234567890')).display, '12345678901234');
  assert.equal(press(type('1.2.3')).display, '1.23');
  assert.equal(press(type('0003')).display, '3');
  let large = press(type('99999999999999*99999999999999='));
  for (let i = 0; i < 25 && !large.error; i++) large = calculatorReducer(large, '=');
  assert.match(large.error!, /trop grand/);
  assert.equal(calculatorReducer(large, '2').display, '2');
});

test('Calculatrice : contexte lisible et remise à zéro indépendante', () => {
  const initial = Object.freeze({ ...initialCalculatorState });
  const pending = press(type('12.5*'), initial);
  assert.equal(pending.expression, '12,5 ×');
  const done = press(type('2='), pending);
  assert.equal(done.expression, '12,5 × 2 =');
  assert.equal(initial.display, '0');
  assert.deepEqual(calculatorReducer(done, 'clear'), initialCalculatorState);
  assert.equal(press(type('2='), pending).display, '25');
});
