export type Category = 'numerical' | 'verbal' | 'abstract' | 'eu' | 'digital' | 'english';
export type Figure = { shape: 'arrow' | 'circle' | 'square' | 'triangle'; rotation: number; filled: boolean; count: number; position: number };
export interface TrainingQuestion {
  id: string; category: Category; prompt: string; context?: string;
  options: string[]; answer: number; explanation: string;
  source?: { title: string; url: string };
  visual?: { sequence: Figure[]; choices: Figure[] };
  table?: { headers: string[]; rows: (string | number)[][]; caption: string };
}
export const categories: { id: Category; title: string; description: string; priority: boolean; minutes?: number; count?: number }[] = [
  { id: 'numerical', title: 'Raisonnement numérique', description: 'Tableaux, pourcentages, ratios, moyennes et conversions.', priority: true, count: 10, minutes: 20 },
  { id: 'verbal', title: 'Raisonnement verbal', description: 'Lire précisément, déduire et repérer les conclusions non justifiées.', priority: true, count: 20, minutes: 35 },
  { id: 'abstract', title: 'Raisonnement abstrait', description: 'Suites visuelles : rotation, position, quantité et alternance.', priority: true, count: 10, minutes: 10 },
  { id: 'eu', title: 'Connaissance de l’UE', description: 'Institutions, actes juridiques, marché intérieur et politiques.', priority: false },
  { id: 'digital', title: 'Compétences numériques', description: 'Information, collaboration, création, sécurité et résolution de problèmes.', priority: false },
  { id: 'english', title: 'Anglais', description: 'Grammaire, vocabulaire professionnel et faux amis.', priority: false },
];
