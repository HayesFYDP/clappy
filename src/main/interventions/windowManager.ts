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
      // set a timeout for the request to prevent the app from hanging
      const timeout = setTimeout(() => {
        this.pythonApp.removeListener('message', () => {});
        this.pythonApp.removeListener('stderr', () => {});
        reject(new Error('Python helper took too long to respond. It may be frozen.'));
      }, 2000);

      // if the Python script raises an exception, we should reject the promise
      this.pythonApp.once('stderr', (err: Error) => {
        clearTimeout(timeout);
        this.pythonApp.removeListener('message', () => {});
        if (err) {
          reject(err);
        }
      });

      // we assume that the response will be of the correct type and don't validate it
      this.pythonApp.once('message', (message: IPCResponseType<T>) => {
        clearTimeout(timeout);
        this.pythonApp.removeListener('stderr', () => {});
        resolve(message);
      });

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
  async focusWindow(handle: number): Promise<IPCResponseType<FocusWindowRequest>> {
    const req: FocusWindowRequest = {
      type: WindowIPCType.FOCUS_WINDOW,
      payload: { handle },
    };

    return this.sendIPC<FocusWindowRequest>(req);
  }

  // Minimize the window with the given handle. If no handle is provided, minimize the active window.
  async minimizeWindow(handle?: number): Promise<IPCResponseType<MinimizeWindowRequest>> {
    const req: MinimizeWindowRequest = {
      type: WindowIPCType.MINIMIZE_WINDOW,
      payload: { handle },
    };

    return this.sendIPC<MinimizeWindowRequest>(req);
  }

  // Shake the window with the given handle. If no handle is provided, shake the active window.
  async shakeWindow(handle?: number): Promise<IPCResponseType<ShakeWindowRequest>> {
    const req: ShakeWindowRequest = {
      type: WindowIPCType.SHAKE_WINDOW,
      payload: { handle },
    };

    return this.sendIPC<ShakeWindowRequest>(req);
  }
}

export default WindowManager;
