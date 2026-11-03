const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('devoirsAPI', {
  load: () => ipcRenderer.invoke('data:load'),
  save: (data) => ipcRenderer.invoke('data:save', data),
});
