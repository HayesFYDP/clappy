import React from 'react';
import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import openPopup, { closeSpeechBubble } from '.';
import smiskiIcon from '../../assets/smiski.png';
import { ClappyExpression } from '../main/types';
import AnalyticsWindow from './AnalyticsWindow';
import './App.css';
import SettingsWindow from './SettingsWindow';

function Hello() {
  const openSettings = () => {
    window.electron.ipcRenderer.sendMessage('open-settings-window');
  };

  const openAnalytics = () => {
    window.electron.ipcRenderer.sendMessage('open-analytics-window');
  };

  const [isTextInputOpen, setIsTextInputOpen] = React.useState(false);

  const onOpenTextInput = () => {
    closeSpeechBubble();
    openPopup(ClappyExpression.Happy, "I'm listening..."); // TODO: idk feed the response here or something
    setIsTextInputOpen(true);
  };

  const onSendTextInput = () => {
    openPopup(ClappyExpression.Happy, "I see! I'll remember that!"); // TODO: idk feed the response here or something
    setIsTextInputOpen(false);
  };

  const hoverClass = !isTextInputOpen ? 'hover-row' : 'hover-row-no-display';

  return (
    <div>
      <div id="popup">
        <div id="speech-bubble" />
        <div id="hover-rows">
          <div id="settings" className={hoverClass}>
            <span>View settings</span>
            <button type="button" id="settings-button" onClick={openSettings}>
              ⚙️
            </button>
          </div>
          <div id="history" className={hoverClass}>
            <span>View history</span>
            <button type="button" id="history-button" onClick={openAnalytics}>
              🕰️
            </button>
          </div>
          {!isTextInputOpen ? (
            <div id="talk-to" className={hoverClass}>
              <span>Talk to Clappy</span>
              <button type="button" id="talk-to-button" onClick={onOpenTextInput}>
                💬
              </button>
            </div>
          ) : (
            <div id="talk-to" className={hoverClass}>
              <span>to Clappy</span>
              <button type="button" id="talk-to-button" onClick={onOpenTextInput}>
                💬
              </button>
            </div>
          )}
          {isTextInputOpen && (
            <div id="text-input-container">
              <input type="text" id="text-input-field" placeholder="Type a reply to Clappy..." />
              <button type="button" id="text-input-button" onClick={onSendTextInput}>
                Send
              </button>
            </div>
          )}
        </div>
        <img src={smiskiIcon} alt="Character" id="main-character-image" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
        <Route path="/settings" element={<SettingsWindow />} />
        <Route path="/analytics" element={<AnalyticsWindow />} />
      </Routes>
    </Router>
  );
}
