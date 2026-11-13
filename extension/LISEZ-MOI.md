# Extension « Mes Devoirs – Ajouter »

Un bouton **+** apparaît en bas à droite de Pronote et d'École Directe. Sélectionne le texte d'un devoir, clique sur **+**, vérifie, puis **Ajouter** : le devoir arrive dans l'appli (elle s'ouvre toute seule si besoin ; le navigateur demande une fois l'autorisation d'ouvrir « Mes Devoirs »).

Si l'appli n'est pas installée, l'extension le détecte et affiche un message avec un bouton vers https://rc9b8hcntp-svg.github.io/mydevoirs/.

Prérequis : l'appli Mes Devoirs **installée** (c'est elle qui enregistre l'adresse `mesdevoirs://`).

## Chrome / Edge
1. `chrome://extensions` (ou `edge://extensions`) → activer **Mode développeur**.
2. **Charger l'extension non empaquetée** → choisir ce dossier `extension`.

## Autre site de Pronote
Si ton lycée héberge Pronote sur un domaine inhabituel, ajoute-le dans `matches` de `manifest.json`.
