'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cartable', {
  getState: () => ipcRenderer.invoke('state:get'),
  onState: (cb) => ipcRenderer.on('state', (_e, s) => cb(s)),
  launch: (id) => ipcRenderer.invoke('apps:launch', id),
  addApp: (name, target) => ipcRenderer.invoke('apps:add', name, target),
  updateApp: (id, name, target) => ipcRenderer.invoke('apps:update', id, name, target),
  removeApp: (id) => ipcRenderer.invoke('apps:remove', id),
  pickAppTarget: () => ipcRenderer.invoke('apps:pick'),
  importSchedule: () => ipcRenderer.invoke('schedule:import'),
  clearSchedule: () => ipcRenderer.invoke('schedule:clear'),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  pickRoot: () => ipcRenderer.invoke('folder:pickRoot'),
  pickSubjectFolder: (name) => ipcRenderer.invoke('folder:pickSubject', name),
  resetSubjectFolder: (name) => ipcRenderer.invoke('folder:resetSubject', name),
  openFolder: (name) => ipcRenderer.invoke('folder:open', name),
  openDevoirs: () => ipcRenderer.invoke('devoirs:open'),
  openDevoirsEmbedded: () => ipcRenderer.invoke('devoirs:openEmbedded'),
  closeDevoirsEmbedded: () => ipcRenderer.invoke('devoirs:closeEmbedded'),
  minimize: () => ipcRenderer.invoke('win:minimize'),
  hide: () => ipcRenderer.invoke('win:hide'),
  quit: () => ipcRenderer.invoke('app:quit'),
});
