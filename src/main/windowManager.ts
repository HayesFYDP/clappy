import { PythonShell } from 'python-shell';
import { IPCResponseType, ListWindowsRequest, WindowIPCRequests, WindowIPCType } from './windowTypes';

class WindowManager {
  private pythonApp: PythonShell;

  constructor() {
    this.pythonApp = new PythonShell('helper.py', {
      scriptPath: 'src/python_helper',
      mode: 'json',
      pythonOptions: ['-u'], // get print results in real-time
    });
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
}

// export default WindowManager;

const wm = new WindowManager();
wm.listWindows()
  .then((response) => {
    console.log(response);
  })
  .catch((err) => {
    console.error(err);
  });
