const DefaultSettings = [
  {
    category: 'Communication',
    type: 'dropdown',
    options: ['continuous input', 'push to talk'],
    value: 'continuous input',
  },
  {
    category: 'Blacklist',
    type: 'list',
    items: { Programs: ['League of Legends'], Sites: ['twitter.com'] },
  },
  {
    category: 'Permissions',
    type: 'checkbox',
    options: ['Take Screenshots', 'Listen to user microphone'],
    values: ['Take Screenshots', 'Listen to user microphone'],
  },
];

export default DefaultSettings;
