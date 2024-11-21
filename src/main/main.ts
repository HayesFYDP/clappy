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
import OpenAI from 'openai';
import os from 'os';
import { resolveHtmlPath } from './util';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey:
    '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',
});

function getClappyTempPath() {
  const tempDir = path.join(os.tmpdir(), 'clappy');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

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
    const filePath = path.join(getClappyTempPath(), fileName);

    await fs.promises.writeFile(filePath, entireScreen.thumbnail.toPNG());
    console.log('Screenshot saved:', filePath);
    return filePath;
  } catch (error) {
    console.error('Error taking screenshot:', error);
    return null;
  }
}

async function isProductive(screenshotPath: string, userTask: string) {
  const prompt = `You are a helpful productivity assistant that is observing the user's computer screen. You are asked to analyze the screen contents and make a judgement on whether the user is being productive or not. The screen contents are attached as image context. Even if the user is using a website that is typically distracting, consider whether the content they are reading is relevant to the problem.
  You are given that the user is currently trying to accomplish: <${userTask}>. Do not ask questions about this objective, simply consider it in light of the screen contents.
  First, you will start by analyzing these contents and discussing with yourself if the contents of the screen match the user's intended tasks. Then, enclosed in <OUTPUT> </OUTPUT> tags, you will output a JSON response that conforms the following schema
  { productive: <TRUE/FALSE>, confidence: <float from 0.0->1.0> justification : <concise string justification for decision> }`;

  // Read the screenshot file and convert to base64
  const imageBuffer = fs.readFileSync(screenshotPath);
  const base64Image = imageBuffer.toString('base64');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${base64Image}` },
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  // Extract the response from the chat completion
  const responseText = response.choices[0].message.content;
  console.log('RAW RESPONSE:', responseText);
  if (!responseText) {
    return {
      productive: true,
      confidence: 0.0,
      justification: 'Failed to analyze screen contents',
    };
  }
  const outputStart = responseText.indexOf('<OUTPUT>') + '<OUTPUT>'.length;
  const outputEnd = responseText.indexOf('</OUTPUT>');

  const output = responseText.slice(outputStart, outputEnd);

  const outputJson = JSON.parse(output);
  console.log('JSON PARSED:', outputJson);

  return outputJson;
}

const createWindow = async () => {
  const isRunningMacos = process.platform === 'darwin';
  const screenSize =
    require('electron').screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: screenSize.width,
    height: screenSize.height,
    fullscreen: !isRunningMacos, // Make the window full-screen
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
      console.log('About to call isproductive');
      // TODO: Replace hardcoded task with actual task
      const hardcodedTask =
        'Working on FYDP presentation (a very cool bicycle)';
      const productivity = await isProductive(screenshotPath, hardcodedTask);
      console.log('Productivity:', productivity);

      // Open the popup with the productivity information
      if (mainWindow) {
        mainWindow.webContents.send('open-popup', productivity.productive);

        // Close the popup after 5 seconds
        setTimeout(() => {
          mainWindow?.webContents.send('close-popup');
        }, 5000);
      }
    } else {
      console.log('No screenshot path recevied');
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
