const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onInitAlarm: (value) => ipcRenderer.on('onInit-webradioAlarm', value),
  quitAlarm: () => ipcRenderer.send('quit-alarm'),
  saveAlarm: (arg) => ipcRenderer.invoke('save-alarm', arg),
  getMsg: (arg) => ipcRenderer.invoke('alarm-msg', arg),
  validateCron: (arg) => ipcRenderer.invoke('validateCronExpression', arg),
});
