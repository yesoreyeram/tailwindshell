import { Shell } from 'tailwindshell';
import { useState, useEffect } from 'react';

/**
 * Advanced example: System monitoring dashboard
 */
export default function SystemMonitoringDashboard() {
  const [metrics, setMetrics] = useState({
    disk: '',
    memory: '',
    cpu: '',
    uptime: '',
    processes: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Metrics will be updated via Shell component callbacks
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>System Monitoring Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <MetricCard title="Disk Usage">
          <Shell
            className="df--h"
            onComplete={(result) => {
              setMetrics((prev) => ({ ...prev, disk: result.stdout }));
            }}
            securityPolicy={{
              allowedCommands: ['df'],
              maxExecutionTime: 5000,
            }}
          />
          <pre>{metrics.disk}</pre>
        </MetricCard>

        <MetricCard title="Memory Usage">
          <Shell
            className="free--h"
            onComplete={(result) => {
              setMetrics((prev) => ({ ...prev, memory: result.stdout }));
            }}
            securityPolicy={{
              allowedCommands: ['free'],
              maxExecutionTime: 5000,
            }}
          />
          <pre>{metrics.memory}</pre>
        </MetricCard>

        <MetricCard title="CPU Info">
          <Shell
            className="top--b--n-1_pipe_head--n-5"
            onComplete={(result) => {
              setMetrics((prev) => ({ ...prev, cpu: result.stdout }));
            }}
            securityPolicy={{
              allowedCommands: ['top', 'head'],
              allowPiping: true,
              maxExecutionTime: 10000,
            }}
          />
          <pre>{metrics.cpu}</pre>
        </MetricCard>

        <MetricCard title="System Uptime">
          <Shell
            className="uptime"
            onComplete={(result) => {
              setMetrics((prev) => ({ ...prev, uptime: result.stdout }));
            }}
            securityPolicy={{
              allowedCommands: ['uptime'],
              maxExecutionTime: 5000,
            }}
          />
          <pre>{metrics.uptime}</pre>
        </MetricCard>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Active Processes</h2>
        <Shell
          className="ps-aux_pipe_wc--l"
          onComplete={(result) => {
            setMetrics((prev) => ({
              ...prev,
              processes: parseInt(result.stdout.trim(), 10),
            }));
          }}
          securityPolicy={{
            allowedCommands: ['ps', 'wc'],
            allowPiping: true,
          }}
        />
        <p>Total processes: {metrics.processes}</p>
      </div>
    </div>
  );
}

function MetricCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '15px',
        backgroundColor: '#f9f9f9',
      }}
    >
      <h3>{title}</h3>
      {children}
    </div>
  );
}
