# Cartable OS

Un « OS » pour le collège, pour Windows. C'est l'écran d'accueil de l'ordinateur d'un élève :

- **Word, Excel, PowerPoint, l'explorateur de fichiers**, et les logiciels ou sites que tu ajoutes toi-même (Réglages → Applications) ;
- **Mes Devoirs**, de deux façons (voir plus bas) : le logiciel à part, ou **directement dans Cartable OS**. L'écran d'accueil affiche aussi tes devoirs (en retard, aujourd'hui, demain, cette semaine, et ceux de la matière du cours en cours) ;
- un **fichier d'emploi du temps `.ics`** qui décide :
  - **quand Cartable OS reste ouvert** : du début du premier cours de la journée à la fin du dernier (plein écran, impossible à fermer pendant ce temps) ;
  - **quand les dossiers des matières s'ouvrent** : au début de chaque cours, le dossier de la matière s'ouvre tout seul dans l'explorateur.

## Un seul build, un seul installeur, deux logiciels

Le dépôt contient les deux projets :

| Dossier | Logiciel |
|---|---|
| `/` (racine) | **Cartable OS** (Electron) |
| `mes-devoirs/` | **Mes Devoirs** (Electron, tel qu'avant) |

Le build construit Mes Devoirs, l'embarque dans Cartable OS et produit **un seul `.msi` par architecture** : `CartableOS-<version>-x64.msi`, `-ia32.msi`, `-arm64.msi`. Une fois installé :

```
Cartable OS\
├─ Cartable OS.exe          ← Cartable OS
└─ Mes Devoirs\
   └─ Mes Devoirs.exe       ← Mes Devoirs, un logiciel à part entière
```

Mes Devoirs se lance seul (raccourci Bureau et menu Démarrer, notifications, zone de notification) et garde ses données dans `%APPDATA%\Mes Devoirs\devoirs.json`.

### Deux raccourcis Mes Devoirs, deux façons de l'ouvrir

Sur l'écran d'accueil de Cartable OS, **Mes Devoirs a deux raccourcis**, qui ouvrent deux choses différentes :

| Raccourci | Ce qu'il ouvre |
|---|---|
| **Mes Devoirs** · *Logiciel à part* | Le logiciel Mes Devoirs, dans **sa propre fenêtre** (comme depuis le Bureau) : notifications, mini-widget, mises à jour. |
| **Mes Devoirs** · *Dans Cartable OS* | Mes Devoirs **directement dans la fenêtre de Cartable OS**, sous la barre du haut. Le bouton **‹ Accueil** de la barre revient à l'écran d'accueil. |

Le bouton **Ouvrir** du panneau « Mes Devoirs » de l'accueil ouvre la version intégrée. Le menu de la zone de notification propose les deux.

Les deux versions utilisent **le même fichier de données** : un devoir noté dans l'une est tout de suite dans l'autre, même si les deux sont ouvertes en même temps (chacune recharge quand l'autre enregistre). Dans la version intégrée, tout fonctionne : devoirs, calendrier, matières, modèles, corbeille, archive, code de verrouillage, sauvegardes (export / import), emploi du temps, synchronisation par dossier, impression et PDF. Seul ce qui dépend du logiciel à part est masqué : mini-widget et notifications Windows (avec leur démarrage automatique). Les rappels continuent donc d'être envoyés par le logiciel à part, tant qu'il tourne en arrière-plan.

Techniquement, la version intégrée affiche l'interface de `mes-devoirs/src` dans une vue de la fenêtre (`devoirs-embed.js`, `devoirs-embed-preload.js`). Le dossier `mes-devoirs/` reste celui du logiciel à part ; seule modification : il recharge ses données quand Cartable OS modifie le fichier (`watchDataFile` dans `mes-devoirs/main.js`).

Les raccourcis de Mes Devoirs sont créés par Cartable OS à son premier lancement (l'installeur le lance à la fin). Si tu désinstalles Cartable OS, supprime-les à la main.

> Si l'ancien installeur de Mes Devoirs seul est déjà installé, désinstalle-le avant d'installer Cartable OS (sinon tu auras Mes Devoirs en double). Tes devoirs sont conservés.

## Le fichier d'emploi du temps (.ics)

Réglages → Emploi du temps → **Choisir un fichier .ics**. Le fichier vient de ton agenda (Pronote, ENT, Google Agenda, Outlook…) : un cours = un événement dont le **titre est la matière** (« Maths », « Français »…).

- Les horaires, les fuseaux horaires et les répétitions (chaque semaine, certains jours, jusqu'à une date…) sont gérés, ainsi que les cours déplacés ou annulés.
- Les événements « toute la journée » (vacances, jours fériés) sont ignorés.
- Un cours sans heure de fin dure 50 minutes.

**Session** : du début du premier cours à la fin du dernier de la journée. Pendant ce temps, Cartable OS s'ouvre en plein écran (même s'il était rangé dans la zone de notification) et ne se ferme pas. Quand le dernier cours est fini, il se range tout seul. Pour pouvoir le fermer à tout moment : Réglages → Session → désactiver « Empêcher la fermeture pendant les cours ».

**Dossiers des matières** : chaque matière a un dossier, créé tout seul dans `Documents\Cartable OS\<matière>` (dossier principal modifiable, et dossier modifiable matière par matière). Au début de chaque cours, il s'ouvre dans l'explorateur, une seule fois par cours.

Pour que tout se déclenche même juste après l'allumage de l'ordinateur, Cartable OS démarre avec Windows (désactivable dans Réglages → Session) et reste dans la zone de notification.

## Construire

Les installeurs se construisent sur GitHub : onglet **Actions → « Construire Cartable OS (Windows + Mes Devoirs pour Mac) » → Run workflow**. Le workflow construit Mes Devoirs, l'embarque, puis publie une Release avec les `.msi` (et le `.dmg` de Mes Devoirs seul pour Mac).

En local, sous Windows :

```
npm install
npm run dist          # construit Mes Devoirs puis l'installeur x64 dans dist/
```

Pour essayer l'interface sans installer : `npm install` puis `npm start`.

Tests de la logique (emploi du temps, applications, lecture des devoirs, Mes Devoirs intégré, contenu du `.msi`) : `npm test` et `node tests/smoke-main.js`.

## Mises à jour

Les mises à jour se font **depuis Cartable OS (Réglages → Mise à jour)** ou depuis Mes Devoirs (Paramètres → Mise à jour, aussi dans la version intégrée) : elles téléchargent l'installeur `CartableOS-<version>-<architecture>.msi` de la dernière Release et mettent à jour **les deux logiciels d'un coup**.

Le dépôt où chercher les mises à jour n'est plus écrit en dur : le build GitHub Actions le note lui-même (`build/update-repo.json` et `mes-devoirs/update-repo.json`, à partir de `GITHUB_REPOSITORY`). Les mises à jour viennent donc du dépôt qui a publié le `.msi`, quel que soit son nom. Pour un build local (pas sur GitHub), ces fichiers n'existent pas et la recherche de mise à jour dit « Dépôt GitHub inconnu ».

Si Mes Devoirs ne s'ouvre pas, la raison est affichée en bas de l'écran d'accueil et écrite dans `%APPDATA%\Cartable OS\cartable.log`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `main.js`, `preload.js` | programme principal et pont sécurisé vers l'interface |
| `ics.js` | lecture du `.ics` et calcul des cours |
| `scheduler.js` | session (premier au dernier cours), cours en cours, prochain cours |
| `apps.js` | liste et lancement des applications |
| `devoirs-link.js` | lien avec Mes Devoirs (chemins, lecture des devoirs pour l'accueil) |
| `updates.js`, `update-config.js` | mises à jour (recherche, téléchargement du .msi, dépôt noté par le build) |
| `devoirs-embed.js`, `devoirs-embed-preload.js` | Mes Devoirs intégré : sauvegardes, fichiers, synchro, PDF… pour la vue dans la fenêtre |
| `src/` | interface (`index.html`, `os.css`, `os.js`) |
| `scripts/prepare-devoirs.js` | construit Mes Devoirs et le prépare pour l'installeur |
| `mes-devoirs/` | le projet Mes Devoirs complet (son README, son site, son wiki) |
