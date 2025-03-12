import { platform } from 'node:process';
import { PythonShell } from 'python-shell';
import {
  FocusWindowRequest,
  IPCResponseType,
  ListWindowsRequest,
  MinimizeWindowRequest,
  ShakeWindowRequest,
  WindowIPCRequests,
  WindowIPCType,
} from './windowTypes';


class WindowManager {
  private pythonApp: PythonShell;

  constructor() {
    switch (platform) {
      case 'win32':
        this.pythonApp = new PythonShell('helper.py', {
          scriptPath: 'src/python_helper/windows',
          mode: 'json',
          pythonOptions: ['-u'], // get print results in real-time
        });
        break;
      case 'darwin':
        this.pythonApp = new PythonShell('helper.py', {
          scriptPath: 'src/python_helper/darwin',
          mode: 'json',
          pythonOptions: ['-u'], // get print results in real-time
        });
        break;
      default:
        throw new Error(`"${platform}" is an unsupported platform (only win32 and darwin are supported)`);
    }
  }

  private async sendIPC<T extends WindowIPCRequests>(req: WindowIPCRequests): Promise<IPCResponseType<T>> {
    return new Promise<IPCResponseType<T>>((resolve, reject) => {
      let errorMessage = '';
      let hasSeenError = false;

      // define these variables early so that they can be accessed in other handlers
      let timeout: ReturnType<typeof setTimeout>;
      let stderrHandler: (err: string) => void;

      // Handle successful message
      const messageHandler = (message: IPCResponseType<T>) => {
        clearTimeout(timeout);
        this.pythonApp.removeListener('stderr', stderrHandler);
        resolve(message);
      };

      // Collect all stderr output lines and reject if an error is seen
      stderrHandler = (err: string) => {
        errorMessage += `${err}\n`;

        // If this is the first stderr, prepare for rejection
        if (!hasSeenError) {
          hasSeenError = true;
          clearTimeout(timeout);
          this.pythonApp.removeListener('message', messageHandler);

          // Set a short timeout to collect additional stderr lines
          setTimeout(() => {
            this.pythonApp.removeListener('stderr', stderrHandler);
            reject(new Error(errorMessage.trim()));
          }, 1000); // Short delay to collect more stderr
        }
      };

      // set a timeout for the request to prevent the app from hanging
      timeout = setTimeout(() => {
        this.pythonApp.removeListener('message', messageHandler);
        this.pythonApp.removeListener('stderr', stderrHandler);
        reject(new Error('Python helper took more than 10 seconds to respond. It may be frozen.'));
      }, 10000);

      // Register listeners
      this.pythonApp.on('stderr', stderrHandler);
      this.pythonApp.once('message', messageHandler);

      // Send the request
      this.pythonApp.send(req);
    });
  }

  // List all the windows that are currently open on the desktop.
  async listWindows(): Promise<IPCResponseType<ListWindowsRequest>> {
    const req: ListWindowsRequest = {
      type: WindowIPCType.LIST_WINDOWS,
      payload: {},
    };

    return this.sendIPC<ListWindowsRequest>(req);
  }

  // Focus the window with the given handle. Handles can be obtained from the listWindows method.
  async focusWindow(id: number): Promise<IPCResponseType<FocusWindowRequest>> {
    const req: FocusWindowRequest = {
      type: WindowIPCType.FOCUS_WINDOW,
      payload: { id },
    };

    return this.sendIPC<FocusWindowRequest>(req);
  }

  // Minimize the window with the given id. If no id is provided, minimize the active window.
  async minimizeWindow(id?: number): Promise<IPCResponseType<MinimizeWindowRequest>> {
    const req: MinimizeWindowRequest = {
      type: WindowIPCType.MINIMIZE_WINDOW,
      payload: { id },
    };

    return this.sendIPC<MinimizeWindowRequest>(req);
  }

  // Shake the window with the given id. If no id is provided, shake the active window.
  async shakeWindow(id?: number): Promise<IPCResponseType<ShakeWindowRequest>> {
    const req: ShakeWindowRequest = {
      type: WindowIPCType.SHAKE_WINDOW,
      payload: { id },
    };

    return this.sendIPC<ShakeWindowRequest>(req);
  }
}

export default WindowManager;
