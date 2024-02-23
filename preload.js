const { contextBridge, ipcRenderer  } = require('electron/renderer')
function sayHello() {
    return 'hello';
  }
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  sayHello: () => ipcRenderer.invoke('sayHello')

})