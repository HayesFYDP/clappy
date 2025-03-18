import { BrowserWindow } from 'electron';
import OpenAI from 'openai';
import { ClappyExpression } from '../types';
import { InterventionHandler, InterventionPayloadMap, Interventions, PopupClappyPayload } from './types';

export default class PopupClappyInterventionHandler implements InterventionHandler {
  supportedInterventions = [Interventions.POPUP_CLAPPY] as const;

  getMainWindow: () => BrowserWindow | null;
  openai: OpenAI | null;
  messageHistory: { expression: ClappyExpression; message: string }[]; // store message history in memory because there's no benefit to persist it

  constructor(getMainWindow: () => BrowserWindow | null, openai: OpenAI | null) {
    this.getMainWindow = getMainWindow;
    this.openai = openai;
    this.messageHistory = [];
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

    const { expression, message } = await this.determineClappyMessage(payload);
    return this.popupClappySpecified(expression, message, timeoutMs);
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

  async determineClappyMessage(payload?: PopupClappyPayload): Promise<{ expression: ClappyExpression; message: string }> {
    const defaultResponse = { expression: ClappyExpression.Enraged, message: 'GET BACK TO WORK' };

    if (!this.openai) {
      return defaultResponse;
    }

    const userTask =
      payload?.userTask !== undefined
        ? `You are given that the user is currently trying to accomplish: ${payload.userTask}`
        : 'The user did not provide a specific goal that they are working on, but would like to generally do productive work.';

    const historyString =
      this.messageHistory.length === 0
        ? 'This is the first message that you are sending to the user.'
        : `The past few expressions and accompanying messages that you have displayed are:\n${this.messageHistory.map((entry) => `${entry.expression}: ${entry.message}`).join('\n')}`;

    const prompt = `You are a helpful productivity assistant that is observing the user's computer screen. ${userTask}.
      Do not ask questions about this objective, simply consider it in light of the productivity records and justification.

      The user has been determined to be currently unproductive. You are asked to display a character expression and a message to the user to encourage them to be more productive.

      ${historyString}

      Your expression options are: ${Object.values(ClappyExpression).join(', ')}.

      Only select one expression, and write a short one sentence message to the user. Use all-caps if the tone fits. Try to avoid repeating exactly what you have said in the past.

      Enclosed in <OUTPUT> </OUTPUT> tags, you will output a JSON response that conforms the following schema:
      { expression: "<${Object.values(ClappyExpression).join('/')}>, message: <some helpful message>" }
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

    const responseText = response?.choices[0].message.content;
    if (!responseText) {
      console.log('[POPUP_CLAPPY] Failed to determine clappy message');
      return defaultResponse;
    }

    const outputStart = responseText.indexOf('<OUTPUT>') + '<OUTPUT>'.length;
    const outputEnd = responseText.indexOf('</OUTPUT>');
    const output = responseText.slice(outputStart, outputEnd);
    const outputJson = JSON.parse(output);

    if (!Object.values(ClappyExpression).includes(outputJson.expression)) {
      console.log('[POPUP_CLAPPY] Invalid expression selected');
      return defaultResponse;
    }
    if (outputJson.message.length === 0) {
      console.log('[POPUP_CLAPPY] Empty message selected');
      return defaultResponse;
    }

    this.messageHistory.push({ expression: outputJson.expression, message: outputJson.message });
    if (this.messageHistory.length > 5) {
      this.messageHistory.shift();
    }

    return outputJson;
  }
}
