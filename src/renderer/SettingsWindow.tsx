import { useState, useEffect, useRef } from 'react';
import './SettingsWindow.css';
import DefaultSettings from './DefaultSettings';

const STORAGE_KEY = 'clappy_settings';

const getStoredSettings = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DefaultSettings));
    return DefaultSettings;
  }

  const storedSettings = JSON.parse(stored);

  const mergedSettings = DefaultSettings.map((defaultSetting) => {
    const storedSetting = storedSettings.find(
      (s) =>
        s.category === defaultSetting.category &&
        s.type === defaultSetting.type &&
        (s.options?.toString() === defaultSetting.options?.toString() || JSON.stringify(s.items) === JSON.stringify(defaultSetting.items)),
    );

    if (!storedSetting) return defaultSetting;

    if (defaultSetting.type === 'list' && typeof defaultSetting.items === 'object') {
      const mergedItems = {};
      Object.keys(defaultSetting.items).forEach((key) => {
        if (storedSetting.items?.hasOwnProperty(key)) {
          mergedItems[key] = storedSetting.items[key];
        } else {
          mergedItems[key] = defaultSetting.items[key];
        }
      });
      return { ...defaultSetting, items: mergedItems };
    }

    return { ...defaultSetting, value: storedSetting.value, values: storedSetting.values };
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedSettings));
  return mergedSettings;
};

const GeneralIcon = () => (
  <svg
    className="clappy-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const CommunicationIcon = () => (
  <svg
    className="clappy-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const BlacklistIcon = () => (
  <svg
    className="clappy-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  </svg>
);

const PermissionsIcon = () => (
  <svg
    className="clappy-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Communication':
      return <CommunicationIcon />;
    case 'Blacklist':
      return <BlacklistIcon />;
    case 'Permissions':
      return <PermissionsIcon />;
    default:
      return <GeneralIcon />;
  }
};

export default function ClappySettingsWindow() {
  const [settings, setSettings] = useState(getStoredSettings());
  const [tempSettings, setTempSettings] = useState(JSON.parse(JSON.stringify(settings)));
  const [originalTempSettings, setOriginalTempSettings] = useState(JSON.parse(JSON.stringify(settings)));
  const [changedSettings, setChangedSettings] = useState(new Set());
  const [changedItems, setChangedItems] = useState(new Set());
  const [newItems, setNewItems] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);
  const [saveIndicator, setSaveIndicator] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const headerRef = useRef(null);

  useEffect(() => {
    if (settings.length > 0 && !activeCategory) {
      setActiveCategory(settings[0].category);
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const detectChangedCategories = () => {
      const changed = new Set();
      const changedSettingItems = new Set();

      tempSettings.forEach((setting, index) => {
        const original = originalTempSettings[index];

        if (setting.type === 'dropdown' && setting.value !== original.value) {
          changed.add(setting.category);
          changedSettingItems.add(`${setting.category}-dropdown`);
        } else if (setting.type === 'checkbox' && Array.isArray(setting.values)) {
          if (JSON.stringify(setting.values) !== JSON.stringify(original.values)) {
            changed.add(setting.category);

            setting.options.forEach((option) => {
              const originalHasOption = original.values.includes(option);
              const currentHasOption = setting.values.includes(option);

              if (originalHasOption !== currentHasOption) {
                changedSettingItems.add(`${setting.category}-${option}`);
              }
            });
          }
        } else if (setting.type === 'list' && typeof setting.items === 'object') {
          const originalItems = original.items || {};
          const currentItems = setting.items || {};

          Object.keys({ ...originalItems, ...currentItems }).forEach((subCategory) => {
            const originalSubItems = originalItems[subCategory] || [];
            const currentSubItems = currentItems[subCategory] || [];

            if (JSON.stringify(originalSubItems) !== JSON.stringify(currentSubItems)) {
              changed.add(setting.category);
              changedSettingItems.add(`${setting.category}-${subCategory}`);
            }
          });
        }
      });

      setChangedSettings(changed);
      setChangedItems(changedSettingItems);
    };

    detectChangedCategories();
  }, [tempSettings, originalTempSettings]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragging && headerRef.current) {
        setPosition({
          x: position.x + e.movementX,
          y: position.y + e.movementY,
        });
      }
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, position]);

  const handleMouseDown = (e) => {
    if (headerRef.current && headerRef.current.contains(e.target)) {
      setDragging(true);
    }
  };

  const updateSetting = (category, newValue) => {
    setTempSettings((prev) => prev.map((setting) => (setting.category === category ? { ...setting, value: newValue } : setting)));
  };

  const removeListItem = (category, subCategory, index) => {
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

  const toggleOption = (category, option) => {
    setTempSettings((prev) =>
      prev.map((setting) =>
        setting.category === category && Array.isArray(setting.values)
          ? {
              ...setting,
              values: setting.values.includes(option) ? setting.values.filter((item) => item !== option) : [...setting.values, option],
            }
          : setting,
      ),
    );
  };

  const handleCloseSettings = () => {
    window.close();
    console.log('Close settings window');
  };

  const saveChanges = () => {
    console.log('Applying settings:', tempSettings);
    setSettings(tempSettings);
    setOriginalTempSettings(JSON.parse(JSON.stringify(tempSettings)));
    setChangedSettings(new Set());
    setChangedItems(new Set());

    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2000);
  };

  const categories = [...new Set(tempSettings.map((setting) => setting.category))];

  const changedCount = changedSettings.size;

  return (
    <div className="clappy-settings">
      <div className="clappy-settings-window">
        <div className="clappy-header-container" ref={headerRef} onMouseDown={handleMouseDown}>
          <div className="clappy-settings-header">Settings</div>
          <button className="clappy-close-button" onClick={handleCloseSettings}>
            ×
          </button>
        </div>

        <div className="clappy-content-container">
          <div className="clappy-settings-navigation">
            <div className="clappy-nav-items">
              {categories.map((category) => (
                <div
                  key={category}
                  className={`clappy-nav-item ${activeCategory === category ? 'clappy-active' : ''} ${
                    changedSettings.has(category) ? 'clappy-changed-nav' : ''
                  }`}
                  onClick={() => setActiveCategory(category)}
                >
                  {getCategoryIcon(category)}
                  {category}
                </div>
              ))}
            </div>

            {changedCount > 0 && (
              <div className="clappy-save-container">
                {saveIndicator ? (
                  <div className="clappy-save-indicator">Settings saved!</div>
                ) : (
                  <div className="clappy-save-count">
                    {changedCount} change{changedCount > 1 ? 's' : ''}
                  </div>
                )}
                <button className="clappy-save-button" onClick={saveChanges}>
                  Save changes
                </button>
              </div>
            )}
          </div>

          <div className="clappy-settings-container">
            <div className="clappy-settings-content">
              {tempSettings
                .filter((setting) => setting.category === activeCategory)
                .map((setting) => (
                  <div key={setting.category} className="clappy-setting-group">
                    {setting.type === 'dropdown' && (
                      <div
                        className={`clappy-setting-control ${changedItems.has(`${setting.category}-dropdown`) ? 'clappy-changed-item' : ''}`}
                      >
                        <label className="clappy-setting-label">{setting.category}</label>
                        <select
                          className="clappy-setting-dropdown"
                          value={setting.value}
                          onChange={(e) => updateSetting(setting.category, e.target.value)}
                        >
                          {setting.options.map((option, index) => (
                            <option key={index} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {setting.type === 'list' && setting.items && typeof setting.items === 'object' && (
                      <div className="clappy-list-section">
                        {Object.entries(setting.items).map(([subCategory, items]) => (
                          <div
                            key={subCategory}
                            className={`clappy-list-wrapper ${changedItems.has(`${setting.category}-${subCategory}`) ? 'clappy-changed-item' : ''}`}
                          >
                            <div className="clappy-setting-label">{subCategory}</div>
                            <div className="clappy-list-container">
                              {Array.isArray(items) && items.length > 0 ? (
                                items.map((item, index) => (
                                  <div key={index} className="clappy-list-item">
                                    {item}
                                    <button
                                      className="clappy-delete-button"
                                      onClick={() => removeListItem(setting.category, subCategory, index)}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="clappy-list-empty">No items added yet</div>
                              )}
                            </div>

                            <div className="clappy-list-add">
                              <input
                                type="text"
                                className="clappy-list-input"
                                placeholder={`Add new ${subCategory.toLowerCase()}`}
                                value={newItems[subCategory] || ''}
                                onChange={(e) => setNewItems({ ...newItems, [subCategory]: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && addListItem(setting.category, subCategory)}
                              />
                              <button className="clappy-add-button" onClick={() => addListItem(setting.category, subCategory)}>
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {setting.type === 'checkbox' && Array.isArray(setting.options) && (
                      <div>
                        {setting.options.map((option, index) => (
                          <div
                            key={index}
                            className={`clappy-setting-control ${changedItems.has(`${setting.category}-${option}`) ? 'clappy-changed-item' : ''}`}
                          >
                            <label className="clappy-setting-label">{option}</label>
                            <label className="clappy-toggle">
                              <input
                                type="checkbox"
                                checked={setting.values.includes(option)}
                                onChange={() => toggleOption(setting.category, option)}
                              />
                              <span className="clappy-toggle-slider"></span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
