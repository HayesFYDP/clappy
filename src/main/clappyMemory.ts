/* eslint-disable no-underscore-dangle */
import type Clappy from "./clappy";

// class to store Clappy's "memory", including both LLM managed memory and other user data
export default class ClappyMemory {
  clappy: Clappy;
  memory: string | null;
  _isEnabled: boolean;

  constructor(clappy: Clappy, isEnabled: boolean) {
    this.clappy = clappy;
    this.memory = ''; // TODO: figure out if we want default memory
    this._isEnabled = isEnabled;
  }

  // whether or not Clappy LLM based memory features are enabled
  isEnabled() {
    return this._isEnabled;
  }

  updateMemory(memory: string) {
    this.memory = memory;
  }

  // returns info about the current memory if enabled, otherwise nothing
  getMemoryInfoString() {
    if (this.isEnabled()) {
      return `\nYou have access to a memory field that persists between calls. This allows you to remember important information or patterns from previous observations.
            Here is the current memory: <${this.memory}>.
            You can update this memory with important ins/eights or patterns you observe.\n`
    }

    return '';
  }

  getMemoryResponseString() {
    if (this.isEnabled()) {
      return `, memory: <string containing all of the information you want to remember for future calls>`
    }

    return '';
  }
}
