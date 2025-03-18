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

    return this.windowManager.minimizeWindow(handle);
  }

  async shakeActiveWindow(payload?: ShakeWindowPayload) {
    const handle = payload?.windowHandle;

    return this.windowManager.shakeWindow(handle);
  }

  async focusWindow(payload?: FocusWindowPayload) {
    const handle = payload?.windowHandle;

    if (handle) {
      return this.windowManager.focusWindow(handle);
    }

    const userTask =
      payload?.userTask !== undefined
        ? `You are given that the user is currently trying to accomplish: ${payload.userTask}`
        : 'The user did not provide a specific goal that they are working on, but would like to generally do productive work.';

    const userWindows = await this.windowManager.listWindows();
    const windowDescriptions = userWindows.windows.map((window, index) => `${index + 1}. ${window.executablePath}: ${window.title}`);

    if (!this.clappy.openai) {
      console.log('[FOCUS_WINDOW] OpenAI API not initialized, cannot use LLM to determine window to focus');
      return null;
    }

    if (userWindows.windows.length === 0) {
      console.log('[FOCUS_WINDOW] No windows to focus on');
      return null;
    }

    const prompt = `You are a helpful productivity assistant that is observing the user's computer screen. ${userTask}.
      Do not ask questions about this objective, simply consider it in light of the productivity records and justification.

      The user has been determined to be currently unproductive. You are given a list of windows that the user has open,
      and are asked to select a window to focus on to help the user become more productive.

      Your goal is to select a window that is most likely related to the user's task. The windows and their associated numeric IDs are:

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

    if (Number.isNaN(windowIndex) || windowIndex < 0 || windowIndex >= userWindows.windows.length) {
      console.log('[FOCUS_WINDOW] Invalid window index selected by LLM:', windowIndex);
      return null;
    }

    const windowToFocus = userWindows.windows[windowIndex];
    console.log(`[FOCUS_WINDOW] LLM selected to focus on window: ${windowToFocus.executablePath}: ${windowToFocus.title}`);

    return this.windowManager.focusWindow(windowToFocus.id);
  }
}
