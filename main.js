const { app, BrowserWindow, Tray, Menu, dialog, ipcMain } = require('electron/main')
const path = require('node:path')
const express = require('./express.js');
let mainWindow;

function createWindow() {
  const win = new BrowserWindow({
    width: 500,
    height: 700,
    icon: path.join(__dirname, 'icon-alt.png'),
    transparent: true,
    resizable: false,
    autoHideMenuBar: true,
    center: true,
    thickFrame: true,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    },
  })

  //win.loadFile('index.html')
  win.loadURL('http://localhost:8443'); // Load your Express server URL

  let tray = null;
    win.on('minimize', function (event) {
        event.preventDefault();
        win.setSkipTaskbar(true);
        tray = createTray();
    });

    win.on('restore', function (event) {
        win.show();
        win.setSkipTaskbar(false);
        tray.destroy();
    });

  // Hide the default menu
  win.setMenu(null);
  return win;

}
function createTray() {
  let appIcon = new Tray(path.join(__dirname, "icon-alt.png"));
  const contextMenu = Menu.buildFromTemplate([
      {
          label: 'Show', click: function () {
              mainWindow.show();
          }
      },
      {
          label: 'Exit', click: function () {
              app.isQuiting = true;
              app.quit();
          }
      }
  ]);

  appIcon.on('double-click', function (event) {
      mainWindow.show();
  });
  appIcon.setToolTip('NetScan Agent');
  appIcon.setContextMenu(contextMenu);
  return appIcon;
}
app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong')

  mainWindow = createWindow()

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
