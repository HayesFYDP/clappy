import {
  InterventionHandler,
  Interventions,
  InterventionPayloadMap,
  MinimizeWindowPayload,
  ShakeWindowPayload,
  FocusWindowPayload,
} from './types';
import WindowManager from './windowManager';
import type Clappy from '../clappy';
import { ClappyExpression } from '../types';
import { WindowInfo } from './windowTypes';

export default class WindowInterventionHandler implements InterventionHandler {
  supportedInterventions = [Interventions.MINIMIZE_WINDOW, Interventions.SHAKE_WINDOW, Interventions.FOCUS_WINDOW] as const;

  clappy: Clappy;
  windowManager: WindowManager;

  constructor(clappy: Clappy) {
    this.windowManager = new WindowManager();
    this.clappy = clappy;
  }

  async handleIntervention<T extends Interventions>(intervention: T, payload?: InterventionPayloadMap[T]): Promise<void> {
    switch (intervention) {
      case Interventions.MINIMIZE_WINDOW:
        await this.minimizeActiveWindow(payload as MinimizeWindowPayload);
        break;
      case Interventions.SHAKE_WINDOW:
        await this.shakeActiveWindow(payload as ShakeWindowPayload);
        break;
      case Interventions.FOCUS_WINDOW:
        await this.focusWindow(payload as FocusWindowPayload);
        break;
      default:
        throw new Error(`WindowInterventionHandler received unsupported intervention: ${intervention}`);
    }
  }

  async minimizeActiveWindow(payload?: MinimizeWindowPayload) {
    const handle = payload?.windowHandle;

    await this.clappy.interventionHandlers[Interventions.POPUP_CLAPPY]?.popupClappySpecified(
      ClappyExpression.Enraged,
      'I minimized that window for you. Get back to work!',
      6000
    );

    return this.windowManager.minimizeWindow(handle);
  }

  async shakeActiveWindow(payload?: ShakeWindowPayload) {
    const handle = payload?.windowHandle;

    await this.clappy.interventionHandlers[Interventions.POPUP_CLAPPY]?.popupClappySpecified(
      ClappyExpression.Thwack,
      'Stop being unproductive.',
      6000
    );

    return this.windowManager.shakeWindow(handle);
  }

  async focusWindow(payload?: FocusWindowPayload) {
    const handle = payload?.windowHandle;

    if (handle) {
      return this.windowManager.focusWindow(handle);
    }

    const userWindows = await this.windowManager.listWindows();
    const selectedWindow = await this.selectWindowToFocus(userWindows.windows);

    if (!selectedWindow) {
      console.log('[FOCUS_WINDOW] No window selected to focus on, skipping intervention');
      return null;
    }

    await this.clappy.interventionHandlers[Interventions.POPUP_CLAPPY]?.popupClappySpecified(
      ClappyExpression.Suspicious,
      'The window I just focused seems more applicable for completing your task.',
      6000
    );
    return this.windowManager.focusWindow(selectedWindow.id);
  }

  async selectWindowToFocus(windows: WindowInfo[], payload?: MinimizeWindowPayload): Promise<WindowInfo | null> {
    const userTask =
      payload?.userTask !== undefined
        ? `You are given that the user is currently trying to accomplish: ${payload.userTask}`
        : 'The user did not provide a specific goal that they are working on, but would like to generally do productive work.';


    const eligibleWindows = windows.filter(window => !window.isFocused); // only consider windows that are not currently focused
    const windowDescriptions = eligibleWindows.map((window, index) => `${index + 1}. ${window.executablePath}: ${window.title}`);
    // console.log(windowDescriptions);

    if (!this.clappy.openai) {
      const randomWindow = eligibleWindows[Math.floor(Math.random() * eligibleWindows.length)];

      console.log(`[FOCUS_WINDOW] OpenAI API not initialized, selecting random window (${randomWindow.title}) to focus on`);
      return randomWindow;
    }

    if (windows.length === 0) {
      return null;
    }

    const prompt = `You are a helpful productivity assistant that is observing the user's computer screen. ${userTask}.
      Do not ask questions about this objective, simply consider it in light of the productivity records and justification.

      The user has been determined to be currently unproductive. You are given a list of windows with the that the user has open,
      with their titles and executable paths. You are asked to select a window to focus on to help the user become more productive.

      Your goal is to select a window that is most likely related to the user's task. Consider both the executable path and the title of the window.
      For example, if the executable is a web browser but the title is something unrelated to the user's task, you should prefer to not select that window.

      The windows and their associated numeric IDs are:
      ${windowDescriptions.join('\n')}

      Only select one window to focus. Enclosed in <OUTPUT> </OUTPUT> tags, you will output a JSON response that conforms the following schema:
      { window: "<number between 1 and ${windowDescriptions.length}}>" }
    `;

    const response = await this.clappy.openai?.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
      max_tokens: 500,
    });

    const responseText = response?.choices[0].message.content;
    if (!responseText) {
      console.log('Failed to select an intervention');
      return null;
    }

    const outputStart = responseText.indexOf('<OUTPUT>') + '<OUTPUT>'.length;
    const outputEnd = responseText.indexOf('</OUTPUT>');
    const output = responseText.slice(outputStart, outputEnd);
    const outputJson = JSON.parse(output);
    const windowIndex = Number(outputJson.window) - 1;

    if (Number.isNaN(windowIndex) || windowIndex < 0 || windowIndex >= windows.length) {
      console.log('[FOCUS_WINDOW] Invalid window index selected by LLM:', windowIndex);
      return null;
    }

    const windowToFocus = windows[windowIndex];
    console.log(`[FOCUS_WINDOW] LLM selected to focus on window: ${windowToFocus.executablePath}: ${windowToFocus.title}`);

    return windowToFocus;
  }
}
