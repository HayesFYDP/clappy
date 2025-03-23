import type Clappy from './clappy';
import { recordAudio, transcribeAudio } from './speechUtil';
import { ClappyExpression } from './types';

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
    console.log(`[TEXT] Received message from ${source} (conversation length: ${this.conversationHistory.length}): ${text}`);

    this.clappy.mainWindow?.webContents.send('open-popup-interact', ClappyExpression.Loading, 'thinking of a reply...');

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

    const conversationInfoString =
      this.conversationHistory.length === 1
        ? 'The user has just began a conversation with you.'
        : 'You are currently in a conversation with the user.';

    const updateMemoryChoiceInfo = 'Otherwise, your preference is to update your memory with UPDATE_MEMORY to better help the user in the future. For example, if the user tells you that they want to stop being distracted by a program or topic, you should UPDATE_MEMORY with that information.'
    const choicePreferencesString = !isUserTaskSet
      ? `Your main objective is to determine what the user is currently trying to accomplish to record it in your memory using SET_TASK.
        You should use CLARIFY if you are unsure about the user's task or if what the user provided is too vague for you to be a effective assistant.
        For example, if the user says that they want to get work done, you should use CLARIFY and ask them what kind of work they want to get done.
        For example, If the user says that they want to complete a task, you should use CLARIFY to obtain more details about the task so that you can accurately determine if what the user is viewing on their screen is related to their task.
        You want to get enough context so that when you observe the user's screen, you can confidently determine if it is related to their task.`
      : `You should use SET_TASK if it is clear that the user wishes to change the task they are working on.
        ${memoryEnabled ? updateMemoryChoiceInfo : ''}
        You should only use CLARIFY if you don't have enough information to do either of those, or if what the user provided is too vague for you to be a effective assistant.
        Use RESPOND if you are sure none of the other options are appropriate.`;

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
          content: [{ type: 'text', text: prompt }],
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

      const estimatedSpeechDuration = content.split(' ').length * 450 + 2000; // assume 0.45 seconds per word, plus 2 second buffer

      if (action === 'SET_TASK') {
        this.clappy.memory.setUserTask(content);

        this.clappy.mainWindow?.webContents.send(
          'open-popup-interact',
          ClappyExpression.ThumbsUp,
          "Thanks for letting me know what you're working on! I'll try to help you stay on task.",
          estimatedSpeechDuration,
        );
        this.conversationHistory.push(`Clappy: Thanks for letting me know what you're working on! I'll try to help you stay on task.`);
        this.lastMessageSentTimestamp = Date.now() - 30 * 1000; // when a conversation finishes, expire conversation history faster
      } else if (action === 'UPDATE_MEMORY') {
        this.clappy.memory.replaceMemory(content);

        this.clappy.mainWindow?.webContents.send(
          'open-popup-interact',
          ClappyExpression.Happy,
          "Thanks for letting me know - I'll remember that.",
          estimatedSpeechDuration,
        );
        this.conversationHistory.push(`Clappy: Thanks for letting me know - I'll remember that.`);
        this.lastMessageSentTimestamp = Date.now() - 30 * 1000; // when a conversation finishes, expire conversation history faster
      } else if (action === 'CLARIFY') {
        this.clappy.mainWindow?.webContents.send('open-popup-interact', ClappyExpression.Thinking, content, estimatedSpeechDuration + 10000);
        this.conversationHistory.push(`Clappy: ${content}`);
      } else if (action === 'RESPOND') {
        this.clappy.mainWindow?.webContents.send('open-popup-interact', ClappyExpression.Happy, content, estimatedSpeechDuration + 10000);
        this.conversationHistory.push(`Clappy: ${content}`);
      }
    }
  }

  async startVoiceInteraction(): Promise<void> {
    this.clappy.mainWindow?.webContents.send('open-popup-interact', ClappyExpression.OffersMicrophone, 'listening...');

    console.log('[VOICE] Starting voice interaction');
    const audioPath = await recordAudio(this.clappy, 15, true);
    console.log('[VOICE] Finished recording audio:', audioPath);
    const transcription = await transcribeAudio(audioPath);
    console.log('[VOICE] Transcription:', transcription);

    await this.handleTextInteraction(transcription, 'speech');
  }
}
