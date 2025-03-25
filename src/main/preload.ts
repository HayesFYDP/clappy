// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels =
  | 'open-popup-intervention'
  | 'close-popup-intervention'
  | 'toggle-popup'
  | 'open-popup-interact'
  | 'set-ignore-mouse-events'
  | 'add-mouse-event-listeners'
  | 'open-settings-window'
  | 'open-analytics-window'
  | 'popup-closed'
  | 'get-settings'
  | 'set-settings'
  | 'get-analytics'
  | 'send-text-interaction'
  | 'get-is-popup-open'
  | 'get-is-popup-open-response';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    invoke(channel: Channels, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
