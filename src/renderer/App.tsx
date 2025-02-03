import React from 'react';
import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import smiskiIcon from '../../assets/smiski.png';
import './App.css';

function Hello() {
  const [isTextInputOpen, setIsTextInputOpen] = React.useState(false);
  const showTextInput = () => setIsTextInputOpen(true);

  return (
    <div>
      <div id="popup">
        <div id="speech-bubble">Hi!</div>
        <div id="hover-rows">
          <div id="settings" className="hover-row">
            <span>View settings</span>
            <button type="button" id="settings-button">
              ⚙️
            </button>
          </div>
          <div id="history" className="hover-row">
            <span>View history</span>
            <button type="button" id="history-button">
              🕰️
            </button>
          </div>
          <div id="talk-to" className="hover-row">
            <span>Talk to Clappy</span>
            <button type="button" id="talk-to-button" onClick={showTextInput}>
              💬
            </button>
          </div>
          {isTextInputOpen && (
            <div id="text-input">
              <input type="text" id="text-input-field" />
              <button type="button" id="text-input-button">
                Send
              </button>
            </div>
          )}
        </div>
        <img src={smiskiIcon} alt="Character" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
