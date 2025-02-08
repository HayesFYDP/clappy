import { useState, useEffect } from 'react';
import './SettingsWindow.css';
import DefaultSettings from './DefaultSettings';

const STORAGE_KEY = 'clappy_settings';

const getStoredSettings = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : DefaultSettings;
};

export default function SettingsWindow() {
  const [settings, setSettings] = useState(getStoredSettings());
  const [tempSettings, setTempSettings] = useState(JSON.parse(JSON.stringify(settings)));
  const [changedSettings, setChangedSettings] = useState(new Set());
  const [newItems, setNewItems] = useState({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const markChanged = (category) => {
    setChangedSettings((prev) => new Set([...prev, category]));
  };

  const updateSetting = (category, newValue) => {
    markChanged(category);
    setTempSettings((prev) =>
      prev.map((setting) => (setting.category === category ? { ...setting, value: newValue } : setting)),
    );
  };

  const removeListItem = (category, subCategory, index) => {
    markChanged(category);
    setTempSettings((prev) =>
      prev.map((setting) =>
        setting.category === category && typeof setting.items === 'object'
          ? {
              ...setting,
              items: {
                ...setting.items,
                [subCategory]: setting.items[subCategory].filter((_, i) => i !== index),
              },
            }
          : setting,
      ),
    );
  };

  const addListItem = (category, subCategory) => {
    if (!newItems[subCategory]?.trim()) return;

    markChanged(category);
    setTempSettings((prev) =>
      prev.map((setting) =>
        setting.category === category && typeof setting.items === 'object'
          ? {
              ...setting,
              items: {
                ...setting.items,
                [subCategory]: [...(setting.items[subCategory] || []), newItems[subCategory].trim()],
              },
            }
          : setting,
      ),
    );

    setNewItems((prev) => ({
      ...prev,
      [subCategory]: '',
    }));
  };

  const toggleCheckbox = (category, option) => {
    markChanged(category);
    setTempSettings((prev) =>
      prev.map((setting) =>
        setting.category === category && Array.isArray(setting.values)
          ? {
              ...setting,
              values: setting.values.includes(option)
                ? setting.values.filter((item) => item !== option)
                : [...setting.values, option],
            }
          : setting,
      ),
    );
  };

  const saveChanges = () => {
    console.log('Applying settings:', tempSettings);
    setSettings(tempSettings);
    setChangedSettings(new Set());
  };

  return (
    <div className="settings-container">
      <div className="header-container">
        <div className="settings-header">Clappy Settings</div>
        <button className="save-button" onClick={saveChanges}>
          save changes?
        </button>
      </div>

      <div className="settings-content">
        {tempSettings.map((setting) => (
          <div
            key={setting.category}
            className={`setting-group ${changedSettings.has(setting.category) ? 'changed' : ''}`}
          >
            <label className="setting-label">{setting.category}</label>

            {/* Dropdown */}
            {setting.type === 'dropdown' && (
              <select
                className="setting-dropdown"
                value={setting.value}
                onChange={(e) => updateSetting(setting.category, e.target.value)}
              >
                {setting.options.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {/* List */}
            {setting.type === 'list' && setting.items && typeof setting.items === 'object' && (
              <div className="list-section">
                <div className="list-container">
                  <div className="list-textarea">
                    {Object.entries(setting.items).map(([subCategory, items]) => (
                      <div key={subCategory} className="list-group">
                        <span className="list-title">{subCategory}</span>
                        {items.map((item, index) => (
                          <div key={index} className="list-item">
                            <button
                              className="delete-button"
                              onClick={() => removeListItem(setting.category, subCategory, index)}
                            >
                              X
                            </button>
                            {item}
                          </div>
                        ))}

                        <div className="list-add">
                          <input
                            type="text"
                            className="list-input"
                            placeholder={`Add new ${subCategory.toLowerCase()}`}
                            value={newItems[subCategory] || ''}
                            onChange={(e) => setNewItems({ ...newItems, [subCategory]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && addListItem(setting.category, subCategory)}
                          />
                          <button className="add-button" onClick={() => addListItem(setting.category, subCategory)}>
                            ADD
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Checkbox */}
            {setting.type === 'checkbox' && Array.isArray(setting.options) && (
              <div className="checkbox-group">
                {setting.options.map((option, index) => (
                  <label key={index} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={setting.values.includes(option)}
                      onChange={() => toggleCheckbox(setting.category, option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
