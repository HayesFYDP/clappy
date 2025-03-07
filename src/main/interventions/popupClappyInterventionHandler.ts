import { BrowserWindow } from 'electron';
import { InterventionHandler, Interventions, InterventionPayloadMap, PopupClappyPayload } from './types';
import { ClappyExpression } from '../types';

export default class PopupClappyInterventionHandler implements InterventionHandler {
  supportedInterventions = [Interventions.POPUP_CLAPPY] as const;
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
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
    const timeoutMs = payload?.timeoutMs ?? 5000;

    if (payload?.expression && payload?.message) {
      const { expression, message } = payload;
      return this.popupClappySpecified(expression, message, timeoutMs);
    }

    // TODO: otherwise, use the LLM to determine Clappy's expression
    return undefined;
  }

  // make Clappy appear on the right side of a user's screen with a specific expression and text
  async popupClappySpecified(expression: ClappyExpression, text: string, timeoutMs = 5000) {
    this.mainWindow.webContents.send('open-popup', expression, text);

    setTimeout(() => {
      this.mainWindow?.webContents.send('close-popup');
    }, timeoutMs);
  }
}
