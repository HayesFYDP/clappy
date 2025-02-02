import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import smiskiIcon from '../../assets/smiski.png';
import './App.css';

function Hello() {
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
            <button type="button" id="talk-to-button">
              💬
            </button>
          </div>
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
