const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const express = require('./express.js');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1250,
    height: 620,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  //win.loadFile('index.html')
  win.loadURL('http://localhost:3000'); // Load your Express server URL


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