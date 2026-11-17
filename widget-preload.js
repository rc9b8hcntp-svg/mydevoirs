const { contextBridge, ipcRenderer } = require('electron');

// Le mini-widget n'a accès qu'à ces quelques actions
contextBridge.exposeInMainWorld('widgetAPI', {
  load: () => ipcRenderer.invoke('widget:load'),
  setDone: (id, done) => ipcRenderer.invoke('widget:done', id, done),
  setSubtask: (id, subId, done) => ipcRenderer.invoke('widget:subtask', id, subId, done),
  add: (input) => ipcRenderer.invoke('widget:add', input),
  collapse: (force) => ipcRenderer.invoke('widget:collapse', force),
  openApp: () => ipcRenderer.invoke('widget:open'),
  newHomework: () => ipcRenderer.invoke('widget:new'),
  close: () => ipcRenderer.invoke('widget:close'),
  togglePin: () => ipcRenderer.invoke('widget:pin'),
  onRefresh: (cb) => ipcRenderer.on('widget:refresh', () => cb()),
});
