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
import { app, BrowserWindow, desktopCapturer, ipcMain } from 'electron';
import { PrismaClient } from '@prisma/client';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import * as fs from 'fs';
import OpenAI from 'openai';
import os from 'os';
import dotenv from 'dotenv';
import { DateTime } from 'luxon';
import { resolveHtmlPath } from './util';
import { ProductivityAnalysis } from './types';

dotenv.config();

// Initialize Prisma client for database access
const prisma = new PrismaClient();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

async function isProductive(screenshotPath: string, userTask: string): Promise<ProductivityAnalysis> {
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

  return outputJson;
}

async function popupProductivityIntervention(productive: boolean) {
  if (mainWindow) {
    mainWindow.webContents.send('open-popup', productive);

    // Close the popup after 5 seconds
    setTimeout(() => {
      mainWindow?.webContents.send('close-popup');
    }, 5000);
  }
}

async function minimizeWindowIntervention(productive: boolean) {
  // TODO: Implement this
}

async function selectIntervention(userTask: string, productive: boolean) {
  if (productive) {
    console.log('User is currently productive, skipping intervention');
    return;
  }

  // select an intervention using LLM prompting
  // first, query the database for the last 5 productivity records
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const records = await prisma.productivityRecord.findMany({
    take: 5,
    orderBy: {
      date: 'desc',
    },
    where: {
      date: {
        gte: tenMinutesAgo,
      },
    },
  });

  const prevRecordsString = records
    .map((record) => {
      const relDate = DateTime.fromJSDate(record.date).toRelative(); // store date in format of "5 seconds ago" or "2 minutes ago"
      return `${relDate}: ${record.isProductive ? 'productive' : 'unproductive'} | confidence: ${record.confidence} | justification: ${record.justification}`;
    })
    .join('\n');

  const lastIntervention = await prisma.interventionRecord.findFirst({
    orderBy: {
      date: 'desc',
    },
    where: {
      date: {
        gte: tenMinutesAgo,
      },
    },
  });

  const lastInterventionString = lastIntervention
    ? `The last intervention taken was ${DateTime.fromJSDate(lastIntervention.date).toRelative()} with action ${lastIntervention.intervention}.`
    : 'No interventions were taken in the last 10 minutes.';

  const prompt = `You are a helpful productivity assistant that is observing the user's computer screen. You are given that the user is currently trying to accomplish: <${userTask}>.
    Do not ask questions about this objective, simply consider it in light of the productivity records and justification.
    You are asked to select an intervention to help the user become more productive. You are given the last 5 productivity records, which are as follows:
    ${prevRecordsString}

    Your goal is to select an intervention that will help the user become more productive. Choose the most fitting intervention based on the productivity history and previous interventions taken.

    Your options, ordered from most gentle to most extreme are:
    NOTIFY - Display a notification to the user to remind them to stay on task
    MINIMIZE - Minimize the current window to reduce distractions

    ${lastInterventionString}

    Enclosed in <OUTPUT> </OUTPUT> tags, you will output a JSON response that conforms the following schema:
    { intervention: "<NOTIFY/MINIMIZE>" }
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: prompt }],
      },
    ],
    max_tokens: 500,
  });

  // Extract the response from the chat completion
  const responseText = response.choices[0].message.content;
  if (!responseText) {
    console.log('Failed to select an intervention');
    return;
  }

  const outputStart = responseText.indexOf('<OUTPUT>') + '<OUTPUT>'.length;
  const outputEnd = responseText.indexOf('</OUTPUT>');

  const output = responseText.slice(outputStart, outputEnd);

  const outputJson = JSON.parse(output);
  const { intervention } = outputJson;
  console.log('Selected intervention: ', intervention);

  if (intervention === 'NOTIFY' || intervention === 'MINIMIZE') {
    prisma.interventionRecord.create({
      data: {
        date: new Date(),
        intervention,
      },
    });
  }

  switch (intervention) {
    case 'NOTIFY':
      popupProductivityIntervention(productive);
      break;
    case 'MINIMIZE':
      minimizeWindowIntervention(productive);
      break;
    default:
      console.log(`Invalid/unknown intervention selected: "${intervention}"`);
  }
}

async function manageProductivity() {
  const screenshotPath = await takeScreenshot();

  if (screenshotPath) {
    console.log('About to call isproductive');
    // TODO: Replace hardcoded task with actual task
    const hardcodedTask = 'Working on FYDP presentation (a very cool bicycle)';
    const productivity = await isProductive(screenshotPath, hardcodedTask);
    console.log('Productivity:', productivity);

    // Save the productivity analysis to the database
    await prisma.productivityRecord.create({
      data: {
        date: new Date(),
        isProductive: productivity.productive,
        confidence: productivity.confidence,
        justification: productivity.justification,
      },
    });

    await selectIntervention(hardcodedTask, productivity.productive);
  } else {
    console.log('No screenshot path recevied');
  }
}

const createWindow = async () => {
  const isRunningMacos = process.platform === 'darwin';
  const screenSize = require('electron').screen.getPrimaryDisplay().workAreaSize;
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
      preload: app.isPackaged ? path.join(__dirname, 'preload.js') : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  // Make the entire window non-interactive
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Take screenshots of the screen every 10 seconds and check if the user is productive
  setInterval(manageProductivity, 10000);

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    // Add mouse event listeners
    mainWindow.webContents.send('add-mouse-event-listeners');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.setIgnoreMouseEvents(ignore, options);
});

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
