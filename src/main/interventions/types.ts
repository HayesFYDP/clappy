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

export interface InterventionHandler {
  supportedInterventions: readonly Interventions[]; // list of interventions that this handler supports

  handleIntervention(intervention: Interventions): Promise<void>;
}
