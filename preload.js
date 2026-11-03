const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('devoirsAPI', {
  load: () => ipcRenderer.invoke('data:load'),
  save: (data) => ipcRenderer.invoke('data:save', data),
  getVersion: () => ipcRenderer.invoke('app:version'),
  checkUpdate: (repo) => ipcRenderer.invoke('update:check', repo),
  openUpdatePage: (url) => ipcRenderer.invoke('update:open', url),
});
