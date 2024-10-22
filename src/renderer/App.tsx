import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import smiskiIcon from '../../assets/smiski.png';
import './App.css';

function Hello() {
  return (
    <div>
      <div id="popup">
        <div id="settings">
          <button type="button" id="settings-button">
            ⚙️
          </button>
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
