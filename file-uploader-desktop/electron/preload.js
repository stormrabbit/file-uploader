const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  selectFolder: () => ipcRenderer.invoke('select-folder'),
});
