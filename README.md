# 📚 Mes Devoirs

Un petit logiciel pour noter ses devoirs, pour Windows et Mac.

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
- **Notifications avancées** (Paramètres → Notifications) : un rappel par devoir la veille de l'échéance, des boutons « Marquer fait » / « Rappeler demain » dans la notification (sans ouvrir l'appli), un rappel du matin (« tes devoirs du jour »), un mode vacances (coupe les rappels entre deux dates) et le choix du son (ou silencieux)
- L'appli peut rester dans la zone de notification quand on ferme la fenêtre (pour que les rappels arrivent) et se lancer au démarrage de Windows
- **Ajout rapide** (touche `Q`) : une phrase suffit, par ex. « maths ex 5 p 42 demain urgent 1h #groupe » (matière, date, priorité, durée et étiquettes sont reconnues ; aperçu en direct)
- **Modèles de devoirs** avec étapes prêtes (exposé, contrôle, lecture…), modifiables et à créer soi-même
- **Corbeille** (30 jours, avec restauration) : supprimer un devoir ne le perd plus ; Ctrl+Z reste disponible
- **Archive automatique** des devoirs terminés depuis plus de N mois (Paramètres → Organisation), consultable et restaurable ; les statistiques les comptent toujours
- **Import d'emploi du temps** depuis un fichier CSV, TXT, ICS ou JSON (Paramètres → Matières / Emploi du temps)
- **Mini-widget** toujours visible (en retard / aujourd'hui / demain, cases à cocher), épinglable au-dessus des autres fenêtres, ouvrable depuis la zone de notification
- **Synchronisation entre ordinateurs** via un dossier partagé (OneDrive, Dropbox, clé USB…) : le fichier `MesDevoirs-synchro.json` est fusionné, la modification la plus récente gagne
- **Code de verrouillage** (verrouillage automatique après inactivité, `Ctrl+L`). Attention : il masque l'appli mais ne chiffre pas `devoirs.json`
- **Français / English** (Paramètres → Confort)
- Raccourcis : `Ctrl+N` nouveau devoir, `Ctrl+F` recherche, `Ctrl+B` réduire / agrandir le menu
- **Interface** : menu latéral plein hauteur et repliable, ajout rapide + recherche + tri sur une seule ligne, panneau d'accueil compact, formulaire « Nouveau devoir » avec boutons toujours visibles (notes, étapes, étiquettes et fichiers dans « Plus de détails »), barre de titre intégrée sur Mac

## Versions Windows

Chaque version est un installeur `.msi` :

| Architecture | Fichier produit |
|---|---|
| x64 (64 bits) | `MesDevoirs-<version>-x64.msi` |
| x86 (32 bits) | `MesDevoirs-<version>-ia32.msi` |
| ARM64 | `MesDevoirs-<version>-arm64.msi` |

L'installeur crée un raccourci sur le Bureau et dans le menu Démarrer.

## Sauvegarde (export / import)

**Paramètres → Sauvegarde** permet d'enregistrer tes données dans un fichier `.json` (« fichier de mémoire ») et de les réimporter, par exemple pour changer d'ordinateur.

- **Exporter** : choisis ce que le fichier contient (devoirs, matières, réglages), puis où l'enregistrer.
- **Importer** : choisis un fichier ; l'appli montre son contenu, puis tu décides quoi importer et si tu **fusionnes** (ajoute ce qui manque, sans rien supprimer) ou si tu **remplaces** tout. Avant un import, une copie de tes données actuelles est gardée dans `avant-import.json` (dossier de données de l'appli).
- Le fichier `devoirs.json` d'une ancienne installation peut aussi être importé.
- Le dépôt GitHub et le tag de mise à jour ne sont jamais exportés ni importés, par sécurité.

## Mises à jour

**Paramètres → Mise à jour** compare ta version avec la dernière « Release » du dépôt (`rc9b8hcntp-svg/mydevoirs`).

Quand une version est disponible, l'appli affiche d'abord ses **nouveautés** (la description de la release GitHub), puis le bouton **Télécharger et installer** :
1. choisit tout seul le `.msi` adapté à ton ordinateur (x64, x86 32 bits ou ARM64),
2. le télécharge avec une barre de progression et vérifie qu'il est complet (taille et empreinte SHA-256 fournie par GitHub),
3. ouvre l'installateur Windows, puis ferme Mes Devoirs pour que l'installation puisse remplacer ses fichiers.

Si aucun installeur ne correspond à ton ordinateur, ou si le téléchargement échoue, l'appli propose d'ouvrir la page de la release à la place.

Le menu « Version à rechercher » permet aussi de choisir un **tag** précis pour viser une version donnée ou revenir en arrière.
