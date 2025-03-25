import { ClappyExpression } from '../types';
import type Clappy from '../clappy';

// to create and enable a new intervention, you must add it to the ENABLED_INTERVENTIONS array in main.ts
// you also need to register your intervention handler in the INTERVENTION_HANDLERS array in interventionHandlers.ts
export enum Interventions {
  // make clappy appear on the right side of the user's screen, using an LLM to determine the expression and message
  POPUP_CLAPPY = 'POPUP_CLAPPY',
  // "shake" the user's current active window
  SHAKE_WINDOW = 'SHAKE_WINDOW',
  // minimize the user's current active window
  MINIMIZE_WINDOW = 'MINIMIZE_WINDOW',
  // put another window into focus, with the window being decided by an LLM
  FOCUS_WINDOW = 'FOCUS_WINDOW',
  // make clappy appear on the right side of the screen and speak a message out loud
  SPEAK_CLAPPY = 'SPEAK_CLAPPY',
}

// descriptions of each intervention used for LLM reasoning, ordered from least to most intense
export const InterventionDescriptions: Record<Interventions, string> = {
  [Interventions.POPUP_CLAPPY]: "Have a character appear on the right side of the user's screen with an expression and message reminding them to be productive.",
  [Interventions.SPEAK_CLAPPY]: 'Have a character speak a message out loud reminding the user to be productive.',
  [Interventions.SHAKE_WINDOW]: "Shake the user's current active window.",
  [Interventions.MINIMIZE_WINDOW]: "Minimize the user's current active window.",
  [Interventions.FOCUS_WINDOW]: 'Put another (more productive) window into focus.',
};

type GenericInterventionPayload = {
  userTask?: string; // the task that the user is currently working on, used for LLM reasoning
  justification?: string; // justification for the intervention, used for LLM reasoning
}

export type MinimizeWindowPayload = GenericInterventionPayload & {
  windowHandle?: number; // if provided, the specific window to minimize; otherwise, minimize the active window
};

export type ShakeWindowPayload = GenericInterventionPayload &{
  windowHandle?: number; // if provided, the specific window to shake; otherwise, shake the active window
};

export type FocusWindowPayload = GenericInterventionPayload & {
  windowHandle?: number; // if provided, the specific window to shake; otherwise, ask an LLM to determine the window to focus
};

export type PopupClappyPayload = GenericInterventionPayload & {
  message?: string; // the message that Clappy will speak out loud if provided, otherwise use an LLM
  expression?: ClappyExpression; // the expression that Clappy will display if provided, otherwise use an LLM
  timeoutMs?: number;
};

export type SpeakClappyPayload = GenericInterventionPayload & {
  message?: string; // the message that Clappy will speak out loud if provided, otherwise use an LLM
};

// Map intervention types to their payload types
export type InterventionPayloadMap = {
  [Interventions.MINIMIZE_WINDOW]: MinimizeWindowPayload;
  [Interventions.SHAKE_WINDOW]: ShakeWindowPayload;
  [Interventions.FOCUS_WINDOW]: FocusWindowPayload;
  [Interventions.POPUP_CLAPPY]: PopupClappyPayload;
  [Interventions.SPEAK_CLAPPY]: SpeakClappyPayload;
};

export interface InterventionHandler {
  supportedInterventions: readonly Interventions[]; // list of interventions that this handler supports

  handleIntervention<T extends Interventions>(intervention: T, payload?: InterventionPayloadMap[T]): Promise<boolean>;
}

export type InterventionHandlerConstructor = new (clappy: Clappy) => InterventionHandler;

export function createInterventionHandler(
  HandlerType: InterventionHandlerConstructor,
  clappy: Clappy,
): InterventionHandler {
  return new HandlerType(clappy);
}
