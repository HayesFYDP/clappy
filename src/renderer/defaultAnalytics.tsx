import { ClappyAnalytics } from './analyticsHistory';

const DefaultAnalytics: ClappyAnalytics = {
  sessions: [
    // {
    //   date: new Date('2025-03-21T00:00:00-05:00'), // March 21st in EST
    //   productivity: [
    //     {
    //       startTime: new Date('2025-03-21T07:45:00-05:00'), // 7:45 AM EST
    //       endTime: new Date('2025-03-21T08:45:00-05:00'), // 8:45 AM EST
    //       status: 'productive',
    //     },
    //     {
    //       startTime: new Date('2025-03-21T08:20:00-05:00'),
    //       endTime: new Date('2025-03-21T08:25:00-05:00'),
    //       status: 'somewhat-productive',
    //     },
    //     {
    //       startTime: new Date('2025-03-21T08:40:00-05:00'),
    //       endTime: new Date('2025-03-21T09:50:00-05:00'),
    //       status: 'very-productive',
    //     },
    //     {
    //       startTime: new Date('2025-03-21T12:10:00-05:00'),
    //       endTime: new Date('2025-03-21T12:15:00-05:00'),
    //       status: 'not-productive',
    //     },
    //     {
    //       startTime: new Date('2025-03-21T12:20:00-05:00'),
    //       endTime: new Date('2025-03-21T14:20:00-05:00'),
    //       status: 'productive',
    //     },
    //   ],
    //   interventions: [
    //     { time: new Date('2025-03-21T08:20:00-05:00'), action: 'popup-clappy' },
    //     { time: new Date('2025-03-21T12:10:00-05:00'), action: 'minimize-window' },
    //   ],
    // },
    {
      date: new Date('2025-03-25T00:00:00-05:00'), // March 20th in EST
      productivity: [
        {
          startTime: new Date('2025-03-25T07:30:00-05:00'), // 7:30 AM EST
          endTime: new Date('2025-03-25T08:30:00-05:00'), // 8:30 AM EST
          status: 'productive',
        },
        {
          startTime: new Date('2025-03-25T08:15:00-05:00'), // 9:00 AM EST
          endTime: new Date('2025-03-25T08:18:00-05:00'), // 10:00 AM EST
          status: 'somewhat-productive',
        },
        {
          startTime: new Date('2025-03-25T08:32:00-05:00'), // 9:00 AM EST
          endTime: new Date('2025-03-25T10:00:00-05:00'), // 10:00 AM EST
          status: 'very-productive',
        },
        {
          startTime: new Date('2025-03-25T12:30:00-05:00'), // 11:00 AM EST
          endTime: new Date('2025-03-25T12:35:00-05:00'), // 12:00 PM EST
          status: 'not-productive',
        },
        // {
        //   startTime: new Date('2025-03-25T12:36:00-05:00'), // 1:30 PM EST
        //   endTime: new Date('2025-03-25T14:36:00-05:00'), // 2:30 PM EST
        //   status: 'productive',
        // },
      ],
      interventions: [
        { time: new Date('2025-03-25T08:15:00-05:00'), action: 'popup-clappy' as const }, // Notification in the morning
        { time: new Date('2025-03-25T10:30:00-05:00'), action: 'minimize-window' as const }, // Minimize in the afternoon
      ],
    },
    {
      date: new Date('2025-03-22T00:00:00-05:00'), // March in EST
      productivity: [
        {
          startTime: new Date('2025-03-22T07:45:00-05:00'), // 7:45 AM EST
          endTime: new Date('2025-03-22T08:45:00-05:00'), // 8:45 AM EST
          status: 'productive',
        },
        {
          startTime: new Date('2025-03-22T08:20:00-05:00'),
          endTime: new Date('2025-03-22T08:25:00-05:00'),
          status: 'somewhat-productive',
        },
        {
          startTime: new Date('2025-03-22T08:40:00-05:00'),
          endTime: new Date('2025-03-22T09:50:00-05:00'),
          status: 'very-productive',
        },
        {
          startTime: new Date('2025-03-22T12:10:00-05:00'),
          endTime: new Date('2025-03-22T12:15:00-05:00'),
          status: 'not-productive',
        },
        {
          startTime: new Date('2025-03-22T12:20:00-05:00'),
          endTime: new Date('2025-03-22T14:20:00-05:00'),
          status: 'productive',
        },
      ],
      interventions: [
        { time: new Date('2025-03-22T08:20:00-05:00'), action: 'popup-clappy' },
        { time: new Date('2025-03-22T12:10:00-05:00'), action: 'minimize-window' },
      ],
    },
    {
      date: new Date('2025-03-24T00:00:00-05:00'), // March in EST
      productivity: [
        {
          startTime: new Date('2025-03-24T08:10:00-05:00'),
          endTime: new Date('2025-03-24T09:10:00-05:00'),
          status: 'very-productive',
        },
        {
          startTime: new Date('2025-03-24T11:30:00-05:00'),
          endTime: new Date('2025-03-24T12:00:00-05:00'),
          status: 'productive',
        },
        {
          startTime: new Date('2025-03-24T12:05:00-05:00'),
          endTime: new Date('2025-03-24T12:10:00-05:00'),
          status: 'not-productive',
        },
        {
          startTime: new Date('2025-03-24T12:11:00-05:00'),
          endTime: new Date('2025-03-24T13:30:00-05:00'),
          status: 'very-productive',
        },
      ],
      interventions: [{ time: new Date('2025-03-24T12:10:00-05:00'), action: 'minimize-window' }],
    },
    {
      date: new Date('2025-03-15T00:00:00-05:00'), // EST
      productivity: [
        {
          startTime: new Date('2025-03-15T08:00:00-05:00'),
          endTime: new Date('2025-03-15T09:00:00-05:00'),
          status: 'very-productive',
        },
        {
          startTime: new Date('2025-03-15T09:30:00-05:00'),
          endTime: new Date('2025-03-15T10:30:00-05:00'),
          status: 'productive',
        },
        {
          startTime: new Date('2025-03-15T11:00:00-05:00'),
          endTime: new Date('2025-03-15T12:00:00-05:00'),
          status: 'somewhat-productive',
        },
        {
          startTime: new Date('2025-03-15T14:00:00-05:00'),
          endTime: new Date('2025-03-15T14:30:00-05:00'),
          status: 'uncertain',
        },
        {
          startTime: new Date('2025-03-15T15:00:00-05:00'),
          endTime: new Date('2025-03-15T16:00:00-05:00'),
          status: 'not-productive',
        },
      ],
      interventions: [
        { time: new Date('2025-03-15T09:45:00-05:00'), action: 'popup-clappy' as const },
        { time: new Date('2025-03-15T15:10:00-05:00'), action: 'minimize-window' as const },
      ],
    },
    {
      date: new Date('2025-03-14T00:00:00-05:00'), // EST
      productivity: [
        {
          startTime: new Date('2025-03-14T07:30:00-05:00'),
          endTime: new Date('2025-03-14T08:30:00-05:00'),
          status: 'productive',
        },
        {
          startTime: new Date('2025-03-14T09:00:00-05:00'),
          endTime: new Date('2025-03-14T10:00:00-05:00'),
          status: 'somewhat-productive',
        },
        {
          startTime: new Date('2025-03-14T11:30:00-05:00'),
          endTime: new Date('2025-03-14T12:00:00-05:00'),
          status: 'very-productive',
        },
        {
          startTime: new Date('2025-03-14T13:00:00-05:00'),
          endTime: new Date('2025-03-14T14:30:00-05:00'),
          status: 'not-productive',
        },
      ],
      interventions: [{ time: new Date('2025-03-14T09:30:00-05:00'), action: 'popup-clappy' as const }],
    },
    // {
    //   date: new Date('2025-03-22T00:00:00-05:00'), // March 17th in EST
    //   productivity: [
    //     {
    //       startTime: new Date('2025-03-22T08:00:00-05:00'),
    //       endTime: new Date('2025-03-22T09:30:00-05:00'),
    //       status: 'very-productive',
    //     },
    //     {
    //       startTime: new Date('2025-03-22T10:00:00-05:00'),
    //       endTime: new Date('2025-03-22T11:00:00-05:00'),
    //       status: 'productive',
    //     },
    //     {
    //       startTime: new Date('2025-03-22T13:30:00-05:00'),
    //       endTime: new Date('2025-03-22T14:30:00-05:00'),
    //       status: 'somewhat-productive',
    //     },
    //   ],
    //   interventions: [{ time: new Date('2025-03-22T10:15:00-05:00'), action: 'popup-clappy' as const }],
    // },
    {
      date: new Date('2025-03-23T00:00:00-05:00'), // March in EST
      productivity: [
        {
          startTime: new Date('2025-03-23T07:30:00-05:00'),
          endTime: new Date('2025-03-23T08:30:00-05:00'),
          status: 'productive',
        },
        {
          startTime: new Date('2025-03-23T09:45:00-05:00'),
          endTime: new Date('2025-03-23T10:45:00-05:00'),
          status: 'very-productive',
        },
        {
          startTime: new Date('2025-03-23T15:00:00-05:00'),
          endTime: new Date('2025-03-23T16:00:00-05:00'),
          status: 'very-productive',
        },
      ],
      interventions: [],
    },
  ],
};

export default DefaultAnalytics;