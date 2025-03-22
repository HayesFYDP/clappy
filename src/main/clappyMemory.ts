/* eslint-disable no-underscore-dangle */
import type Clappy from "./clappy";

// class to interact with Clappy's "memory", including both LLM managed memory and other user data
export default class ClappyMemory {
  clappy: Clappy;
  userTask: string | null;
  memory: string | null;
  _isEnabled: boolean;

  constructor(clappy: Clappy, isEnabled: boolean) {
    this.clappy = clappy;
    this.memory = null;
    this.userTask = null;
    this._isEnabled = isEnabled;
  }

  // whether or not Clappy LLM based memory features are enabled
  isEnabled() {
    return this._isEnabled;
  }

  getUserTask(): string {
    if (this.userTask) {
      return this.userTask;
    }
    return 'Working on a school programming assignment.';
    // return 'The user did not provide a specific goal that they are working on, but would like to generally do productive work.';
  }

  replaceMemory(memory: string) {
    this.memory = memory;
  }

  // returns info about the current memory if enabled, otherwise nothing
  getMemoryInfoString(): string {
    console.log('[getMemoryInfoString content]', this.memory);

    const memoryInfo = this.memory ? `Here is the current memory: <${this.memory}>` : 'There is currently nothing stored in memory.';

    if (this.isEnabled()) {
      return `You have access to a memory field that persists between calls. This allows you to remember important information or patterns from previous observations.
            Here is the current memory: <${memoryInfo}>.
            You can update this memory with important insights or patterns you observe.`
    }

    return '';
  }

  getMemoryResponseString(): string {
    if (this.isEnabled()) {
      return `, memory: <concise string containing all of the information you want to remember for future calls>`
    }

    return '';
  }
}
