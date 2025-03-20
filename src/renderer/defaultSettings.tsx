export type CategoryType = 'Communication' | 'Blacklist' | 'Permissions';

interface DropdownSetting {
  category: 'Communication';
  type: 'dropdown';
  options: string[];
  value: string;
}

interface ListSetting {
  category: 'Blacklist';
  type: 'list';
  items: {
    Programs: string[];
    Sites: string[];
  };
}

interface CheckboxSetting {
  category: 'Permissions';
  type: 'checkbox';
  options: string[];
  values: string[];
}

export type SettingType = DropdownSetting | ListSetting | CheckboxSetting;

const DefaultSettings: SettingType[] = [
  {
    category: 'Communication',
    type: 'dropdown',
    options: ['continuous input', 'push to talk'],
    value: 'continuous input',
  },
  {
    category: 'Blacklist',
    type: 'list',
    items: {
      Programs: ['League of Legends'],
      Sites: ['twitter.com'],
    },
  },
  {
    category: 'Permissions',
    type: 'checkbox',
    options: ['Take screenshots', 'Listen to user microphone'],
    values: ['Take screenshots', 'Listen to user microphone'],
  },
];

export default DefaultSettings;
