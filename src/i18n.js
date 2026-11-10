'use strict';

// Traduction de l'interface : français (par défaut) → anglais.
// Le français reste la langue du code : en anglais, chaque texte affiché est traduit à la volée
// (dictionnaire de phrases + règles pour les phrases qui contiennent des nombres ou des noms).
// Les textes écrits par l'utilisateur (titres, notes, noms de matières) ne sont jamais traduits.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.I18N = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  // [français, anglais]
  const PAIRS = [
    // --- Général
    ['Mes Devoirs', 'My Homework'], ['📚 Mes Devoirs', '📚 My Homework'],
    ['Nouveau devoir (Ctrl+N)', 'New assignment (Ctrl+N)'], ['Nouveau devoir', 'New assignment'],
    ["Aujourd'hui", 'Today'], ['À faire', 'To do'], ['En retard', 'Late'], ['Cette semaine', 'This week'], ['Terminés', 'Done'], ['Tous', 'All'], ['Toutes', 'All'],
    ["Aujourd'hui et demain", 'Today and tomorrow'], ['Tous les devoirs', 'All assignments'],
    ['Matières', 'Subjects'], ['Gérer les matières', 'Manage subjects'], ['Supprimer les terminés', 'Delete completed'],
    ['Corbeille', 'Trash'], ['Archive', 'Archive'], ['Mini-widget', 'Mini widget'], ['Raccourcis clavier', 'Keyboard shortcuts'], ['Paramètres', 'Settings'],
    ['Affichage', 'View'], ['Liste', 'List'], ['Calendrier', 'Calendar'], ['Statistiques (Ctrl+I)', 'Statistics (Ctrl+I)'], ['Statistiques', 'Statistics'],
    ['Imprimer ou enregistrer en PDF (Ctrl+P)', 'Print or save as PDF (Ctrl+P)'], ['Imprimer', 'Print'],
    ['Changer de thème (Ctrl+Maj+D)', 'Change theme (Ctrl+Shift+D)'], ['Changer de thème', 'Change theme'],
    ['Ajout rapide : Maths ex 5 p.12 pour vendredi', 'Quick add: Maths ex 5 p.12 due friday'],
    ['Tape une phrase : matière, jour, durée… (touche Q)', 'Type a sentence: subject, day, duration… (Q key)'], ['Ajout rapide', 'Quick add'],
    ['Rechercher (Ctrl+F ou /)', 'Search (Ctrl+F or /)'], ['Rechercher un devoir…', 'Search assignments…'], ['Rechercher…', 'Search…'], ['Rechercher', 'Search'],
    ['Trier', 'Sort'], ['Trier par date', 'Sort by date'], ['Trier par priorité', 'Sort by priority'], ['Trier par matière', 'Sort by subject'],
    ["Plus récents d'abord", 'Newest first'], ['Ordre personnalisé (glisser)', 'Custom order (drag)'],
    ['Sélection multiple', 'Multi-select'], ['Sélectionner', 'Select'], ['Tout', 'All'], ['Terminer', 'Complete'], ['Supprimer', 'Delete'], ['Fermer', 'Close'],
    ['Période', 'Period'], ['Mois', 'Month'], ['Semaine', 'Week'], ['Mois précédent', 'Previous month'], ['Mois suivant', 'Next month'],
    ['Semaine précédente', 'Previous week'], ['Semaine suivante', 'Next week'], ["Aujourd’hui", 'Today'],
    ['Rien à afficher ici.', 'Nothing to show here.'],
    ['Rien à faire aujourd\'hui ni demain.', 'Nothing to do today or tomorrow.'], ['Aucun devoir à faire. Profites-en !', 'No assignments to do. Enjoy!'],
    ['Aucun devoir en retard.', 'No late assignments.'], ['Rien de prévu cette semaine.', 'Nothing planned this week.'],
    ['Aucun devoir terminé pour l\'instant.', 'No completed assignments yet.'], ['Ajoute ton premier devoir avec « Nouveau devoir ».', 'Add your first assignment with “New assignment”.'],
    ['Aucun résultat.', 'No results.'], ['Rien à faire.', 'Nothing to do.'],

    // --- Formulaire
    ['Modèle', 'Template'], ['Titre', 'Title'], ['Ex : Exercices 3 à 7 page 142', 'E.g. Exercises 3 to 7 page 142'], ['Type', 'Type'],
    ['Devoir', 'Assignment'], ['📝 Contrôle', '📝 Test'], ['🎤 Exposé', '🎤 Presentation'], ['Contrôle', 'Test'], ['Exposé', 'Presentation'], ['Matière', 'Subject'],
    ['Nom de la nouvelle matière', 'Name of the new subject'], ['Annuler', 'Cancel'], ['Ajouter la matière', 'Add subject'],
    ['Gérer les matières (retirer, changer la couleur…)', 'Manage subjects (remove, change colour…)'], ['Pour le', 'Due'], ['Priorité', 'Priority'],
    ['Normale', 'Normal'], ['Importante', 'Important'], ['Urgente', 'Urgent'], ['Normal', 'Normal'],
    ['Note obtenue', 'Grade received'], ['Note maximale', 'Maximum grade'], ['Coef.', 'Weight'], ['Coefficient', 'Weight'],
    ["Laisse vide tant que tu n'as pas la note. Elle compte dans la moyenne de la matière (Statistiques).", "Leave empty until you have the grade. It counts towards the subject average (Statistics)."],
    ['Durée estimée', 'Estimated time'], ['min', 'min'], ['Répétition', 'Repeat'], ['Aucune', 'None'], ['Chaque jour', 'Every day'], ['Chaque semaine', 'Every week'], ['Chaque mois', 'Every month'],
    ["Choisis d'abord une date.", 'Pick a date first.'], ['Quand tu le coches, le prochain est créé automatiquement.', 'When you tick it, the next one is created automatically.'],
    ['Notes', 'Notes'], ['Détails, pages, consignes… (les liens https:// sont cliquables)', 'Details, pages, instructions… (https:// links are clickable)'],
    ['Sous-tâches', 'Subtasks'], ["Ajouter une étape (Entrée)", 'Add a step (Enter)'], ['Ajouter', 'Add'], ['Étiquettes', 'Tags'],
    ['Ex : groupe, à rendre… (Entrée pour ajouter)', 'E.g. group, hand in… (Enter to add)'], ['Fichiers joints', 'Attached files'], ['Joindre un fichier', 'Attach a file'],
    ['Enregistrer comme modèle', 'Save as template'], ['Enregistrer', 'Save'], ['Dupliquer', 'Duplicate'], ['Modifier', 'Edit'], ['OK', 'OK'],
    ['Modifier le devoir', 'Edit assignment'], ['Dupliquer le devoir', 'Duplicate assignment'], ['Nouvelle matière', 'New subject'],
    ['Retirer cette étape', 'Remove this step'], ['Étape terminée', 'Step done'], ['Retirer cette étiquette', 'Remove this tag'], ['Retirer ce fichier', 'Remove this file'],
    ['Cours ce jour-là', 'Classes that day'], ['Marquer comme terminé', 'Mark as done'], ['Sous-tâches terminées', 'Subtasks done'],
    ['Voir les devoirs avec cette étiquette', 'Show assignments with this tag'], ['Ouvrir le lien', 'Open link'],
    ["Ce type de fichier ne peut pas être ouvert depuis l'application.", 'This type of file cannot be opened from the app.'],
    ['Minuteur de travail (25 min)', 'Work timer (25 min)'], ['Minuteur de travail', 'Work timer'], ['Minuteur terminé', 'Timer finished'],
    ['Devoir supprimé', 'Assignment deleted'], ['Ajouter un devoir ce jour-là', 'Add an assignment on this day'],
    ['Temps de travail estimé ce jour-là', 'Estimated work time that day'], ['Sans matière', 'No subject'],
    ['Aucune matière. Ajoutes-en avec le crayon.', 'No subjects. Add some with the pencil.'], ['Aucune matière. Ajoutes-en une ci-dessous.', 'No subjects. Add one below.'],
    ["Aucune matière. Ajoutes-en dans l'onglet Matières.", 'No subjects. Add some in the Subjects tab.'],
    ['Écris un nom de matière.', 'Enter a subject name.'], ['Cette matière existe déjà.', 'This subject already exists.'],
    ['Couleur personnalisée', 'Custom colour'], ['Choisir une couleur personnalisée', 'Pick a custom colour'], ['Changer la couleur', 'Change colour'], ['Retirer cette matière', 'Remove this subject'],

    // --- Corbeille, archive, verrouillage
    ['Vider la corbeille', 'Empty trash'], ['Restaurer', 'Restore'], ['Supprimer définitivement', 'Delete permanently'], ['Mettre à la corbeille', 'Move to trash'],
    ['La corbeille est vide.', 'The trash is empty.'], ["L'archive est vide.", 'The archive is empty.'],
    ['Les devoirs terminés depuis longtemps. Ils comptent toujours dans les statistiques.', 'Assignments completed a long time ago. They still count in the statistics.'],
    ['Mes Devoirs est verrouillé', 'My Homework is locked'], ['Code', 'Code'], ['Déverrouiller', 'Unlock'], ['Code oublié ?', 'Forgot the code?'],
    ["Pour retrouver l'accès : ferme l'application, ouvre le fichier « devoirs.json » (dossier %APPDATA%\\Mes Devoirs) avec le Bloc-notes et supprime le bloc « lock ». Tes devoirs sont conservés.",
      'To get back in: close the app, open the file “devoirs.json” (folder %APPDATA%\\Mes Devoirs) with Notepad and delete the “lock” block. Your assignments are kept.'],
    ['Code incorrect.', 'Wrong code.'], ['Code retiré', 'Code removed'], ['Code enregistré', 'Code saved'],
    ['Le code actuel est incorrect.', 'The current code is wrong.'], ['Le code doit faire au moins 4 caractères.', 'The code must be at least 4 characters long.'],
    ['Les deux codes ne sont pas identiques.', 'The two codes do not match.'],
    ['Un code est défini : il est demandé à chaque ouverture.', 'A code is set: it is asked every time the app opens.'],
    ["Aucun code. L'application s'ouvre sans rien demander.", 'No code. The app opens without asking anything.'],
    ["Aucun code. Demande un code pour ouvrir l'application.", 'No code. Ask for a code to open the app.'],
    ['Changer le code', 'Change code'], ['Définir un code', 'Set a code'], ['Retirer', 'Remove'], ['Code actuel', 'Current code'],
    ['Nouveau code (4 caractères ou plus)', 'New code (4 characters or more)'], ['Nouveau code', 'New code'], ['Répète le nouveau code', 'Repeat the new code'], ['Répéter le nouveau code', 'Repeat the new code'],

    // --- Impression
    ['Imprimer ou enregistrer en PDF', 'Print or save as PDF'], ['Tout ce qui reste', 'Everything that is left'], ['Inclure les devoirs terminés', 'Include completed assignments'],
    ['Enregistrer en PDF', 'Save as PDF'],

    // --- Paramètres : onglets et apparence
    ['Apparence', 'Appearance'], ['Emploi du temps', 'Timetable'], ['Devoirs', 'Assignments'], ['Notifications', 'Notifications'], ['Organisation', 'Organisation'], ['Confort', 'Comfort'],
    ['Sauvegarde', 'Backup'], ['Mise à jour', 'Update'], ['Fermer les paramètres', 'Close settings'],
    ['Thème', 'Theme'], ['Clair', 'Light'], ['Sombre', 'Dark'], ['Automatique', 'Automatic'], ["Selon l'heure", 'By time of day'],
    ["« Automatique » suit le thème de Windows. « Selon l'heure » : clair de 7 h à 19 h, sombre ensuite.", '“Automatic” follows the Windows theme. “By time of day”: light from 7 am to 7 pm, dark afterwards.'],
    ['Couleur principale', 'Main colour'], ['Taille du texte', 'Text size'], ['Petit', 'Small'], ['Grand', 'Large'], ['Très grand', 'Extra large'], ['Mode compact', 'Compact mode'],
    ['Liste plus serrée quand tu as beaucoup de devoirs.', 'A tighter list when you have lots of assignments.'],
    ['Indigo', 'Indigo'], ['Bleu ciel', 'Sky blue'], ['Turquoise', 'Turquoise'], ['Vert', 'Green'], ['Citron vert', 'Lime'], ['Jaune', 'Yellow'], ['Rouge', 'Red'], ['Rose', 'Pink'],
    ['Violet', 'Purple'], ['Ardoise', 'Slate'], ['Marron', 'Brown'], ['Bleu', 'Blue'],
    ['Ces matières apparaissent quand tu ajoutes un devoir. Clique sur une pastille pour changer sa couleur.', 'These subjects appear when you add an assignment. Click a dot to change its colour.'],
    ['Ajouter une matière', 'Add a subject'], ['Ex : Latin, Informatique…', 'E.g. Latin, Computing…'], ['Remettre les matières par défaut', 'Restore default subjects'],
    ['Toutes les matières par défaut sont déjà dans la liste.', 'All the default subjects are already in the list.'],
    ["Coche les jours où tu as cours dans chaque matière. En créant un devoir pour un jour donné, l'application te propose les matières de ce jour-là, et la page « Aujourd'hui » affiche tes cours.",
      'Tick the days you have class in each subject. When you create an assignment for a given day, the app suggests that day’s subjects, and the “Today” page shows your classes.'],
    ['Importer un emploi du temps', 'Import a timetable'],
    ['Depuis un fichier .csv, .txt, .ics (agenda) ou .json. Exemple : « Maths;lundi, mercredi » sur chaque ligne, ou un tableau avec une croix par jour.',
      'From a .csv, .txt, .ics (calendar) or .json file. Example: “Maths;Monday, Wednesday” on each line, or a table with a cross for each day.'],
    ['Importer…', 'Import…'], ['Ce fichier est trop gros.', 'This file is too big.'],
    ["Aucune matière trouvée dans ce fichier. Vérifie le format (exemple : « Maths;lundi, mercredi » sur chaque ligne).", 'No subject found in this file. Check the format (example: “Maths;Monday, Wednesday” on each line).'],
    ['Impossible de lire ce fichier.', 'Unable to read this file.'], ['Emploi du temps importé', 'Timetable imported'],
    ['Page affichée au démarrage', 'Page shown at startup'], ["La liste ouverte quand tu lances l'application.", 'The list opened when you start the app.'],
    ['Priorité par défaut', 'Default priority'], ['Utilisée pour chaque nouveau devoir.', 'Used for each new assignment.'],
    ['Confirmer avant de supprimer', 'Confirm before deleting'], ['Demande une confirmation avant de supprimer un devoir.', 'Asks for confirmation before deleting an assignment.'],

    // --- Notifications
    ['Rappel quotidien', 'Daily reminder'], ['Une notification Windows avec les devoirs à rendre bientôt.', 'A Windows notification with the assignments due soon.'],
    ['Activer le rappel quotidien', 'Turn on the daily reminder'], ['Heure du rappel', 'Reminder time'], ['Chaque jour à cette heure-là.', 'Every day at that time.'],
    ['Devoirs concernés', 'Assignments included'], ['Jusqu\'à quand regarder pour le rappel.', 'How far ahead to look for the reminder.'],
    ['Ceux du jour', "Today's"], ["Jusqu'à demain", 'Up to tomorrow'], ['Dans les 2 jours', 'Within 2 days'], ['Dans les 3 jours', 'Within 3 days'], ['Dans la semaine', 'Within the week'],
    ['Inclure les devoirs en retard', 'Include late assignments'], ["Ils sont ajoutés au rappel tant qu'ils ne sont pas terminés.", 'They are added to the reminder until they are done.'],
    ['Un rappel par devoir', 'One reminder per assignment'], ["Une notification pour chaque devoir à rendre demain (la veille de l'échéance).", 'A notification for each assignment due tomorrow (the day before the deadline).'],
    ['Activer un rappel par devoir', 'Turn on one reminder per assignment'], ['Heure du rappel par devoir', 'Per-assignment reminder time'], ['Par exemple la veille à 18h.', 'For example the day before at 6 pm.'],
    ['Rappel du matin', 'Morning reminder'], ['Une notification « tes devoirs du jour ».', 'A “your assignments for today” notification.'],
    ['Activer le rappel du matin', 'Turn on the morning reminder'], ['Heure du rappel du matin', 'Morning reminder time'],
    ['Boutons dans la notification', 'Buttons in the notification'], ["« Marquer fait » et « Rappeler demain » directement depuis la notification d'un devoir, sans ouvrir l'appli.", '“Mark done” and “Remind me tomorrow” straight from an assignment notification, without opening the app.'],
    ['Son de notification', 'Notification sound'], ['Choisis un son, ou rends les notifications silencieuses.', 'Pick a sound, or make notifications silent.'],
    ['Son par défaut', 'Default sound'], ['Rappel', 'Reminder'], ['Message', 'Message'], ['Courrier', 'Mail'], ['SMS', 'SMS'], ['Silencieux', 'Silent'],
    ['Mode vacances', 'Holiday mode'], ['Coupe tous les rappels entre deux dates.', 'Turns off all reminders between two dates.'], ['Activer le mode vacances', 'Turn on holiday mode'],
    ['Début des vacances', 'Holiday start'], ['Premier jour sans rappel.', 'First day without reminders.'], ['Fin des vacances', 'Holiday end'], ['Dernier jour sans rappel.', 'Last day without reminders.'],
    ['La fin doit être après le début : le mode vacances est inactif.', 'The end must be after the start: holiday mode is inactive.'],
    ['Rester actif en arrière-plan', 'Keep running in the background'],
    ["Fermer la fenêtre garde l'application dans la zone de notification, pour que les rappels arrivent quand même. Clic droit sur son icône pour la quitter.", 'Closing the window keeps the app in the notification area so reminders still arrive. Right-click its icon to quit.'],
    ['Lancer au démarrage de Windows', 'Start with Windows'], ["L'application démarre discrètement dans la zone de notification.", 'The app starts quietly in the notification area.'],
    ['Tester', 'Test'], ['Envoie une notification pour vérifier que tout marche.', 'Sends a notification to check that everything works.'],
    ['Notification envoyée. Rien reçu ? Vérifie que les notifications de Windows ne sont pas coupées (mode « Ne pas déranger » ou assistant de concentration).', 'Notification sent. Nothing received? Check that Windows notifications are not turned off (“Do not disturb” or focus assist).'],
    ["Impossible d'envoyer la notification sur cet ordinateur.", 'Unable to send the notification on this computer.'],
    ['Les notifications fonctionnent 🎉', 'Notifications are working 🎉'], ["Tu n'as aucun devoir à rendre bientôt.", 'You have no assignments due soon.'],
    ['Marquer fait', 'Mark done'], ['Rappeler demain', 'Remind me tomorrow'], ['À rendre demain', 'Due tomorrow'], ['Ouvrir Mes Devoirs', 'Open My Homework'], ['Quitter', 'Quit'],
    ['Mes Devoirs reste actif', 'My Homework keeps running'],
    ["L'application continue de t'envoyer tes rappels depuis la zone de notification. Clic droit sur son icône pour la quitter.", 'The app keeps sending you reminders from the notification area. Right-click its icon to quit.'],
    ['Ouvre la liste pour les voir.', 'Open the list to see them.'],

    // --- Organisation / confort
    ['Modèles de devoirs', 'Assignment templates'], ["Un modèle remplit le formulaire en un clic (titre, durée, étapes…). Pour en créer un : « Enregistrer comme modèle » dans « Nouveau devoir ».", 'A template fills in the form in one click (title, duration, steps…). To create one: “Save as template” in “New assignment”.'],
    ['Remettre les modèles par défaut', 'Restore default templates'], ['Tous les modèles par défaut sont déjà là.', 'All the default templates are already there.'],
    ['Lire un chapitre', 'Read a chapter'], ['Lire le chapitre …', 'Read chapter …'], ['Lire le chapitre', 'Read the chapter'], ['Noter les mots difficiles', 'Note the difficult words'], ['Résumer en 3 phrases', 'Summarise in 3 sentences'],
    ['Fiche de révision', 'Revision sheet'], ['Fiche de révision : …', 'Revision sheet: …'], ['Relire le cours', 'Re-read the lesson'], ['Écrire les points clés', 'Write the key points'], ['Se tester sans regarder', 'Test yourself without looking'],
    ['Exercices', 'Exercises'], ['Exercices page …', 'Exercises page …'], ['Préparer un contrôle', 'Prepare for a test'], ['Contrôle : …', 'Test: …'], ['Refaire les exercices', 'Redo the exercises'],
    ['Apprendre les définitions', 'Learn the definitions'], ['Faire un auto-test', 'Take a self-test'], ['Préparer un exposé', 'Prepare a presentation'], ['Exposé : …', 'Presentation: …'],
    ['Chercher des informations', 'Look up information'], ['Écrire le plan', 'Write the outline'], ['Préparer les diapositives', 'Prepare the slides'], ["S'entraîner à l'oral", 'Practise speaking'],
    ['Remplir le formulaire avec ce modèle', 'Fill in the form with this template'], ['Aucun modèle : enregistre un devoir comme modèle (lien en bas du formulaire).', 'No templates: save an assignment as a template (link at the bottom of the form).'],
    ["Écris d'abord un titre : il sert de nom au modèle.", 'Write a title first: it is used as the template name.'], ['Aucun modèle.', 'No templates.'], ['Nom du modèle', 'Template name'], ['Supprimer ce modèle', 'Delete this template'],
    ['Ajoute au moins un titre.', 'Add at least a title.'], ['Entrée pour ajouter', 'Press Enter to add'],
    ['Archiver automatiquement', 'Archive automatically'], ["Les devoirs terminés depuis longtemps quittent la liste (ils restent dans les statistiques et dans « Archive »).", 'Assignments completed a long time ago leave the list (they stay in the statistics and in “Archive”).'],
    ['Jamais', 'Never'], ['Après 3 mois', 'After 3 months'], ['Après 6 mois', 'After 6 months'], ['Après 1 an', 'After 1 year'], ['Après 2 ans', 'After 2 years'],
    ['Les devoirs archivés.', 'Archived assignments.'], ['Aucun devoir archivé pour le moment.', 'No archived assignments yet.'], ['Archiver maintenant', 'Archive now'], ['Ouvrir', 'Open'],
    ["Choisis d'abord un délai (3 mois, 6 mois…).", 'Choose a delay first (3 months, 6 months…).'], ['Rien à archiver.', 'Nothing to archive.'],
    ['Un devoir supprimé reste récupérable pendant 30 jours.', 'A deleted assignment can be recovered for 30 days.'],
    ['Langue', 'Language'], ['Français', 'Français'], ['English', 'English'], ["L'application se recharge pour changer de langue.", 'The app reloads to change language.'],
    ['Afficher le mini-widget', 'Show the mini widget'], ["Une petite fenêtre toujours visible avec les devoirs en retard, d'aujourd'hui et de demain.", 'A small always-visible window with late assignments and those due today and tomorrow.'],
    ["L'ouvrir au démarrage", 'Open it at startup'], ["Le widget s'affiche dès que l'application se lance.", 'The widget appears as soon as the app starts.'], ['Ouvrir le mini-widget au démarrage', 'Open the mini widget at startup'],
    ['Mini-widget affiché', 'Mini widget shown'], ['Mini-widget fermé', 'Mini widget closed'], ['Nouveau devoir', 'New assignment'], ['Toujours au premier plan', 'Always on top'], ['Fermer le widget', 'Close the widget'],
    ['Code de verrouillage', 'Lock code'], ["Code d'accès", 'Access code'], ['Verrouiller après inactivité', 'Lock after inactivity'], ["Redemande le code quand tu n'utilises plus l'application.", 'Asks for the code again when you stop using the app.'],
    ['1 minute', '1 minute'], ['5 minutes', '5 minutes'], ['15 minutes', '15 minutes'], ['30 minutes', '30 minutes'],
    ["Le code empêche d'ouvrir l'application (Ctrl+L pour la verrouiller tout de suite) et cache les devoirs dans le widget. Il ne chiffre pas le fichier de données, et les notifications peuvent montrer le titre des devoirs.",
      'The code stops the app from opening (Ctrl+L to lock it right away) and hides assignments in the widget. It does not encrypt the data file, and notifications may show assignment titles.'],
    ['Synchronisation entre ordinateurs', 'Sync between computers'],
    ["Choisis un dossier partagé (OneDrive, Google Drive, clé USB…) sur chaque ordinateur : les devoirs, la corbeille, l'archive, les matières et les modèles sont fusionnés automatiquement. Retirer une matière n'est pas synchronisé.",
      'Pick a shared folder (OneDrive, Google Drive, USB stick…) on each computer: assignments, trash, archive, subjects and templates are merged automatically. Removing a subject is not synced.'],
    ['Dossier de synchronisation', 'Sync folder'], ['Désactivée.', 'Turned off.'], ['Choisir un dossier…', 'Choose a folder…'], ['Changer de dossier…', 'Change folder…'], ['Synchroniser', 'Sync'], ['Arrêter', 'Stop'],
    ['Synchronisé', 'Synced'], ['Synchronisation arrêtée', 'Sync stopped'], ['dossier inaccessible', 'folder not reachable'],
    ["fichier de synchro non reconnu, rien n'a été modifié", 'sync file not recognised, nothing was changed'], ["fichier créé par une version plus récente : mets l'application à jour", 'file created by a newer version: update the app'],
    ['Choisir le dossier de synchronisation', 'Choose the sync folder'],
    ['Ajout rapide (une phrase)', 'Quick add (one sentence)'], ['Ouvrir la corbeille', 'Open the trash'], ["Ouvrir l'archive", 'Open the archive'], ['Afficher / masquer le mini-widget', 'Show / hide the mini widget'],
    ['Verrouiller maintenant', 'Lock now'], ['Synchroniser maintenant', 'Sync now'],

    // --- Widget
    ['Mes Devoirs est protégé par un code.', 'My Homework is protected by a code.'], ['Rien à faire pour le moment.', 'Nothing to do right now.'], ["Rien à faire aujourd'hui ni demain.", 'Nothing to do today or tomorrow.'],
    ['Mes Devoirs · widget', 'My Homework · widget'],

    // --- Sauvegarde
    ['Exporte tes données dans un fichier pour les garder en sécurité ou les retrouver sur un autre ordinateur, puis réimporte-le quand tu veux.', 'Export your data to a file to keep it safe or to move it to another computer, then re-import it whenever you like.'],
    ['Exporter', 'Export'], ['Tous tes devoirs, terminés ou non.', 'All your assignments, done or not.'], ['Exporter les devoirs', 'Export assignments'],
    ['La liste de tes matières et leurs couleurs.', 'Your list of subjects and their colours.'], ['Exporter les matières', 'Export subjects'],
    ['Réglages', 'Settings'], ['Apparence, préférences et notifications.', 'Appearance, preferences and notifications.'], ['Exporter les réglages', 'Export settings'],
    ['Créer le fichier', 'Create the file'], ["Tu choisis où l'enregistrer.", 'You choose where to save it.'], ['Importer', 'Import'], ['Choisir un fichier', 'Choose a file'],
    ['Une sauvegarde créée par Mes Devoirs.', 'A backup created by My Homework.'], ['Importer les devoirs', 'Import assignments'], ['Importer les matières', 'Import subjects'],
    ['Remplacent tes réglages actuels (thème, notifications…).', 'Replace your current settings (theme, notifications…).'], ['Importer les réglages', 'Import settings'],
    ['Que faire des devoirs et matières actuels ?', 'What to do with the current assignments and subjects?'], ["Mode d'import", 'Import mode'], ['Fusionner', 'Merge'], ['Tout remplacer', 'Replace everything'],
    ["Ajoute les devoirs et matières qui te manquent. Rien de ce que tu as déjà n'est supprimé ni modifié.", "Adds the assignments and subjects you're missing. Nothing you already have is deleted or changed."],
    ['Remplace tes devoirs et matières par ceux du fichier. Une copie de tes données actuelles est gardée au cas où.', 'Replaces your assignments and subjects with those in the file. A copy of your current data is kept just in case.'],
    ["Choisis au moins une partie à exporter.", 'Choose at least one part to export.'], ['Sauvegarde sans date', 'Backup without a date'],
    ["Ce fichier n'est pas une sauvegarde valide.", 'This file is not a valid backup.'], ["Ce fichier vient d'une autre application.", 'This file comes from another application.'],
    ["Ce fichier vient d'une version plus récente de Mes Devoirs. Mets l'application à jour d'abord.", 'This file comes from a newer version of My Homework. Update the app first.'],
    ['Ce fichier ne contient rien à importer.', 'This file contains nothing to import.'], ['Ce fichier est trop gros pour être une sauvegarde.', 'This file is too big to be a backup.'],
    ["Impossible d'écrire le fichier à cet endroit.", 'Unable to write the file there.'], ["Choisis d'abord un fichier à importer.", 'Choose a file to import first.'],
    ["L'import a échoué. Tes données n'ont pas été modifiées.", 'The import failed. Your data was not changed.'],
    ['Exporter une sauvegarde', 'Export a backup'], ['Importer une sauvegarde', 'Import a backup'], ['Enregistrer en PDF', 'Save as PDF'], ['Joindre un fichier', 'Attach a file'], ['Tous les fichiers', 'All files'],
    ['Emploi du temps (.csv, .txt, .ics, .json)', 'Timetable (.csv, .txt, .ics, .json)'], ['Importer un emploi du temps', 'Import a timetable'],

    // --- Mise à jour
    ['Version installée', 'Installed version'], ['Rechercher une mise à jour', 'Check for updates'], ['Version à rechercher', 'Version to look for'],
    ['« Dernière version » suit les nouveautés. Choisis un tag pour viser une version précise (ou revenir en arrière).', '“Latest version” follows new releases. Pick a tag to target a specific version (or go back).'],
    ['Dernière version', 'Latest version'], ['Télécharger', 'Download'], ['Dépôt GitHub des versions', 'GitHub repository for releases'],
    ['Le nom de ton dépôt GitHub, par exemple', 'The name of your GitHub repository, for example'], ['. Les nouvelles versions sont celles publiées dans « Releases ».', '. New versions are those published in “Releases”.'],
    ['Tu as la dernière version', 'You have the latest version'], ['Dépôt GitHub manquant', 'GitHub repository missing'], ['Écris le nom de ton dépôt (ex : pseudo/mes-devoirs) ci-dessous.', 'Write the name of your repository (e.g. username/my-homework) below.'],
    ['Aucune version trouvée', 'No version found'], ['Impossible de vérifier', 'Unable to check'], ['Vérifie ta connexion Internet puis réessaie.', 'Check your Internet connection and try again.'],
    ['La vérification a échoué', 'The check failed'], ['Réessaie dans quelques instants.', 'Try again in a few moments.'], ['Téléchargement en cours…', 'Downloading…'], ['Préparation…', 'Preparing…'],
    ["L'installateur est ouvert", 'The installer is open'], ["Mes Devoirs va se fermer pour laisser l'installation se faire. Suis les étapes de l'installateur.", 'My Homework will close so the installation can proceed. Follow the installer steps.'],
    ['Installation impossible', 'Installation failed'], ['Une erreur est survenue. Réessaie.', 'An error occurred. Try again.'], ['Ouvrir la page de téléchargement', 'Open the download page'],
    ['Télécharge-la puis installe-la par-dessus la version actuelle.', 'Download it, then install it over the current version.'], ['Tu peux quand même la télécharger pour revenir en arrière.', 'You can still download it to go back.'],
    ['Le téléchargement a échoué. Vérifie ta connexion Internet puis réessaie.', 'The download failed. Check your Internet connection and try again.'], ['Le fichier téléchargé est incomplet. Réessaie.', 'The downloaded file is incomplete. Try again.'],
    ['Le fichier téléchargé est corrompu (empreinte incorrecte). Réessaie.', 'The downloaded file is corrupted (wrong checksum). Try again.'], ["Impossible d'enregistrer le fichier sur le disque.", 'Unable to save the file to disk.'],
    ["Le fichier est téléchargé mais l'installateur ne s'est pas ouvert.", 'The file was downloaded but the installer did not open.'], ['Un téléchargement est déjà en cours.', 'A download is already in progress.'],
    ['Aucun installeur trouvé pour ton ordinateur.', 'No installer found for your computer.'], ["Aucune description n'a été publiée pour cette version.", 'No description was published for this version.'],
    ["Aucun installeur pour ton type d'ordinateur dans cette version : la page de téléchargement va s'ouvrir.", 'No installer for your type of computer in this version: the download page will open.'],
    ['(préversion)', '(pre-release)'],

    // --- Statistiques
    ['Série sans retard', 'On-time streak'], ['Ajoute des devoirs pour lancer ta série.', 'Add assignments to start your streak.'], ['Série en pause', 'Streak paused'], ['Rendus à temps', 'Handed in on time'],
    ['Les statistiques apparaîtront quand tu auras terminé des devoirs qui ont une date.', 'Statistics will appear once you have completed assignments that have a date.'],
    ['Notes et moyennes', 'Grades and averages'], ["Choisis le type « Contrôle » ou « Exposé » dans un devoir, puis renseigne la note obtenue : les moyennes par matière s'affichent ici.", 'Choose the type “Test” or “Presentation” in an assignment, then enter the grade received: subject averages appear here.'],
    ['moyenne générale (chaque matière compte autant)', 'overall average (each subject counts equally)'], ['8 dernières semaines', 'Last 8 weeks'],
    ['À temps', 'On time'], ['Rendu en retard', 'Handed in late'], ['Non rendu', 'Not handed in'], ['À venir', 'Upcoming'],

    // --- Divers
    ['Lundi', 'Monday'], ['Mardi', 'Tuesday'], ['Mercredi', 'Wednesday'], ['Jeudi', 'Thursday'], ['Vendredi', 'Friday'], ['Samedi', 'Saturday'], ['Dimanche', 'Sunday'],
    ['lundi', 'Monday'], ['mardi', 'Tuesday'], ['mercredi', 'Wednesday'], ['jeudi', 'Thursday'], ['vendredi', 'Friday'], ['samedi', 'Saturday'], ['dimanche', 'Sunday'],
    ['Lun', 'Mon'], ['Mar', 'Tue'], ['Mer', 'Wed'], ['Jeu', 'Thu'], ['Ven', 'Fri'], ['Sam', 'Sat'], ['Dim', 'Sun'],
    ['En retard (hier)', 'Late (yesterday)'], ['Demain', 'Tomorrow'], ['devoir à faire', 'assignment to do'], ['devoirs à faire', 'assignments to do'], ['en retard', 'late'],
    ['Annuler la dernière suppression ou le dernier déplacement', 'Undo the last deletion or move'], ['Ajout rapide (une phrase suffit)', 'Quick add (one sentence is enough)'],
    ["Verrouiller l'application (si un code est défini)", 'Lock the app (if a code is set)'],
    // --- Aide, palette de commandes, thèmes
    ['Navigation', 'Navigation'], ['Général', 'General'], ['Calendrier', 'Calendar'],
    ["Formulaire d'un devoir", 'Assignment form'], ["Détail d'un devoir (calendrier)", 'Assignment details (calendar)'],
    ['Se déplacer dans la liste', 'Move through the list'], ['Espace', 'Space'], ['Entrée', 'Enter'], ['Échap', 'Esc'], ['ou', 'or'],
    ['Cocher / décocher le devoir sélectionné', 'Check / uncheck the selected assignment'], ['Cocher / décocher', 'Check / uncheck'],
    ['Supprimer le devoir sélectionné', 'Delete the selected assignment'], ['Suppr', 'Del'],
    ['Fermer la fenêtre ouverte, vider la recherche', 'Close the open window, clear the search'],
    ['Afficher cette aide', 'Show this help'], ['1 à 6', '1 to 6'],
    ["Aujourd'hui · À faire · En retard · Cette semaine · Terminés · Tous", 'Today · To do · Late · This week · Done · All'],
    ['Période précédente', 'Previous period'], ['Période suivante', 'Next period'], ["Revenir à aujourd'hui", 'Back to today'],
    ['Thème clair', 'Light theme'], ['Thème sombre', 'Dark theme'], ['Thème automatique (suit Windows)', 'Automatic theme (follows Windows)'],
    ["Thème selon l'heure", 'Theme by time of day'], ['Texte plus grand', 'Larger text'], ['Texte plus petit', 'Smaller text'],
    ['Activer le mode compact', 'Turn on compact mode'], ['Désactiver le mode compact', 'Turn off compact mode'],
    ['Tri personnalisé (glisser-déposer)', 'Custom order (drag and drop)'],
    ['Afficher : Aujourd\'hui', 'Show: Today'], ['Afficher : À faire', 'Show: To do'], ['Afficher : En retard', 'Show: Late'],
    ['Afficher : Cette semaine', 'Show: This week'], ['Afficher : Terminés', 'Show: Done'], ['Afficher : Tous les devoirs', 'Show: All assignments'],
    ['Tape une action : nouveau devoir, thème sombre…', 'Type an action: new assignment, dark theme…'],
    // --- Panneau d'accueil et groupes
    ['Bonjour', 'Good morning'], ['Bon après-midi', 'Good afternoon'], ['Bonsoir', 'Good evening'], ['Bonne nuit', 'Good night'],
    ["Tout est fait pour aujourd'hui ✨", 'All done for today ✨'], ["Rien de prévu aujourd'hui", 'Nothing planned for today'],
    ["À faire aujourd'hui", 'To do today'], ['À faire cette semaine', 'To do this week'], ['Semaine', 'Week'],
    ['Progression de la semaine', 'Progress this week'], ['Plus tard', 'Later'], ['Sans date', 'No date'],
    ['Tout sélectionner', 'Select all'], ['Annuler', 'Cancel'], ['Annuler la sélection', 'Cancel selection'],
    ['Aucun', 'None'], ['Oui', 'Yes'], ['Non', 'No'],
  ];

  // Règles pour les phrases qui contiennent des nombres, des dates ou des noms.
  const num = (n, one, many) => `${n} ${Number(n) > 1 ? many : one}`;
  const RULES = [
    [/^En retard de (\d+) jours$/, (m) => `${m[1]} days late`],
    [/^Prochain devoir créé pour le (.+)$/, (m) => `Next one created for ${m[1]}`],
    [/^Fichier introuvable : (.+)$/, (m) => `File not found: ${m[1]}`],
    [/^Impossible d'ouvrir (.+)$/, (m) => `Unable to open ${m[1]}`],
    [/^Note (.+)$/, (m) => `Grade ${m[1]}`],
    [/^Coefficient (.+)$/, (m) => `Weight ${m[1]}`],
    [/^(\d+) devoirs?$/, (m) => num(m[1], 'assignment', 'assignments')],
    [/^· ≈ (.+) de travail$/, (m) => `· ≈ ${m[1]} of work`],
    [/^≈ (.+) de travail$/, (m) => `≈ ${m[1]} of work`],
    [/^⚠ (\d+) devoirs? en retard — Voir$/, (m) => `⚠ ${num(m[1], 'late assignment', 'late assignments')} — View`],
    [/^(\d+) devoirs? le week-end \(non affichés?\)$/, (m) => `${num(m[1], 'assignment', 'assignments')} on the weekend (not shown)`],
    [/^(\d+) devoirs? sans date \(visibles? dans la liste\)$/, (m) => `${num(m[1], 'assignment', 'assignments')} with no date (visible in the list)`],
    [/^« (.+) » déplacé au (.+)$/, (m) => `“${m[1]}” moved to ${m[2]}`],
    [/^Cours le (.+) : (.+)$/, (m) => `Classes on ${tr(m[1])}: ${m[2]}`],
    [/^Supprimer « (.+) » \?$/, (m) => `Delete “${m[1]}”?`],
    [/^(\d+) devoirs? supprimés?$/, (m) => `${num(m[1], 'assignment', 'assignments')} deleted`],
    [/^Supprimer (\d+) devoirs? \?$/, (m) => `Delete ${num(m[1], 'assignment', 'assignments')}?`],
    [/^« (.+) » est utilisée par (\d+) devoirs?\.$/, (m) => `“${m[1]}” is used by ${num(m[2], 'assignment', 'assignments')}.`],
    [/^(Ils garderont|Il gardera) le nom de la matière, mais sans couleur\.$/, () => 'They will keep the subject name, but without a colour.'],
    [/^Retirer cette matière \?$/, () => 'Remove this subject?'],
    [/^Changer la couleur de (.+)$/, (m) => `Change the colour of ${m[1]}`],
    [/^Retirer (.+)$/, (m) => `Remove ${m[1]}`],
    [/^(.+), (lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)$/, (m) => `${m[1]}, ${tr(m[2])}`],
    [/^Il te reste (\d+) devoirs? pour aujourd'hui$/, (m) => `You have ${num(m[1], 'assignment', 'assignments')} left for today`],
    [/^Mes Devoirs (\d[\w.\-]*)$/, (m) => `My Homework ${m[1]}`],
    [/^Cours : (.+)$/, (m) => `Classes: ${m[1]}`],
    [/^Mes Devoirs v(.+)$/, (m) => `My Homework v${m[1]}`],
    [/^jours? de suite sans devoir en retard$/, (m, s) => (/^jours/.test(s) ? 'days in a row with no late assignment' : 'day in a row with no late assignment')],
    [/^(\d+) devoirs? en retard : termine-(les|le) pour relancer la série\.$/, (m) => `${num(m[1], 'late assignment', 'late assignments')}: finish ${m[2] === 'les' ? 'them' : 'it'} to restart the streak.`],
    [/^Record : (\d+) jours?$/, (m) => `Best: ${num(m[1], 'day', 'days')}`],
    [/^(\d+) % · (\d+)\/(\d+)$/, (m) => `${m[1]}% · ${m[2]}/${m[3]}`],
    [/^(\d+) sur (\d+) devoirs terminés à temps$/, (m) => `${m[1]} of ${m[2]} completed assignments handed in on time`],
    [/^(.+)\/20 · (\d+) notes?$/, (m) => `${m[1]}/20 · ${num(m[2], 'grade', 'grades')}`],
    [/^Sem\. du (.+)$/, (m) => `Week of ${m[1]}`],
    [/^(\d+) devoirs? : (\d+) à temps, (\d+) rendus? en retard, (\d+) non rendus?, (\d+) à venir$/, (m) => `${num(m[1], 'assignment', 'assignments')}: ${m[2]} on time, ${m[3]} late, ${m[4]} not handed in, ${m[5]} upcoming`],
    [/^Sauvegarde du (.+)$/, (m) => `Backup from ${m[1]}`],
    [/^(\d+) (matières?|devoirs?) dans le fichier\.$/, (m) => `${m[1]} ${/^matière/.test(m[2]) ? (Number(m[1]) > 1 ? 'subjects' : 'subject') : (Number(m[1]) > 1 ? 'assignments' : 'assignment')} in the file.`],
    [/^Remplacer (tes devoirs|tes matières|tes devoirs et tes matières) actuels par ceux du fichier \?$/, (m) => `Replace your current ${/devoirs/.test(m[1]) && /matières/.test(m[1]) ? 'assignments and subjects' : /devoirs/.test(m[1]) ? 'assignments' : 'subjects'} with those in the file?`],
    [/^Une copie de tes données actuelles est gardée au cas où\.$/, () => 'A copy of your current data is kept just in case.'],
    [/^Import terminé : (.+)\.$/, (m) => `Import finished: ${translateList(m[1])}.`],
    [/^Fichier « (.+) » enregistré(.*)$/, (m) => `File “${m[1]}” saved${m[2] ? translateTail(m[2]) : ''}`],
    [/^Importé depuis « (.+) » : (\d+) matières? mises? à jour, (\d+) créées?\.$/, (m) => `Imported from “${m[1]}”: ${num(m[2], 'subject updated', 'subjects updated')}, ${m[3]} created.`],
    [/^Modèle « (.+) » enregistré$/, (m) => `Template “${m[1]}” saved`],
    [/^(\d+) étapes?$/, (m) => num(m[1], 'step', 'steps')],
    [/^Ajouté : « (.+) » pour le (.+)$/, (m) => `Added: “${m[1]}” for ${m[2]}`],
    [/^Ajouté : « (.+) »$/, (m) => `Added: “${m[1]}”`],
    [/^« (.+) » restauré$/, (m) => `“${m[1]}” restored`],
    [/^Supprimer définitivement « (.+) » \?$/, (m) => `Permanently delete “${m[1]}”?`],
    [/^Cette action est irréversible\.$/, () => 'This cannot be undone.'],
    [/^Vider la corbeille \((\d+) devoirs?\) \?$/, (m) => `Empty the trash (${num(m[1], 'assignment', 'assignments')})?`],
    [/^Les devoirs supprimés sont gardés (\d+) jours, puis disparaissent\.$/, (m) => `Deleted assignments are kept for ${m[1]} days, then disappear.`],
    [/^Supprimé le (.+)$/, (m) => `Deleted on ${m[1]}`],
    [/^Archivé le (.+)$/, (m) => `Archived on ${m[1]}`],
    [/^(\d+) jours? restants?$/, (m) => `${m[1]} ${Number(m[1]) > 1 ? 'days' : 'day'} left`],
    [/^(\d+) devoirs? archivés?\.?$/, (m) => `${num(m[1], 'assignment archived', 'assignments archived')}`],
    [/^Trop d'essais\. Réessaie dans (\d+) secondes?\.$/, (m) => `Too many attempts. Try again in ${num(m[1], 'second', 'seconds')}.`],
    [/^Synchro impossible : (.+)$/, (m) => `Sync failed: ${tr(m[1])}`],
    [/^(.+) — dernière synchro à (.+)$/, (m) => `${m[1]} — last synced at ${m[2]}`],
    [/^(.+) — (dossier inaccessible|fichier de synchro non reconnu, rien n'a été modifié|fichier créé par une version plus récente : mets l'application à jour)$/, (m) => `${m[1]} — ${tr(m[2])}`],
    [/^Tes devoirs du jour : (\d+)$/, (m) => `Your assignments for today: ${m[1]}`],
    [/^(\d+) en retard$/, (m) => `${m[1]} late`],
    [/^(\d+) devoirs? à rendre$/, (m) => `${num(m[1], 'assignment due', 'assignments due')}`],
    [/^… et (\d+) autres?$/, (m) => `… and ${num(m[1], 'other', 'others')}`],
    [/^(\d+) autres devoirs pour demain$/, (m) => `${m[1]} more assignments for tomorrow`],
    [/^(\d+) aujourd'hui · (\d+) demain(?: · (\d+) en retard)?$/, (m) => `${m[1]} today · ${m[2]} tomorrow${m[3] ? ` · ${m[3]} late` : ''}`],
    [/^(Aujourd'hui|Demain|En retard \(hier\)|En retard de \d+ jours|Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche|\S+ \d+ \S+) — (.+)$/, (m) => `${tr(m[1])} — ${m[2]}`],
    [/^(\d+) min$/, (m) => `${m[1]} min`],
    [/^Sélection : (\d+)$/, (m) => `Selected: ${m[1]}`],
    [/^(\d+) sélectionnés?$/, (m) => `${m[1]} selected`],
    [/^(\d+) devoirs? (seront imprimés|sera imprimé)$/, (m) => `${num(m[1], 'assignment', 'assignments')} will be printed`],
    [/^Temps de travail : (.+)$/, (m) => `Work time: ${m[1]}`],
    [/^· temps de travail estimé : (.+)$/, (m) => `· estimated work time: ${m[1]}`],
  ];

  function translateList(s) {
    return s.split(', ').map((p) => tr(p)).join(', ');
  }
  function translateTail(s) {
    return s;
  }

  const MAP = new Map(PAIRS.map(([fr, en]) => [fr, en]));
  let current = 'fr';

  function translateLine(core) {
    if (MAP.has(core)) return MAP.get(core);
    for (const [re, fn] of RULES) {
      const m = re.exec(core);
      if (m) return fn(m, core);
    }
    // « a · b » et « a — b » : on traduit chaque morceau
    for (const sep of [' · ', ' — ']) {
      if (core.includes(sep)) {
        const parts = core.split(sep);
        const out = parts.map((p) => translateLine(p));
        if (out.some((p, i) => p !== parts[i])) return out.join(sep);
      }
    }
    // « a. b » : phrases collées les unes aux autres
    if (/[.!?] \S/.test(core)) {
      const parts = core.split(/(?<=[.!?]) /);
      if (parts.length > 1) {
        const out = parts.map((p) => translateLine(p));
        if (out.some((p, i) => p !== parts[i])) return out.join(' ');
      }
    }
    return core;
  }

  // Traduit un texte (en gardant les espaces autour et les retours à la ligne)
  function tr(text, lang) {
    const l = lang || current;
    if (l !== 'en' || typeof text !== 'string' || !text) return text;
    if (text.includes('\n')) return text.split('\n').map((line) => tr(line, l)).join('\n');
    const lead = /^\s*/.exec(text)[0];
    const trail = /\s*$/.exec(text)[0];
    const core = text.trim().replace(/\s+/g, ' ');
    if (!core) return text;
    const out = translateLine(core);
    return out === core ? text : lead + out + trail;
  }

  // ---------- Traduction de la page ----------
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE']);
  // Contenu écrit par l'utilisateur : jamais traduit
  const NO_TR = '[data-notr], .item .title, .item .notes, .item .eyebrow, .v-title, .v-notes, .tag.subject, .tag.hash, .cs, .ct, .ps-subject, .ps-notes, .box-title, .qp-title, .file-chip';
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  let observer = null;

  function skipNode(node) {
    const p = node.parentElement;
    if (!p) return true;
    if (SKIP_TAGS.has(p.tagName)) return true;
    return !!p.closest(NO_TR);
  }
  function translateTextNode(node) {
    if (skipNode(node)) return;
    const out = tr(node.nodeValue);
    if (out !== node.nodeValue) node.nodeValue = out;
  }
  function translateAttrs(el) {
    if (!el.getAttribute) return;
    if (el.closest && el.closest(NO_TR)) return;
    ATTRS.forEach((a) => {
      const v = el.getAttribute(a);
      if (!v) return;
      const out = tr(v);
      if (out !== v) el.setAttribute(a, out);
    });
  }
  function translateTree(rootNode) {
    if (rootNode.nodeType === 3) { translateTextNode(rootNode); return; }
    if (rootNode.nodeType !== 1 && rootNode.nodeType !== 9) return;
    const base = rootNode.nodeType === 9 ? rootNode.documentElement : rootNode;
    translateAttrs(base);
    const walker = document.createTreeWalker(base, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n = walker.nextNode();
    while (n) {
      if (n.nodeType === 3) translateTextNode(n); else translateAttrs(n);
      n = walker.nextNode();
    }
  }

  function start(lang) {
    current = lang === 'en' ? 'en' : 'fr';
    if (current !== 'en' || typeof document === 'undefined') return;
    // Fenêtres de confirmation du navigateur
    if (!window.__i18nDialogs) {
      window.__i18nDialogs = true;
      const c = window.confirm.bind(window);
      const a = window.alert.bind(window);
      window.confirm = (m) => c(tr(String(m)));
      window.alert = (m) => a(tr(String(m)));
    }
    translateTree(document);
    if (observer) observer.disconnect();
    observer = new MutationObserver((list) => {
      list.forEach((m) => {
        if (m.type === 'childList') m.addedNodes.forEach((n) => translateTree(n));
        else if (m.type === 'characterData') translateTextNode(m.target);
        else if (m.type === 'attributes') translateAttrs(m.target);
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  return { tr, start, PAIRS };
}));
