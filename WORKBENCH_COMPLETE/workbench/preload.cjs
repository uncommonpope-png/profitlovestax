'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
    return () => ipcRenderer.removeListener(channel, callback);
  },
  platform: process.platform,
  seshat: {
    search: (query, topK) => ipcRenderer.invoke('seshat-search', { query, topK }),
    reason: (prompt, context) => ipcRenderer.invoke('seshat-reason', { prompt, context }),
    synthesize: (topic, sources) => ipcRenderer.invoke('seshat-synthesize', { topic, sources }),
  }
});