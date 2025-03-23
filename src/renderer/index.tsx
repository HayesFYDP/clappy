import { createRoot } from 'react-dom/client';
import bufoCryingIcon from '../../assets/bufo-crying.gif';
import bufoDisappointedIcon from '../../assets/bufo-disappointed.png';
import bufoEnragedIcon from '../../assets/bufo-enraged.png';
import bufoHappyIcon from '../../assets/bufo-happy.png';
import bufoHelloIcon from '../../assets/bufo-hello.gif';
import bufoDespairIcon from '../../assets/bufo-despair.png';
import bufoSuspiciousIcon from '../../assets/bufo-suspicious.png';
import bufoOffersMicrophoneIcon from '../../assets/bufo-offers-mic.png';
import bufoThumbsUpIcon from '../../assets/bufo-thumbsup.png';
import bufoChompIcon from '../../assets/bufo-chomp.gif'; // use as speaking
import bufoThwackIcon from '../../assets/bufo-thwack.gif';
import bufoLoadingIcon from '../../assets/bufo-loading.gif';
import bufoThinkingIcon from '../../assets/bufo-thinking.png';

import { ClappyExpression } from '../main/types';
import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

let isMouseOver = false;
let openSource: 'hotkey' | 'intervention' | 'interaction' | null = null;
let activeTimeout: ReturnType<typeof setTimeout> | null = null;
let activePopupTimeout: ReturnType<typeof setTimeout> | null = null;

function closePopup(): void {
  const popup = document.getElementById('popup') as HTMLElement;
  popup.classList.remove('visible');
  setTimeout(() => {
    popup.style.display = 'none';
  }, 500); // Wait for the transition before hiding
}

// function to close the popup only if the user is not hovering over it
// this is meant to prevent the popup from closing while the user is interacting with it if it was opened by an intervention
function closeIfUserNotHovering(remainingChecks: number, checkCooldown = 200): void {
  if (activeTimeout !== null) {
    // if there is already a timeout active, don't start another one
    return;
  }

  if (remainingChecks <= 0 && !isMouseOver) {
    closePopup();
    openSource = null;
  } else if (isMouseOver) {
    // reset the countdown if the user is hovering
    activeTimeout = setTimeout(() => {
      activeTimeout = null;
      closeIfUserNotHovering(10, checkCooldown);
    }, checkCooldown);
  } else {
    activeTimeout = setTimeout(() => {
      activeTimeout = null;
      closeIfUserNotHovering(remainingChecks - 1, checkCooldown);
    }, checkCooldown);
  }
}

export default function openPopup(expression: ClappyExpression, text: string | null, removeTextTimeoutMs: number | null = null): void {
  if (activePopupTimeout) {
    clearTimeout(activePopupTimeout);
  }
  if (activeTimeout) {
    clearTimeout(activeTimeout);
    activeTimeout = null;
  }

  const speechBubble = document.getElementById('speech-bubble') as HTMLElement;
  if (text && text.length > 0) {
    speechBubble.style.display = 'block';
    speechBubble.textContent = text as string;
  } else if (openSource === 'interaction' && speechBubble?.textContent !== '') {
    // do nothing if the source is interaction as we want to leave any existing text present
  } else {
    speechBubble.style.display = 'none';
  }

  // Change Clappy image based on expression
  const clappyIcon = document.getElementById('main-character-image') as HTMLImageElement;
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
    case ClappyExpression.Chomp:
      clappyIcon.src = bufoChompIcon;
      break;
    case ClappyExpression.Thwack:
      clappyIcon.src = bufoThwackIcon
      break;
    case ClappyExpression.OffersMicrophone:
      clappyIcon.src = bufoOffersMicrophoneIcon;
      break;
    case ClappyExpression.Despair:
      clappyIcon.src = bufoDespairIcon;
      break;
    case ClappyExpression.Suspicious:
      clappyIcon.src = bufoSuspiciousIcon;
      break;
    case ClappyExpression.ThumbsUp:
      clappyIcon.src = bufoThumbsUpIcon;
      break;
    case ClappyExpression.Loading:
      clappyIcon.src = bufoLoadingIcon;
      break;
    case ClappyExpression.Thinking:
      clappyIcon.src = bufoThinkingIcon;
      break;
    default:
      clappyIcon.src = bufoHelloIcon;
  }

  const popup = document.getElementById('popup') as HTMLElement;
  popup.style.display = 'block';
  popup.classList.add('visible');

  // optional timeout to remove the text from the speech bubble after a certain amount of time has passed
  if (removeTextTimeoutMs !== null) {
    activePopupTimeout = setTimeout(() => {
      const speechBubbleNew = document.getElementById('speech-bubble') as HTMLElement;

      // double check that the text is the same to prevent changes if the content has changed in the meantime
      if (speechBubbleNew.textContent === text) {
        closeIfUserNotHovering(10, 200);
      }

      activePopupTimeout = null;
    }, removeTextTimeoutMs);
  }
}

export function closeSpeechBubble(): void {
  const speechBubble = document.getElementById('speech-bubble') as HTMLElement;
  speechBubble.style.display = 'none';
}

window.electron.ipcRenderer.on('add-mouse-event-listeners', () => {
  const popup = document.getElementById('popup');
  popup?.addEventListener('mouseenter', (): void => {
    isMouseOver = true;
    window.electron.ipcRenderer.sendMessage('set-ignore-mouse-events', false);
  });

  popup?.addEventListener('mouseleave', (): void => {
    isMouseOver = false;
    window.electron.ipcRenderer.sendMessage('set-ignore-mouse-events', true, { forward: true });
  });

  const settingsButton = document.getElementById('settings-button');
  settingsButton?.addEventListener('click', (): void => {
    // TODO: implement open settings window
  });
});

// Listen for the open-popup message from the main process
window.electron.ipcRenderer.on('open-popup-intervention', (expression, text) => {
  console.log('Received open-popup-intervention message');

  if (openSource === null) {
    openSource = 'intervention'; // track how the popup was opened to better determine when it should be closed
  }
  openPopup(expression as ClappyExpression, text as string | null);
});

window.electron.ipcRenderer.on('close-popup-intervention', () => {
  // only attempt to close the popup if it was opened by an intervention
  if (openSource === 'intervention') {
    closeIfUserNotHovering(10, 200);
  }
});

window.electron.ipcRenderer.on('toggle-popup', () => {
  const popup = document.getElementById('popup') as HTMLElement;
  if (popup.classList.contains('visible')) {
    closePopup();
    openSource = null;
  } else {
    openSource = 'hotkey';
    openPopup(ClappyExpression.Hello, '');
  }
});

window.electron.ipcRenderer.on('open-popup-interact', (expression, text, timeoutMs) => {
  openSource = 'interaction';
  openPopup(expression as ClappyExpression, text as string | null, timeoutMs as number | undefined);
});
