import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

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
