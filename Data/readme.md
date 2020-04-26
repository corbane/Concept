<style>
blockquote {
     border: 1px solid #eee !important;
     border-radius: .25rem !important;
     border-left-color: #f0ad4e !important;
     border-left-width: .25rem !important;
     padding: 1.25rem !important;
}
</style>


# `Node`

Le noeud est un élément abstrait représentant une donnée de l'application.
Il peut s'agir de n'importe quels types de données.
Cela peut être par exemple une personne, un bouton de l'interface utilisateur, un rectangle 2d ou tout autres choses.

Toute les données représenter par un noeud possède obligatoirement trois propriétés indispensables.
Un **contexte**, un **type** et un **identifiant**


# `DataTree`

`DataTree` est une classe qui stocke les noeuds de données.
Elle stocke les noeuds de manière hiérarchique tel que :

    ┌─ [premier context]
    │   ├─ [type de noeuds A]
    │   │   ├─  [Identifiant du noeud 1] = [Le noeud 1]
    │   │   ├─  [Identifiant du noeud 2] = [Le noeud 2]
    │   │   └─  [Identifiant du noeud ...]
    │   │
    │   ├ [type de noeuds B]
    │   │   └─  [Identifiant du noeud ...]
    │   │
    │   └─ [type de noeuds ...]
    │
    ├─ [second context]
    │   └─ [type de noeuds ...]
    │
    └─ [troisième contexte ...]


# `Link`

`Link` définit des classes permettant de lier les noeuds de données entre eux.
Le principe est le même que celui des Triplestore utiliser pour le web sémantique.
La différence étant que ces classes ne sont pas dépendantes d'un serveur, elle fonctionne directement dans le navigateur.
Le code est basé sur [Hexastore](http://crubier.github.io/Hexastore)

> Actuellement les classes de `Link` ne sont pas utilisé par l'application.
> L'objectif de cette implémentation est de pouvoir faire des recherches comme les requête > sur les Triplestores `Subject <predicate> Object`.
> 
> Par exemple : `Qui <connais> programmation-Arduino`



# `Factory`

Chaque noeud de données peut être associé avec un ou plusieurs classes de gestion.

Je nomme "classe de gestion", toute classe avec un constructeur prenant comme argument un noeud de données.

La classe `Factory` permet de définir ces associations et de créer les instances des classes de gestion.

Son utilité est de faciliter la création de différentes représentations pour un même noeud de données.
Par exemple, un noeud définissant une personne est dans l'espace de dessin de l'application représenter par un cercle avec un avatar. Dans l'espace `Propriétés`, cette même personne sera représenter par une description, sa photo et probablement des boutons de commandes. Ou bien encore elle peut être représenté par un graph affichant ces relations. par exemple :

```ts
ui.make <Drawing> ( Personne );
ui.make <Properties> ( Personne );
ui.make <Graph> ( Personne );
```
> Cette classe est surtout une classe utilitaire. Elle n'est pas indispensable à l'application.
