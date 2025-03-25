import dotenv from 'dotenv';
import Clappy from './clappy';
import { Interventions } from './interventions/types';

dotenv.config();

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line global-require
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const IS_DEVELOPMENT = false; // TODO: Set this to false when deploying or take as an arg
// if set to true, will randomly select interventions when IS_DEVELOPMENT is true; otherwise, no interventions will be taken
const DEVELOPMENT_INTERVENTION_ENABLED = false;
const MEMORY_ENABLED = true; // whether or not to use memory - in theory we get better reasoning but it uses a lot more tokens

// these should be ordered from least to most intrusive
const ENABLED_INTERVENTIONS: Interventions[] = [
  Interventions.POPUP_CLAPPY,
  Interventions.SPEAK_CLAPPY,
  Interventions.SHAKE_WINDOW,
  Interventions.MINIMIZE_WINDOW,
  Interventions.FOCUS_WINDOW,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const clappy = new Clappy(ENABLED_INTERVENTIONS, IS_DEVELOPMENT, DEVELOPMENT_INTERVENTION_ENABLED, MEMORY_ENABLED);
