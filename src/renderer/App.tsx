import React from 'react';
import { FaClock } from 'react-icons/fa6';
import { IoMdSettings } from 'react-icons/io';
import { IoChatbubbleEllipses } from 'react-icons/io5';
import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import openPopup, { closeSpeechBubble } from '.';
import bufoHelloIcon from '../../assets/bufo-hello.gif';
import { ClappyExpression } from '../main/types';
import AnalyticsWindow from './AnalyticsWindow';
import './App.css';
import SettingsWindow from './SettingsWindow';
import { ClappyAnalytics } from './analyticsHistory';

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
            <span onClick={openSettings}>View settings</span>
            <button type="button" id="settings-button" onClick={openSettings}>
              <div className="button-icon">
                <IoMdSettings />
              </div>
            </button>
          </div>
          <div id="history" className={hoverClass}>
            <span>View history</span>
            <button type="button" id="history-button" onClick={openAnalytics}>
              <div className="button-icon">
                <FaClock />
              </div>
            </button>
          </div>
          {!isTextInputOpen ? (
            <div id="talk-to" className={hoverClass}>
              <span>Talk to Clappy</span>
              <button type="button" id="talk-to-button" onClick={onOpenTextInput}>
                <div className="button-icon">
                  <IoChatbubbleEllipses />
                </div>
              </button>
            </div>
          ) : (
            <div id="talk-to" className={hoverClass}>
              <span>to Clappy</span>
              <button type="button" id="talk-to-button" onClick={onOpenTextInput}>
                <span className="button-icon">
                  <IoChatbubbleEllipses />
                </span>
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
        <img src={bufoHelloIcon} alt="Character" id="main-character-image" width="100" />
      </div>
    </div>
  );
}

const dummyAnalytics: ClappyAnalytics = {
  sessions: [
    {
      date: new Date('2025-03-16'),
      productivity: [
        {
          startTime: new Date('2025-03-10T08:00:00'),
          endTime: new Date('2025-03-10T09:00:00'),
          status: 'very-productive',
        },
        {
          startTime: new Date('2025-03-10T09:30:00'),
          endTime: new Date('2025-03-10T10:30:00'),
          status: 'productive',
        },
        {
          startTime: new Date('2025-03-10T11:00:00'),
          endTime: new Date('2025-03-10T12:00:00'),
          status: 'somewhat-productive',
        },
        {
          startTime: new Date('2025-03-10T14:00:00'),
          endTime: new Date('2025-03-10T14:30:00'),
          status: 'uncertain',
        },
        {
          startTime: new Date('2025-03-10T15:00:00'),
          endTime: new Date('2025-03-10T16:00:00'),
          status: 'not-productive',
        },
      ],
      interventions: [
        { time: new Date('2025-03-10T09:45:00'), action: 'notify' },
        { time: new Date('2025-03-10T15:10:00'), action: 'minimize-window' },
      ],
    },
    {
      date: new Date('2025-03-09'),
      productivity: [
        {
          startTime: new Date('2025-03-09T07:30:00'),
          endTime: new Date('2025-03-09T08:30:00'),
          status: 'productive',
        },
        {
          startTime: new Date('2025-03-09T09:00:00'),
          endTime: new Date('2025-03-09T10:00:00'),
          status: 'somewhat-productive',
        },
        {
          startTime: new Date('2025-03-09T11:30:00'),
          endTime: new Date('2025-03-09T12:00:00'),
          status: 'very-productive',
        },
        {
          startTime: new Date('2025-03-09T13:00:00'),
          endTime: new Date('2025-03-09T14:30:00'),
          status: 'not-productive',
        },
      ],
      interventions: [{ time: new Date('2025-03-09T09:30:00'), action: 'notify' }],
    },
  ],
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
        <Route path="/settings" element={<SettingsWindow />} />
        <Route path="/analytics" element={<AnalyticsWindow analytics={dummyAnalytics} />} />
      </Routes>
    </Router>
  );
}
