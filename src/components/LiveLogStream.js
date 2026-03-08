import React, { useEffect, useRef, useState } from 'react';

const mockLogs = [
  { id: 1, timestamp: '14:20:01', level: 'INFO', message: 'System initialization started', source: 'CORE' },
  { id: 2, timestamp: '14:20:05', level: 'INFO', message: 'Network handshake successful', source: 'NET' },
  { id: 3, timestamp: '14:20:12', level: 'WARN', message: 'High latency detected in Zone B', source: 'NET' },
  { id: 4, timestamp: '14:20:45', level: 'INFO', message: 'Database synchronization complete', source: 'DB' },
  { id: 5, timestamp: '14:21:10', level: 'ERROR', message: 'Failed to authenticate secondary node', source: 'AUTH' },
  { id: 6, timestamp: '14:21:30', level: 'INFO', message: 'Resource allocation optimized', source: 'SCHED' },
];

const LiveLogStream = () => {
  const [logs, setLogs] = useState(mockLogs);
  const scrollRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        level: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'ERROR' : 'WARN') : 'INFO',
        message: `Pulse heartbeat detected - sequence ${Math.floor(Math.random() * 1000)}`,
        source: ['CORE', 'NET', 'DB', 'AUTH', 'SCHED'][Math.floor(Math.random() * 5)]
      };
      setLogs(prev => [...prev.slice(-49), newLog]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="log-stream-container glass">
      <div className="log-header">
        <h3>Live Activity Stream</h3>
        <span className="live-indicator">LIVE</span>
      </div>
      <div className="log-scroll" ref={scrollRef}>
        {logs.map(log => (
          <div key={log.id} className={`log-entry ${log.level.toLowerCase()}`}>
            <span className="log-time">[{log.timestamp}]</span>
            <span className="log-source">{log.source}</span>
            <span className="log-level">{log.level}</span>
            <span className="log-message">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveLogStream;
