

Il s'agit d'une tentative de créer une application numérique de la
["Bulloerie"](https://movilab.org/wiki/La_Bulloterie)

Pour faire simple, il s'agit d'un outil de visualisation des savoirs et des affinités d'un ensemble de personnes.
Un certain nombre de collectifs ont déjà expérimentés l’utilité de cette méthode. Un problème de stockage et de traitement des données collecté semble être récurrent.
Ce projet souhaite donc répondre à ce manque.

> Je n’ai pas suffisamment de temps (et de connaissances) pour mener à terme ce projet. Toute aide est donc la bienvenue.
  Vous pouvez visualiser l’état actuel cette [page de démo](https://corbane.github.io/Concept/Demo/index.html).
> Notez aussi que la reste de cette page décrit des notes d’intentions et non l’état réel et actuel du projet.

---

Quelques règles que j’ai essayé de respecter pour réaliser l’application :
- L’affichage générale doit ressembler à la version papier.
- Son utilisation doit pouvoir être possible avec un seul doit uniquement
- L’interface utilisateur doit être entièrement configurable

---
 
L’application est divisée en quatre modules opérationnels

- `Application/Data` Définit les classes pour la gestion des données “brut” (les personnes, les catégories, les compétences, etc)
- `Application/Aspect` Définit les classes permettants de représenter graphiquement les données.
- `UI` Définit des composant pour l’interface utilisateur

Le répertoire `Data` Définit des classes génériques de base de données utilisée par les trois modules.

---
