const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('devoirsAPI', {
  load: () => ipcRenderer.invoke('data:load'),
  save: (data) => ipcRenderer.invoke('data:save', data),
  getVersion: () => ipcRenderer.invoke('app:version'),
  checkUpdate: (repo, tag) => ipcRenderer.invoke('update:check', repo, tag),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  onUpdateProgress: (cb) => ipcRenderer.on('update:progress', (_e, p) => cb(p)),
  listReleases: (repo) => ipcRenderer.invoke('update:list', repo),
  openUpdatePage: (url) => ipcRenderer.invoke('update:open', url),
  testNotification: () => ipcRenderer.invoke('notif:test'),
  exportBackup: (data, parts) => ipcRenderer.invoke('backup:export', data, parts),
  pickBackup: () => ipcRenderer.invoke('backup:pick'),
  applyBackup: (current, options) => ipcRenderer.invoke('backup:apply', current, options),
  cancelBackup: () => ipcRenderer.invoke('backup:cancel'),
  printPage: () => ipcRenderer.invoke('print:run'),
  savePdf: (name) => ipcRenderer.invoke('print:pdf', name),
  pickFiles: () => ipcRenderer.invoke('file:pick'),
  openFile: (filePath) => ipcRenderer.invoke('file:open', filePath),
  openLink: (url) => ipcRenderer.invoke('link:open', url),
  syncPick: () => ipcRenderer.invoke('sync:pick'),
  syncNow: () => ipcRenderer.invoke('sync:now'),
  syncStatus: () => ipcRenderer.invoke('sync:status'),
  importSchedule: () => ipcRenderer.invoke('schedule:import'),
  toggleWidget: (force) => ipcRenderer.invoke('widget:toggle', force),
  widgetState: () => ipcRenderer.invoke('widget:state'),
  // Le mini-widget demande d'ouvrir le formulaire « Nouveau devoir »
  onNewRequest: (cb) => ipcRenderer.on('app:new', () => cb()),
  // Appelé quand l'utilisateur clique sur une notification (reçoit le filtre à afficher)
  // Les boutons d'une notification ont modifié les devoirs : reçoit la nouvelle liste
  onDataChanged: (cb) => ipcRenderer.on('data:changed', (_e, homework) => cb(homework)),
  onNotificationOpen: (cb) => ipcRenderer.on('notif:open', (_e, filter) => cb(filter)),
});
