"use client";

import { useEffect, useState } from "react";

type ProcessEntry = {
  pid: number;
  name: string;
  cpu_percent: number;
};

type MetricEntry = {
  time: string;
  cpu: number;
  memory: number;
  disk: number;
  top_processes?: ProcessEntry[];
};

type MetricsResponse = {
  latest: MetricEntry | null;
  history: MetricEntry[];
};

const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export default function HomePage() {
  const [metrics, setMetrics] = useState<MetricsResponse>({ latest: null, history: [] });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/metrics");
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error("Failed to fetch metrics", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const timer = setInterval(fetchMetrics, 5000);
    return () => clearInterval(timer);
  }, []);

  const latest = metrics.latest;
  const history = metrics.history;

  const renderMetricCard = (label: string, value: number | undefined, colorClass = "#38bdf8") => (
    <div className="card">
      <div className="metric-name">{label}</div>
      <p className="metric-value">{value !== undefined ? `${value.toFixed(1)}%` : "—"}</p>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${Math.min(100, value ?? 0)}%` }} />
      </div>
    </div>
  );

  return (
    <main>
      <div className="header">
        <div>
          <p className="small-text">Linux System Monitor UI</p>
          <h1>Live system metrics dashboard</h1>
        </div>
        <button className="button" onClick={fetchMetrics} type="button">
          Refresh
        </button>
      </div>

      <section className="card-grid">
        {renderMetricCard("CPU Usage", latest?.cpu)}
        {renderMetricCard("Memory Usage", latest?.memory)}
        {renderMetricCard("Disk Usage", latest?.disk)}
      </section>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 className="section-title">Recent data</h2>
        {loading && <p className="small-text">Loading metrics…</p>}
        {!loading && history.length === 0 && <p className="small-text">No metrics available yet. Start the Python monitor with JSON logging enabled.</p>}
        {history.length > 0 && (
          <div className="process-list">
            {history.slice(-5).reverse().map((entry) => (
              <div key={entry.time} className="process-item">
                <div className="process-meta">
                  <span className="process-name">{formatTime(entry.time)}</span>
                  <span className="small-text">CPU {entry.cpu.toFixed(1)}% · Memory {entry.memory.toFixed(1)}% · Disk {entry.disk.toFixed(1)}%</span>
                </div>
                <span className="status-pill">Snapshot</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 className="section-title">Top processes from latest sample</h2>
        {latest?.top_processes && latest.top_processes.length > 0 ? (
          <ul className="process-list">
            {latest.top_processes.map((process) => (
              <li key={process.pid} className="process-item">
                <div className="process-meta">
                  <span className="process-name">{process.name || "Unknown"}</span>
                  <span className="small-text">PID {process.pid}</span>
                </div>
                <span className="status-pill">{process.cpu_percent.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small-text">No process data available yet. Run the Python monitor with JSON logging.</p>
        )}
      </div>

      <footer className="footer">
        <p>Data is loaded from <code>system_logs.json</code> and refreshed every 5 seconds.</p>
      </footer>
    </main>
  );
}
