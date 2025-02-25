import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

function App() {
  const [performanceData, setPerformanceData] = useState({
    cpuUsage: 0, // Default to 0 instead of null
    memoryUsage: 0,
  });

  useEffect(() => {
    // Establish socket connection inside useEffect to avoid multiple instances
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'], // Allow fallback to polling
      reconnection: true, // Auto-reconnect if disconnected
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Connection error:', err);
    });

    socket.on('performanceData', (data) => {
      console.log('📊 Received performance data:', data);
      setPerformanceData(data);
    });

    // Cleanup function to close socket when component unmounts
    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('performanceData');
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Real-Time Performance Monitoring</h1>
      <div style={{ marginTop: '20px' }}>
        <p>
          <strong>CPU Usage:</strong> {performanceData.cpuUsage.toFixed(2)}%
        </p>
        <p>
          <strong>Memory Usage:</strong> {performanceData.memoryUsage.toFixed(2)}%
        </p>
        <p>
          <strong>Raw Data:</strong> {JSON.stringify(performanceData)}
        </p>
      </div>
    </div>
  );
}

export default App;
