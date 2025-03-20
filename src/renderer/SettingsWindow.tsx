import { ChangeEvent, JSX, KeyboardEvent, useEffect, useState } from 'react';
import DefaultSettings, { CategoryType } from './DefaultSettings';
import { BlacklistIcon, CommunicationIcon, GeneralIcon, PermissionsIcon } from './SettingsIcons';
import './SettingsWindow.css';

/** Utility functions for transforming blacklist lists <-> DB string */
const dbListToString = (dbList: string[]): string => dbList.join(', ');

const dbStringToList = (dbString: string): string[] => dbString.split(',').map((item) => item.trim());

/** Stored shape of data (from DB or Electron) */
interface StoredSettings {
  id: number;
  communicationIsContinuousInput: boolean;
  blacklistPrograms: string;
  blacklistSites: string;
  permissionScreenshot: boolean;
  permissionMicrophone: boolean;
}

/** The local shape of each Setting in the UI */
interface DropdownSetting {
  category: CategoryType;
  type: 'dropdown';
  options: string[];
  value: string;
}

interface ListSetting {
  category: CategoryType;
  type: 'list';
  items: Record<string, string[]>;
}

interface CheckboxSetting {
  category: CategoryType;
  type: 'checkbox';
  options: string[];
  values: string[];
}

/** Union type to cover all setting variants in the UI */
type ClappySetting = DropdownSetting | ListSetting | CheckboxSetting;

/** Grab the settings from the main process (Electron) */
const getStoredSettings = async (): Promise<ClappySetting[]> => {
  const stored: StoredSettings | null = await window.electron.ipcRenderer.invoke('get-settings');
  if (!stored) return DefaultSettings;

  return [
    {
      category: 'Communication',
      type: 'dropdown',
      options: ['continuous input', 'push to talk'],
      value: stored.communicationIsContinuousInput ? 'continuous input' : 'push to talk',
    },
    {
      category: 'Blacklist',
      type: 'list',
      items: {
        Programs: dbStringToList(stored.blacklistPrograms),
        Sites: dbStringToList(stored.blacklistSites),
      },
    },
    {
      category: 'Permissions',
      type: 'checkbox',
      options: ['Take screenshots', 'Listen to user microphone'],
      values: [
        stored.permissionScreenshot ? 'Take screenshots' : '',
        stored.permissionMicrophone ? 'Listen to user microphone' : '',
      ].filter(Boolean),
    },
  ];
};

const getCategoryIcon = (category: CategoryType): JSX.Element => {
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

export default function ClappySettingsWindow(): JSX.Element {
  const [settings, setSettings] = useState<ClappySetting[]>(DefaultSettings);
  const [tempSettings, setTempSettings] = useState<ClappySetting[]>(JSON.parse(JSON.stringify(DefaultSettings)));
  const [originalTempSettings, setOriginalTempSettings] = useState<ClappySetting[]>(JSON.parse(JSON.stringify(DefaultSettings)));

  const [changedSettings, setChangedSettings] = useState<Set<string>>(new Set());
  const [changedItems, setChangedItems] = useState<Set<string>>(new Set());
  const [newItems, setNewItems] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<CategoryType | null>(null);
  const [saveIndicator, setSaveIndicator] = useState<boolean>(false);

  /** Load settings from Electron on mount */
  useEffect(() => {
    (async () => {
      try {
        const storedSettings = await getStoredSettings();
        setSettings(storedSettings);
        setTempSettings(JSON.parse(JSON.stringify(storedSettings)));
        setOriginalTempSettings(JSON.parse(JSON.stringify(storedSettings)));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    })();
  }, []);

  /** If we haven't chosen a category yet, default to the first one */
  useEffect(() => {
    if (settings.length > 0 && !activeCategory) {
      setActiveCategory(settings[0].category);
    }
  }, [activeCategory, settings]);

  /**
   * Push changes to Electron whenever `tempSettings` or `settings` change,
   * replicating the data shape used in the main process.
   */
  useEffect(() => {
    const newSettings: StoredSettings = {
      id: 1,
      communicationIsContinuousInput: true,
      blacklistPrograms: '',
      blacklistSites: '',
      permissionScreenshot: true,
      permissionMicrophone: true,
    };

    tempSettings.forEach((setting) => {
      switch (setting.category) {
        case 'Communication':
          if (setting.type === 'dropdown') {
            newSettings.communicationIsContinuousInput = setting.value === 'continuous input';
          }
          break;
        case 'Blacklist':
          if (setting.type === 'list') {
            newSettings.blacklistPrograms = dbListToString(setting.items.Programs);
            newSettings.blacklistSites = dbListToString(setting.items.Sites);
          }
          break;
        case 'Permissions':
          if (setting.type === 'checkbox') {
            newSettings.permissionScreenshot = setting.values.includes('Take Screenshots');
            newSettings.permissionMicrophone = setting.values.includes('Listen to user microphone');
          }
          break;
        default:
          break;
      }
    });

    window.electron.ipcRenderer.invoke('set-settings', newSettings);
  }, [settings]);

  /** Detect which categories and items have changed compared to originalTempSettings */
  useEffect(() => {
    const detectChangedCategories = (): void => {
      const changedCats = new Set<string>();
      const changedSettingItems = new Set<string>();

      tempSettings.forEach((setting, index) => {
        const original = originalTempSettings[index];
        if (!original) return;

        if (setting.type === 'dropdown' && original.type === 'dropdown') {
          if (setting.value !== original.value) {
            changedCats.add(setting.category);
            changedSettingItems.add(`${setting.category}-dropdown`);
          }
        }

        if (setting.type === 'checkbox' && original.type === 'checkbox') {
          if (JSON.stringify(setting.values) !== JSON.stringify(original.values)) {
            changedCats.add(setting.category);
            setting.options.forEach((option) => {
              const originalHasOption = original.values.includes(option);
              const currentHasOption = setting.values.includes(option);
              if (originalHasOption !== currentHasOption) {
                changedSettingItems.add(`${setting.category}-${option}`);
              }
            });
          }
        }

        if (setting.type === 'list' && original.type === 'list') {
          const originalItems = original.items;
          const currentItems = setting.items;

          Object.keys({ ...originalItems, ...currentItems }).forEach((sub) => {
            const origSub = originalItems[sub] || [];
            const currSub = currentItems[sub] || [];
            if (JSON.stringify(origSub) !== JSON.stringify(currSub)) {
              changedCats.add(setting.category);
              changedSettingItems.add(`${setting.category}-${sub}`);
            }
          });
        }
      });

      setChangedSettings(changedCats);
      setChangedItems(changedSettingItems);
    };

    detectChangedCategories();
  }, [tempSettings, originalTempSettings]);

  /** Update a dropdown setting */
  const updateSetting = (category: CategoryType, newValue: string) => {
    setTempSettings((prev) =>
      prev.map((setting) => (setting.category === category && setting.type === 'dropdown' ? { ...setting, value: newValue } : setting)),
    );
  };

  /** Remove an item from a list setting */
  const removeListItem = (category: CategoryType, subCategory: string, index: number) => {
    setTempSettings((prev) =>
      prev.map((setting) =>
        setting.category === category && setting.type === 'list'
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

  /** Add a new item to a list setting */
  const addListItem = (category: CategoryType, subCategory: string) => {
    const newValue = newItems[subCategory];
    if (!newValue || !newValue.trim()) return;

    setTempSettings((prev) =>
      prev.map((setting) =>
        setting.category === category && setting.type === 'list'
          ? {
              ...setting,
              items: {
                ...setting.items,
                [subCategory]: [...setting.items[subCategory], newValue.trim()].filter((item) => item.trim() !== ''),
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

  /** Toggle a checkbox option */
  const toggleOption = (category: CategoryType, option: string) => {
    setTempSettings((prev) =>
      prev.map((setting) => {
        if (setting.category === category && setting.type === 'checkbox') {
          const hasOption = setting.values.includes(option);
          return {
            ...setting,
            values: hasOption ? setting.values.filter((item) => item !== option) : [...setting.values, option],
          };
        }
        return setting;
      }),
    );
  };

  /** Finalize/sync changes into `settings` and mark everything as unmodified */
  const saveChanges = () => {
    console.log('Applying settings:', tempSettings);
    setSettings(tempSettings);
    setOriginalTempSettings(JSON.parse(JSON.stringify(tempSettings)));

    setChangedSettings(new Set());
    setChangedItems(new Set());

    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2000);
  };

  /** List of categories to render in the sidebar */
  const categories = Array.from(new Set(tempSettings.map((s) => s.category)));
  const changedCount = changedSettings.size;

  return (
    <div className="clappy-settings">
      <div className="clappy-settings-window">
        {/* Content area */}
        <div className="clappy-content-container">
          {/* Sidebar navigation */}
          <div className="clappy-settings-navigation">
            <div className="clappy-nav-items">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className={`clappy-nav-item ${
                    activeCategory === cat ? 'clappy-active' : ''
                  } ${changedSettings.has(cat) ? 'clappy-changed-nav' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveCategory(cat);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {getCategoryIcon(cat)}
                  {cat}
                </div>
              ))}
            </div>

            {changedCount === 0 && saveIndicator && (
              <div className="clappy-save-container">
                <div className="clappy-save-indicator">Settings saved!</div>
              </div>
            )}

            {/* Save changes button & indicator */}
            {changedCount > 0 && (
              <div className="clappy-save-container">
                <div className="clappy-save-count">
                  {changedCount} setting{changedCount > 1 ? 's' : ''} changed
                </div>
                <button className="clappy-save-button" onClick={saveChanges} type="button">
                  Save changes
                </button>
              </div>
            )}
          </div>

          {/* Main settings panel */}
          <div className="clappy-settings-container">
            <div className="clappy-settings-content">
              <div>
                <div className="clappy-settings-title">{activeCategory}</div>
              </div>
              {tempSettings
                .filter((setting) => setting.category === activeCategory)
                .map((setting) => {
                  if (setting.type === 'dropdown') {
                    return (
                      <div key={setting.category} className="clappy-setting-group">
                        <div
                          className={`clappy-setting-control ${
                            changedItems.has(`${setting.category}-dropdown`) ? 'clappy-changed-item' : ''
                          }`}
                        >
                          <label className="clappy-setting-label" htmlFor={`dropdown-${setting.category}`}>
                            {setting.category}
                          </label>
                          <select
                            id={`dropdown-${setting.category}`}
                            className="clappy-setting-dropdown"
                            value={setting.value}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => updateSetting(setting.category, e.target.value)}
                          >
                            {setting.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  }

                  if (setting.type === 'list') {
                    return (
                      <div key={setting.category} className="clappy-setting-group">
                        {Object.entries(setting.items).map(([subCategory, items]) => (
                          <div
                            key={subCategory}
                            className={`clappy-list-wrapper ${
                              changedItems.has(`${setting.category}-${subCategory}`) ? 'clappy-changed-item' : ''
                            }`}
                          >
                            <div className="clappy-setting-label">{subCategory}</div>
                            <div className="clappy-list-container">
                              {items.some(Boolean) && items.length > 0 ? (
                                items.map((item, index) => (
                                  <div key={item} className="clappy-list-item">
                                    {item}
                                    <button
                                      className="clappy-delete-button"
                                      onClick={() => removeListItem(setting.category, subCategory, index)}
                                      type="button"
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
                                placeholder={`Add new ${subCategory.toLowerCase()}...`}
                                value={newItems[subCategory] || ''}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                  setNewItems((prev) => ({
                                    ...prev,
                                    [subCategory]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                                  if (e.key === 'Enter') {
                                    addListItem(setting.category, subCategory);
                                  }
                                }}
                              />
                              <button
                                className="clappy-add-button"
                                onClick={() => addListItem(setting.category, subCategory)}
                                type="button"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (setting.type === 'checkbox') {
                    return (
                      <div key={setting.category} className="clappy-setting-group">
                        {setting.options.map((option) => (
                          <div
                            key={option}
                            className={`clappy-setting-control ${
                              changedItems.has(`${setting.category}-${option}`) ? 'clappy-changed-item' : ''
                            }`}
                          >
                            <label className="clappy-setting-label" htmlFor={`${setting.category}-${option}`}>
                              {option}
                            </label>
                            <label className="clappy-toggle" htmlFor={`${setting.category}-${option}`} aria-label={option}>
                              <input
                                id={`${setting.category}-${option}`}
                                type="checkbox"
                                checked={setting.values.includes(option)}
                                onChange={() => toggleOption(setting.category, option)}
                              />
                              <span className="clappy-toggle-slider" />
                            </label>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return null;
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
