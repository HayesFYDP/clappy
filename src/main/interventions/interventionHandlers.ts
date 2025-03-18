import WindowInterventionHandler from "./windowInterventionHandler";
import PopupClappyInterventionHandler from "./popupClappyInterventionHandler";
import SpeechInterventionHandler from "./speechInterventionHandler";
import { InterventionHandlerConstructor, Interventions } from "./types";

export const INTERVENTION_HANDLERS: InterventionHandlerConstructor[] = [
  WindowInterventionHandler,
  PopupClappyInterventionHandler,
  SpeechInterventionHandler
] as const;

export type InterventionHandlerMap = {
  [Interventions.MINIMIZE_WINDOW]: WindowInterventionHandler;
  [Interventions.SHAKE_WINDOW]: WindowInterventionHandler;
  [Interventions.FOCUS_WINDOW]: WindowInterventionHandler;
  [Interventions.POPUP_CLAPPY]: PopupClappyInterventionHandler;
  [Interventions.SPEAK_CLAPPY]: SpeechInterventionHandler;
}
