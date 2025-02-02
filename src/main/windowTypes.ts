type WindowInfo = {
  // the title of the window which can be used to get more context
  // for example: "windowManager.ts - clappy - Visual Studio Code"
  title: string;

  // the full path to the executable associated with the window
  // for example: "C:\\Users\\micro\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe"
  executablePath: string;
  handle: number; // used to refer to the window for future window operations
};

/* Types for IPC communication between the main process and the Python helper */
enum WindowIPCType {
  LIST_WINDOWS = 'LIST_WINDOWS',
  MINIMIZE_ACTIVE_WINDOW = 'MINIMIZE_ACTIVE_WINDOW',
  SHAKE_ACTIVE_WINDOW = 'SHAKE_ACTIVE_WINDOW',
  FOCUS_WINDOW = 'FOCUS_WINDOW',
}

type ListWindowsRequest = {
  type: WindowIPCType.LIST_WINDOWS;
  payload: {};
};

// response from a LIST_WINDOWS IPC request
type ListWindowsResponse = {
  windows: WindowInfo[];
};

type FocusWindowRequest = {
  type: WindowIPCType.FOCUS_WINDOW;
  payload: { handle: number };
};

type FocusWindowResponse = {
  success: boolean;
};

export { WindowIPCType, ListWindowsRequest, ListWindowsResponse, FocusWindowRequest, FocusWindowResponse };

/* Union types for all possible IPC requests and their responses */
type WindowIPCRequests = ListWindowsRequest | FocusWindowRequest;

type RequestToResponseMap = {
  [WindowIPCType.LIST_WINDOWS]: ListWindowsResponse;
  [WindowIPCType.FOCUS_WINDOW]: FocusWindowResponse;
};

// infer the response type based on the request type
type IPCResponseType<T extends WindowIPCRequests> = T extends { type: infer R }
  ? R extends keyof RequestToResponseMap
    ? RequestToResponseMap[R]
    : never
  : never;

export { WindowIPCRequests, IPCResponseType };
