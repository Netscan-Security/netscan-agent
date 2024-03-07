const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  sayHello: () => ipcRenderer.invoke('sayHello')
});

// let isMouseMoving = true;
// let mouseMoveTimer;

// Function to hide the scrollbar
// const hideScrollbar = () => {
//   document.body.style.overflow = 'hidden';
// };

// Handle mousemove events

// Show the scrollbar
// window.addEventListener('mousemove', () => {
//   if (!isMouseMoving) {
//     isMouseMoving = true;
//     document.body.style.overflow = 'auto';
//   }

//   // Clear previous timeout (if any) and set a new one
//   clearTimeout(mouseMoveTimer);
//   mouseMoveTimer = setTimeout(() => {
//     isMouseMoving = false;
//     hideScrollbar();
//   }, 1000);
// });

// Initial setup to hide the scrollbar
// hideScrollbar();
