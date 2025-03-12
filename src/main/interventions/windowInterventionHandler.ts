import { BrowserWindow } from "electron";
import OpenAI from 'openai';
import {
  InterventionHandler,
  Interventions,
  InterventionPayloadMap,
  MinimizeWindowPayload,
  ShakeWindowPayload,
  FocusWindowPayload,
} from './types';
import WindowManager from './windowManager';

export default class WindowInterventionHandler implements InterventionHandler {
  supportedInterventions = [Interventions.MINIMIZE_WINDOW, Interventions.SHAKE_WINDOW, Interventions.FOCUS_WINDOW] as const;

  getMainWindow: () => BrowserWindow | null;
  openai: OpenAI | null;
  windowManager: WindowManager;

  constructor(getMainWindow: () => BrowserWindow | null, openai: OpenAI | null) {
    this.windowManager = new WindowManager();
    this.getMainWindow = getMainWindow;
    this.openai = openai;
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

    // TODO: list all windows, ask LLM what window should be focused
    return undefined;
  }
}
