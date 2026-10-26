# Prépa EPSO AD5 - Horizon

**Horizon** est une application web interactive d'aide à la préparation du prestigieux concours européen **EPSO AD5**. Conçue pour optimiser et structurer vos révisions, l'application utilise l'Intelligence Artificielle (via l'API Google Gemini) pour transformer vos cours, rapports et documents bruts en supports d'apprentissage interactifs et ciblés.

## 🎯 Objectif et But de l'Application

### Tests prêts et tablette Android

L’onglet **Tests prêts** propose six domaines : raisonnement numérique, verbal,
abstrait, connaissance de l’UE, compétences numériques et anglais. Une première
banque de 96 questions (24 verbales, 24 UE, 24 compétences numériques, 24 anglaises)
complète les calculs et les suites visuelles générés localement. Les questions
sont originales ; elles ne reproduisent pas une banque officielle d’EPSO.

En entraînement, chaque réponse peut être vérifiée immédiatement. En chronométré,
le corrigé apparaît à la fin : verbal 20 questions / 35 minutes, numérique
10 / 20 minutes, abstrait 10 / 10 minutes. Les autres défis proposent 20 questions
en 20 minutes comme format de révision. Les séances se sauvegardent, le chronomètre
continue pendant une fermeture, et les erreurs peuvent être retravaillées.

La version de production est prévue pour le site GitHub Pages existant
`https://robertopasc.github.io/Quizz-AD5/`. Après publication de cette version,
ouvrir cette adresse **dans Chrome sur Android**, attendre le message
« Tests et maths disponibles hors connexion », puis utiliser le menu ⋮ →
**Ajouter à l’écran d’accueil** → **Installer** si proposé. La première visite
demande Internet. Les fonctions IA demandent toujours Internet et une clé
personnelle ; aucune clé de développeur n’est incluse dans la version publiée.

**Exporter mon suivi**, en bas des Tests prêts, sauvegarde ensemble ces tests et
le parcours de maths. Le fichier peut être importé sur un autre appareil après
confirmation. Les anciennes bibliothèques et les clés IA ne font pas partie de
cet export ; leur sauvegarde reste accessible dans les réglages existants.

Pour vérifier la version installable : `npm run build`, puis `npm run preview`
(chemin `/Quizz-AD5/`). Le build produit le cache hors connexion avec tous les
fichiers de l’application. Un bouton propose les mises à jour lorsqu’elles sont
prêtes ; aucune mise à jour ne recharge automatiquement une séance en cours.

### Parcours de maths — objectif 9 novembre 2026

L’onglet **Parcours Maths** propose 18 chapitres avec méthodes, exemples corrigés,
exercices à valeurs variables, diagnostic de 18 questions, simulations numériques
de 10 questions en 20 minutes, formulaire et carnet d’erreurs. Les calculs sont
produits localement : cette partie de l’application ne nécessite pas de clé d’IA.
Le programme pédagogique couvre les bases de calcul et les applications au
raisonnement numérique ; les exercices sont originaux et ne sont pas officiels.
Les références EPSO du format AD5 sont consultables dans le parcours.

Sous Windows, ouvrir **Ouvrir EPSO.cmd**. Le serveur local utilise l’adresse
`http://127.0.0.1:4175/Quizz-Interatif/#maths` ; les dépendances doivent avoir été
installées avec `npm ci`. Le raccourci relance le serveur si nécessaire.

Le suivi et la séance en cours sont conservés dans ce navigateur. Le chronomètre
continue pendant une fermeture. Utiliser **Exporter mon suivi** pour une sauvegarde
portable, puis **Importer mon suivi** pour la restaurer. L’import ne remplace le
suivi qu’après validation du fichier et confirmation dans l’interface.

Vérifications du parcours : `npm test`, `npm run lint` et `npm run build`.

### Préparation générale

Le concours EPSO (Office européen de sélection du personnel) exige une connaissance pointue des institutions européennes, de l'histoire, des politiques et du droit de l'UE, ainsi que de solides capacités de raisonnement (numérique, verbal) et de rédaction (EUFTE).

Le but de **Horizon** est de vous faire gagner un temps précieux et d'améliorer votre mémorisation en automatisant la création de vos supports de révision. Au lieu de lire passivement des centaines de pages de PDF, l'application vous permet de :

1. **Extraire intelligemment les connaissances** (RAG - Retrieval-Augmented Generation) de vos documents personnels.
2. **Générer des Fiches de Synthèse et des Flashcards** pour un apprentissage actif.
3. **Vous tester via des QCM sur-mesure** générés à partir des connaissances extraites.
4. **Vous entraîner à l'expression écrite (EUFTE)** avec une correction personnalisée.

## ✨ Fonctionnalités Principales

*   📚 **Bibliothèque Locale Intégrée (File System Access API)**
    *   Sur les navigateurs compatibles, l’application peut se connecter à un dossier de l’ordinateur. Sur Android, utiliser l’import de fichiers et les exports de sauvegarde ; l’accès direct aux dossiers n’est pas disponible dans tous les navigateurs.
    *   Vos documents (PDF, Word, TXT) et vos révisions restent chez vous.
*   🧠 **Analyse IA de Documents**
    *   Importez un document et laissez l'IA l'analyser.
    *   Extraction automatique des **notions clés, chiffres clés, chronologies (dates) et acteurs majeurs**.
*   📝 **Création de Supports de Révision**
    *   Génération de Fiches thématiques (Institutions, Histoire, Politiques).
    *   Génération de listes de Vocabulaire et règles de Grammaire (Anglais).
    *   Génération de paquets de Flashcards pour la mémorisation espacée.
*   🎯 **Générateur de QCM Avancé (RAG)**
    *   Générez des QCM de "Connaissance de l'UE" à partir des données extraites de vos documents. Les réponses générées par l’IA doivent être vérifiées avec les sources.
    *   Entraînements aux raisonnements : Verbal, Numérique, et Compétences Numériques (DigComp).
*   ✍️ **Module Expression Écrite (EUFTE)**
    *   Entraînement à la rédaction d'essais dans les conditions de l'EPSO avec correction détaillée de l'IA sur le fond et la forme.

## 🚀 Comment ça marche ? (Workflow Idéal)

1. **Connectez un Dossier Local :** Indiquez à l'application où sauvegarder vos révisions.
2. **Uploadez un Cours :** Ajoutez un PDF (ex: un cours sur la PAC ou le Traité de Lisbonne).
3. **Lancez l'Analyse :** Demandez à l'IA d'analyser le document. L'IA va lire le texte brut et extraire toutes les connaissances importantes (dates, institutions, synthèse).
4. **Testez-vous :** Allez dans l'onglet QCM, sélectionnez "Connaissance de l'UE", et lancez un test. L'IA utilisera les connaissances qu'elle a extraites pour générer les questions.

## 🛠️ Technologies Utilisées

*   **Frontend :** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons.
*   **Intelligence Artificielle :** Google Gemini API (Modèles Gemini 1.5 Flash et Pro).
*   **Stockage :** sauvegarde dans le navigateur et, lorsque disponible, accès à un dossier autorisé via File System Access API.
*   **PWA (Progressive Web App) :** Installable sur tablette (iOS/Android) ou Desktop pour une utilisation en plein écran comme une application native.

## 🔐 Sécurité et Confidentialité

*   **Clé API Locale :** Votre clé API Google AI Studio n'est sauvegardée que sur votre appareil (LocalStorage). Elle n'est jamais transmise à un serveur tiers (autre que Google pour la requête).
*   **Données Locales :** Les documents traités et les analyses générées restent dans le dossier local de votre choix. L'application ne possède pas de backend de base de données distant.

---
*Conçu comme un outil personnel d'excellence pour réussir le concours EPSO AD5.*
