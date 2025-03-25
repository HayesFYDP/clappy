import say from 'say';
import { InterventionHandler, InterventionPayloadMap, Interventions, SpeakClappyPayload } from './types';
import type Clappy from '../clappy';
import { ClappyExpression } from '../types';

export default class SpeechInterventionHandler implements InterventionHandler {
  supportedInterventions = [Interventions.SPEAK_CLAPPY] as const;

  messageHistory: string[]; // store message history in memory because there's no benefit to persist it
  clappy: Clappy;

  constructor(clappy: Clappy) {
    this.clappy = clappy;
    this.messageHistory = [];
  }

  async handleIntervention<T extends Interventions>(intervention: T, payload?: InterventionPayloadMap[T]): Promise<boolean> {
    switch (intervention) {
      case Interventions.SPEAK_CLAPPY:
        return this.speakClappy(payload);
      default:
        throw new Error(`SpeechInterventionHandler received unsupported intervention: ${intervention}`);
    }
  }

  async speakClappy(payload?: SpeakClappyPayload): Promise<boolean> {
    const message = payload?.message ?? (await this.determineClappySpeech(payload));
    const estimatedSpeechDuration = message.split(' ').length * 450 + 2000; // assume 0.45 seconds per word, plus 2 second buffer

    await this.clappy.interventionHandlers[Interventions.POPUP_CLAPPY]?.popupClappySpecified(
      ClappyExpression.Chomp,
      message,
      estimatedSpeechDuration,
    );
    await this.speak(message);

    return true;
  }

  async speak(message: string) {
    console.log('[SPEECH] Speaking:', message);
    say.speak(message);
  }

  async determineClappySpeech(payload?: SpeakClappyPayload): Promise<string> {
    const defaultSpeech = 'Get back to work!';

    if (!this.clappy.openai) {
      return defaultSpeech;
    }

    const userTask =
      payload?.userTask !== undefined
        ? `You are given that the user is currently trying to accomplish: ${payload.userTask}`
        : 'The user did not provide a specific goal that they are working on, but would like to generally do productive work.';

    const historyString =
      this.messageHistory.length === 0
        ? 'This is the first message that you are sending to the user.'
        : `The past few messages that you have spoken are:\n${this.messageHistory.join('\n')}`;

    const unproductiveReasoning = payload?.justification
      ? `The user is currently unproductive with the following reasoning: ${payload.justification}`
      : 'The user has been determined to be currently unproductive';

    const prompt = `You are a helpful productivity assistant that is observing the user's computer screen. ${userTask}.
      Do not ask questions about this objective, simply consider it in light of the productivity records and justification.

      ${unproductiveReasoning}. You asked to write a message that will be verbally spoken to the user to encourage them to be more productive.

      ${historyString}

      Write a short one to two sentence message to the user. Try to avoid repeating exactly what you have said in the past and utilize the reasoning if applicable.

      Enclosed in <OUTPUT> </OUTPUT> tags, you will output a JSON response that conforms the following schema:
      { message: <some helpful message>" }
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
    }).catch(() => null);

    const responseText = response?.choices[0].message.content;
    if (!responseText) {
      console.log('[SPEECH] Failed to determine clappy message');
      return defaultSpeech;
    }

    try {
      const outputStart = responseText.indexOf('<OUTPUT>') + '<OUTPUT>'.length;
      const outputEnd = responseText.indexOf('</OUTPUT>');
      const output = responseText.slice(outputStart, outputEnd);
      const outputJson = JSON.parse(output);

      if (outputJson.message.length === 0) {
        console.log('[SPEECH] Empty message selected');
        return defaultSpeech;
      }

      this.messageHistory.push(outputJson.message);
      if (this.messageHistory.length > 5) {
        this.messageHistory.shift();
      }

      return outputJson.message;
    } catch {
      console.log('[SPEECH] Failed to parse clappy message');
      return defaultSpeech;
    }
  }
}

// sox -d -c 1 -r 16000 -b 16 -e signed-integer ./test.wav silence 1 0.1 3% 1 2.0 3%
