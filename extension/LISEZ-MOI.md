# Extension « Mes Devoirs – Ajouter » (v1.2)

Ajoute un devoir à l'appli **Mes Devoirs** depuis Pronote, École Directe… ou n'importe quelle page.

## Ce que fait l'extension
- **Détection automatique** : sur Pronote et École Directe, l'extension repère les devoirs affichés sur la page (un texte « à faire », « exercices », « contrôle »… avec une date à venir). Un badge rouge sur le bouton **+** donne leur nombre ; ouvre le panneau, décoche ceux que tu ne veux pas, **Ajouter la sélection**. Un devoir déjà ajouté ou ignoré n'est pas reproposé, et l'appli refuse les doublons. Dans l'icône de l'extension, tu peux couper la détection ou activer l'**ajout automatique sans confirmation**. La détection est une aide : elle se base sur le texte de la page, pas sur le code de Pronote, donc vérifie ce qui est ajouté.
- **Bouton +** en bas à droite de Pronote et d'École Directe. Sélectionne le texte d'un devoir, clique sur **+** (ou **Alt + Maj + D**) : le panneau s'ouvre **déjà rempli**. La matière, la date (« pour vendredi », « le 20/11 »…), la priorité (« urgent », « ! »), la durée (« 30 min ») et le type (contrôle, exposé) sont reconnus dans le texte.
- **Panneau complet** : titre, matière (liste de *tes* matières, lue depuis l'appli), date avec raccourcis (Aujourd'hui / Demain / Dans 1 semaine), priorité, type, durée, notes. **Ctrl + Entrée** pour ajouter. Thème clair/sombre automatique.
- **Icône de l'extension** (barre du navigateur) : voit si l'appli est connectée, tes compteurs (en retard / aujourd'hui / demain) et ajoute un devoir en **une phrase** : `Maths ex 5 p.12 pour vendredi ! 30 min`.
- **Clic droit** sur du texte sélectionné, sur n'importe quel site → **Ajouter « … » à Mes Devoirs**. Une pastille ✓ (ajouté) ou ! (appli injoignable) apparaît sur l'icône.
- Si l'appli n'est pas lancée, elle s'ouvre toute seule (le navigateur demande une fois l'autorisation d'ouvrir « Mes Devoirs »). Si elle n'est pas installée, l'extension le détecte et propose le téléchargement : https://rc9b8hcntp-svg.github.io/mydevoirs/

Prérequis : l'appli Mes Devoirs **installée**. Pour la liste de matières et les compteurs, mets l'appli à jour (version qui accompagne l'extension 1.1) ; avec une ancienne version, l'ajout marche quand même, avec les matières par défaut.

## Publier une version (GitHub Actions)
Onglet **Actions** → **Publier l'extension (Release)** → **Run workflow** (ou pousse un tag `v1.2.0`) : le workflow vérifie les fichiers, fabrique `Extension-Mes-Devoirs-<version>.zip` et crée la Release.

## Installer (Chrome / Edge)
1. `chrome://extensions` (ou `edge://extensions`) → activer **Mode développeur**.
2. **Charger l'extension non empaquetée** → choisir ce dossier.
3. Pour changer le raccourci : `chrome://extensions/shortcuts`.

## Autre site de Pronote
Si ton lycée héberge Pronote sur un domaine inhabituel, ajoute-le dans `matches` de `manifest.json`. (Le clic droit et l'icône marchent déjà partout.)

## Confidentialité
L'extension ne parle qu'à ton appli, sur ton ordinateur (`127.0.0.1`). Aucune donnée n'est envoyée sur Internet. Permissions : `contextMenus` (clic droit), `storage` (retenir les devoirs déjà traités et tes réglages) et l'accès à `127.0.0.1:47653`. Le texte de la page est analysé sur place, il ne sort jamais de ton ordinateur.
