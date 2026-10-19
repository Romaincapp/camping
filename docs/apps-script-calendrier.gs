/**
 * Met à jour le calendrier du site dès qu'un événement change dans Google Agenda.
 *
 * À coller dans un projet https://script.google.com (compte romainfrancedumoulin@gmail.com),
 * pas dans le site. Installation : voir docs/CALENDAR.md, section « Mise à jour instantanée ».
 *
 * Fonctionnement : à chaque ajout / modification / suppression d'événement, Google lance
 * onCalendarChange(), qui démarre le workflow GitHub update-calendar.yml. Le site est à jour
 * 1 à 2 minutes plus tard. Le jeton GitHub reste dans les propriétés du script (privées).
 */

const GITHUB_REPO = 'romaincapp/camping';
const WORKFLOW_FILE = 'update-calendar.yml';

function onCalendarChange() {
  // Laisser à Google le temps de mettre à jour le flux iCal public lu par le workflow
  Utilities.sleep(30 * 1000);

  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('Propriété GITHUB_TOKEN manquante (Paramètres du projet > Propriétés du script)');

  const response = UrlFetchApp.fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json'
      },
      payload: JSON.stringify({ ref: 'main' }),
      muteHttpExceptions: true
    }
  );

  if (response.getResponseCode() !== 204) {
    throw new Error(`GitHub a répondu ${response.getResponseCode()} : ${response.getContentText()}`);
  }
}

/** À lancer une seule fois (bouton Exécuter) pour brancher le déclencheur sur l'agenda. */
function installer() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onCalendarChange')
    .forUserCalendar(Session.getEffectiveUser().getEmail())
    .onEventUpdated()
    .create();
}
