import type Clappy from "./clappy";

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
}
