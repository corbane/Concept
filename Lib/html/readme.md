
Classes & fonctions utilitaires

# `xcode`

`xcode` est la fonction d’usine pour les éléments JSX.
A la différence des frameworks comme React ou Angular cette fonction appelle les fonctions standard des navigateurs et renvoie un object natif.

Soit :
```tsx
var e = <div class="my-div" style="color: red;"/>
```
est identique à :
```ts
var e = document.createElement ("div")
e.classList.add ("my-div")
e.style.color = "red"
```

# `Element`

Définit quelques alias sur les types DOM.Element et DOM.Window
