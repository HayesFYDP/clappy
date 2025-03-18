import dotenv from 'dotenv';
import Clappy from './clappy';
import { Interventions } from './interventions/types';

dotenv.config();

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line global-require
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const IS_DEVELOPMENT = true; // TODO: Set this to false when deploying or take as an arg
// if set to true, will randomly select interventions when IS_DEVELOPMENT is true; otherwise, no interventions will be taken
const DEVELOPMENT_INTERVENTION_ENABLED = true;

const ENABLED_INTERVENTIONS = [
  // Interventions.POPUP_CLAPPY,
  // Interventions.MINIMIZE_WINDOW,
  // Interventions.SHAKE_WINDOW,
  // Interventions.FOCUS_WINDOW,
  Interventions.SPEAK_CLAPPY,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const clappy = new Clappy(ENABLED_INTERVENTIONS, IS_DEVELOPMENT, DEVELOPMENT_INTERVENTION_ENABLED);
