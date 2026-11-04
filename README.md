# 📚 Mes Devoirs

Un petit logiciel Windows pour noter ses devoirs.

## Fonctionnalités

- Ajouter, modifier, supprimer des devoirs (titre, matière, date, priorité, notes)
- Cocher un devoir quand il est fait
- Filtres : À faire, En retard, Cette semaine, Terminés, Tous
- Matières prédéfinies avec une couleur chacune (Maths, Français, Histoire-Géo…), à choisir en un clic quand on ajoute un devoir
- Ajouter / retirer des matières et changer leur couleur (Paramètres → Matières, ou directement dans « Nouveau devoir »)
- Filtre par matière et recherche
- Vue Liste ou Calendrier, au choix par **mois** ou par **semaine** (lundi à vendredi) (devoirs colorés par matière, clic sur un jour pour ajouter un devoir)
- Tri par date, priorité, matière ou ajout récent
- Barres de défilement masquées (on défile toujours à la molette), même en fenêtre réduite ; la fenêtre peut être très étroite (le menu passe alors au-dessus de la liste)
- Paramètres : thème clair / sombre / automatique, couleur principale, matières, page de démarrage, priorité par défaut, confirmation de suppression
- Données enregistrées en local dans `%APPDATA%\Mes Devoirs\devoirs.json`
- Mise à jour : Paramètres → Mise à jour compare ta version avec la dernière « Release » de ton dépôt GitHub et propose de la télécharger. Le menu « Version à rechercher » permet aussi de choisir un **tag** précis (liste des Releases du dépôt) pour viser une version donnée ou revenir en arrière
- **Notifications** : un rappel quotidien Windows (heure au choix, 18:00 par défaut) listant les devoirs à rendre aujourd'hui / demain / dans la semaine, et ceux en retard. Un clic sur la notification ouvre la bonne liste. Paramètres → Notifications
- L'appli peut rester dans la zone de notification quand on ferme la fenêtre (pour que les rappels arrivent) et se lancer au démarrage de Windows
- Raccourcis : `Ctrl+N` nouveau devoir, `Ctrl+F` recherche

## Versions Windows

Chaque version est un installeur `.msi` :

| Architecture | Fichier produit |
|---|---|
| x64 (64 bits) | `MesDevoirs-<version>-x64.msi` |
| x86 (32 bits) | `MesDevoirs-<version>-ia32.msi` |
| ARM64 | `MesDevoirs-<version>-arm64.msi` |

L'installeur crée un raccourci sur le Bureau et dans le menu Démarrer.

## Construire sur ton PC (alternative)

Avec [Node.js](https://nodejs.org) installé :

```
npm install
npm start          # lancer l'appli pour tester
npm run dist       # construire les 3 .msi dans le dossier dist/
```

## Publier une version

Le workflow GitHub **ne démarre plus tout seul** quand tu ajoutes des fichiers : tu le lances toi-même.

1. Sur GitHub : onglet **Actions** → **Construire Mes Devoirs (Windows)** → **Run workflow**
2. Dans le champ **version**, écris le numéro voulu au format `x.y.z` (ex : `1.2.0`), ou laisse vide pour la numérotation automatique `1.0.<numéro du run>`
   Dans le champ **notes**, écris la description de la version, affichée dans l'appli avant l'installation (`\n` pour aller à la ligne, `- ` pour une liste, ex : `## Nouveautés\n- Notifications\n- Choix du tag`). Vide = notes générées automatiquement par GitHub
3. Les 3 `.msi` sont construits puis publiés dans une release dont le tag est `v<version>` (ex : `v1.2.0`)

Le numéro doit contenir uniquement des chiffres (limite du format `.msi` : premier nombre ≤ 255, deuxième ≤ 255, troisième ≤ 65535). Si le tag existe déjà, ses fichiers sont remplacés.

## Mises à jour

**Paramètres → Mise à jour** compare ta version avec la dernière « Release » du dépôt (`rc9b8hcntp-svg/mydevoirs`).

Quand une version est disponible, l'appli affiche d'abord ses **nouveautés** (la description de la release GitHub), puis le bouton **Télécharger et installer** :
1. choisit tout seul le `.msi` adapté à ton ordinateur (x64, x86 32 bits ou ARM64),
2. le télécharge avec une barre de progression et vérifie qu'il est complet (taille et empreinte SHA-256 fournie par GitHub),
3. ouvre l'installateur Windows, puis ferme Mes Devoirs pour que l'installation puisse remplacer ses fichiers.

Si aucun installeur ne correspond à ton ordinateur, ou si le téléchargement échoue, l'appli propose d'ouvrir la page de la release à la place.

Le menu « Version à rechercher » permet aussi de choisir un **tag** précis pour viser une version donnée ou revenir en arrière.
