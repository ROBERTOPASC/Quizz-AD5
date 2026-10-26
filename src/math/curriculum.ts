export interface Lesson {
  id: string;
  title: string;
  family: string;
  goal: string;
  when: string;
  rules: string[];
  example: { question: string; steps: string[] };
  trap: string;
}

export const lessons: Lesson[] = [
  {
    id: 'arithmetic', title: 'Les quatre opérations et les priorités', family: 'Fondations',
    goal: 'Additionner, soustraire, multiplier et diviser des entiers et des décimaux.',
    when: 'Un total → addition ; un écart ou un reste → soustraction ; des groupes identiques → multiplication ; un partage ou une valeur par unité → division.',
    rules: ['Addition et soustraction : aligner les virgules. 12,5 + 0,75 = 13,25.', 'Multiplication : 1,2 × 0,3 = 0,36. Division : 7,5 ÷ 0,5 = 75 ÷ 5 = 15 ; multiplier les deux nombres par le même facteur.', 'Calculer les parenthèses, puis les puissances, puis × et ÷ de gauche à droite, puis + et − de gauche à droite.', 'Pour un produit ou un quotient : mêmes signes → positif, signes différents → négatif. Soustraire un négatif revient à additionner : 5 − (−3) = 8.', 'Contrôle mental : 19 × 21 est proche de 20 × 20 = 400. Une division par zéro est impossible.'],
    example: { question: 'Un budget de 500 € finance 8 lots à 35 € et 20 € de livraison. Quel reste ?', steps: ['Le coût des lots est 8 × 35 = 280 €.', 'La dépense totale est 280 + 20 = 300 €.', 'Le reste est 500 − (8 × 35 + 20) = 200 €.'] },
    trap: '8 + 4 × 3 vaut 20 ; (8 + 4) × 3 vaut 36. Les parenthèses changent le sens du calcul.',
  },
  {
    id: 'fractions', title: 'Fractions et nombres décimaux', family: 'Fondations',
    goal: 'Simplifier, comparer et effectuer les quatre opérations sur des fractions.',
    when: 'Une quantité est une partie d’un tout, ou une division doit rester exacte.',
    rules: ['a/b signifie a ÷ b, avec b différent de zéro. Simplifier en divisant haut et bas par le même nombre.', 'Pour + ou −, mettre au même dénominateur : 1/2 + 1/3 = 3/6 + 2/6 = 5/6.', 'Pour ×, multiplier les numérateurs et les dénominateurs : 2/3 × 3/4 = 6/12 = 1/2.', 'Pour ÷, multiplier par l’inverse de la seconde fraction : 2/3 ÷ 4/5 = 2/3 × 5/4 = 5/6.', 'Repères : 1/2 = 0,5 = 50 % ; 1/4 = 25 % ; 1/5 = 20 % ; 1/8 = 12,5 % ; 1/3 ≈ 33,33 %.'],
    example: { question: 'Les 3/5 de 240 dossiers sont traités. Combien ?', steps: ['Partager 240 en 5 parts : 240 ÷ 5 = 48.', 'Prendre 3 parts : 48 × 3 = 144 dossiers.'] },
    trap: '1/2 + 1/3 ne vaut pas 2/5. On additionne des parts de même taille.',
  },
  {
    id: 'powers', title: 'Puissances, racines et estimation', family: 'Fondations',
    goal: 'Manipuler les ordres de grandeur et vérifier la plausibilité d’un résultat.',
    when: 'Les données sont très grandes, présentées en notation scientifique, ou un résultat doit être estimé.',
    rules: ['10³ = 1 000 ; 10⁶ = un million ; 10⁹ = un milliard. 3,2 × 10⁶ = 3 200 000.', 'a² = a × a ; √a est la racine carrée positive de a pour a ≥ 0. √144 = 12.', 'À base identique : aᵐ × aⁿ = aᵐ⁺ⁿ ; aᵐ ÷ aⁿ = aᵐ⁻ⁿ pour a non nul.', '10⁻² = 0,01 ; multiplier par 10⁻² revient à diviser par 100.', 'Estimer avant de calculer. Arrondir seulement à la fin si les réponses proposées sont proches.'],
    example: { question: 'Un budget de 2,4 × 10⁶ € couvre 600 projets. Budget moyen ?', steps: ['2,4 × 10⁶ € = 2 400 000 €.', '2 400 000 ÷ 600 = 4 000 € par projet.', 'Vérification : 600 × 4 000 = 2 400 000.'] },
    trap: 'Un million contient 1 000 milliers. Une racine ne se distribue pas sur une somme : √(9 + 16) = 5.',
  },
  {
    id: 'proportion', title: 'Proportionnalité et règle de trois', family: 'Proportions',
    goal: 'Trouver une valeur manquante en passant par l’unité.',
    when: 'Le prix par unité, le rendement ou la consommation unitaire reste constant.',
    rules: ['Passage à l’unité : valeur connue ÷ quantité connue, puis × quantité cherchée.', 'Produit en croix : si a/b = c/d, alors a × d = b × c.', 'Proportionnalité inverse : pour un travail fixe, doubler le nombre de personnes divise la durée par deux, à rendement égal.', 'Vérifier l’hypothèse : un prix avec un forfait fixe n’est pas proportionnel à la quantité.'],
    example: { question: '12 dossiers demandent 18 minutes. Durée pour 50 dossiers au même rythme ?', steps: ['18 ÷ 12 = 1,5 minute par dossier.', '50 × 1,5 = 75 minutes, soit 1 h 15.'] },
    trap: 'Toujours vérifier le sens : davantage de personnes doit réduire la durée d’un même travail.',
  },
  {
    id: 'percent', title: 'Pourcentages : part, taux et total', family: 'Proportions',
    goal: 'Choisir entre calculer une part, calculer un pourcentage et retrouver un total.',
    when: 'L’énoncé contient « sur », « représente », « part de » ou « % de ».',
    rules: ['Part = total × taux/100.', 'Taux en % = part ÷ total × 100.', 'Total = part ÷ (taux/100), pour un taux non nul.', 'Calcul mental : 10 % = ÷ 10 ; 5 % = moitié de 10 % ; 1 % = ÷ 100 ; 15 % = 10 % + 5 %.'],
    example: { question: '84 dossiers représentent 35 % du total. Combien de dossiers au total ?', steps: ['35 % = 0,35.', 'Total = 84 ÷ 0,35 = 240 dossiers.', 'Vérifier : 240 × 0,35 = 84.'] },
    trap: 'Le dénominateur est le total de référence demandé. « Parmi les femmes » utilise le nombre de femmes.',
  },
  {
    id: 'ratios', title: 'Ratios et partages', family: 'Proportions',
    goal: 'Passer d’un rapport entre deux groupes à leurs effectifs ou à leurs parts.',
    when: 'Deux quantités sont dans le rapport 2:3, ou une enveloppe est répartie proportionnellement.',
    rules: ['Un ratio A:B = 2:3 signifie 2 parts pour A et 3 pour B, soit 5 parts au total.', 'Part de A dans le total = 2/(2 + 3) = 40 %.', 'Si A est connu, B = A × 3/2.', 'Pour partager un total T dans le rapport a:b:c, une part vaut T/(a + b + c).'],
    example: { question: 'Partager 900 € entre A et B dans le ratio 2:3.', steps: ['2 + 3 = 5 parts.', '900 ÷ 5 = 180 € par part.', 'A reçoit 360 € ; B reçoit 540 €.'] },
    trap: 'Dans un ratio 2:3, A représente 2/5 du total, et non 2/3.',
  },
  {
    id: 'change', title: 'Augmentations et diminutions', family: 'Évolutions',
    goal: 'Distinguer variation absolue, variation relative et valeur finale.',
    when: 'Comparer deux périodes ou appliquer une hausse ou une baisse.',
    rules: ['Variation absolue = valeur finale − valeur initiale.', 'Taux d’évolution = (finale − initiale) ÷ initiale × 100, pour une base initiale positive.', 'Hausse de t % : multiplier par 1 + t/100. Baisse de t % : multiplier par 1 − t/100.', 'Une base initiale nulle ne permet pas ce calcul de taux.'],
    example: { question: 'Un effectif passe de 240 à 276. Quelle hausse en % ?', steps: ['Écart : 276 − 240 = 36.', 'Comparer à la valeur initiale : 36 ÷ 240 = 0,15.', 'La hausse est de 15 %.'] },
    trap: 'Diviser par la valeur finale donne le mauvais taux d’évolution.',
  },
  {
    id: 'successive', title: 'Évolutions successives', family: 'Évolutions',
    goal: 'Combiner plusieurs hausses et baisses sur des bases successives.',
    when: 'Un prix ou un budget évolue plusieurs fois.',
    rules: ['Transformer chaque taux en coefficient multiplicateur.', 'Coefficient global = produit des coefficients.', 'Taux global en % = (coefficient global − 1) × 100.', 'Un même taux t répété n fois : finale = initiale × (1 + t/100)ⁿ.'],
    example: { question: 'Une valeur augmente de 20 %, puis baisse de 20 %. Évolution globale ?', steps: ['Coefficients : 1,20 et 0,80.', '1,20 × 0,80 = 0,96.', '(0,96 − 1) × 100 = −4 % : baisse de 4 %.'] },
    trap: 'Les taux successifs ne s’additionnent pas. Les deux variations portent sur des bases différentes.',
  },
  {
    id: 'reverse', title: 'Retrouver la valeur initiale', family: 'Évolutions',
    goal: 'Remonter d’une valeur finale au montant d’origine.',
    when: '« Après une hausse », « après remise », « avant augmentation » ou « revenir au niveau initial ».',
    rules: ['Initiale = finale ÷ coefficient multiplicateur.', 'Après une hausse de 25 %, diviser par 1,25.', 'Après une baisse de 20 %, diviser par 0,80.', 'Taux de retour = (1/coefficient − 1) × 100. Une baisse de 20 % nécessite ensuite une hausse de 25 % pour être annulée.'],
    example: { question: 'Un prix après remise de 20 % vaut 96 €. Quel était le prix initial ?', steps: ['Il reste 80 % du prix : coefficient 0,80.', '96 ÷ 0,80 = 120 €.', 'Contrôle : 120 × 0,80 = 96 €.'] },
    trap: 'Ajouter 20 % à 96 € ne restitue pas le prix avant une remise de 20 %.',
  },
  {
    id: 'points', title: 'Pourcentages et points de pourcentage', family: 'Évolutions',
    goal: 'Comparer des taux sans confondre écart de taux et évolution relative.',
    when: 'Un taux passe, par exemple, de 20 % à 25 %.',
    rules: ['Écart en points = taux final − taux initial.', 'Évolution relative du taux = (taux final − taux initial) ÷ taux initial × 100.', 'De 20 % à 25 % : +5 points, mais +25 % en valeur relative.', 'Un point de base = 0,01 point de pourcentage ; 100 points de base = 1 point.'],
    example: { question: 'Un taux passe de 40 % à 50 %. Quelle évolution ?', steps: ['Écart : 50 − 40 = 10 points.', 'Évolution relative : 10 ÷ 40 × 100 = 25 %.'] },
    trap: '« +10 % » et « +10 points » ne désignent pas la même augmentation.',
  },
  {
    id: 'averages', title: 'Moyennes simples et pondérées', family: 'Données',
    goal: 'Calculer une moyenne en tenant compte des effectifs et retrouver un total.',
    when: 'Plusieurs groupes, périodes ou catégories ont des poids différents.',
    rules: ['Moyenne simple = somme des valeurs ÷ nombre de valeurs.', 'Moyenne pondérée = somme(valeur × effectif) ÷ somme des effectifs.', 'Total = moyenne × effectif.', 'Pour un taux global, additionner les numérateurs et les dénominateurs avant de diviser.'],
    example: { question: '10 agents traitent en moyenne 12 dossiers, et 30 agents en traitent 20. Moyenne générale ?', steps: ['Total : 10 × 12 + 30 × 20 = 720 dossiers.', 'Effectif : 10 + 30 = 40.', 'Moyenne : 720 ÷ 40 = 18 dossiers par agent.'] },
    trap: '(12 + 20)/2 = 16 ignore que le second groupe est trois fois plus nombreux.',
  },
  {
    id: 'units', title: 'Conversions et durées', family: 'Applications',
    goal: 'Mettre toutes les données dans la même unité avant de calculer.',
    when: 'Un tableau mélange milliers, millions, heures, minutes, longueurs, surfaces ou volumes.',
    rules: ['1 million = 1 000 milliers ; 1 milliard = 1 000 millions.', '1 h = 60 min ; 1 min = 60 s. 1 h 30 = 1,5 h et non 1,30 h.', '1 km = 1 000 m ; 1 kg = 1 000 g ; 1 L = 1 000 mL.', 'Les surfaces ont des facteurs au carré : 1 m² = 10 000 cm² ; 1 km² = 1 000 000 m².', 'Les volumes ont des facteurs au cube : 1 m³ = 1 000 L.'],
    example: { question: '2,4 millions d’euros sont répartis entre 800 bénéficiaires. Montant unitaire ?', steps: ['Convertir : 2,4 millions = 2 400 000 €.', '2 400 000 ÷ 800 = 3 000 € par bénéficiaire.'] },
    trap: 'Lire l’unité dans l’en-tête du tableau : « 240 » peut signifier 240 000.',
  },
  {
    id: 'rates', title: 'Vitesses, débits et productivité', family: 'Applications',
    goal: 'Relier une quantité, une durée et un rythme de réalisation.',
    when: 'Il est question de km/h, dossiers/heure, litres/minute ou rendement par personne.',
    rules: ['Vitesse = distance ÷ durée ; distance = vitesse × durée ; durée = distance ÷ vitesse.', 'Quantité produite = débit × durée. Conserver des unités compatibles.', 'Pour un trajet complet : vitesse moyenne = distance totale ÷ durée totale.', 'Des équipes indépendantes à rendement constant additionnent leurs débits, pas leurs durées.'],
    example: { question: '180 km sont parcourus en 2 h 15. Vitesse moyenne ?', steps: ['2 h 15 = 2 + 15/60 = 2,25 h.', '180 ÷ 2,25 = 80 km/h.'] },
    trap: 'À distances égales, la moyenne de deux vitesses n’est généralement pas leur moyenne arithmétique.',
  },
  {
    id: 'currency', title: 'Devises, prix et taxes', family: 'Applications',
    goal: 'Appliquer un taux de change, une taxe ou une remise dans le bon sens.',
    when: 'Convertir une monnaie ou passer d’un prix HT à TTC et inversement.',
    rules: ['Si 1 € = 1,20 unité monétaire, multiplier les euros par 1,20 pour obtenir cette monnaie.', 'Pour le trajet inverse, diviser par 1,20.', 'TTC = HT × (1 + taxe/100) ; HT = TTC ÷ (1 + taxe/100).', 'Bénéfice = recette − coût. Pourcentage sur coût : bénéfice/coût ; pourcentage sur recette : bénéfice/recette.'],
    example: { question: 'Un prix TTC de 144 € inclut une taxe de 20 %. Quel est le prix HT ?', steps: ['TTC = HT × 1,20.', 'HT = 144 ÷ 1,20 = 120 €.', 'Taxe = 144 − 120 = 24 €.'] },
    trap: 'Le taux de change est fourni dans chaque exercice. La taxe porte sur le HT, pas sur le TTC.',
  },
  {
    id: 'indices', title: 'Indices et croissance moyenne', family: 'Données',
    goal: 'Lire un indice base 100 et comparer deux dates.',
    when: 'Un tableau affiche des indices plutôt que les valeurs réelles.',
    rules: ['Indice = valeur ÷ valeur de base × 100.', 'Valeur = valeur de base × indice/100.', 'Entre deux indices I₁ et I₂ : évolution = (I₂/I₁ − 1) × 100.', 'Sur n périodes, taux moyen composé = ((finale/initiale)^(1/n) − 1) × 100. Ce complément demande une racine ou une puissance.'],
    example: { question: 'L’indice passe de 120 à 150. Quelle croissance ?', steps: ['Coefficient : 150 ÷ 120 = 1,25.', 'Croissance : (1,25 − 1) × 100 = 25 %.'] },
    trap: 'La différence de 30 points d’indice n’est pas une hausse de 30 %.',
  },
  {
    id: 'equations', title: 'Équations et valeurs manquantes', family: 'Fondations',
    goal: 'Traduire un énoncé en calcul et isoler l’inconnue.',
    when: 'Un total, un forfait ou un tarif permet de retrouver une quantité inconnue.',
    rules: ['Nommer l’inconnue x et préciser son unité.', 'Effectuer la même opération des deux côtés de l’égalité.', 'Si ax + b = c, alors x = (c − b)/a, pour a non nul.', 'Avec un budget maximal, calculer le quotient puis prendre l’entier inférieur si seuls des objets entiers peuvent être achetés.', 'Contrôler le résultat en le remplaçant dans l’énoncé.'],
    example: { question: 'Une commande coûte 20 € de forfait et 8 € par article, pour 116 € au total. Combien d’articles ?', steps: ['Équation : 20 + 8x = 116.', '8x = 116 − 20 = 96.', 'x = 96 ÷ 8 = 12 articles.'] },
    trap: 'Un coût fixe ne se multiplie pas par le nombre d’articles.',
  },
  {
    id: 'tables', title: 'Lire les tableaux et graphiques', family: 'Données',
    goal: 'Repérer la bonne ligne, la bonne période et la bonne base de calcul.',
    when: 'Plusieurs données sont disponibles et seules certaines répondent à la question.',
    rules: ['Lire d’abord la question : quantité cherchée, période, population et unité.', 'Repérer les cellules utiles ; ignorer les données qui ne servent pas au calcul.', 'Pour un total, additionner uniquement des catégories compatibles et sans double comptage.', 'Sur un graphique, lire l’axe, sa graduation, son origine et la légende. Un axe tronqué peut amplifier visuellement une variation.', '« Impossible à déterminer » est justifié si une donnée nécessaire manque : ne pas l’inventer.'],
    example: { question: 'A compte 120 dossiers en année 1 et 150 en année 2 ; B en compte 80 puis 120. Hausse de l’ensemble ?', steps: ['Total année 1 : 120 + 80 = 200.', 'Total année 2 : 150 + 120 = 270.', '(270 − 200) ÷ 200 × 100 = 35 %.'] },
    trap: 'La plus forte hausse en valeur absolue n’est pas forcément la plus forte hausse en %.',
  },
  {
    id: 'multi', title: 'Problèmes à plusieurs étapes', family: 'Synthèse',
    goal: 'Construire une courte chaîne de calculs pour répondre exactement à la question.',
    when: 'Le résultat exige de combiner une part, une évolution et une conversion, ou des stocks et des flux.',
    rules: ['Écrire la grandeur finale demandée et son unité avant de commencer.', 'Décomposer : donnée de départ → quantité intermédiaire → résultat.', 'Pour une part d’une part : multiplier les proportions. 30 % de 40 % = 0,30 × 0,40 = 12 % du tout.', 'Stock final = stock initial + entrées − sorties, sur une même période.', 'Garder la précision intermédiaire et arrondir le résultat final seulement.'],
    example: { question: 'Un budget de 2 M€ augmente de 10 %. On attribue 30 % du nouveau budget à 60 projets. Montant par projet ?', steps: ['Nouveau budget : 2 000 000 × 1,10 = 2 200 000 €.', 'Enveloppe : 2 200 000 × 0,30 = 660 000 €.', 'Par projet : 660 000 ÷ 60 = 11 000 €.'] },
    trap: 'Une bonne formule appliquée à la mauvaise base produit une réponse plausible mais fausse.',
  },
];

export const studyPlan = [
  { title: 'Diagnostic et bases', topics: ['arithmetic', 'fractions'] },
  { title: 'Ordres de grandeur et conversions', topics: ['powers', 'units'] },
  { title: 'Proportionnalité et ratios', topics: ['proportion', 'ratios'] },
  { title: 'Les trois calculs de pourcentage', topics: ['percent'] },
  { title: 'Hausses, baisses et valeur initiale', topics: ['change', 'reverse'] },
  { title: 'Évolutions successives et points', topics: ['successive', 'points'] },
  { title: 'Moyennes et indices', topics: ['averages', 'indices'] },
  { title: 'Vitesses et productivité', topics: ['rates'] },
  { title: 'Prix, devises et équations', topics: ['currency', 'equations'] },
  { title: 'Tableaux et graphiques', topics: ['tables'] },
  { title: 'Problèmes à plusieurs étapes', topics: ['multi'] },
  { title: 'Simulation numérique et correction', topics: ['tables', 'multi', 'percent'] },
  { title: 'Deuxième simulation, reprise des erreurs', topics: ['change', 'averages', 'rates'] },
  { title: 'Révision légère des méthodes fragiles', topics: ['reverse', 'successive', 'units'] },
];

export const officialSources = [
  { title: 'Avis AD5 consolidé : format et seuils, p. 6', url: 'https://selection.eu-careers.europa.eu/system/files/2026-07/Notice-of-open-competition-EPSO-AD-427-26_consolidated-version.pdf' },
  { title: 'Calendrier officiel du concours AD5', url: 'https://selection.eu-careers.europa.eu/en/job-opportunities/graduate-administrators' },
  { title: 'Exemples officiels : verbal, numérique et abstrait', url: 'https://selection.eu-careers.europa.eu/en/graduates-administrators-ad5' },
];
