import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);

// Listen for the toggle-visual message from the main process
window.electron.ipcRenderer.on('toggle-visual', () => {
  const visual = document.getElementById('visual') as HTMLElement;
  if (visual.style.display === 'none' || !visual.classList.contains('visible')) {
    visual.style.display = 'block';
    visual.classList.add('visible');
  } else {
    visual.classList.remove('visible');
    setTimeout(() => {
      visual.style.display = 'none';
    }, 500); // Wait for the transition before hiding
  }
});