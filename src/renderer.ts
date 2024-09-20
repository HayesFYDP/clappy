import { ipcRenderer } from 'electron';

const visual = document.getElementById('visual') as HTMLElement;

// Listen for the toggle-visual message from the main process
ipcRenderer.on('toggle-visual', () => {
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