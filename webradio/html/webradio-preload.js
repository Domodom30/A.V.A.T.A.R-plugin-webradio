const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onInitWebRadio: (callback) => ipcRenderer.on('onInit-webradio', (_event, value) => callback(value)),
    searchTop:() => ipcRenderer.invoke('webradio-top'),
    saveRadio:(nameRadio) => ipcRenderer.invoke('webradio-save', nameRadio),
    saveRadioFavoris:(nameRadio) => ipcRenderer.invoke('webradio-save-favoris', nameRadio),
    quit: () => ipcRenderer.send('webradio-quit')
})