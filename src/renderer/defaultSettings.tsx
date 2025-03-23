export type CategoryType = 'Communication' | 'Blacklist' | 'Permissions';

interface DropdownSetting {
  category: 'Communication';
  type: 'dropdown';
  options: string[];
  value: string;
  descriptions: string[];
}

interface ListSetting {
  category: 'Blacklist';
  type: 'list';
  items: {
    Programs: string[];
    Sites: string[];
  };
  descriptions: string[];
}

interface CheckboxSetting {
  category: 'Permissions';
  type: 'checkbox';
  options: string[];
  values: string[];
  descriptions: string[];
}

export type SettingType = DropdownSetting | ListSetting | CheckboxSetting;

const DefaultSettings: SettingType[] = [
  /*
  {
    category: 'Communication',
    type: 'dropdown',
    options: ['continuous input', 'push to talk'],
    value: 'continuous input',
    descriptions: [],
  },
  */
  {
    category: 'Blacklist',
    type: 'list',
    items: {
      Programs: ['League of Legends'],
      Sites: ['twitter.com'],
    },
    descriptions: ['Programs you would like Clappy to help block', 'Websites you would like Clappy to stop you from visiting'],
  },
  {
    category: 'Permissions',
    type: 'checkbox',
    options: ['Take screenshots', 'Listen to user microphone', 'Window control'],
    values: ['Take screenshots', 'Listen to user microphone', 'Window control'],
    descriptions: [
      'Clappy needs to take screenshots to see what is on your screen',
      'User microphone is required to verbally talk with Clappy',
      'Window control is required for interventions to interact with other windows'
    ],
  },
];

export default DefaultSettings;
