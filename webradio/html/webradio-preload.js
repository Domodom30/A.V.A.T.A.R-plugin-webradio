const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onInitWebRadio: (callback) => ipcRenderer.on('onInit-webradio', (_event, value) => callback(value)),
    nameRadio:(value) => ipcRenderer.on('name-radio', value),
    setRadio:() => ipcRenderer.invoke('webradio-radio'),
    getConfig:() => ipcRenderer.invoke('webradio-config'),
    getMsg: (value) => ipcRenderer.invoke('webradio-msg', value),
    searchTop:() => ipcRenderer.invoke('webradio-top'),
    setPosition: () => ipcRenderer.send('webradio-position'),
    quit: () => ipcRenderer.send('webradio-quit')
})