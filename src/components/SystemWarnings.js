import React, { useState } from 'react';

const initialWarnings = [
  { id: 1, severity: 'CRITICAL', title: 'Secondary Node Failure', description: 'Authentication node in Region 4 is unresponsive.', timestamp: '14:21:10' },
  { id: 2, severity: 'WARNING', title: 'High Memory Usage', description: 'DB cluster memory at 88%. Threshold exceeded.', timestamp: '14:18:05' },
  { id: 3, severity: 'INFO', title: 'Backup Delayed', description: 'Nightly backup started 15 minutes late.', timestamp: '14:05:00' },
];

const SystemWarnings = () => {
  const [warnings, setWarnings] = useState(initialWarnings);

  const acknowledge = (id) => {
    setWarnings(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div className="warnings-container glass">
      <div className="warnings-header">
        <h3>Active Alerts</h3>
        <span className="warning-count">{warnings.length}</span>
      </div>
      <div className="warnings-list">
        {warnings.length === 0 ? (
          <div className="no-warnings">No active alerts. System is stable.</div>
        ) : (
          warnings.map(warning => (
            <div key={warning.id} className={`warning-card ${warning.severity.toLowerCase()}`}>
              <div className="warning-content">
                <div className="warning-title-row">
                  <span className="warning-severity">{warning.severity}</span>
                  <span className="warning-time">{warning.timestamp}</span>
                </div>
                <h4>{warning.title}</h4>
                <p>{warning.description}</p>
              </div>
              <button className="ack-button" onClick={() => acknowledge(warning.id)}>
                ACKNOWLEDGE
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SystemWarnings;
