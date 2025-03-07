import { BrowserWindow } from "electron";
import OpenAI from 'openai';
import { ClappyExpression } from "../types";

// to create and enable a new intervention, you must add it to the ENABLED_INTERVENTIONS array in main.ts
// you also need to register your intervention handler in the INTERVENTION_HANDLERS array in interventionHandlers.ts
export enum Interventions {
  // make clappy appear on the right side of the user's screen, using an LLM to determine the expression
  POPUP_CLAPPY = 'POPUP_CLAPPY',
  // minimize the user's current active window
  MINIMIZE_WINDOW = 'MINIMIZE_WINDOW',
  // "shake" the user's current active window
  SHAKE_WINDOW = 'SHAKE_WINDOW',
  // put another window into focus, with the window being decided by an LLM
  FOCUS_WINDOW = 'FOCUS_WINDOW',
}

export type MinimizeWindowPayload = {
  windowHandle?: number; // if provided, the specific window to minimize; otherwise, minimize the active window
};

export type ShakeWindowPayload = {
  windowHandle?: number; // if provided, the specific window to shake; otherwise, shake the active window
};

export type FocusWindowPayload = {
  windowHandle: number; // if provided, the specific window to shake; otherwise, ask an LLM to determine the window to focus
};

export type PopupClappyPayload = {
  message?: string;
  expression?: ClappyExpression;
  timeoutMs?: number;
}

// Map intervention types to their payload types
export type InterventionPayloadMap = {
  [Interventions.MINIMIZE_WINDOW]: MinimizeWindowPayload;
  [Interventions.SHAKE_WINDOW]: ShakeWindowPayload;
  [Interventions.FOCUS_WINDOW]: FocusWindowPayload;
  [Interventions.POPUP_CLAPPY]: PopupClappyPayload;
};

export interface InterventionHandler {
  supportedInterventions: readonly Interventions[]; // list of interventions that this handler supports

  handleIntervention<T extends Interventions>(intervention: T, payload?: InterventionPayloadMap[T]): Promise<void>;
}

export type InterventionHandlerConstructor = new (getMainWindow:  () => BrowserWindow | null, openai: OpenAI | null) => InterventionHandler;

export function createInterventionHandler(HandlerType: InterventionHandlerConstructor, getMainWindow: () => BrowserWindow | null, openai: OpenAI | null): InterventionHandler {
  return new HandlerType(getMainWindow, openai);
}
