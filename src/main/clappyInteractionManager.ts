import type Clappy from './clappy';
import { recordAudio, transcribeAudio } from './speechUtil';

// class to handle text and voice interactions with Clappy
export default class ClappyInteractionManager {
  clappy: Clappy;
  lastMessageSentTimestamp: number | null; // timestamp of the last message sent to Clappy
  conversationHistory: string[]; // store conversation history in memory; each message should begin with "User: " or "Clappy: "

  constructor(clappy: Clappy) {
    this.clappy = clappy;
    this.lastMessageSentTimestamp = null;
    this.conversationHistory = [];
  }

  async handleTextInteraction(text: string, source: 'text' | 'speech' = 'text'): Promise<void> {
    console.log(`[TEXT] Received message from ${source}: ${text}`);

    if (this.lastMessageSentTimestamp && Date.now() - this.lastMessageSentTimestamp > 60 * 1000) {
      // if a message was sent more than 60 seconds ago, assume the conversation has ended
      this.conversationHistory = [];
    }
    this.lastMessageSentTimestamp = Date.now();

    // add the message to the conversation history
    this.conversationHistory.push(`User: ${text}`);

    const memoryEnabled = this.clappy.memory.isEnabled();
    // if a task is set, make the conversation more general; otherwise, try to determine what the user's task is.
    const isUserTaskSet = this.clappy.memory.isUserTaskSet();
    const userTaskString = isUserTaskSet
      ? `You have recorded that the user is currently trying to accomplish: <${this.clappy.memory.getUserTask()}>.`
      : 'You have not yet determined what the user is trying to accomplish. Your focus is to record what the user is trying to accomplish in this conversation.';

    const conversationInfoString = this.conversationHistory.length === 1 ? 'The user has just began a conversation with you.' : 'You are currently in a conversation with the user.';
    const choicePreferencesString = isUserTaskSet ?
      "Your main objective is to determine what the user is currently trying to accomplish to record it in your memory. You should only use CLARIFY if you are unsure about the user's task."
      : "Your preference should be to either update the user's task with SET_TASK or update your memory with UPDATE_MEMORY to better help the user in the future. You should only use CLARIFY if you don't have enough information to do either of those. Prefer to avoid using RESPOND unless you are sure none of the other options are appropriate.";

    const prompt = `You are Clappy, a productivity AI assistant that can analyze a user's screen to determine if they're being productive.
                  ${userTaskString}

                  ${this.clappy.memory.getMemoryInfoString()}

                  ${conversationInfoString} The current conversation history is:
                  =====
                  ${this.conversationHistory.join('\n')}
                  =====

                  Your overall goal is to help the user be more productive. You have ${memoryEnabled ? '4' : '3'} choices for how to respond:
                  SET_TASK: <record the user's task internally to enable you to help them be more productive>
                  ${memoryEnabled ? 'UPDATE_MEMORY: <record important information or patterns from the conversation in your memory>' : ''}
                  CLARIFY: <respond to the user to ask clarifying questions that allow you to either SET_TASK or UPDATE_MEMORY>
                  RESPOND: <respond to the user with a simple, helpful response>

                  ${choicePreferencesString}

                  Only select one option. Enclosed in <OUTPUT> </OUTPUT> tags, you will output a JSON response that conforms the following schema:
                  { action: "<SET_TASK${memoryEnabled ? '/UPDATE_MEMORY' : ''}/CLARIFY/RESPOND>", content: "<string>" }
    `;

    const response = await this.clappy.openai?.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
          ],
        },
      ],
      max_tokens: 500,
    });

    // Extract the response from the chat completion
    const responseText = response?.choices[0].message.content;
    if (!responseText) {
      // TODO: handle error better
      console.error('No response text received from OpenAI API');
      return;
    }

    const outputStart = responseText.indexOf('<OUTPUT>') + '<OUTPUT>'.length;
    const outputEnd = responseText.indexOf('</OUTPUT>');

    const output = responseText.slice(outputStart, outputEnd);

    const outputJson = JSON.parse(output);

    if (outputJson.action && ['SET_TASK', 'UPDATE_MEMORY', 'CLARIFY', 'RESPOND'].includes(outputJson.action) && outputJson.content) {
      const { action, content } = outputJson;

      console.log(`[INTERACTION] Clappy chose action: ${action} with content: ${content}`);
      // TODO: handle each action
    }

  }

  async startVoiceInteraction(): Promise<void> {
    this.clappy.mainWindow?.webContents.send('toggle-popup-voice');

    console.log('[VOICE] Starting voice interaction');
    const audioPath = await recordAudio(this.clappy, 15, true);
    console.log('[VOICE] Finished recording audio:', audioPath);
    const transcription = await transcribeAudio(audioPath);
    console.log('[VOICE] Transcription:', transcription);

    await this.handleTextInteraction(transcription, 'speech');
  }
}
