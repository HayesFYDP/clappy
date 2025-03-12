export type ProductivityHistoryRecord = {
  startTime: Date;
  endTime: Date;
  status: 'very-productive' | 'productive' | 'somewhat-productive' | 'uncertain' | 'not-productive';
};

export type InterventionRecord = {
  time: Date;
  action: 'notify' | 'minimize-window';
};

export type SessionAnalytics = {
  date: Date;
  productivity: ProductivityHistoryRecord[];
  interventions: InterventionRecord[];
};

export type ClappyAnalytics = {
  sessions: SessionAnalytics[]; // multiple sessions on the same date can be guaranteed to have no overlap
};
