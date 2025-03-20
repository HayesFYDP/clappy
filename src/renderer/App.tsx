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

  const onCancelTextInput = () => {
    openPopup(ClappyExpression.Happy, "Alright, I'll be here if you need me!"); // TODO: idk feed the response here or something
    setIsTextInputOpen(false);
  };

  const hoverClass = !isTextInputOpen ? 'hover-row' : 'hover-row-no-display';

  function autoGrow(e: { target: any }) {
    const { target } = e;

    // First, lock it to your single-line min, e.g. 24px
    const singleLineHeight = 20;
    target.style.height = `${singleLineHeight}px`;

    // Now measure the scrollHeight
    const needed = target.scrollHeight;

    // Only grow if it exceeds single-line height
    if (needed > singleLineHeight) {
      target.style.height = `${needed}px`;
    }
  }

  return (
    <div>
      <div id="popup">
        <div id="speech-bubble" />
        <div id="hover-rows">
          <div id="settings" className={hoverClass}>
            <button type="button" id="settings-button" onClick={openSettings}>
              <div className="button-icon">
                <IoMdSettings />
              </div>
              <div>View settings</div>
            </button>
          </div>
          <div id="history" className={hoverClass}>
            <button type="button" id="history-button" onClick={openAnalytics}>
              <div className="button-icon">
                <FaClock />
              </div>
              <div>View history</div>
            </button>
          </div>
          {!isTextInputOpen ? (
            <div id="talk-to" className={hoverClass}>
              <button type="button" id="talk-to-button" onClick={onOpenTextInput}>
                <div className="button-icon">
                  <IoChatbubbleEllipses />
                </div>
                <div>Talk to Clappy</div>
              </button>
            </div>
          ) : (
            <div id="talk-to" className={hoverClass}>
              <button type="button" id="talk-to-button" onClick={onOpenTextInput}>
                <span className="button-icon">
                  <IoChatbubbleEllipses />
                </span>
                <div>Type to Clappy</div>
              </button>
            </div>
          )}
          {isTextInputOpen && (
            <div id="text-input-wrapper">
              <textarea id="bubble-textarea" placeholder="Type a reply to Clappy..." onInput={autoGrow} />
              <div className="flex-row-div">
                <button type="button" className="text-input-button" onClick={onSendTextInput}>
                  Send
                </button>
                <button type="button" id="cancel-button" className="text-input-button" onClick={onCancelTextInput}>
                  Cancel
                </button>
              </div>
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
      date: new Date('2025-03-20T00:00:00-05:00'), // March 20th in EST
      productivity: [
        {
          startTime: new Date('2025-03-20T07:30:00-05:00'), // 7:30 AM EST
          endTime: new Date('2025-03-20T08:30:00-05:00'), // 8:30 AM EST
          status: 'productive',
        },
        {
          startTime: new Date('2025-03-20T09:00:00-05:00'), // 9:00 AM EST
          endTime: new Date('2025-03-20T10:00:00-05:00'), // 10:00 AM EST
          status: 'very-productive',
        },
        {
          startTime: new Date('2025-03-20T11:00:00-05:00'), // 11:00 AM EST
          endTime: new Date('2025-03-20T12:00:00-05:00'), // 12:00 PM EST
          status: 'somewhat-productive',
        },
        {
          startTime: new Date('2025-03-20T13:30:00-05:00'), // 1:30 PM EST
          endTime: new Date('2025-03-20T14:30:00-05:00'), // 2:30 PM EST
          status: 'uncertain',
        },
        {
          startTime: new Date('2025-03-20T15:30:00-05:00'), // 3:30 PM EST
          endTime: new Date('2025-03-20T16:30:00-05:00'), // 4:30 PM EST
          status: 'not-productive',
        },
      ],
      interventions: [
        { time: new Date('2025-03-20T08:15:00-05:00'), action: 'notify' as const }, // Notification in the morning
        { time: new Date('2025-03-20T12:30:00-05:00'), action: 'minimize-window' as const }, // Minimize in the afternoon
      ],
    },
    {
      date: new Date('2025-03-10T00:00:00-05:00'), // EST
      productivity: [
        {
          startTime: new Date('2025-03-10T08:00:00-05:00'),
          endTime: new Date('2025-03-10T09:00:00-05:00'),
          status: 'very-productive',
        },
        {
          startTime: new Date('2025-03-10T09:30:00-05:00'),
          endTime: new Date('2025-03-10T10:30:00-05:00'),
          status: 'productive',
        },
        {
          startTime: new Date('2025-03-10T11:00:00-05:00'),
          endTime: new Date('2025-03-10T12:00:00-05:00'),
          status: 'somewhat-productive',
        },
        {
          startTime: new Date('2025-03-10T14:00:00-05:00'),
          endTime: new Date('2025-03-10T14:30:00-05:00'),
          status: 'uncertain',
        },
        {
          startTime: new Date('2025-03-10T15:00:00-05:00'),
          endTime: new Date('2025-03-10T16:00:00-05:00'),
          status: 'not-productive',
        },
      ],
      interventions: [
        { time: new Date('2025-03-10T09:45:00-05:00'), action: 'notify' as const },
        { time: new Date('2025-03-10T15:10:00-05:00'), action: 'minimize-window' as const },
      ],
    },
    {
      date: new Date('2025-03-09T00:00:00-05:00'), // EST
      productivity: [
        {
          startTime: new Date('2025-03-09T07:30:00-05:00'),
          endTime: new Date('2025-03-09T08:30:00-05:00'),
          status: 'productive',
        },
        {
          startTime: new Date('2025-03-09T09:00:00-05:00'),
          endTime: new Date('2025-03-09T10:00:00-05:00'),
          status: 'somewhat-productive',
        },
        {
          startTime: new Date('2025-03-09T11:30:00-05:00'),
          endTime: new Date('2025-03-09T12:00:00-05:00'),
          status: 'very-productive',
        },
        {
          startTime: new Date('2025-03-09T13:00:00-05:00'),
          endTime: new Date('2025-03-09T14:30:00-05:00'),
          status: 'not-productive',
        },
      ],
      interventions: [{ time: new Date('2025-03-09T09:30:00-05:00'), action: 'notify' as const }],
    },
    {
      date: new Date('2025-03-17T00:00:00-05:00'), // March 17th in EST
      productivity: [
        {
          startTime: new Date('2025-03-17T08:00:00-05:00'),
          endTime: new Date('2025-03-17T09:30:00-05:00'),
          status: 'very-productive',
        },
        {
          startTime: new Date('2025-03-17T10:00:00-05:00'),
          endTime: new Date('2025-03-17T11:00:00-05:00'),
          status: 'productive',
        },
        {
          startTime: new Date('2025-03-17T13:30:00-05:00'),
          endTime: new Date('2025-03-17T14:30:00-05:00'),
          status: 'somewhat-productive',
        },
      ],
      interventions: [{ time: new Date('2025-03-17T10:15:00-05:00'), action: 'notify' as const }],
    },
    {
      date: new Date('2025-03-18T00:00:00-05:00'), // March 18th in EST
      productivity: [
        {
          startTime: new Date('2025-03-18T07:30:00-05:00'),
          endTime: new Date('2025-03-18T08:30:00-05:00'),
          status: 'productive',
        },
        {
          startTime: new Date('2025-03-18T09:45:00-05:00'),
          endTime: new Date('2025-03-18T10:45:00-05:00'),
          status: 'very-productive',
        },
        {
          startTime: new Date('2025-03-18T15:00:00-05:00'),
          endTime: new Date('2025-03-18T16:00:00-05:00'),
          status: 'not-productive',
        },
      ],
      interventions: [{ time: new Date('2025-03-18T09:50:00-05:00'), action: 'minimize-window' as const }],
    },
    {
      date: new Date('2025-03-19T00:00:00-05:00'), // March 19th in EST
      productivity: [
        {
          startTime: new Date('2025-03-19T08:00:00-05:00'),
          endTime: new Date('2025-03-19T09:00:00-05:00'),
          status: 'very-productive',
        },
        {
          startTime: new Date('2025-03-19T11:00:00-05:00'),
          endTime: new Date('2025-03-19T12:00:00-05:00'),
          status: 'productive',
        },
        {
          startTime: new Date('2025-03-19T14:30:00-05:00'),
          endTime: new Date('2025-03-19T15:30:00-05:00'),
          status: 'somewhat-productive',
        },
      ],
      interventions: [{ time: new Date('2025-03-19T12:10:00-05:00'), action: 'notify' as const }],
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
