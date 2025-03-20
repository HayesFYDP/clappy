/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { FaTableList } from 'react-icons/fa6';
import { IoTime } from 'react-icons/io5';
import { TbGraphFilled } from 'react-icons/tb';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ClappyAnalytics, ProductivityHistoryRecord, SessionAnalytics } from './analyticsHistory';
import './AnalyticsWindow.css';

function getColorForStatus(status: ProductivityHistoryRecord['status']): string {
  const colors: Record<ProductivityHistoryRecord['status'], string> = {
    'very-productive': '#4CAF50',
    productive: '#8BC34A',
    'somewhat-productive': '#FFC107',
    uncertain: '#E0E0E0',
    'not-productive': '#F44336',
  };
  return colors[status];
}

function formatDate(date: string) {
  const dateFormatted = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));

  return dateFormatted;
}
const statuses: ProductivityHistoryRecord['status'][] = [
  'very-productive',
  'productive',
  'somewhat-productive',
  'not-productive',
  'uncertain',
];

const productivityScore: Record<ProductivityHistoryRecord['status'], number> = {
  'very-productive': 5,
  productive: 4,
  'somewhat-productive': 3,
  uncertain: 2,
  'not-productive': 1,
};

function calculateProductivityStats(sessions: SessionAnalytics[]) {
  return sessions.map((session) => {
    const totalDuration = session.productivity.reduce((sum, record) => {
      return sum + (new Date(record.endTime).getTime() - new Date(record.startTime).getTime());
    }, 0);

    const categorizedDurations: Record<ProductivityHistoryRecord['status'], number> = {
      'very-productive': 0,
      productive: 0,
      'somewhat-productive': 0,
      uncertain: 0,
      'not-productive': 0,
    };

    session.productivity.forEach((record) => {
      const duration = new Date(record.endTime).getTime() - new Date(record.startTime).getTime();
      categorizedDurations[record.status] += duration;
    });

    const segments = Object.entries(categorizedDurations).map(([status, duration]) => ({
      label: status.replace('-', ' '),
      color: getColorForStatus(status as ProductivityHistoryRecord['status']),
      widthPercent: totalDuration > 0 ? (duration / totalDuration) * 100 : 0,
    }));

    return {
      date: formatDate(session.date.toDateString()),
      estimatedProductivity: `${Math.round((categorizedDurations['very-productive'] + categorizedDurations.productive) / 3600000)} hours / ${Math.round(totalDuration / 3600000)} hours (${Math.round(((categorizedDurations['very-productive'] + categorizedDurations.productive) / totalDuration) * 100) || 0}%)`,
      segments,
    };
  });
}

function calculateProductivityStatsLineGraph(sessions: SessionAnalytics[]) {
  return sessions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort by date in ascending order
    .map((session) => {
      const totalDuration = session.productivity.reduce((sum, record) => {
        return sum + (new Date(record.endTime).getTime() - new Date(record.startTime).getTime());
      }, 0);

      const weightedSum = session.productivity.reduce((sum, record) => {
        const duration = new Date(record.endTime).getTime() - new Date(record.startTime).getTime();
        return sum + productivityScore[record.status] * duration;
      }, 0);

      const avgScore = Math.round((totalDuration > 0 ? weightedSum / totalDuration : 0) * 100) / 100;

      return {
        date: formatDate(session.date.toDateString()),
        avgProductivityScore: avgScore,
      };
    });
}

type AnalyticsWindowProps = {
  analytics: ClappyAnalytics;
};

function GraphView({ analytics }: { analytics: ClappyAnalytics }) {
  const statsData = calculateProductivityStatsLineGraph(analytics.sessions);

  return (
    <div className="graph-container">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={statsData} margin={{ bottom: 30 }}>
          <XAxis
            dataKey="date"
            padding={{ left: 50, right: 50 }}
            label={{ value: 'Date', position: 'insideBottom', offset: -10, fill: '#7b8a6e' }}
            stroke="#536C3F"
            tick={{ fill: '#536C3F' }}
          />
          <YAxis domain={[0, 5]} tickCount={6} allowDataOverflow ticks={[0, 1, 2, 3, 4, 5]} stroke="#536C3F" tick={{ fill: '#536C3F' }} />
          <Tooltip formatter={(value, _) => [value, 'Average Productivity Score']} contentStyle={{ color: '#536C3F' }} />
          <Line type="monotone" dataKey="avgProductivityScore" stroke="#536C3F" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TimelineView({ analytics }: { analytics: ClappyAnalytics }) {
  const statsData = calculateProductivityStats(analytics.sessions);
  return (
    <div className="timeline-container">
      <div className="legend-container">
        {statuses.map((status) => (
          <div className="legend-item" key={status}>
            <span className="color-box" style={{ backgroundColor: getColorForStatus(status) }} />
            <span className="legend-text">{status.replace('-', ' ')}</span>
          </div>
        ))}
      </div>
      {statsData.map((dayData) => (
        <div key={dayData.date} className="dayContainer">
          <div className="dayHeader">
            <strong>{dayData.date}</strong>
            <span className="estimation">Estimated Productivity Time: {dayData.estimatedProductivity}</span>
          </div>
          <div className="timelineBar">
            {dayData.segments.map((segment) => (
              <div
                key={segment.label}
                className="segment"
                style={{ backgroundColor: segment.color, width: `${segment.widthPercent}%` }}
                title={segment.label}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TableView({ analytics }: { analytics: ClappyAnalytics }) {
  const statsData = calculateProductivityStats(analytics.sessions);
  return (
    <div className="table-container">
      <div className="legend-container">
        {statuses.map((status) => (
          <div className="legend-item" key={status}>
            <span className="color-box" style={{ backgroundColor: getColorForStatus(status) }} />
            <span className="legend-text">{status.replace('-', ' ')}</span>
          </div>
        ))}
      </div>

      <table className="analytics-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Estimated Productivity</th>
            <th>Productivity Breakdown</th>
          </tr>
        </thead>
        <tbody>
          {statsData.map((data) => (
            <tr key={data.date}>
              <td>{formatDate(data.date)}</td>
              <td>{data.estimatedProductivity}</td>
              <td>
                <div className="productivitySegments">
                  {data.segments.map((segment) => (
                    <div
                      key={segment.label}
                      style={{
                        width: '100%',
                        background: `linear-gradient(to right, ${segment.color} ${segment.widthPercent}%, transparent ${segment.widthPercent}%)`,
                      }}
                    >
                      {`${segment.widthPercent.toPrecision(3)}% ${segment.label}`}
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AnalyticsWindow({ analytics }: AnalyticsWindowProps) {
  const [currentView, setCurrentView] = React.useState<'graph' | 'timeline' | 'table'>('timeline');
  const [timeRange, setTimeRange] = React.useState<'last week' | 'last month' | 'last year'>('last week');
  const [productiveFilter, setProductiveFilter] = React.useState(false);
  const [sortByTask, setSortByTask] = React.useState(false);

  return (
    <div className="container">
      <div className="navLinks-wrapper">
        <div className="navLinks">
          <div className={`navLink ${currentView === 'graph' ? 'navLink-active' : ''}`} onClick={() => setCurrentView('graph')}>
            <TbGraphFilled />
            Graph View
          </div>
          <div className={`navLink ${currentView === 'timeline' ? 'navLink-active' : ''}`} onClick={() => setCurrentView('timeline')}>
            <IoTime />
            Timeline View
          </div>
          <div className={`navLink ${currentView === 'table' ? 'navLink-active' : ''}`} onClick={() => setCurrentView('table')}>
            <FaTableList />
            Table View
          </div>
        </div>
      </div>
      <div className="controls">
        <label className="label" htmlFor="timeRange">
          Time Range:
          <select id="timeRange" className="select">
            <option>last week</option>
            <option>last month</option>
            <option>last year</option>
          </select>
        </label>
        <div className="filters">
          <span>Filters: </span>
          <div style={{ marginRight: 10 }}>
            <input type="checkbox" id="productiveCheckbox" className="statCheckbox" />
            <label htmlFor="productiveCheckbox">Only Productive Time</label>
          </div>

          <div>
            <input type="checkbox" id="sortByTask" className="statCheckbox" />
            <label htmlFor="sortByTask">Sort by Task</label>
          </div>
        </div>
      </div>
      {currentView === 'graph' && <GraphView analytics={analytics} />}
      {currentView === 'timeline' && <TimelineView analytics={analytics} />}
      {currentView === 'table' && <TableView analytics={analytics} />}
    </div>
  );
}

export default AnalyticsWindow;
