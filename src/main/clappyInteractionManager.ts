import type Clappy from "./clappy";
import { recordAudio, transcribeAudio } from "./speechUtil";

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

  async handleTextInteraction(text: string): Promise<void> {
    console.log('[TEXT] Received text message: ', text);
  };

  async startVoiceInteraction(): Promise<void> {
    this.clappy.mainWindow?.webContents.send('toggle-popup-voice');

    console.log('[VOICE] Starting voice interaction');
    const audioPath = await recordAudio(this.clappy, 15, true);
    console.log('[VOICE] Finished recording audio:', audioPath);
    const transcription = await transcribeAudio(audioPath);
    console.log('[VOICE] Transcription:', transcription);
  };
}
