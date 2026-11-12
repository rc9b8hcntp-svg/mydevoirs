'use strict';

// Pont entre l'interface de Mes Devoirs (affichée dans Cartable OS) et le programme principal de Cartable OS.
// Il expose le même « devoirsAPI » que le preload de Mes Devoirs, pour que l'interface fonctionne sans aucun changement.
// Les actions qui n'existent que dans le logiciel à part (mini-widget, notifications) répondent « indisponible ».

const { contextBridge, ipcRenderer } = require('electron');

const call = (channel, ...args) => ipcRenderer.invoke(`dv:${channel}`, ...args);
const none = () => {};

contextBridge.exposeInMainWorld('devoirsAPI', {
  load: () => call('data:load'),
  save: (data) => call('data:save', data),
  getVersion: () => call('app:version'),
  exportBackup: (data, parts) => call('backup:export', data, parts),
  pickBackup: () => call('backup:pick'),
  applyBackup: (current, options) => call('backup:apply', current, options),
  cancelBackup: () => call('backup:cancel'),
  printPage: () => call('print:run'),
  savePdf: (name) => call('print:pdf', name),
  pickFiles: () => call('file:pick'),
  openFile: (filePath) => call('file:open', filePath),
  openLink: (url) => call('link:open', url),
  syncPick: () => call('sync:pick'),
  syncNow: () => call('sync:now'),
  syncStatus: () => call('sync:status'),
  importSchedule: () => call('schedule:import'),
  // Les données ont changé en dehors de la vue (Mes Devoirs à part, synchro) : reçoit la nouvelle liste
  onDataChanged: (cb) => ipcRenderer.on('data:changed', (_e, payload) => cb(payload)),

  // Mises à jour : celles de Cartable OS (un seul installeur met à jour les deux logiciels)
  checkUpdate: (repo, tag) => call('update:check', repo, tag),
  downloadUpdate: () => call('update:download'),
  listReleases: (repo) => call('update:list', repo),
  openUpdatePage: (url) => call('update:open', url),
  onUpdateProgress: (cb) => ipcRenderer.on('update:progress', (_e, p) => cb(p)),

  // Réservé au logiciel Mes Devoirs à part
  testNotification: async () => ({ ok: false }),
  toggleWidget: async () => false,
  widgetState: async () => false,
  onNewRequest: none,
  onNotificationOpen: none,
});
