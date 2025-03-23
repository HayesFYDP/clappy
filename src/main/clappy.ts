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
import { app, BrowserWindow, desktopCapturer, globalShortcut, ipcMain } from 'electron';
import * as fs from 'fs';
import { DateTime } from 'luxon';
import OpenAI from 'openai';
import os from 'os';
import path from 'path';
import { INTERVENTION_HANDLERS, InterventionHandlerMap } from './interventions/interventionHandlers';
import { createInterventionHandler, InterventionDescriptions, Interventions } from './interventions/types';
import { ClappyExpression, ProductivityAnalysis } from './types';
import { resolveHtmlPath } from './util';
import ClappyMemory from './clappyMemory';
import ClappyInteractionManager from './clappyInteractionManager';

class Clappy {
  prisma: PrismaClient;
  openai: OpenAI | null;
  isDevelopment: boolean; // when true, avoid interacting with the LLM
  developmentInterventionEnabled: boolean; // randomly select interventions in development mode
  memory: ClappyMemory; // Clappy's memory used to store more persistent information
  interactionManager: ClappyInteractionManager; // used to handle interactions (text and voice) with Clappy
  // memory: string = 'empty memory, do not use this in reasoning'; // Persistent memory field for LLM

  mainWindow: BrowserWindow | null = null;
  settingsWindow: BrowserWindow | null = null;
  analyticsWindow: BrowserWindow | null = null;

  enabledInterventions: Interventions[];
  interventionHandlers: Partial<InterventionHandlerMap> = {};

  constructor(enabledInterventions: Interventions[], isDevelopment: boolean, developmentInterventionEnabled: boolean, memoryEnabled: boolean) {
    this.isDevelopment = isDevelopment;
    this.developmentInterventionEnabled = developmentInterventionEnabled;
    this.enabledInterventions = enabledInterventions;
    console.log(`Enabled interventions: ${enabledInterventions}`);
    console.log(`>> Globally, interventions are ${(!this.isDevelopment || this.developmentInterventionEnabled) ? 'ENABLED' : 'DISABLED'}`);

    this.interactionManager = new ClappyInteractionManager(this);
    this.memory = new ClappyMemory(this, memoryEnabled);

    // Initialize Prisma client for database access
    this.prisma = new PrismaClient();
    this.openai = this.isDevelopment ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
        width: 800,
        height: 600,
        title: 'Clappy Settings',
        resizable: false,
        frame: true,
        movable: true,
        icon: path.join(__dirname, '../../assets/app-icon.png'),
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
        icon: path.join(__dirname, '../../assets/app-icon.png'),
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

    ipcMain.on('send-text-interaction', async (event, text) => {
      this.interactionManager.handleTextInteraction(text);
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
        const shortcutSuccessTogglePopup = globalShortcut.register('F8', () => {
          console.log('F8 is pressed');
          this.mainWindow?.webContents.send('toggle-popup');
        });
        if (!shortcutSuccessTogglePopup) {
          console.error('Failed to register global shortcut for toggle popup');
        }

        const shortcutSuccessSpeech = globalShortcut.register('F9', () => {
          console.log('F9 is pressed');
          this.interactionManager.startVoiceInteraction();
        });
        if (!shortcutSuccessSpeech) {
          console.error('Failed to register global shortcut for speech interaction');
        }

        this.createWindow();
        app.on('activate', () => {
          // On macOS it's common to re-create a window in the app when the
          // dock icon is clicked and there are no other windows open.
          if (this.mainWindow === null) this.createWindow();
        });

        // Initialize the intervention handlers after the main window is created
        INTERVENTION_HANDLERS.forEach((HandlerType) => {
          const handler = createInterventionHandler(HandlerType, this);
          handler.supportedInterventions.forEach((intervention) => {
            // use a type assertion here because the rest of the code ensures that the handler is valid
            this.assignHandler(intervention, handler as InterventionHandlerMap[typeof intervention]);
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
      icon: path.join(__dirname, '../../assets/app-icon.png'),
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

    // Take screenshots of the screen every 30 seconds and check if the user is productive
    if (!this.isDevelopment || this.developmentInterventionEnabled) {
      setTimeout(() => {
        this.manageProductivity();

        setInterval(() => {
          this.manageProductivity();
        }, 30000);
      }, 10000);
    }

    mainWindow.on('ready-to-show', () => {
      if (!mainWindow) {
        throw new Error('"mainWindow" is not defined');
      }
      mainWindow.show();
      // Add mouse event listeners
      mainWindow.webContents.send('add-mouse-event-listeners');

      // Upon startup, popup Clappy asking what the user is trying to accomplish
      mainWindow.webContents.send('open-popup-interact', ClappyExpression.Happy, 'Hello! What are you trying to accomplish today?');
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
    return tempDir;
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
    const prompt = `You are Clappy, a productivity AI assistant analyzing a user's screen to determine if they're being productive.'
                    You are given that the user is currently trying to accomplish: <${userTask}>. Do not ask questions about this objective, simply consider it in light of the screen contents.
                    ${this.memory.getMemoryInfoString()}
                    First, you will start by analyzing these contents and discussing with yourself if the contents of the screen match the user's intended tasks.

                    Consider:
                    1) Is the current activity directly contributing to the user's goal?
                    2) Even if using typically distracting sites, is the content relevant to their task?
                    3) Are there patterns in the user's behavior you can identify from memory?

                    Then, enclosed in <OUTPUT> </OUTPUT> tags, you will output a JSON response that conforms the following schema:
                    { productive: <TRUE/FALSE>, confidence: <float from 0.0->1.0>, justification: <concise string justification for decision>${this.memory.getMemoryResponseString()} }.`;

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

    if (outputJson.memory) {
      this.memory.replaceMemory(outputJson.memory);
    }

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

    const lastInterventions = await this.prisma.interventionRecord.findMany({
      orderBy: {
        date: 'desc',
      },
      where: {
        date: {
          gte: tenMinutesAgo,
        },
      },
      take: 10,
    });

    const lastInterventionString = lastInterventions.length > 0
      ? `In the past 10 minutes, the following interventions were taken (most recent first): ${lastInterventions.map(intervention => intervention.intervention).join(', ')}
         The last intervention was taken ${DateTime.fromJSDate(lastInterventions[0].date).toRelative()}.`
      : 'No interventions were taken in the last 10 minutes.';

    const interventionOptions = this.enabledInterventions
      .map((intervention) => {
        return `${intervention}: ${InterventionDescriptions[intervention as keyof typeof InterventionDescriptions]}`;
      })
      .join('\n');

    const llmChoices = this.enabledInterventions.join('/');
    console.log('LLM choices:', llmChoices);

    const prompt = `You are a helpful productivity assistant that is observing the user's computer screen.
                    You are given that the user is currently trying to accomplish: <${userTask}>. Do not ask questions about this objective, simply consider it in light of the productivity records and justification.
                    You are asked to select an intervention to help the user become more productive.

                    You are given the last 5 productivity records, which are as follows:
                    ${prevRecordsString}

                    Your goal is to select an intervention that will help the user become more productive.
                    Choose the most fitting intervention based on the productivity history and previous interventions taken.
                    Your options, ordered from most gentle to most extreme are:
                    ${interventionOptions}

                    ${lastInterventionString}

                    ${this.memory.getMemoryInfoString()}
                    Consider:
                    1) Is this a recurring pattern of distraction?
                    2) Did previous interventions work effectively?
                    3) Should you try a different approach based on the user's response?

                    Only select one intervention. Enclosed in <OUTPUT> </OUTPUT> tags, you will output a JSON response that conforms the following schema:
                    { intervention: "<${llmChoices}>"${this.memory.getMemoryResponseString()} }
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

    // Update memory if provided
    if (outputJson.memory) {
      this.memory.replaceMemory(outputJson.memory);
    }

    // if interventions isn't in the Interventions enums, return null
    // TODO: figure out if we want to re-try picking
    if (!Object.values(Interventions).includes(intervention)) {
      return null;
    }

    return intervention.trim();
  }

  async applyIntervention(userTask: string, productive: boolean, confidence: number, justification: string) {
    // avoid being too aggressive if we are less confident about the user's productivity
    if (productive || confidence <= 0.65) {
      if (this.isDevelopment && this.developmentInterventionEnabled) {
        // do nothing; don't early exit in development mode with interventions enabled
      } else {
        return;
      }

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
      const randomIntervention = this.enabledInterventions[Math.floor(Math.random() * this.enabledInterventions.length)];
      console.log('Random intervention selected:', randomIntervention);

      return randomIntervention;
    })();

    // save the chosen intervention to the database
    await this.prisma.interventionRecord.create({
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
      console.error(
        'No handler found for intervention (did you forget to add the handler to interventionHandlers.ts?):',
        selectedIntervention,
      );
    }
  }

  async manageProductivity() {
    const screenshotPath = await this.takeScreenshot();

    if (screenshotPath) {
      console.log('About to call isproductive');
      const userTask = this.memory.getUserTask();
      const productivity = await this.isProductive(screenshotPath, userTask);
      console.log('Productivity:', productivity);

      // Save the productivity analysis to the database (excluding memory field)
      await this.prisma.productivityRecord.create({
        data: {
          date: new Date(),
          isProductive: productivity.productive,
          confidence: productivity.confidence,
          justification: productivity.justification,
        },
      });

      await this.applyIntervention(userTask, productivity.productive, productivity.confidence, productivity.justification);
    } else {
      console.log('No screenshot path recevied');
    }
  }

  // function to assign a handler, mostly here to satisfy typescript typing
  assignHandler<K extends keyof InterventionHandlerMap>(intervention: K, handler: InterventionHandlerMap[K]) {
    this.interventionHandlers[intervention] = handler;
  }
}

export default Clappy;
