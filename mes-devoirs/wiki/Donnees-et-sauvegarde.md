# Données et sauvegarde

Les données sont enregistrées en local sur ton ordinateur, dans `%APPDATA%\Mes Devoirs\devoirs.json`.

## Exporter et importer

**Paramètres → Sauvegarde** enregistre tes données dans un fichier `.json` (« fichier de mémoire ») et permet de les réimporter, par exemple pour changer d'ordinateur.

- **Exporter** : choisis ce que le fichier contient (devoirs, matières, réglages), puis où l'enregistrer.
- **Importer** : choisis un fichier ; l'appli montre son contenu, puis tu décides quoi importer et si tu **fusionnes** (ajoute ce qui manque, sans rien supprimer) ou si tu **remplaces** tout.
- Avant un import, une copie de tes données actuelles est gardée dans `avant-import.json` (dossier de données de l'appli).
- Le fichier `devoirs.json` d'une ancienne installation peut aussi être importé.

## Synchronisation entre ordinateurs

Avec un dossier partagé (OneDrive, Dropbox, clé USB…), le fichier `MesDevoirs-synchro.json` est fusionné et la modification la plus récente gagne.

## Verrouillage

Le code de verrouillage empêche d'ouvrir l'appli, mais il ne chiffre pas le fichier de données.
