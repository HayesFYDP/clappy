import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

window.electron.ipcRenderer.on('add-mouse-event-listeners', () => {
  const popup = document.getElementById('popup');
  popup?.addEventListener('mouseenter', (): void => {
    window.electron.ipcRenderer.sendMessage('set-ignore-mouse-events', false);
  });

  popup?.addEventListener('mouseleave', (): void => {
    window.electron.ipcRenderer.sendMessage('set-ignore-mouse-events', true, { forward: true });
  });

  const settingsButton = document.getElementById('settings-button');
  settingsButton?.addEventListener('click', (): void => {
    // TODO: implement open settings window
    console.log('settings button clicked');
  });

});

// Listen for the open-popup message from the main process
window.electron.ipcRenderer.on('open-popup', (productive) => {
  const speechBubble = document.getElementById('speech-bubble') as HTMLElement;
  speechBubble.textContent = productive ? 'Good job!' : 'GET BACK TO WORK';

  const popup = document.getElementById('popup') as HTMLElement;
  popup.style.display = 'block';
  popup.classList.add('visible');
});

window.electron.ipcRenderer.on('close-popup', () => {
  const popup = document.getElementById('popup') as HTMLElement;
  popup.classList.remove('visible');
  setTimeout(() => {
    popup.style.display = 'none';
  }, 500); // Wait for the transition before hiding
});
