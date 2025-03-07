/* eslint-disable jsx-a11y/anchor-is-valid */
import './AnalyticsWindow.css';

function AnalyticsWindow() {
  // Example data to drive our timeline
  const statsData = [
    {
      date: 'December 3rd',
      estimatedProductivity: '2 hours / 3 hours (67%)',
      segments: [
        { color: '#4CAF50', label: 'Very Productive', widthPercent: 25 },
        { color: '#8BC34A', label: 'Productive', widthPercent: 25 },
        { color: '#FFC107', label: 'Somewhat Productive', widthPercent: 20 },
        { color: '#E0E0E0', label: 'Uncertain', widthPercent: 15 },
        { color: '#F44336', label: 'Not Productive', widthPercent: 15 },
      ],
    },
    {
      date: 'December 2nd',
      estimatedProductivity: '2 hours / 10 hours (20%)',
      segments: [
        { color: '#4CAF50', label: 'Very Productive', widthPercent: 10 },
        { color: '#8BC34A', label: 'Productive', widthPercent: 10 },
        { color: '#FFC107', label: 'Somewhat Productive', widthPercent: 10 },
        { color: '#E0E0E0', label: 'Uncertain', widthPercent: 20 },
        { color: '#F44336', label: 'Not Productive', widthPercent: 50 },
      ],
    },
  ];

  return (
    <div className="container">
      <h1 className="title">Clappy Stats</h1>
      <div className="navLinks">
        <a href="#" className="link">
          Graph View
        </a>{' '}
        |
        <a href="#" className="link">
          Timeline View
        </a>{' '}
        |
        <a href="#" className="link">
          Table View
        </a>
      </div>
      <div className="controls">
        <label className="label" htmlFor="timeRange">
          Time Range:
          <select id="timeRange" className="select">
            <option>last week</option>
            <option>last month</option>
            <option>custom range</option>
          </select>
        </label>
        <div className="filters">
          <span>Filters: </span>
          <input type="checkbox" id="productive" />
          {/* <label htmlFor="productive">Only Productive Time</label> */}
          <input type="checkbox" id="sortByTask" />
          {/* <label htmlFor="sortByTask">Sort by Task</label> */}
        </div>
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

export default AnalyticsWindow;
