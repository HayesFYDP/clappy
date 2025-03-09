/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* standalone script to make it easier to test windowManager functionality separately */

import * as readline from 'readline';
import WindowManager from './windowManager';

async function run() {
  const wm = new WindowManager();

  // Create readline interface for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Helper function to get user input
  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve);
    });
  };

  // Main loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      console.log('\n========================================');
      // 1. List all windows with numbers
      const allWindows = await wm.listWindows();
      console.log('Available Windows:');

      allWindows.windows.forEach((window, index) => {
        const shortExecPath = window.executablePath.split('\\').pop();

        console.log(`[${index}] ${shortExecPath}: ${window.title} ${window.isFocused ? '(focused)' : ''}`);
      });

      // 2. Display menu options
      console.log('\nOptions:');
      console.log('1. Focus window');
      console.log('2. Minimize window');
      console.log('3. Shake window');
      console.log('4. Exit');

      // 3. Ask for user choice
      const choice = await question('\nSelect an option (1-4): ');

      if (choice === '4') {
        console.log('Exiting...');
        break;
      }

      // For options 1-3, get window number
      if (['1', '2', '3'].includes(choice)) {
        const windowIndex = parseInt(await question('Enter window number: '), 10);

        if (Number.isNaN(windowIndex) || windowIndex < 0 || windowIndex >= allWindows.windows.length) {
          console.log('Invalid window number. Please try again.');
          continue;
        }

        const selectedWindow = allWindows.windows[windowIndex];

        // Execute selected action
        switch (choice) {
          case '1':
            console.log(`Focusing window: ${selectedWindow.title}`);
            await wm.focusWindow(selectedWindow.id);
            break;
          case '2':
            console.log(`Minimizing window: ${selectedWindow.title}`);
            await wm.minimizeWindow(selectedWindow.id);
            break;
          case '3':
            console.log(`Shaking window: ${selectedWindow.title}`);
            await wm.shakeWindow(selectedWindow.id);
            break;
          default:
            console.log('Invalid option. Please choose 1-4. This should never trigger.');
            continue;
        }
      } else if (choice !== '4') {
        console.log('Invalid option. Please choose 1-4.');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }

  // Close the readline interface
  rl.close();
}

run().catch(console.error);
