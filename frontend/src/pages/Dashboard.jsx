import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  ArrowRight,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Header from '../components/Layout/Header';
import { scansAPI } from '../api/client';
import { formatDistanceToNow } from 'date-fns';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#10b981',
};

// Mock data for charts (would come from API in production)
const trendData = [
  { date: 'Mon', vulnerabilities: 12, scans: 3 },
  { date: 'Tue', vulnerabilities: 19, scans: 4 },
  { date: 'Wed', vulnerabilities: 8, scans: 2 },
  { date: 'Thu', vulnerabilities: 15, scans: 5 },
  { date: 'Fri', vulnerabilities: 22, scans: 4 },
  { date: 'Sat', vulnerabilities: 11, scans: 2 },
  { date: 'Sun', vulnerabilities: 7, scans: 1 },
];

const severityData = [
  { name: 'Critical', value: 3, color: SEVERITY_COLORS.critical },
  { name: 'High', value: 8, color: SEVERITY_COLORS.high },
  { name: 'Medium', value: 15, color: SEVERITY_COLORS.medium },
  { name: 'Low', value: 24, color: SEVERITY_COLORS.low },
];

function StatCard({ icon: Icon, label, value, trend, trendUp, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}15`, color }}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {trend && (
          <span className={`stat-trend ${trendUp ? 'up' : 'down'}`}>
            <TrendingUp size={14} style={{ transform: trendUp ? 'none' : 'rotate(180deg)' }} />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function RecentScanItem({ scan }) {
  const statusColors = {
    completed: 'var(--color-success)',
    running: 'var(--color-info)',
    failed: 'var(--color-danger)',
    pending: 'var(--color-warning)',
  };

  return (
    <Link to={`/scans/${scan.id}`} className="recent-scan-item">
      <div className="scan-status-dot" style={{ background: statusColors[scan.status] }} />
      <div className="scan-info">
        <span className="scan-name">{scan.name}</span>
        <span className="scan-model">{scan.model_name}</span>
      </div>
      <div className="scan-meta">
        <span className="scan-time">
          {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
        </span>
        <ArrowRight size={16} />
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { data: scans, isLoading } = useQuery({
    queryKey: ['scans'],
    queryFn: () => scansAPI.list({ limit: 5 }),
  });

  const completedScans = scans?.filter(s => s.status === 'completed').length || 0;
  const runningScans = scans?.filter(s => s.status === 'running').length || 0;

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Overview of your LLM security posture"
      />
      
      <div className="dashboard">
        <div className="dashboard-stats">
          <StatCard 
            icon={Shield} 
            label="Total Scans" 
            value={scans?.length || 0}
            trend="+12%"
            trendUp={true}
            color="var(--color-accent)"
          />
          <StatCard 
            icon={AlertTriangle} 
            label="Vulnerabilities" 
            value="50"
            trend="-8%"
            trendUp={false}
            color="var(--color-warning)"
          />
          <StatCard 
            icon={CheckCircle} 
            label="Completed" 
            value={completedScans}
            color="var(--color-success)"
          />
          <StatCard 
            icon={Clock} 
            label="Running" 
            value={runningScans}
            color="var(--color-info)"
          />
        </div>
        
        <div className="dashboard-grid">
          <div className="card dashboard-chart">
            <div className="card-header">
              <h3>Vulnerability Trend</h3>
              <span className="text-muted">Last 7 days</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorVuln" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="vulnerabilities" 
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                    fill="url(#colorVuln)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="card dashboard-severity">
            <div className="card-header">
              <h3>Severity Distribution</h3>
            </div>
            <div className="card-body severity-chart-container">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="severity-legend">
                {severityData.map((item) => (
                  <div key={item.name} className="severity-legend-item">
                    <span className="severity-dot" style={{ background: item.color }} />
                    <span className="severity-name">{item.name}</span>
                    <span className="severity-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="card dashboard-recent">
            <div className="card-header">
              <h3>Recent Scans</h3>
              <Link to="/scans" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            <div className="card-body recent-scans-list">
              {isLoading ? (
                <div className="skeleton-list">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton skeleton-text" style={{ height: 48, marginBottom: 8 }} />
                  ))}
                </div>
              ) : scans?.length > 0 ? (
                scans.map(scan => (
                  <RecentScanItem key={scan.id} scan={scan} />
                ))
              ) : (
                <div className="empty-state">
                  <Activity size={32} />
                  <p>No scans yet</p>
                  <Link to="/scans/create" className="btn btn-primary btn-sm">
                    Run your first scan
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          <div className="card dashboard-compliance">
            <div className="card-header">
              <h3>Compliance Status</h3>
            </div>
            <div className="card-body">
              <div className="compliance-items">
                <div className="compliance-item">
                  <div className="compliance-info">
                    <span className="compliance-name">NIST AI RMF</span>
                    <span className="compliance-score">78%</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: '78%' }} />
                  </div>
                </div>
                <div className="compliance-item">
                  <div className="compliance-info">
                    <span className="compliance-name">ISO 42001</span>
                    <span className="compliance-score">65%</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar progress-bar-warning" style={{ width: '65%' }} />
                  </div>
                </div>
                <div className="compliance-item">
                  <div className="compliance-info">
                    <span className="compliance-name">EU AI Act</span>
                    <span className="compliance-score">82%</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar progress-bar-success" style={{ width: '82%' }} />
                  </div>
                </div>
              </div>
              <Link to="/compliance" className="btn btn-secondary" style={{ marginTop: 'var(--space-md)', width: '100%' }}>
                View Full Report
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .dashboard {
          padding: var(--space-xl);
          animation: fadeIn var(--transition-base);
        }
        
        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }
        
        @media (max-width: 1200px) {
          .dashboard-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 600px) {
          .dashboard-stats {
            grid-template-columns: 1fr;
          }
        }
        
        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-lg);
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
        }
        
        .stat-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
        }
        
        .stat-content {
          display: flex;
          flex-direction: column;
        }
        
        .stat-label {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          margin-bottom: 2px;
        }
        
        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          line-height: 1;
        }
        
        .stat-trend {
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: 0.75rem;
          margin-top: var(--space-xs);
        }
        
        .stat-trend.up { color: var(--color-success); }
        .stat-trend.down { color: var(--color-danger); }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          grid-template-rows: auto auto;
          gap: var(--space-lg);
        }
        
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .dashboard-chart {
          grid-column: 1;
          grid-row: 1;
        }
        
        .dashboard-severity {
          grid-column: 2;
          grid-row: 1;
        }
        
        .dashboard-recent {
          grid-column: 1;
          grid-row: 2;
        }
        
        .dashboard-compliance {
          grid-column: 2;
          grid-row: 2;
        }
        
        @media (max-width: 1024px) {
          .dashboard-chart,
          .dashboard-severity,
          .dashboard-recent,
          .dashboard-compliance {
            grid-column: 1;
            grid-row: auto;
          }
        }
        
        .severity-chart-container {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        
        .severity-legend {
          flex: 1;
        }
        
        .severity-legend-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-xs) 0;
        }
        
        .severity-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        
        .severity-name {
          flex: 1;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }
        
        .severity-value {
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .recent-scans-list {
          padding: 0;
        }
        
        .recent-scan-item {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-md);
          border-bottom: 1px solid var(--color-border);
          transition: background var(--transition-fast);
        }
        
        .recent-scan-item:last-child {
          border-bottom: none;
        }
        
        .recent-scan-item:hover {
          background: var(--color-bg-hover);
        }
        
        .scan-status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .scan-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        
        .scan-name {
          font-weight: 500;
          color: var(--color-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .scan-model {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }
        
        .scan-meta {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--color-text-muted);
        }
        
        .scan-time {
          font-size: 0.8125rem;
        }
        
        .compliance-items {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        
        .compliance-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }
        
        .compliance-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .compliance-name {
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .compliance-score {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-accent);
        }
        
        .empty-state {
          padding: var(--space-xl);
        }
      `}</style>
    </>
  );
}
