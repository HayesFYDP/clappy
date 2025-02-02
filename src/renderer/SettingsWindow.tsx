import React from 'react';

const placeholderSettings = [
  'Enable Dark Mode',
  'Auto-Start on Boot',
  'Voice Activation Sensitivity',
  'Enable Clappy Sound Effects',
  'Adjust Clappy Transparency',
  "Customize Clappy's Appearance",
  'Enable Clappy Notifications',
  "Set Clappy's Personality",
  'Allow Clappy to Give Productivity Tips',
  'Reset Clappy to Default Settings',
];

export default function SettingsWindow() {
  return (
    <div className="settings-container">
      {/* Sticky Header */}
      <div className="settings-header">Clappy Settings</div>

      {/* Scrollable Content */}
      <div className="settings-content">
        {placeholderSettings.map((setting, index) => (
          <div key={index} className="setting-item">
            {setting}
          </div>
        ))}
      </div>
    </div>
  );
}
