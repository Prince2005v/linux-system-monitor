"use client";

import { useEffect, useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Activity, Cpu, HardDrive, MemoryStick as Memory, RefreshCw, Server, AlertCircle, ArrowUp, ArrowDown, XCircle } from 'lucide-react';

type ProcessEntry = {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_mb?: number;
};

type MetricEntry = {
  time: string;
  cpu: number;
  memory: number;
  disk: number;
  network_sent_mb?: number;
  network_recv_mb?: number;
  top_processes?: ProcessEntry[];
};

type MetricsResponse = {
  latest: MetricEntry | null;
  history: MetricEntry[];
};

const formatTime = (value: string) => {
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

// Custom Radial Progress component
const RadialProgress = ({ value, label, color, icon: Icon }: { value: number, label: string, color: string, icon: any }) => {
  const radius = 40;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="metric-header" style={{ width: '100%' }}>
        <div className="metric-name">
          <Icon size={18} color={color} /> {label}
        </div>
      </div>
      
      <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg height={120} width={120} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            stroke="rgba(255,255,255,0.05)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={60}
            cy={60}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={60}
            cy={60}
          />
        </svg>
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const [metrics, setMetrics] = useState<MetricsResponse>({ latest: null, history: [] });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [killingPid, setKillingPid] = useState<number | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch("/api/metrics");
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error("Failed to fetch metrics", error);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 500); // Visual delay
    }
  };

  const handleKillProcess = async (pid: number, name: string) => {
    if (!window.confirm(`Are you sure you want to kill process ${name} (PID: ${pid})?`)) {
      return;
    }
    
    setKillingPid(pid);
    try {
      const response = await fetch("/api/process", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(`Error: ${data.details || data.error}`);
      } else {
        // Optimistically remove or wait for next refresh
        setTimeout(fetchMetrics, 1000);
      }
    } catch (error) {
      alert("Failed to send kill signal");
    } finally {
      setKillingPid(null);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const timer = setInterval(fetchMetrics, 5000);
    return () => clearInterval(timer);
  }, []);

  const latest = metrics.latest;
  const history = metrics.history;

  const chartData = useMemo(() => {
    return history.map(item => ({
      name: formatTime(item.time),
      CPU: item.cpu,
      Memory: item.memory,
      NetUp: item.network_sent_mb || 0,
      NetDown: item.network_recv_mb || 0
    }));
  }, [history]);

  return (
    <main>
      <div className="header fade-in">
        <div className="title-container">
          <p>
            <span className="pulse" /> Live Monitoring
          </p>
          <h1>Linux System Monitor</h1>
        </div>
        <button 
          className="button" 
          onClick={fetchMetrics} 
          type="button"
          disabled={isRefreshing}
        >
          <RefreshCw size={18} className={isRefreshing ? "spin-animation" : ""} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .kill-btn {
          background: rgba(239, 68, 68, 0.1);
          color: var(--destructive);
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .kill-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
        }
        .kill-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}} />

      {loading && !latest && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--muted)' }}>
          <Activity size={32} className="pulse" />
        </div>
      )}

      {!loading && !latest && history.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
          No metrics available yet. Start the Python monitor with JSON logging enabled.
        </div>
      )}

      {latest && (
        <>
          <section className="card-grid">
            <RadialProgress value={latest.cpu} label="CPU Usage" color="var(--primary)" icon={Cpu} />
            <RadialProgress value={latest.memory} label="Memory Usage" color="var(--secondary)" icon={Memory} />
            <RadialProgress value={latest.disk} label="Disk Usage" color="var(--accent)" icon={HardDrive} />
            
            <div className="card fade-in delay-1">
              <div className="metric-header">
                <div className="metric-name">
                  <Server size={18} color="var(--destructive)" /> Network I/O
                </div>
              </div>
              <div className="network-stats">
                <div className="network-stat-box">
                  <span className="network-label"><ArrowUp size={14} color="var(--primary)"/> Sent</span>
                  <span className="network-val">{(latest.network_sent_mb || 0).toFixed(2)} <span className="metric-unit">MB/s</span></span>
                </div>
                <div className="network-stat-box">
                  <span className="network-label"><ArrowDown size={14} color="var(--accent)"/> Recv</span>
                  <span className="network-val">{(latest.network_recv_mb || 0).toFixed(2)} <span className="metric-unit">MB/s</span></span>
                </div>
              </div>
            </div>
          </section>

          <section className="big-card-grid">
            <div className="card fade-in delay-2">
              <h2 className="section-title"><Activity color="var(--primary)" /> Resource Usage History</h2>
              <div className="chart-container" style={{ marginLeft: '-15px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Area type="monotone" dataKey="CPU" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                    <Area type="monotone" dataKey="Memory" stroke="var(--secondary)" strokeWidth={2} fillOpacity={1} fill="url(#colorMem)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card fade-in delay-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <h2 className="section-title" style={{ position: 'sticky', top: 0, background: 'var(--card)', zIndex: 10, paddingBottom: 10 }}><AlertCircle color="var(--destructive)" /> Top Processes</h2>
              {latest.top_processes && latest.top_processes.length > 0 ? (
                <div className="process-list">
                  {latest.top_processes.map((process, i) => (
                    <div key={`${process.pid}-${i}`} className="process-item">
                      <div className="process-info">
                        <span className="process-name">{process.name || "Unknown"}</span>
                        <div className="process-details">
                          <span className="process-stat">PID: {process.pid}</span>
                          {process.memory_mb !== undefined && <span className="process-stat">• {process.memory_mb} MB</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="badge">{process.cpu_percent.toFixed(1)}%</span>
                        <button 
                          onClick={() => handleKillProcess(process.pid, process.name)}
                          disabled={killingPid === process.pid}
                          className="kill-btn"
                          title="Force Kill Process"
                        >
                          <XCircle size={14} />
                          {killingPid === process.pid ? 'Killing...' : 'Kill'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>
                  No process data available.
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <footer className="footer fade-in delay-4">
        <p>Dashboard updates automatically every 5 seconds. Connects directly to python monitor logs.</p>
      </footer>
    </main>
  );
}
