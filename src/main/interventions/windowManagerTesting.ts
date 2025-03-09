/* standalone script to make it easier to test windowManager functionality separately */

import WindowManager from './windowManager';

async function run() {
  const wm = new WindowManager();
  const allWindows = await wm.listWindows();
  console.log(allWindows);

  const someOtherWindow = allWindows.windows.find((w) => w.isFocused === false);
  if (someOtherWindow) {
    // ignore type error for testinig
    await wm.focusWindow(someOtherWindow.id);
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });

    await wm.minimizeWindow(someOtherWindow.id);
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });

    await wm.focusWindow(someOtherWindow.id);
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });

    await wm.shakeWindow(someOtherWindow.id);
  }
}

run().catch(console.error);
