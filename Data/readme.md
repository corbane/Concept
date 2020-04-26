

# `Node`

Le noeud est un élément abstrait représentant une donnée de l'application.
Il peut s'agir de n'importe quels types de données.
Cela peut être par exemple une personne, un bouton de l'interface utilisateur, un rectangle 2d ou tout autres choses.

Toute les données représentées par un noeud possèdent obligatoirement trois propriétés indispensables.
Un **contexte**, un **type** et un **identifiant**


# `DataTree`

`DataTree` est une classe qui stocke les noeuds de données.
Elle stocke les noeuds de manière hiérarchique tel que :

    ┌─ [premier contexte]
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
    ├─ [second contexte]
    │   └─ [type de noeuds ...]
    │
    └─ [troisième contexte ...]


# `Link`

`Link` définit des classes permettant de lier les noeuds de données entre eux.
Le principe est le même que celui des Triplestores utilisés pour le web sémantique.
La différence étant que ces classes ne sont pas dépendantes d'un serveur externe, elles fonctionnent directement dans le navigateur.
Le code est basé sur [Hexastore](http://crubier.github.io/Hexastore)

> Actuellement les classes de `Link` ne sont pas utilisées par l'application.
> L'objectif de cette implémentation est de pouvoir faire des recherches comme les requêtes sur les Triplestores : `Subject <predicate> Object`.
> 
> Par exemple : `Qui <Connaître> Programmation-Arduino`



# `Factory`

Chaque noeud de données peuvent être associés avec une ou plusieurs classes de gestion.
Je nomme "classe de gestion", toute classes avec un constructeur prenant un noeud comme argument.

La classe `Factory` permet de définir ces associations et de créer les instances des classes de gestion.

Son utilité est de faciliter la création de différentes représentations pour un même noeud de données.
Par exemple, un noeud définissant une personne est dans l'espace de dessin de l'application représenté par un cercle avec un avatar. Dans l'espace `Propriétés`, cette même personne sera représentée par une description, sa photo et probablement des boutons de commandes. Ou bien encore elle peut être représentée par un graphe affichant ces relations.

> Cette classe est surtout une classe utilitaire. Elle n'est pas indispensable à l'application.
