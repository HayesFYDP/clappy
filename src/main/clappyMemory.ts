/* eslint-disable no-underscore-dangle */
import type Clappy from "./clappy";

const DEFAULT_USER_TASK = 'Working on a school programming assignment.';
// const DEFAULT_USER_TASK = 'The user did not provide a specific goal that they are working on, but would like to generally do productive work.';

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

    return DEFAULT_USER_TASK;
  }

  setUserTask(userTask: string) {
    this.userTask = userTask;
    console.log('[MEMORY] userTask updated to:', this.userTask);
  }

  isUserTaskSet(): boolean {
    return this.userTask !== null && this.userTask !== DEFAULT_USER_TASK;
  }

  replaceMemory(memory: string) {
    this.memory = memory;
  }

  // returns info about the current memory if enabled, otherwise nothing
  getMemoryInfoString(): string {
    if (this.isEnabled()) {
      const memoryInfo = this.memory ? `Here is the current memory: <${this.memory}>.` : 'There is currently nothing stored in memory.';

      return `You have access to a memory field that persists between calls. This allows you to remember important information or patterns from previous observations.
            ${memoryInfo}
            You can update this memory with important insights or patterns you observe. You do not need to store blacklist information in memory as it will always be given to you.`
    }

    return '';
  }

  getMemoryResponseString(): string {
    if (this.isEnabled()) {
      return `, memory: <concise string containing all of the information you want to remember for future calls>`
    }

    return '';
  }

  resetState() {
    this.memory = null;
    this.userTask = null;
    console.log('[MEMORY] reset');
  }
}
