/* standalone script to make it easier to test windowManager functionality separately */

import WindowManager from './windowManager';

async function run() {
  const wm = new WindowManager();
  const response = await wm.listWindows();
  console.log(response);
}

run().catch(console.error);
