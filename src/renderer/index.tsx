import { createRoot } from 'react-dom/client';
import { ClappyExpression } from '../main/types';
import bufoHelloIcon from '../../assets/bufo-hello.gif';
import bufoCryingIcon from '../../assets/bufo-crying.gif';
import bufoDisappointedIcon from '../../assets/bufo-disappointed.png';
import bufoEnragedIcon from '../../assets/bufo-enraged.png';
import bufoHappyIcon from '../../assets/bufo-happy.png';
import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

function openPopup(expression: ClappyExpression, text: string | null): void {
  const speechBubble = document.getElementById('speech-bubble') as HTMLElement;
  if (text !== null && text !== undefined && text !== '') {
    speechBubble.style.display = 'block';
    speechBubble.textContent = text as string;
  } else {
    speechBubble.style.display = 'none';
  }

  // Change Clappy image based on expression
  const clappyIcon = document.getElementById('clappy-icon') as HTMLImageElement;
  switch (expression) {
    case ClappyExpression.Happy:
      clappyIcon.src = bufoHappyIcon;
      break;
    case ClappyExpression.Crying:
      clappyIcon.src = bufoCryingIcon;
      break;
    case ClappyExpression.Disappointed:
      clappyIcon.src = bufoDisappointedIcon;
      break;
    case ClappyExpression.Enraged:
      clappyIcon.src = bufoEnragedIcon;
      break;
    case ClappyExpression.Hello:
      clappyIcon.src = bufoHelloIcon;
      break;
    default:
      clappyIcon.src = bufoHelloIcon;
  }

  const popup = document.getElementById('popup') as HTMLElement;
  popup.style.display = 'block';
  popup.classList.add('visible');
}

function closePopup(): void {
  const popup = document.getElementById('popup') as HTMLElement;
  popup.classList.remove('visible');
  setTimeout(() => {
    popup.style.display = 'none';
  }, 500); // Wait for the transition before hiding
}

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
  });
});

// Listen for the open-popup message from the main process
window.electron.ipcRenderer.on('open-popup', (expression, text) => {
  openPopup(expression as ClappyExpression, text as string | null);
});

window.electron.ipcRenderer.on('close-popup', () => {
  closePopup();
});

window.electron.ipcRenderer.on('toggle-popup', () => {
  const popup = document.getElementById('popup') as HTMLElement;
  if (popup.classList.contains('visible')) {
    closePopup();
  } else {
    openPopup(ClappyExpression.Hello, 'GET BACK TO WORK');
  }
});
