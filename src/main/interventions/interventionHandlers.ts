import WindowInterventionHandler from "./windowInterventionHandler";
import PopupClappyInterventionHandler from "./popupClappyInterventionHandler";
import { InterventionHandlerConstructor } from "./types";

const INTERVENTION_HANDLERS: InterventionHandlerConstructor[] = [
  WindowInterventionHandler,
  PopupClappyInterventionHandler
] as const;

export default INTERVENTION_HANDLERS;
