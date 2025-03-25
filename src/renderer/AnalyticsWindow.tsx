/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useEffect } from 'react';
import { FaTableList } from 'react-icons/fa6';
import { IoTime } from 'react-icons/io5';
import { TbGraphFilled } from 'react-icons/tb';
import { Tooltip as ReactTooltip } from 'react-tooltip'; // Renamed Tooltip from react-tooltip
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import bufoThwackIcon from '../../assets/bufo-thwack.gif';
import { ClappyAnalytics, ProductivityHistoryRecord, SessionAnalytics } from './analyticsHistory';
import DefaultAnalytics from './defaultAnalytics';
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
  const parsedDate = new Date(date);

  // Get today's date (without time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the date being formatted (without time)
  const formattedDate = new Date(parsedDate);
  formattedDate.setHours(0, 0, 0, 0);

  // Format the date
  const dateFormatted = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsedDate);

  // Check if the date is today
  if (formattedDate.getTime() === today.getTime()) {
    return `${dateFormatted} (Today)`;
  }

  return dateFormatted;
}

/** Grab the analytics from the main process (Electron) */
async function getAnalytics(): Promise<ClappyAnalytics> {
  const analytics: ClappyAnalytics | null = await window.electron.ipcRenderer.invoke('get-analytics');
  if (!analytics) return DefaultAnalytics

  // Merge with default analytics
  const thisDate = 25;
  const filteredAnalytics = analytics.sessions.filter((session) => session.date.getDate() === thisDate);
  const defaultAnalyticsFiltered = DefaultAnalytics.sessions.filter((session) => session.date.getDate() !== thisDate);
  analytics.sessions = [...filteredAnalytics, ...defaultAnalyticsFiltered];
  return analytics;
}

const scoreLabels = {
  1: 'not-productive',
  2: 'uncertain',
  3: 'somewhat-productive',
  4: 'productive',
  5: 'very-productive',
};

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

type TimeFilter = 'last week' | 'last month' | 'last year';

function getStartDate(timeFilter: TimeFilter): Date {
  const now = new Date();
  const startDate = new Date(now);

  switch (timeFilter) {
    case 'last week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'last month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'last year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return new Date(0); // Default: No filter (all time)
  }

  return startDate;
}

function calculateProductivityStats(sessions: SessionAnalytics[], timeFilter: TimeFilter) {
  const startDate = getStartDate(timeFilter);

  return sessions
    .filter((session) => new Date(session.date) >= startDate) // Apply time filter
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort: Most recent → oldest
    .map((session) => {
      const totalDuration = session.productivity.reduce(
        (sum, record) => sum + (new Date(record.endTime).getTime() - new Date(record.startTime).getTime()),
        0,
      );

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

function calculateProductivityStatsLineGraph(sessions: SessionAnalytics[], timeFilter: TimeFilter) {
  const startDate = getStartDate(timeFilter);

  return sessions
    .filter((session) => new Date(session.date) >= startDate) // Apply time filter
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort: Oldest → most recent (graph order)
    .map((session) => {
      const totalDuration = session.productivity.reduce(
        (sum, record) => sum + (new Date(record.endTime).getTime() - new Date(record.startTime).getTime()),
        0,
      );

      const weightedSum = session.productivity.reduce((sum, record) => {
        const duration = new Date(record.endTime).getTime() - new Date(record.startTime).getTime();
        return sum + productivityScore[record.status] * duration;
      }, 0);

      const avgScore = totalDuration > 0 ? Math.round((weightedSum / totalDuration) * 100) / 100 : 0;

      return {
        date: formatDate(session.date.toDateString()),
        avgProductivityScore: avgScore,
      };
    });
}

function CustomXAxisTick({ x, y, payload }: { x: number; y: number; payload: any }) {
  const formattedTick = payload.value.replace('(Today)', '\n(Today)'); // Ensure correct wrapping

  return (
    <text x={x} y={y} textAnchor="middle" fill="#536C3F" fontSize={14}>
      {formattedTick
        .split('\n')
        .map(
          (
            line:
              | string
              | number
              | boolean
              | React.ReactElement<any, string | React.JSXElementConstructor<any>>
              | Iterable<React.ReactNode>
              | React.ReactPortal
              | null
              | undefined,
            index: React.Key | null | undefined,
          ) => (
            <tspan x={x} dy={index === 0 ? 12 : 18} key={payload.value}>
              {line}
            </tspan>
          ),
        )}
    </text>
  );
}

function GraphView({ analytics, timeFilter }: { analytics: ClappyAnalytics; timeFilter: TimeFilter }) {
  const statsData = calculateProductivityStatsLineGraph(analytics.sessions, timeFilter);

  const productivityLabels: Record<number, string> = {
    1: 'not productive',
    2: 'uncertain',
    3: 'somewhat productive',
    4: 'productive',
    5: 'very productive',
  };

  const scoreColors: { [key: number]: string } = {
    1: getColorForStatus('not-productive'),
    2: getColorForStatus('uncertain'),
    3: getColorForStatus('somewhat-productive'),
    4: getColorForStatus('productive'),
    5: getColorForStatus('very-productive'),
  };

  const CustomYAxisTick = ({ x, y, payload }: { x: number; y: number; payload: any }) => {
    const value = payload.value;
    return (
      <text x={x - 5} y={y} textAnchor="end" fill={scoreColors[value] || '#536C3F'} fontWeight="bold" fontSize="12px">
        {productivityLabels[value] || ''}
      </text>
    );
  };

  const CustomDot = (props: any) => {
    const { cx, cy, value } = props;
    const scoreValue = Math.round(value);
    const color = scoreColors[scoreValue] || '#536C3F';

    return <circle cx={cx} cy={cy} r={5} fill={color} stroke="#FFFFFF" strokeWidth={1} />;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const roundedValue = Math.round(value);
      const color = scoreColors[roundedValue] || '#536C3F';
      const productivityText = productivityLabels[roundedValue] || '';

      return (
        <div className="graph-view-custom-tooltip-container">
          <p className="graph-view-custom-tooltip-label">{`Date: ${label}`}</p>
          <p
            className="graph-view-custom-tooltip-intro"
            style={{
              color: color,
            }}
          >
            {`Average Productivity: ${productivityText}`}
          </p>
          <p
            className="graph-view-custom-tooltip-value"
            style={{
              color: color,
            }}
          >
            {`Score: ${value.toFixed(2)}`}
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="graph-container">
      <ResponsiveContainer width="100%" height={370}>
        <LineChart data={statsData} margin={{ bottom: 0, left: 130 }}>
          <XAxis
            dataKey="date"
            padding={{ left: 50, right: 50 }}
            label={{ value: 'Date', position: 'insideBottom', offset: -20, fill: '#7b8a6e' }}
            stroke="#536C3F"
            tick={CustomXAxisTick}
          />
          <YAxis
            domain={[0, 5]}
            tickCount={6}
            allowDataOverflow
            ticks={[1, 2, 3, 4, 5]}
            stroke="#536C3F"
            tick={CustomYAxisTick}
            width={10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line type="linear" dataKey="avgProductivityScore" stroke="#536C3F" strokeWidth={2} dot={<CustomDot />} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TimelineView({ analytics, timeFilter }: { analytics: ClappyAnalytics; timeFilter: TimeFilter }) {
  const statsData = calculateProductivityStats(analytics.sessions, timeFilter);

  return (
    <div className="timeline-container">
      {/* Legend Section */}
      <div className="legend-container">
        {statuses.map((status) => (
          <div className="legend-item" key={status}>
            <span className="color-box" style={{ backgroundColor: getColorForStatus(status) }} />
            <span className="legend-text">{status.replace('-', ' ')}</span>
          </div>
        ))}
      </div>

      {/* Timeline Data */}
      {statsData.map((dayData) => {
        const daySession = analytics.sessions.find((session) => formatDate(session.date.toDateString()) === dayData.date);

        if (!daySession || daySession.productivity.length === 0) return null;

        // Find session start & end based on productivity records
        const sessionStart = Math.min(...daySession.productivity.map((record) => new Date(record.startTime).getTime()));
        const sessionEnd = Math.max(...daySession.productivity.map((record) => new Date(record.endTime).getTime()));
        const sessionDuration = sessionEnd - sessionStart || 1; // Avoid division by zero

        // Generate time markers
        const timeMarkers: { label: any; offset: any; position: any }[] = [];

        // Start Time Marker
        timeMarkers.push({
          offset: 0,
          label: new Date(sessionStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          position: 0,
        });

        // Productivity Change Markers
        daySession.productivity.forEach((record, index, arr) => {
          const startTime = new Date(record.startTime).getTime();
          const elapsedTime = startTime - sessionStart;
          const positionPercent = (elapsedTime / sessionDuration) * 100;

          const formattedTime = new Date(record.startTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          // Check if it's a different status, or if the last marker is different, etc.
          if (index === 0 || arr[index - 1].status !== record.status || !timeMarkers.some((m) => m.label === formattedTime)) {
            timeMarkers.push({
              offset: elapsedTime, // <--- numeric offset
              label: formattedTime, // <--- user-friendly label
              position: positionPercent,
            });
          }
        });

        // End Time Marker
        // Add end time marker only if it's at least 5 minutes after the last one
        timeMarkers.push({
          offset: sessionEnd - sessionStart,
          label: new Date(sessionEnd).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          position: 100,
        });

        return (
          <div key={dayData.date} className="dayContainer">
            <div className="dayHeader">
              <strong>{dayData.date}</strong>
              <span className="estimation">Estimated Productivity Time: {dayData.estimatedProductivity}</span>
            </div>
            {/* Timeline Bar (relative for interventions) */}
            <div className="timelineBar">
              {daySession.productivity.map((record) => {
                const startTime = new Date(record.startTime).getTime();
                const endTime = new Date(record.endTime).getTime();
                const elapsedStart = startTime - sessionStart;
                const elapsedEnd = endTime - sessionStart;
                const startPercent = (elapsedStart / sessionDuration) * 100;
                const endPercent = (elapsedEnd / sessionDuration) * 100;
                const widthPercent = endPercent - startPercent;

                return (
                  <div
                    key={record.startTime.toISOString()}
                    className="segment"
                    style={{
                      backgroundColor: getColorForStatus(record.status),
                      width: `${widthPercent}%`,
                      left: `${startPercent}%`, // Position it at the exact start time
                      position: 'absolute', // Ensure it is positioned correctly
                    }}
                    title={record.status}
                  />
                );
              })}

              {/* Interventions - Marked on the Timeline */}
              {daySession.interventions.map((intervention) => {
                const interventionTime = new Date(intervention.time).getTime();
                const elapsedTime = interventionTime - sessionStart;
                const positionPercent = (elapsedTime / sessionDuration) * 100;

                return (
                  <>
                    <ReactTooltip id={intervention.action + interventionTime} place="top" positionStrategy="fixed" />
                    <img
                      data-tooltip-id={intervention.action + interventionTime}
                      data-tooltip-content={`${intervention.action} at ${new Date(intervention.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      data-tooltip-place="top" /* Ensure this is set */
                      src={bufoThwackIcon}
                      alt="bufo"
                      key={interventionTime}
                      className="intervention-marker"
                      style={{ left: `${Math.min(100, Math.max(0, positionPercent))}%` }}
                    />
                  </>
                );
              })}
            </div>

            <div className="timeline-labels">
              {(() => {
                const minSpacingMs = 30 * 60 * 1000;
                let lastShownOffset = -Infinity;

                return timeMarkers
                  .sort((a, b) => a.offset - b.offset)
                  .filter(({ offset }) => {
                    if (offset - lastShownOffset >= minSpacingMs) {
                      lastShownOffset = offset;
                      return true;
                    }
                    return false;
                  })
                  .map(({ label, position, offset }) => (
                    <div key={offset} className="time-label" style={{ left: `${position}%` }}>
                      {label}
                    </div>
                  ));
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TableView({ analytics, timeFilter }: { analytics: ClappyAnalytics; timeFilter: TimeFilter }) {
  const statsData = calculateProductivityStats(analytics.sessions, timeFilter);
  return (
    <div className="table-container">
      <table className="analytics-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Estimated Productivity</th>
            <th>Productivity Breakdown</th>
            <th>Interventions</th>
          </tr>
        </thead>
        <tbody>
          {statsData.map((data) => (
            <tr key={data.date}>
              <td>{formatDate(data.date)}</td>
              <td>{data.estimatedProductivity}</td>
              <td>
                <div className="productivitySegments">
                  {data.segments.map((segment) =>
                    segment.widthPercent > 0 ? (
                      <div
                        key={segment.label}
                        style={{
                          width: '100%',
                          background: `linear-gradient(to right, ${segment.color} ${segment.widthPercent}%, transparent ${segment.widthPercent}%)`,
                        }}
                      >
                        {`${segment.widthPercent.toPrecision(3)}% ${segment.label}`}
                      </div>
                    ) : null,
                  )}
                </div>
              </td>
              <td>
                {analytics.sessions
                  .find((session) => formatDate(session.date.toDateString()) === data.date)
                  ?.interventions.map((intervention) => (
                    <div
                      key={intervention.time.toDateString()}
                    >{`${intervention.action} at ${new Date(intervention.time).toLocaleTimeString()}`}</div>
                  ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AnalyticsWindow() {
  const [analytics, setAnalytics] = React.useState<ClappyAnalytics>(DefaultAnalytics);
  const [currentView, setCurrentView] = React.useState<'graph' | 'timeline' | 'table'>('timeline');
  const [timeRange, setTimeRange] = React.useState<'last week' | 'last month' | 'last year'>('last week');
  const [productiveFilter, setProductiveFilter] = React.useState(false);
  const [sortByTask, setSortByTask] = React.useState(false);

  /** Load analytics from Electron on mount */
  useEffect(() => {
    (async () => {
      try {
        const storedAnalytics = await getAnalytics();
        setAnalytics(storedAnalytics);
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    })();
  }, []);
  
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
          <select id="timeRange" className="select" value={timeRange} onChange={(e) => setTimeRange(e.target.value as TimeFilter)}>
            <option value="last week">last week</option>
            <option value="last month">last month</option>
            <option value="last year">last year</option>
          </select>
        </label>
        <div className="filters">
          <span>Filters: </span>
          <div style={{ marginRight: 10 }}>
            <input
              type="checkbox"
              id="productiveCheckbox"
              className="statCheckbox"
              checked={productiveFilter}
              onChange={() => setProductiveFilter(!productiveFilter)}
            />
            <label htmlFor="productiveCheckbox">Only Productive Time</label>
          </div>

          <div>
            <input
              type="checkbox"
              id="sortByTask"
              className="statCheckbox"
              checked={sortByTask}
              onChange={() => setSortByTask(!sortByTask)}
            />
            <label htmlFor="sortByTask">Sort by Task</label>
          </div>
        </div>
      </div>
      {currentView === 'graph' && <GraphView analytics={analytics} timeFilter={timeRange} />}
      {currentView === 'timeline' && <TimelineView analytics={analytics} timeFilter={timeRange} />}
      {currentView === 'table' && <TableView analytics={analytics} timeFilter={timeRange} />}
    </div>
  );
}

export default AnalyticsWindow;
