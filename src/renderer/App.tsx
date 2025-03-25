import React, { useEffect, useState } from 'react';
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

  const [isTextInputOpen, setIsTextInputOpen] = useState(false);

  const onOpenTextInput = () => {
    closeSpeechBubble();
    openPopup(ClappyExpression.Happy, "waiting for your message..."); // TODO: idk feed the response here or something
    setIsTextInputOpen(true);
  };

  const onSendTextInput = () => {
    const textArea = document.getElementById('bubble-textarea') as HTMLTextAreaElement;
    const message = textArea.value;

    if (message.trim() === '') {
      openPopup(ClappyExpression.Happy, "Did you forget to type something?");
      return;
    }

    window.electron.ipcRenderer.sendMessage('send-text-interaction', message);

    setIsTextInputOpen(false);
  };

  const onCancelTextInput = () => {
    openPopup(ClappyExpression.Happy, "Alright, I'll be here if you need me!", 5000); // TODO: idk feed the response here or something
    setIsTextInputOpen(false);
  };

  useEffect(() => {
    // add event listener to close the text input when the user presses the escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isTextInputOpen) {
        onCancelTextInput();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // add event listener to the input textarea to submit when the user presses enter, unless shift is pressed
    const textArea = document.getElementById('bubble-textarea');
    const handleTextEnter = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevent the default behavior of adding a new line
        onSendTextInput();
      }
    };

    if (textArea) {
      textArea.addEventListener('keydown', handleTextEnter);
    }

    return () => {
      // Clean up the event listeners when component unmounts
      window.removeEventListener('keydown', handleKeyDown);
      if (textArea) {
        textArea.removeEventListener('keydown', handleTextEnter);
      }
    };
  }, [isTextInputOpen]); // Only re-attach when isTextInputOpen changes

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
