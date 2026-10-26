export type Level = 1 | 2 | 3;
export interface DataTable { headers: string[]; rows: (string | number)[][]; caption: string }
export interface Exercise {
  id: string; topic: string; seed: number; level: Level; variant: number;
  prompt: string; answer: number; unit: string; steps: string[]; hint: string;
  options: number[]; table?: DataTable; bars?: boolean;
}

export const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n);
export const roundAnswer = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const variantCounts: Record<string, number> = {
  arithmetic: 6, fractions: 5, powers: 4, proportion: 3, percent: 3, ratios: 3,
  change: 3, successive: 3, reverse: 3, points: 3, averages: 3, units: 5,
  rates: 4, currency: 4, indices: 3, equations: 3, tables: 3, multi: 3,
};

export function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateExercise(topic: string, seed: number, level: Level = 1): Exercise {
  if (!variantCounts[topic]) throw new Error('Notion inconnue');
  const rng = seededRandom(seed);
  const n = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
  const pick = <T,>(values: T[]) => values[n(0, values.length - 1)];
  const f = formatNumber;
  const variant = Math.abs(Math.trunc(seed)) % variantCounts[topic];
  const a = n(3, 12) * (level === 3 ? 3 : 1);
  const b = n(2, 9);
  const total = n(8, 30) * (level === 1 ? 20 : 100);
  const rate = pick(level === 1 ? [10, 20, 25, 50] : [8, 12, 15, 18, 24, 35]);
  let prompt = '', answer = 0, unit = '', steps: string[] = [], wrong: number[] = [];
  let table: DataTable | undefined;
  let bars = false;
  const set = (q: string, result: number, solution: string[], suffix = '', distractors: number[] = []) => {
    prompt = q; answer = result; steps = solution; unit = suffix; wrong = distractors;
  };

  switch (topic) {
    case 'arithmetic': {
      const x = a + 0.5, y = b + 0.25;
      if (variant === 0) set(`Calculer ${f(x)} + ${f(y)}.`, x + y, ['Aligner les virgules avant d’additionner.', `${f(x)} + ${f(y)} = ${f(x + y)}.`]);
      if (variant === 1) set(`Le solde est de ${a} €. Une dépense de ${a + b} € intervient. Quel est le nouveau solde ?`, -b, [`Solde final = solde initial − dépense.`, `${a} − ${a + b} = −${b}. Le solde est négatif.`], '€', [b, a + a + b]);
      if (variant === 2) set(`Calculer ${f(a / 10)} × ${f(b / 10)}.`, a * b / 100, [`Multiplier d’abord les entiers : ${a} × ${b} = ${a * b}.`, `Il y a deux chiffres décimaux au total : ${a * b} ÷ 100 = ${f(a * b / 100)}.`], '', [a * b / 10, a * b]);
      if (variant === 3) set(`Calculer ${f(a * b / 10)} ÷ ${f(b / 10)}.`, a, [`Multiplier les deux termes par 10 : ${a * b} ÷ ${b}.`, `Le résultat est ${a}.`], '', [a / 10, a * 10]);
      if (variant === 4) set(`Calculer ${a} + ${b} × 3 − 4.`, a + b * 3 - 4, [`La multiplication est prioritaire : ${b} × 3 = ${b * 3}.`, `${a} + ${b * 3} − 4 = ${a + b * 3 - 4}.`], '', [(a + b) * 3 - 4, (a + b) * (3 - 4)]);
      if (variant === 5) set(`Calculer (−${a}) × (−${b}) − (−5).`, a * b + 5, [`Deux signes négatifs dans un produit donnent un résultat positif : ${a * b}.`, `Soustraire −5 revient à ajouter 5 : ${a * b + 5}.`], '', [a * b - 5, -a * b - 5]);
      break;
    }
    case 'fractions': {
      const d = pick([4, 5, 8, 10]);
      if (variant === 0) set(`Calculer 1/2 + 1/${d}. Une fraction ou un décimal est accepté.`, 0.5 + 1 / d, [`Dénominateur commun : 2 × ${d} = ${2 * d}.`, `1/2 = ${d}/${2 * d} et 1/${d} = 2/${2 * d}.`, `Somme = ${d + 2}/${2 * d} ≈ ${f(0.5 + 1 / d)}.`], '', [2 / (2 + d), 1 / (2 * d)]);
      if (variant === 1) set(`Calculer 3/4 − 1/${d}.`, 0.75 - 1 / d, [`Dénominateur commun : ${4 * d}.`, `3/4 − 1/${d} = (${3 * d} − 4)/${4 * d} = ${3 * d - 4}/${4 * d}.`, `Résultat ≈ ${f(0.75 - 1 / d)}.`]);
      if (variant === 2) set(`Calculer 2/3 × ${b}/${d}.`, 2 * b / (3 * d), [`Multiplier haut et bas : (2 × ${b})/(3 × ${d}).`, `Cela donne ${2 * b}/${3 * d} ≈ ${f(2 * b / (3 * d))}.`]);
      if (variant === 3) set(`Calculer 2/3 ÷ ${b}/${d}.`, 2 * d / (3 * b), [`Multiplier par l’inverse : 2/3 × ${d}/${b}.`, `Résultat = ${2 * d}/${3 * b} ≈ ${f(2 * d / (3 * b))}.`], '', [2 * b / (3 * d), 3 * b / (2 * d)]);
      if (variant === 4) set(`Les 3/5 de ${total} dossiers sont finalisés. Combien ?`, total * 3 / 5, [`Une part = ${total} ÷ 5 = ${total / 5}.`, `Trois parts = ${total / 5} × 3 = ${total * 3 / 5}.`], 'dossiers');
      break;
    }
    case 'powers': {
      if (variant === 0) set(`Écrire ${f(a / 10)} × 10⁶ en nombre ordinaire.`, a * 100000, [`10⁶ = 1 000 000.`, `${f(a / 10)} × 1 000 000 = ${f(a * 100000)}.`]);
      if (variant === 1) set(`Calculer √${a * a}.`, a, [`Chercher le nombre positif dont le carré est ${a * a}.`, `${a} × ${a} = ${a * a} : la racine est ${a}.`]);
      if (variant === 2) set(`Calculer (${a} × 10⁶) ÷ (${b} × 10³).`, a / b * 1000, [`Séparer coefficients et puissances : (${a}/${b}) × 10³.`, `${a} ÷ ${b} × 1 000 ≈ ${f(a / b * 1000)}.`]);
      if (variant === 3) {
        const result = (total + 3) * b;
        set(`Estimer (${total + 3}) × ${b} en arrondissant le résultat à la centaine la plus proche.`, Math.round(result / 100) * 100, [`Produit exact : ${f(result)}.`, `À la centaine la plus proche : ${f(Math.round(result / 100) * 100)}.`]);
      }
      break;
    }
    case 'proportion': {
      if (variant === 0) set(`${a} articles identiques coûtent ${a * b} €. Combien coûtent ${a + 5} articles au même prix unitaire ?`, (a + 5) * b, [`Un article coûte ${a * b} ÷ ${a} = ${b} €.`, `${a + 5} × ${b} = ${(a + 5) * b} €.`], '€');
      if (variant === 1) set(`${b} agents terminent une tâche en ${a * 2} heures. Avec ${b * 2} agents de même rendement, combien d’heures faut-il ?`, a, [`Le nombre d’agents est doublé. La durée est divisée par deux.`, `${a * 2} × ${b} ÷ ${b * 2} = ${a} heures.`], 'h', [a * 4, a * 2]);
      if (variant === 2) set(`Une machine utilise ${f(a / 10)} L pour ${b * 10} pièces. Combien de litres pour ${b * 25} pièces, à consommation constante ?`, a / 4, [`Facteur de quantité : ${b * 25} ÷ ${b * 10} = 2,5.`, `${f(a / 10)} × 2,5 = ${f(a / 4)} L.`], 'L');
      break;
    }
    case 'percent': {
      const part = total * rate / 100;
      if (variant === 0) set(`Calculer ${rate} % de ${total} €.`, part, [`${rate} % = ${f(rate / 100)}.`, `${total} × ${f(rate / 100)} = ${f(part)} €.`], '€', [total / rate, total * rate]);
      if (variant === 1) set(`${f(part)} personnes sur ${total} ont répondu. Quel pourcentage représente cette part ?`, rate, [`Diviser la part par le total : ${f(part)} ÷ ${total} = ${f(rate / 100)}.`, `Multiplier par 100 : ${rate} %.`], '%');
      if (variant === 2) set(`${f(part)} € représentent ${rate} % d’un budget. Quel est le budget total ?`, total, [`Le total est inconnu : part ÷ proportion.`, `${f(part)} ÷ ${f(rate / 100)} = ${total} €.`], '€', [part * rate / 100, part * (1 + rate / 100)]);
      break;
    }
    case 'ratios': {
      if (variant === 0) set(`Répartir ${a * (b + 2)} € entre A et B dans le ratio 2:${b}. Combien reçoit A ?`, 2 * a, [`Total des parts : 2 + ${b} = ${b + 2}.`, `Une part vaut ${a * (b + 2)} ÷ ${b + 2} = ${a} €.`, `A reçoit 2 × ${a} = ${2 * a} €.`], '€');
      if (variant === 1) set(`Le ratio A:B est 2:${b}. A compte ${a * 2} agents. Combien en compte B ?`, a * b, [`Une part = ${a * 2} ÷ 2 = ${a}.`, `B compte ${b} parts : ${b} × ${a} = ${a * b}.`], 'agents');
      if (variant === 2) set(`Le ratio A:B est 2:${b}. Quel pourcentage du total représente A ?`, 200 / (b + 2), [`Le total comporte ${b + 2} parts.`, `Part de A : 2/${b + 2} × 100 ≈ ${f(200 / (b + 2))} %.`], '%', [200 / b, b / (b + 2) * 100]);
      break;
    }
    case 'change': {
      if (variant === 0) set(`Un budget de ${total} € augmente de ${rate} %. Quel est le nouveau budget ?`, total * (1 + rate / 100), [`Coefficient : 1 + ${rate}/100 = ${f(1 + rate / 100)}.`, `${total} × ${f(1 + rate / 100)} = ${f(total * (1 + rate / 100))} €.`], '€');
      if (variant === 1) set(`Un budget passe de ${total} € à ${f(total * (1 - rate / 100))} €. Quel est son taux d’évolution signé ?`, -rate, [`Écart : ${f(total * (1 - rate / 100))} − ${total} = ${f(-total * rate / 100)} €.`, `Écart ÷ valeur initiale × 100 = −${rate} %.`], '%', [rate, -rate / (1 - rate / 100)]);
      if (variant === 2) set(`Un budget de ${total} € baisse de ${rate} %. De combien d’euros diminue-t-il ?`, total * rate / 100, [`On cherche la baisse en euros, pas le montant restant.`, `${total} × ${rate}/100 = ${f(total * rate / 100)} €.`], '€', [total * (1 - rate / 100)]);
      break;
    }
    case 'successive': {
      const coefficient = (1 + rate / 100) * (1 - b / 100);
      if (variant === 0) set(`${total} € augmentent de ${rate} %, puis diminuent de ${b} %. Quel montant final ?`, total * coefficient, [`Coefficients : ${f(1 + rate / 100)} puis ${f(1 - b / 100)}.`, `${total} × ${f(1 + rate / 100)} × ${f(1 - b / 100)} ≈ ${f(total * coefficient)} €.`], '€', [total * (1 + (rate - b) / 100)]);
      if (variant === 1) set(`Après +${rate} %, puis −${rate} %, quel est le taux global signé ?`, -rate * rate / 100, [`Coefficient global = (1 + ${rate}/100) × (1 − ${rate}/100).`, `Soustraire 1 puis multiplier par 100 : −${f(rate * rate / 100)} %.`], '%', [0, rate, -rate]);
      if (variant === 2) set(`Un budget de ${total} € augmente de ${rate} % par an pendant 3 ans. Montant final ?`, total * (1 + rate / 100) ** 3, [`Appliquer le coefficient trois fois.`, `${total} × ${f(1 + rate / 100)}³ ≈ ${f(total * (1 + rate / 100) ** 3)} €.`], '€', [total * (1 + 3 * rate / 100)]);
      break;
    }
    case 'reverse': {
      if (variant === 0) set(`Après une hausse de ${rate} %, un budget vaut ${f(total * (1 + rate / 100))} €. Montant avant hausse ?`, total, [`Coefficient de hausse : ${f(1 + rate / 100)}.`, `Initiale = ${f(total * (1 + rate / 100))} ÷ ${f(1 + rate / 100)} = ${total} €.`], '€');
      if (variant === 1) set(`Après une remise de ${rate} %, le prix vaut ${f(total * (1 - rate / 100))} €. Quel prix initial ?`, total, [`Il reste ${100 - rate} % du prix initial.`, `${f(total * (1 - rate / 100))} ÷ ${f(1 - rate / 100)} = ${total} €.`], '€');
      if (variant === 2) set(`Après une baisse de ${rate} %, quelle hausse en % permet de revenir à la valeur initiale ?`, (1 / (1 - rate / 100) - 1) * 100, [`Pour revenir au départ, prendre l’inverse du coefficient ${f(1 - rate / 100)}.`, `(1 ÷ ${f(1 - rate / 100)} − 1) × 100 ≈ ${f((1 / (1 - rate / 100) - 1) * 100)} %.`], '%', [rate, -rate]);
      break;
    }
    case 'points': {
      const initial = b * 5, final = initial + a;
      if (variant === 0) set(`Un taux passe de ${initial} % à ${final} %. De combien de points augmente-t-il ?`, a, [`Un écart en points est une soustraction de taux.`, `${final} − ${initial} = ${a} points.`], 'points', [a / initial * 100]);
      if (variant === 1) set(`Un taux passe de ${initial} % à ${final} %. Quelle est sa hausse relative en % ?`, a / initial * 100, [`Écart : ${final} − ${initial} = ${a} points.`, `Hausse relative : ${a} ÷ ${initial} × 100 ≈ ${f(a / initial * 100)} %.`], '%', [a]);
      if (variant === 2) set(`Un taux augmente de ${a * 25} points de base. Combien de points de pourcentage cela représente-t-il ?`, a / 4, [`100 points de base correspondent à 1 point de pourcentage.`, `${a * 25} ÷ 100 = ${f(a / 4)} points.`], 'points');
      break;
    }
    case 'averages': {
      if (variant === 0) set(`Calculer la moyenne de ${a}, ${a + b} et ${a + 2 * b}.`, a + b, [`Additionner les 3 valeurs : ${3 * (a + b)}.`, `Diviser par 3 : ${a + b}.`]);
      if (variant === 1) set(`${b} agents traitent chacun ${a} dossiers et ${b * 3} autres agents en traitent chacun ${a + 8}. Quelle moyenne par agent ?`, a + 6, [`Total : ${b} × ${a} + ${b * 3} × ${a + 8} = ${b * (4 * a + 24)} dossiers.`, `Effectif total : ${b * 4}.`, `Moyenne = ${b * (4 * a + 24)} ÷ ${b * 4} = ${a + 6}.`], 'dossiers/agent', [a + 4, a + 8]);
      if (variant === 2) set(`Sur ${b} mois, la moyenne est de ${total} dossiers par mois. Sur les ${b - 1} premiers mois, le total était de ${total * (b - 1) - a}. Combien au dernier mois ?`, total + a, [`Le total des ${b} mois est ${b} × ${total} = ${b * total}.`, `Dernier mois = ${b * total} − ${total * (b - 1) - a} = ${total + a}.`], 'dossiers');
      break;
    }
    case 'units': {
      if (variant === 0) set(`Convertir ${f(a / 10)} million(s) en milliers.`, a * 100, [`1 million = 1 000 milliers.`, `${f(a / 10)} × 1 000 = ${f(a * 100)} milliers.`], 'milliers', [a * 100000, a / 10000]);
      if (variant === 1) set(`Convertir ${b} h ${a} min en heures décimales.`, b + a / 60, [`Les minutes sont des soixantièmes d’heure.`, `${b} + ${a}/60 ≈ ${f(b + a / 60)} h.`], 'h', [b + a / 100]);
      if (variant === 2) set(`Convertir ${f(a / 10)} m² en cm².`, a * 1000, [`1 m = 100 cm, donc 1 m² = 100² = 10 000 cm².`, `${f(a / 10)} × 10 000 = ${f(a * 1000)} cm².`], 'cm²', [a * 10, a * 100]);
      if (variant === 3) set(`Convertir ${f(a / 10)} m³ en litres.`, a * 100, [`1 m³ = 1 000 L.`, `${f(a / 10)} × 1 000 = ${f(a * 100)} L.`], 'L', [a * 10, a * 1000]);
      if (variant === 4) set(`Une réunion commence à 9 h ${b * 5} et dure ${a + 45} minutes. Combien de minutes après 10 h se termine-t-elle ?`, b * 5 + a + 45 - 60, [`De 9 h à 10 h, il y a 60 minutes.`, `Minutes après 10 h : ${b * 5} + ${a + 45} − 60 = ${b * 5 + a + 45 - 60}. Un résultat négatif indique une fin avant 10 h.`], 'min');
      break;
    }
    case 'rates': {
      const speed = b * 10, duration = a / 4;
      const hours = n(2, 8);
      if (variant === 0) set(`Un trajet de ${f(speed * duration)} km dure ${f(duration)} h. Quelle vitesse moyenne ?`, speed, [`Vitesse = distance ÷ durée.`, `${f(speed * duration)} ÷ ${f(duration)} = ${speed} km/h.`], 'km/h');
      if (variant === 1) set(`Une machine traite ${b * 20} dossiers par heure. Durée pour ${b * a * 10} dossiers ?`, a / 2, [`Durée = quantité ÷ débit.`, `${b * a * 10} ÷ ${b * 20} = ${f(a / 2)} h.`], 'h');
      if (variant === 2) set(`Un aller de ${a * 10} km est parcouru à ${b * 10} km/h et le retour de même distance à ${b * 20} km/h. Vitesse moyenne sur l’ensemble ?`, b * 40 / 3, [`Distance totale : ${a * 20} km.`, `Durée totale = ${a * 10}/${b * 10} + ${a * 10}/${b * 20} heures. Conserver ces fractions.`, `Distance totale ÷ durée totale ≈ ${f(b * 40 / 3)} km/h.`], 'km/h', [b * 15]);
      if (variant === 3) set(`Deux équipes traitent respectivement ${a} et ${b} dossiers par heure, indépendamment. Durée pour ${hours * (a + b)} dossiers en travaillant ensemble ?`, hours, [`Débit commun = ${a} + ${b} = ${a + b} dossiers/h.`, `${hours * (a + b)} ÷ ${a + b} = ${hours} h.`], 'h');
      break;
    }
    case 'currency': {
      const exchange = 1 + b / 10;
      if (variant === 0) set(`Le taux fourni est 1 € = ${f(exchange)} dollar. Combien de dollars pour ${total} € ?`, total * exchange, [`Pour passer des euros aux dollars, multiplier par ${f(exchange)}.`, `${total} × ${f(exchange)} = ${f(total * exchange)} dollars.`], '$');
      if (variant === 1) set(`Le taux fourni est 1 € = ${f(exchange)} dollar. Combien d’euros pour ${f(total * exchange)} dollars ?`, total, [`Faire le trajet inverse : diviser par le taux.`, `${f(total * exchange)} ÷ ${f(exchange)} = ${total} €.`], '€');
      if (variant === 2) set(`Un prix TTC de ${f(total * (1 + rate / 100))} € inclut une taxe de ${rate} %. Quel prix HT ?`, total, [`TTC = HT × ${f(1 + rate / 100)}.`, `HT = ${f(total * (1 + rate / 100))} ÷ ${f(1 + rate / 100)} = ${total} €.`], '€');
      if (variant === 3) set(`Un bien coûte ${total} € et se vend ${f(total * (1 + rate / 100))} €. Quel est le bénéfice en pourcentage du prix de vente ?`, rate / (100 + rate) * 100, [`Bénéfice = ${f(total * (1 + rate / 100))} − ${total} = ${f(total * rate / 100)} €.`, `La base demandée est la recette : ${f(total * rate / 100)} ÷ ${f(total * (1 + rate / 100))} × 100 ≈ ${f(rate / (100 + rate) * 100)} %.`], '%', [rate]);
      break;
    }
    case 'indices': {
      if (variant === 0) set(`Une valeur de base est de ${total} €. Son indice actuel est ${100 + rate}, base 100. Valeur actuelle ?`, total * (1 + rate / 100), [`Valeur = base × indice/100.`, `${total} × ${100 + rate}/100 = ${f(total * (1 + rate / 100))} €.`], '€');
      if (variant === 1) set(`Un indice passe de ${100 + a} à ${100 + a + b * 5}. Quel taux d’évolution ?`, b * 5 / (100 + a) * 100, [`La base est l’indice de départ ${100 + a}.`, `(${100 + a + b * 5} ÷ ${100 + a} − 1) × 100 ≈ ${f(b * 5 / (100 + a) * 100)} %.`], '%', [b * 5]);
      if (variant === 2) {
        // Un multiple de 10 000 garde la valeur finale exacte à deux décimales.
        const initial = a * 10000, final = initial * (1 + b / 100) ** 2;
        set(`Un budget passe de ${f(initial)} € à ${f(final)} € en 2 ans. Quel taux annuel moyen composé ?`, b, [`Coefficient global = ${f(final)} ÷ ${f(initial)}.`, `Coefficient annuel = racine carrée du coefficient global = ${f(1 + b / 100)}.`, `Taux annuel = ${b} %.`], '%', [((1 + b / 100) ** 2 - 1) * 50]);
      }
      break;
    }
    case 'equations': {
      const count = n(4, 24);
      if (variant === 0) set(`Résoudre ${b}x + ${a} = ${b * count + a}.`, count, [`Soustraire ${a} des deux côtés : ${b}x = ${b * count}.`, `Diviser par ${b} : x = ${count}.`]);
      if (variant === 1) set(`Une commande coûte ${a} € de forfait et ${b} € par article. Total : ${a + b * count} €. Combien d’articles ?`, count, [`Retirer le forfait : ${a + b * count} − ${a} = ${b * count} €.`, `Nombre d’articles = ${b * count} ÷ ${b} = ${count}.`], 'articles');
      if (variant === 2) set(`Budget maximal : ${total} €. Le forfait est de ${a} € et chaque article coûte ${b} €. Nombre maximal d’articles entiers ?`, Math.floor((total - a) / b), [`Budget pour les articles : ${total} − ${a} = ${total - a} €.`, `(${total} − ${a}) ÷ ${b} ≈ ${f((total - a) / b)}.`, `Prendre l’entier inférieur : ${Math.floor((total - a) / b)} articles.`], 'articles', [Math.floor((total - a) / b) + 1]);
      break;
    }
    case 'tables': {
      const x = a * 100, y = b * 100;
      table = { caption: 'Dossiers traités — données fictives, unité : dossier', headers: ['Service', 'Année 1', 'Année 2'], rows: [['A', x, x + 100], ['B', y, y + 200], ['C', 500, 600]] };
      bars = variant === 2;
      if (variant === 0) set('Quelle est la hausse relative du total des trois services entre l’année 1 et l’année 2 ?', 400 / (x + y + 500) * 100, [`Total année 1 : ${x} + ${y} + 500 = ${x + y + 500}.`, `Total année 2 : ${x + 100} + ${y + 200} + 600 = ${x + y + 900}.`, `Hausse = 400 ÷ ${x + y + 500} × 100 ≈ ${f(400 / (x + y + 500) * 100)} %.`], '%');
      if (variant === 1) set('En année 2, quelle part du total représente le service B ?', (y + 200) / (x + y + 900) * 100, [`Le service B compte ${y + 200} dossiers en année 2.`, `Le total de cette même année est ${x + y + 900}.`, `Part = ${y + 200} ÷ ${x + y + 900} × 100 ≈ ${f((y + 200) / (x + y + 900) * 100)} %.`], '%');
      if (variant === 2) set('En année 2, combien de dossiers A et B ont-ils traités de plus que C ?', x + y - 300, [`Lire les barres ou la colonne de l’année 2.`, `A + B − C = ${x + 100} + ${y + 200} − 600 = ${x + y - 300}.`], 'dossiers');
      break;
    }
    case 'multi': {
      const budget = total * 1000;
      if (variant === 0) set(`Un budget de ${total} milliers d’euros augmente de ${rate} %. ${b * 5} % du nouveau budget sont répartis entre 50 projets. Combien d’euros par projet ?`, budget * (1 + rate / 100) * (b * 5 / 100) / 50, [`Convertir : ${total} milliers = ${f(budget)} €.`, `Nouveau budget : ${f(budget)} × ${f(1 + rate / 100)} = ${f(budget * (1 + rate / 100))} €.`, `Enveloppe : nouveau budget × ${b * 5}/100.`, `Diviser cette enveloppe par 50 : ${f(budget * (1 + rate / 100) * (b * 5 / 100) / 50)} € par projet.`], '€/projet');
      if (variant === 1) set(`${rate} % des ${total * 5} dossiers sont prioritaires. Parmi ces dossiers prioritaires, 40 % sont clos. Combien de dossiers sont à la fois prioritaires et clos ?`, total * 5 * rate / 100 * 0.4, [`Nombre de dossiers prioritaires : ${total * 5} × ${rate}/100 = ${f(total * 5 * rate / 100)}.`, `Prendre 40 % de ce sous-ensemble : ${f(total * 5 * rate / 100)} × 0,40 = ${f(total * 5 * rate / 100 * 0.4)}.`], 'dossiers', [total * 5 * 0.4, total * 5 * (rate + 40) / 100]);
      if (variant === 2) set(`Stock initial : ${total} litres. On reçoit ${a * b} litres puis on vend ${rate} % du stock disponible après réception. Combien reste-t-il ?`, (total + a * b) * (1 - rate / 100), [`Stock disponible : ${total} + ${a * b} = ${total + a * b} L.`, `Il reste ${100 - rate} % de ce nouveau stock.`, `${total + a * b} × ${f(1 - rate / 100)} = ${f((total + a * b) * (1 - rate / 100))} L.`], 'L');
      break;
    }
  }

  if (!prompt || !Number.isFinite(answer)) throw new Error(`Exercice invalide : ${topic}`);
  const rounded = roundAnswer(answer);
  const options = [rounded];
  const candidates = [...wrong, rounded * 1.1, rounded * 0.9, rounded + 1, rounded - 1, rounded + 10, rounded + 2];
  for (const candidate of candidates) {
    const value = roundAnswer(candidate);
    if (Number.isFinite(value) && !options.includes(value)) options.push(value);
    if (options.length === 4) break;
  }
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { id: `${topic}-${seed}-${level}`, topic, seed, level, variant, prompt, answer: rounded, unit, steps, hint: steps[0], options, table, bars };
}
