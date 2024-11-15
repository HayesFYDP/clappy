/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, ipcMain, desktopCapturer } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import * as fs from 'fs';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

async function takeScreenshot() {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 800, height: 600 },
    });
    const entireScreen = sources[0];

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const fileName = `screenshot-${timestamp}.png`;
    const filePath = path.join(app.getPath('downloads'), fileName);

    fs.writeFile(filePath, entireScreen.thumbnail.toPNG(), (err) => {
      if (err) {
        console.error('Failed to save screenshot:', err);
      } else {
        console.log('Screenshot saved:', filePath);
      }
    });
    return filePath;
  } catch (error) {
    console.error('Error taking screenshot:', error);
    return null;
  }
}

async function isProductive(screenshotPath: string) {
  // TODO: Implement prompting
  return {
    productive: false,
    confidence: 0.9,
    justification: screenshotPath,
  };
}

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreen: true, // Make the window full-screen
    transparent: true, // Transparent background
    frame: false, // Remove window borders and title bar
    alwaysOnTop: true, // Keep the window always on top
    skipTaskbar: true, // Don't show in taskbar
    hasShadow: false, // Remove window shadow
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  // Make the entire window non-interactive
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Take screenshots of the screen every 10 seconds and check if the user is productive
  setInterval(async () => {
    const screenshotPath = await takeScreenshot();
    if (screenshotPath) {
      const productivity = await isProductive(screenshotPath);
      console.log('Productivity:', productivity);

      // Open the popup with the productivity information
      if (mainWindow) {
        mainWindow.webContents.send('open-popup', productivity.productive);

        // Close the popup after 5 seconds
        setTimeout(() => {
          mainWindow?.webContents.send('close-popup');
        }, 5000);
      }
    }
  }, 10000);

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
