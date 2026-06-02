const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {

  

  
  obtenerInfoDispositivo: () =>
    ipcRenderer.invoke('obtener-info-dispositivo'),

  
  aceptarTransferencia: () =>
    ipcRenderer.invoke('aceptar-transferencia'),

  
  rechazarTransferencia: () =>
    ipcRenderer.invoke('rechazar-transferencia'),

  
  
  

  
  onDispositivoEncontrado: (callback) =>
    ipcRenderer.on('dispositivo-encontrado', (_evento, datos) => callback(datos)),

  
  onTransferenciaEntrante: (callback) =>
    ipcRenderer.on('transferencia-entrante', (_evento, datos) => callback(datos)),

  
  onProgresoTransferencia: (callback) =>
    ipcRenderer.on('progreso-transferencia', (_evento, datos) => callback(datos)),

  
  onTransferenciaCompleta: (callback) =>
    ipcRenderer.on('transferencia-completa', (_evento, datos) => callback(datos)),
})