const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const express = require('./express.js');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 500,
    height: 700,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
  })

  //win.loadFile('index.html')
  win.loadURL('http://localhost:8443'); // Load your Express server URL

  // Hide the default menu
  win.setMenu(null);

}

app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong')

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
