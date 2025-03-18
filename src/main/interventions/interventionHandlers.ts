import WindowInterventionHandler from "./windowInterventionHandler";
import PopupClappyInterventionHandler from "./popupClappyInterventionHandler";
import SpeechInterventionHandler from "./speechInterventionHandler";
import { InterventionHandlerConstructor } from "./types";

const INTERVENTION_HANDLERS: InterventionHandlerConstructor[] = [
  WindowInterventionHandler,
  PopupClappyInterventionHandler,
  SpeechInterventionHandler
] as const;

export default INTERVENTION_HANDLERS;
