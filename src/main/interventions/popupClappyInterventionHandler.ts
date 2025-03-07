import { BrowserWindow } from 'electron';
import { InterventionHandler, Interventions } from './types';
import { ClappyExpression } from '../types';

export default class PopupClappyInterventionHandler implements InterventionHandler {
  supportedInterventions = [Interventions.POPUP_CLAPPY] as const;
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  async handleIntervention(intervention: Interventions): Promise<void> {
    switch (intervention) {
      case Interventions.POPUP_CLAPPY:
        await this.popupClappyReasoning();
        break;
      default:
        throw new Error(`PopupClappyInterventionHandler received unsupported intervention: ${intervention}`);
    }
  }

  // make Clappy appear on the right side of a user's screen, using an LLM to determine Clappy's expression
  async popupClappyReasoning() {
    // TODO: make this configurable, use LLM to determine expression and possibly text
    const expression = ClappyExpression.Enraged;
    const popupText = 'GET BACK TO WORK';

    await this.popupClappy(expression, popupText, 5000);
  }

  // make Clappy appear on the right side of a user's screen with a specific expression and text
  async popupClappy(expression: ClappyExpression, text: string, timeoutMs = 5000) {
    this.mainWindow.webContents.send('open-popup', expression, text);

    setTimeout(() => {
      this.mainWindow?.webContents.send('close-popup');
    }, timeoutMs);
  }
}
