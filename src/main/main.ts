/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { app, BrowserWindow, desktopCapturer, globalShortcut, ipcMain } from 'electron';
import * as fs from 'fs';
import { DateTime } from 'luxon';
import OpenAI from 'openai';
import os from 'os';
import path from 'path';
import INTERVENTION_HANDLERS from './interventions/interventionHandlers';
import { createInterventionHandler, InterventionDescriptions, InterventionHandler, Interventions } from './interventions/types';
import { ProductivityAnalysis } from './types';
import { resolveHtmlPath } from './util';

// TODO: move this to env
const WHISPER_PATH = '/Users/yashmulki/school/se490/clappy/whisper.cpp';
const IS_DEVELOPMENT = true; // TODO: Set this to false when deploying or take as an arg
// if set to true, will randomly select interventions when IS_DEVELOPMENT is true; otherwise, no interventions will be taken
const DEVELOPMENT_INTERVENTION_ENABLED = false;
dotenv.config();

const ENABLED_INTERVENTIONS = [
  Interventions.POPUP_CLAPPY,
  // Interventions.MINIMIZE_WINDOW,
  // Interventions.SHAKE_WINDOW,
  // Interventions.FOCUS_WINDOW,
];

class Clappy {
  prisma: PrismaClient;
  openai: OpenAI | null;
  mainWindow: BrowserWindow | null = null;
  settingsWindow: BrowserWindow | null = null;
  analyticsWindow: BrowserWindow | null = null;
  interventionHandlers: { [key in Interventions]?: InterventionHandler } = {};

  constructor() {
    // Initialize Prisma client for database access
    this.prisma = new PrismaClient();
    this.openai = IS_DEVELOPMENT ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      win?.setIgnoreMouseEvents(ignore, options);
    });

    ipcMain.on('open-settings-window', () => {
      if (this.settingsWindow) {
        this.settingsWindow.focus();
        return;
      }
      const settingsWindow = new BrowserWindow({
        width: 650,
        height: 600,
        title: 'Clappy Settings',
        resizable: false,
        frame: true,
        movable: true,
        titleBarStyle: 'hidden',
        roundedCorners: true,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: app.isPackaged ? path.join(__dirname, 'preload.js') : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
      });

      settingsWindow.loadURL(`${resolveHtmlPath('index.html')}#/settings`);

      // without this, the newly opened settings window requires a click before contents show
      settingsWindow.webContents.setBackgroundThrottling(false);

      settingsWindow.once('ready-to-show', () => {
        settingsWindow.show();
      });

      this.settingsWindow = settingsWindow;
      settingsWindow.on('closed', () => {
        this.settingsWindow = null;
      });
    });

    ipcMain.on('open-analytics-window', () => {
      if (this.analyticsWindow) {
        this.analyticsWindow.focus();
        return;
      }
      const analyticsWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Clappy Analytics',
        resizable: false,
        frame: true,
        roundedCorners: true,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: app.isPackaged ? path.join(__dirname, 'preload.js') : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
      });

      analyticsWindow.loadURL(`${resolveHtmlPath('index.html')}#/analytics`);

      // without this, the newly opened analytics window requires a click before contents show
      analyticsWindow.webContents.setBackgroundThrottling(false);

      analyticsWindow.once('ready-to-show', () => {
        analyticsWindow.show();
      });

      this.analyticsWindow = analyticsWindow;
      analyticsWindow.on('closed', () => {
        this.analyticsWindow = null;
      });
    });

    ipcMain.handle('get-settings', () => {
      return this.prisma.settings.findFirst();
    });

    ipcMain.handle('set-settings', (event, settings) => {
      return this.prisma.settings.upsert({
        where: { id: 1 }, // only one row in the settings table
        update: settings,
        create: settings,
      });
    });

    app.on('will-quit', () => {
      // Unregister all shortcuts.
      globalShortcut.unregisterAll();
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
        const shortcutSuccess = globalShortcut.register('F8', () => {
          console.log('F8 is pressed');
          this.mainWindow?.webContents.send('toggle-popup');
        });
        if (!shortcutSuccess) {
          console.error('Failed to register global shortcut');
        }
        this.createWindow();
        app.on('activate', () => {
          // On macOS it's common to re-create a window in the app when the
          // dock icon is clicked and there are no other windows open.
          if (this.mainWindow === null) this.createWindow();
        });

        // Initialize the intervention handlers after the main window is created
        INTERVENTION_HANDLERS.forEach((HandlerType) => {
          const handler = createInterventionHandler(
            HandlerType,
            () => {
              return this.getMainWindow();
            },
            this.openai,
          );
          handler.supportedInterventions.forEach((intervention) => {
            if (ENABLED_INTERVENTIONS.includes(intervention)) {
              this.interventionHandlers[intervention] = handler;
            }
          });
        });
      })
      .catch(console.log);
  }

  createWindow() {
    const isRunningMacos = process.platform === 'darwin';
    const screenSize = require('electron').screen.getPrimaryDisplay().workAreaSize;
    const mainWindow = new BrowserWindow({
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

    // Make window stay on top even after switching focus
    // https://github.com/electron/electron/issues/10078
    app.dock?.hide();
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    app.dock?.show();

    mainWindow.loadURL(resolveHtmlPath('index.html'));

    // Make the entire window non-interactive
    mainWindow.setIgnoreMouseEvents(true, { forward: true });

    // // Test speech and transcription on startup
    // const testSpeechAndTranscription = async () => {
    //   // First test with duration argument
    //   console.log('Starting first test with duration...');
    //   await say.speak('say something for 5 seconds');
    //   const transcriptPromise = await this.recordAudioAndTranscribe(5);
    //   const result1 = await transcriptPromise;
    //   console.log('First transcript:', result1);
    // };

    // testSpeechAndTranscription();

    // Take screenshots of the screen every 30 seconds and check if the user is productive
    if (!IS_DEVELOPMENT || DEVELOPMENT_INTERVENTION_ENABLED) {
      setTimeout(() => {
        this.manageProductivity();

        setInterval(() => {
          this.manageProductivity();
        }, 30000);
      }, 5000)
    }

    mainWindow.on('ready-to-show', () => {
      if (!mainWindow) {
        throw new Error('"mainWindow" is not defined');
      }
      mainWindow.show();
      // Add mouse event listeners
      mainWindow.webContents.send('add-mouse-event-listeners');
    });

    mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    this.mainWindow = mainWindow;
  }

  getMainWindow() {
    return this.mainWindow;
  }

  getClappyTempPath(): string {
    const tempDir = path.join(os.tmpdir(), 'clappy');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    console.log(tempDir);
    return tempDir;
  }

  // Add recording function
  async recordAudioAndTranscribe(durationS: number): Promise<string[]> {
    return new Promise((resolve) => {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const outputPath = path.join(this.getClappyTempPath(), `recording-${timestamp}.wav`);

      // Use sox for recording
      const args = ['-d', '-c', '1', '-r', '16000', '-b', '16', '-e', 'signed-integer', outputPath, 'trim', '0', durationS.toString()];
      const recordProcess = spawn('sox', args);

      recordProcess.on('exit', async () => {
        try {
          // Save current working directory
          const currentDir = process.cwd();
          // Change to whisper directory
          process.chdir(WHISPER_PATH);

          const whisperArgs = ['-f', outputPath, '-otxt'];
          const whisperProcess = spawn('./build/bin/whisper-cli', whisperArgs);

          whisperProcess.on('exit', async () => {
            console.log('finished whisper');
            // Change back to original directory
            process.chdir(currentDir);
            // Read the generated .txt file
            const txtPath = `${outputPath}.txt`;
            const transcript = await fs.promises.readFile(txtPath, 'utf8');
            console.log('Transcription text:', transcript);

            // Clean up files
            fs.unlinkSync(txtPath);

            resolve([transcript]);
          });
        } catch (err) {
          console.error('Error transcribing audio:', err);
          resolve([]);
        }
      });
    });
  }

  async takeScreenshot() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 800, height: 600 },
      });
      const entireScreen = sources[0];

      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const fileName = `screenshot-${timestamp}.png`;
      const filePath = path.join(this.getClappyTempPath(), fileName);

      await fs.promises.writeFile(filePath, entireScreen.thumbnail.toPNG());
      console.log('Screenshot saved:', filePath);
      return filePath;
    } catch (error) {
      console.error('Error taking screenshot:', error);
      return null;
    }
  }

  async isProductive(screenshotPath: string, userTask: string): Promise<ProductivityAnalysis> {
    const prompt = `You are a helpful productivity assistant that is observing the user's computer screen. You are asked to analyze the screen contents and make a judgement on whether the user is being productive or not. The screen contents are attached as image context. Even if the user is using a website that is typically distracting, consider whether the content they are reading is relevant to the problem.
    You are given that the user is currently trying to accomplish: <${userTask}>. Do not ask questions about this objective, simply consider it in light of the screen contents.
    First, you will start by analyzing these contents and discussing with yourself if the contents of the screen match the user's intended tasks. Then, enclosed in <OUTPUT> </OUTPUT> tags, you will output a JSON response that conforms the following schema
    { productive: <TRUE/FALSE>, confidence: <float from 0.0->1.0> justification : <concise string justification for decision> }`;

    // Read the screenshot file and convert to base64
    const imageBuffer = fs.readFileSync(screenshotPath);
    const base64Image = imageBuffer.toString('base64');

    const response = await this.openai?.chat.completions.create({
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
    const responseText = response?.choices[0].message.content;
    if (!responseText) {
      return {
        productive: false,
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

  async selectIntervention(userTask: string): Promise<Interventions | null> {
    // select an intervention using LLM prompting
    // first, query the database for the last 5 productivity records
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const records = await this.prisma.productivityRecord.findMany({
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

    const lastIntervention = await this.prisma.interventionRecord.findFirst({
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

    const interventionOptions = Object.keys(InterventionDescriptions)
      .map((intervention) => {
        return `${intervention}: ${InterventionDescriptions[intervention as keyof typeof InterventionDescriptions]}`;
      })
      .join('\n');

    const llmChoices = ENABLED_INTERVENTIONS.join('/');
    console.log('LLM choices:', llmChoices);

    const prompt = `You are a helpful productivity assistant that is observing the user's computer screen. You are given that the user is currently trying to accomplish: <${userTask}>.
      Do not ask questions about this objective, simply consider it in light of the productivity records and justification.
      You are asked to select an intervention to help the user become more productive. You are given the last 5 productivity records, which are as follows:
      ${prevRecordsString}

      Your goal is to select an intervention that will help the user become more productive. Choose the most fitting intervention based on the productivity history and previous interventions taken.

      Your options, ordered from most gentle to most extreme are:
      ${interventionOptions}

      ${lastInterventionString}

      Only select one intervention. Enclosed in <OUTPUT> </OUTPUT> tags, you will output a JSON response that conforms the following schema:
      { intervention: "<${llmChoices}>" }
    `;

    const response = await this.openai?.chat.completions.create({
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
    const responseText = response?.choices[0].message.content;
    if (!responseText) {
      console.log('Failed to select an intervention');
      return null;
    }

    const outputStart = responseText.indexOf('<OUTPUT>') + '<OUTPUT>'.length;
    const outputEnd = responseText.indexOf('</OUTPUT>');

    const output = responseText.slice(outputStart, outputEnd);

    const outputJson = JSON.parse(output);
    const { intervention } = outputJson;
    console.log('LLM selected intervention: ', intervention);

    // if interventions isn't in the Interventions enums, return null
    // TODO: figure out if we want to re-try picking
    if (!Object.values(Interventions).includes(intervention)) {
      return null;
    }

    return intervention;
  }

  async applyIntervention(userTask: string, productive: boolean, justification: string) {
    if (productive) {
      return;
    }

    // use an IIFE to select an intervention based on whether LLM is enabled
    const selectedIntervention = await (async () => {
      // if LLM is enabled, first attempt to select an intervention using LLM
      if (this.openai) {
        const llmIntervention = await this.selectIntervention(userTask);
        if (llmIntervention) {
          console.log('LLM intervention selected:', llmIntervention);
          return llmIntervention;
        }
      }

      // if LLM is disabled or an invalid intervention was selected, select a random intervention
      const randomIntervention = ENABLED_INTERVENTIONS[Math.floor(Math.random() * ENABLED_INTERVENTIONS.length)];
      console.log('Random intervention selected:', randomIntervention);

      return randomIntervention;
    })();

    // save the chosen intervention to the database
    this.prisma.interventionRecord.create({
      data: {
        date: new Date(),
        intervention: selectedIntervention,
      },
    });

    // apply the intervention
    const handler = this.interventionHandlers[selectedIntervention];
    if (handler) {
      await handler.handleIntervention(selectedIntervention, { userTask, justification });
    } else {
      console.error('No handler found for intervention (did you forget to enable it in ENABLED_INTERVENTIONS?):', selectedIntervention);
    }
  }

  async manageProductivity() {
    const screenshotPath = await this.takeScreenshot();

    if (screenshotPath) {
      console.log('About to call isproductive');
      // TODO: Replace hardcoded task with actual task
      const hardcodedTask = 'Working on a school programming assignment.';
      const productivity = await this.isProductive(screenshotPath, hardcodedTask);
      console.log('Productivity:', productivity);

      // Save the productivity analysis to the database
      await this.prisma.productivityRecord.create({
        data: {
          date: new Date(),
          isProductive: productivity.productive,
          confidence: productivity.confidence,
          justification: productivity.justification,
        },
      });

      await this.applyIntervention(hardcodedTask, productivity.productive, productivity.justification);
    } else {
      console.log('No screenshot path recevied');
    }
  }
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const clappy = new Clappy();
