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
  // Appelé quand l'utilisateur clique sur une notification (reçoit le filtre à afficher)
  onNotificationOpen: (cb) => ipcRenderer.on('notif:open', (_e, filter) => cb(filter)),
});
