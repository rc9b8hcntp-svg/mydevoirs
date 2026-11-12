const { contextBridge, ipcRenderer } = require('electron');

// Le mini-widget n'a accès qu'à ces quelques actions
contextBridge.exposeInMainWorld('widgetAPI', {
  load: () => ipcRenderer.invoke('widget:load'),
  setDone: (id, done) => ipcRenderer.invoke('widget:done', id, done),
  openApp: () => ipcRenderer.invoke('widget:open'),
  newHomework: () => ipcRenderer.invoke('widget:new'),
  close: () => ipcRenderer.invoke('widget:close'),
  togglePin: () => ipcRenderer.invoke('widget:pin'),
  onRefresh: (cb) => ipcRenderer.on('widget:refresh', () => cb()),
});
