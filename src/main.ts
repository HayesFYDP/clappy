import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreen: true,  // Make the window full-screen
    transparent: true, // Transparent background
    frame: false,      // Remove window borders and title bar
    alwaysOnTop: true, // Keep the window always on top
    skipTaskbar: true, // Don't show in taskbar
    hasShadow: false,  // Remove window shadow
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Preload script (optional)
      nodeIntegration: true,
      contextIsolation: false, // Disable isolation for simplicity
    },
  });

  // Load the compiled HTML from the dist folder
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Make the entire window non-interactive except for the popup
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Send a message to toggle the visual in the renderer every 5 seconds
  setInterval(() => {
    if (mainWindow) {
      mainWindow.webContents.send('toggle-visual');
    }
  }, 5000);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});