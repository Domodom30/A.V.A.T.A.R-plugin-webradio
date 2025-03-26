const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onInitMapping: (music, mapping) => ipcRenderer.on('onInit-musicMapping', music, mapping),
  quitMapping: (arg) => ipcRenderer.send('quit-mapping', arg),
  applyMapping: (arg) => ipcRenderer.invoke('apply-mapping', arg),
  getMsg: (arg) => ipcRenderer.invoke('mapping-msg', arg),
  getTheme: () => ipcRenderer.invoke('get-theme')
})