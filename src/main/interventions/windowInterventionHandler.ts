import { InterventionHandler, Interventions } from './types';
import WindowManager from './windowManager';

export default class WindowInterventionHandler implements InterventionHandler {
  supportedInterventions = [
    Interventions.MINIMIZE_WINDOW,
    Interventions.SHAKE_WINDOW,
    Interventions.FOCUS_WINDOW,
  ] as const;

  windowManager: WindowManager;

  constructor() {
    this.windowManager = new WindowManager();
  }

  async handleIntervention(intervention: Interventions): Promise<void> {
    switch (intervention) {
      case Interventions.MINIMIZE_WINDOW:
        await this.minimizeActiveWindow();
        break;
      case Interventions.SHAKE_WINDOW:
        await this.shakeActiveWindow();
        break;
      case Interventions.FOCUS_WINDOW:
        await this.focusWindow();
        break;
      default:
        throw new Error(`WindowInterventionHandler received unsupported intervention: ${intervention}`);
    }
  }

  async minimizeActiveWindow() {
    return this.windowManager.minimizeWindow();
  }

  async shakeActiveWindow() {
    return this.windowManager.shakeWindow();
  }

  async focusWindow() {
    // todo: list all, ask LLM what window should be focused
  }
}
