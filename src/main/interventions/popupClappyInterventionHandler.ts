import { BrowserWindow } from 'electron';
import { ClappyExpression } from '../types';
import { InterventionHandler, InterventionPayloadMap, Interventions, PopupClappyPayload } from './types';

export default class PopupClappyInterventionHandler implements InterventionHandler {
  supportedInterventions = [Interventions.POPUP_CLAPPY] as const;

  getMainWindow: () => BrowserWindow | null;

  constructor(getMainWindow: () => BrowserWindow | null) {
    this.getMainWindow = getMainWindow;
  }

  async handleIntervention<T extends Interventions>(intervention: T, payload?: InterventionPayloadMap[T]): Promise<void> {
    switch (intervention) {
      case Interventions.POPUP_CLAPPY:
        await this.popupClappy(payload as PopupClappyPayload);
        break;
      default:
        throw new Error(`PopupClappyInterventionHandler received unsupported intervention: ${intervention}`);
    }
  }

  // make Clappy appear on the right side of a user's screen, using an LLM to determine Clappy's expression
  async popupClappy(payload?: PopupClappyPayload) {
    const timeoutMs = payload?.timeoutMs ?? 10000;

    if (payload?.expression && payload?.message) {
      const { expression, message } = payload;
      return this.popupClappySpecified(expression, message, timeoutMs);
    }

    // TODO: otherwise, use the LLM to determine Clappy's expression
    return this.popupClappySpecified(ClappyExpression.Enraged, 'GET BACK TO WORK', timeoutMs);
  }

  // make Clappy appear on the right side of a user's screen with a specifclose-popupic expression and text
  async popupClappySpecified(expression: ClappyExpression, text: string, timeoutMs = 10000) {
    const mainWindow = this.getMainWindow();
    if (mainWindow === null) {
      console.error('Main window is not available, cannot popup clappy');
      return;
    }

    mainWindow.webContents.send('open-popup-intervention', expression, text);

    setTimeout(() => {
      mainWindow.webContents.send('close-popup-intervention');
    }, timeoutMs);
  }
}
