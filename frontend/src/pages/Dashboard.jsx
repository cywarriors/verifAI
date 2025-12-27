import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Activity,
  Zap,
  Target,
  BarChart3,
  Sparkles,
  ExternalLink
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
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { scansAPI } from '../api/client';
import { formatDistanceToNow } from 'date-fns';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#22c55e',
};

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

// Animated counter hook
function useAnimatedCounter(end, duration = 1500) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  
  return count;
}

function StatCard({ icon: Icon, label, value, trend, trendUp, color, delay = 0 }) {
  const animatedValue = useAnimatedCounter(parseInt(value) || 0);
  
  return (
    <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-glow" style={{ background: color }} />
      <div className="stat-icon" style={{ '--stat-color': color }}>
        <Icon size={22} />
      </div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{animatedValue}</span>
        {trend && (
          <span className={`stat-trend ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </span>
        )}
      </div>
      <div className="stat-chart-mini">
        <svg viewBox="0 0 60 24" className="mini-chart">
          <path 
            d={trendUp 
              ? "M0,20 Q15,18 20,14 T40,8 T60,4" 
              : "M0,4 Q15,8 20,12 T40,18 T60,20"
            } 
            fill="none" 
            stroke={color} 
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </div>
    </div>
  );
}

function RecentScanItem({ scan, index }) {
  const statusConfig = {
    completed: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', label: 'Completed' },
    running: { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', label: 'Running' },
    failed: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Failed' },
    pending: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Pending' },
  };
  
  const status = statusConfig[scan.status] || statusConfig.pending;

  return (
    <Link 
      to={`/scans/${scan.id}`} 
      className="recent-scan-item"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="scan-status-badge" style={{ background: status.bg, color: status.color }}>
        {scan.status === 'running' ? (
          <div className="pulse-dot" style={{ background: status.color }} />
        ) : (
          <CheckCircle size={14} />
        )}
        <span>{status.label}</span>
      </div>
      <div className="scan-info">
        <span className="scan-name">{scan.name}</span>
        <span className="scan-model">{scan.model_name}</span>
      </div>
      <div className="scan-meta">
        <span className="scan-time">
          {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
        </span>
        <ArrowRight size={16} className="scan-arrow" />
      </div>
    </Link>
  );
}

function SecurityScoreRing({ score = 72 }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  return (
    <div className="security-score-ring">
      <svg viewBox="0 0 180 180">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="12"
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: 'stroke-dashoffset 1.5s ease-out',
          }}
        />
      </svg>
      <div className="score-content">
        <span className="score-value">{score}</span>
        <span className="score-label">Security Score</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: scans, isLoading } = useQuery({
    queryKey: ['scans'],
    queryFn: () => scansAPI.list({ limit: 5 }),
  });

  const completedScans = scans?.filter(s => s.status === 'completed').length || 0;
  const runningScans = scans?.filter(s => s.status === 'running').length || 0;
  const totalVulnerabilities = severityData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="dashboard">
      {/* Hero Stats */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h2 className="hero-title">
              <Sparkles className="hero-icon" size={24} />
              Welcome back
            </h2>
            <p className="hero-subtitle">
              Your AI systems are {completedScans > 0 ? 'being monitored' : 'ready for scanning'}. 
              {runningScans > 0 && ` ${runningScans} scan${runningScans > 1 ? 's' : ''} in progress.`}
            </p>
          </div>
          <Link to="/scans/create" className="hero-cta">
            <Zap size={18} />
            New Security Scan
          </Link>
        </div>
        <SecurityScoreRing score={72} />
      </div>
      
      {/* Stats Grid */}
      <div className="dashboard-stats">
        <StatCard 
          icon={Shield} 
          label="Total Scans" 
          value={scans?.length || 0}
          trend="+12%"
          trendUp={true}
          color="#06b6d4"
          delay={0}
        />
        <StatCard 
          icon={AlertTriangle} 
          label="Vulnerabilities" 
          value={totalVulnerabilities}
          trend="-8%"
          trendUp={false}
          color="#f59e0b"
          delay={100}
        />
        <StatCard 
          icon={CheckCircle} 
          label="Completed" 
          value={completedScans}
          trend="+5%"
          trendUp={true}
          color="#22c55e"
          delay={200}
        />
        <StatCard 
          icon={Target} 
          label="Models Tested" 
          value="8"
          trend="+3"
          trendUp={true}
          color="#8b5cf6"
          delay={300}
        />
      </div>
      
      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Vulnerability Trend Chart */}
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <div className="card-title-group">
              <BarChart3 size={18} className="card-icon" />
              <h3>Vulnerability Trend</h3>
            </div>
            <div className="card-actions">
              <span className="time-badge">Last 7 days</span>
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorVuln" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: 8 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="vulnerabilities" 
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#colorVuln)"
                  name="Vulnerabilities"
                />
                <Area 
                  type="monotone" 
                  dataKey="scans" 
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#colorScans)"
                  name="Scans"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Severity Distribution */}
        <div className="dashboard-card severity-card">
          <div className="card-header">
            <div className="card-title-group">
              <Target size={18} className="card-icon" />
              <h3>Severity Distribution</h3>
            </div>
          </div>
          <div className="card-body severity-content">
            <div className="severity-chart">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="severity-total">
                <span className="total-value">{totalVulnerabilities}</span>
                <span className="total-label">Total</span>
              </div>
            </div>
            <div className="severity-legend">
              {severityData.map((item) => (
                <div key={item.name} className="legend-item">
                  <div className="legend-color" style={{ background: item.color }} />
                  <span className="legend-name">{item.name}</span>
                  <span className="legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Recent Scans */}
        <div className="dashboard-card scans-card">
          <div className="card-header">
            <div className="card-title-group">
              <Activity size={18} className="card-icon" />
              <h3>Recent Scans</h3>
            </div>
            <Link to="/scans" className="card-link">
              View all <ExternalLink size={14} />
            </Link>
          </div>
          <div className="card-body scans-list">
            {isLoading ? (
              <div className="loading-skeleton">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-item" />
                ))}
              </div>
            ) : scans?.length > 0 ? (
              scans.map((scan, index) => (
                <RecentScanItem key={scan.id} scan={scan} index={index} />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <Activity size={40} />
                </div>
                <p className="empty-title">No scans yet</p>
                <p className="empty-desc">Run your first security scan to get started</p>
                <Link to="/scans/create" className="empty-cta">
                  <Zap size={16} />
                  Start Scanning
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Compliance Overview */}
        <div className="dashboard-card compliance-card">
          <div className="card-header">
            <div className="card-title-group">
              <Shield size={18} className="card-icon" />
              <h3>Compliance Status</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="compliance-grid">
              {[
                { name: 'NIST AI RMF', score: 78, color: '#06b6d4' },
                { name: 'ISO 42001', score: 65, color: '#f59e0b' },
                { name: 'EU AI Act', score: 82, color: '#22c55e' },
                { name: 'OWASP Top 10', score: 71, color: '#8b5cf6' },
              ].map((item) => (
                <div key={item.name} className="compliance-item">
                  <div className="compliance-header">
                    <span className="compliance-name">{item.name}</span>
                    <span className="compliance-score" style={{ color: item.color }}>
                      {item.score}%
                    </span>
                  </div>
                  <div className="compliance-bar">
                    <div 
                      className="compliance-fill" 
                      style={{ 
                        width: `${item.score}%`,
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <Link to="/compliance" className="compliance-link">
              View Full Compliance Report
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
      
      <style>{`
        .dashboard {
          animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Hero Section */
        .dashboard-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem 2.5rem;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          margin-bottom: 1.5rem;
          position: relative;
          overflow: hidden;
        }
        
        .dashboard-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
        }
        
        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .hero-text {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .hero-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }
        
        .hero-icon {
          color: #f59e0b;
          -webkit-text-fill-color: initial;
        }
        
        .hero-subtitle {
          font-size: 1rem;
          color: #94a3b8;
          margin: 0;
          max-width: 400px;
        }
        
        .hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          color: #030712;
          font-weight: 600;
          font-size: 0.9375rem;
          border-radius: 12px;
          width: fit-content;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
        }
        
        .hero-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(6, 182, 212, 0.4);
          color: #030712;
        }
        
        /* Security Score Ring */
        .security-score-ring {
          position: relative;
          width: 180px;
          height: 180px;
        }
        
        .score-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        
        .score-value {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #06b6d4 0%, #22c55e 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .score-label {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
        }
        
        /* Stats Grid */
        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        @media (max-width: 1200px) {
          .dashboard-stats { grid-template-columns: repeat(2, 1fr); }
        }
        
        @media (max-width: 600px) {
          .dashboard-stats { grid-template-columns: 1fr; }
        }
        
        .stat-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          overflow: hidden;
          animation: slideIn 0.5s ease backwards;
        }
        
        .stat-glow {
          position: absolute;
          top: -20px;
          right: -20px;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          filter: blur(40px);
          opacity: 0.15;
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: var(--stat-color);
        }
        
        .stat-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          z-index: 1;
        }
        
        .stat-label {
          font-size: 0.8125rem;
          color: #64748b;
        }
        
        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
        }
        
        .stat-trend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          margin-top: 4px;
        }
        
        .stat-trend.up { color: #22c55e; }
        .stat-trend.down { color: #ef4444; }
        
        .stat-chart-mini {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 60px;
          height: 24px;
          opacity: 0.5;
        }
        
        .mini-chart {
          width: 100%;
          height: 100%;
        }
        
        /* Dashboard Grid */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          grid-template-rows: auto auto;
          gap: 1.5rem;
        }
        
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .dashboard-card {
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
        }
        
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .card-title-group {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }
        
        .card-icon {
          color: #06b6d4;
        }
        
        .card-header h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
          color: #fff;
        }
        
        .time-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          color: #64748b;
        }
        
        .card-link {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: #06b6d4;
          transition: color 0.2s ease;
        }
        
        .card-link:hover {
          color: #22d3ee;
        }
        
        .card-body {
          padding: 1.5rem;
        }
        
        /* Chart Card */
        .chart-card {
          grid-column: 1;
          grid-row: 1;
        }
        
        /* Severity Card */
        .severity-card {
          grid-column: 2;
          grid-row: 1;
        }
        
        .severity-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .severity-chart {
          position: relative;
        }
        
        .severity-total {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        
        .total-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
        }
        
        .total-label {
          font-size: 0.75rem;
          color: #64748b;
        }
        
        .severity-legend {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }
        
        .legend-color {
          width: 10px;
          height: 10px;
          border-radius: 3px;
        }
        
        .legend-name {
          flex: 1;
          font-size: 0.8125rem;
          color: #94a3b8;
        }
        
        .legend-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #fff;
        }
        
        /* Scans Card */
        .scans-card {
          grid-column: 1;
          grid-row: 2;
        }
        
        .scans-list {
          padding: 0;
        }
        
        .recent-scan-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.15s ease;
          animation: slideIn 0.4s ease backwards;
        }
        
        .recent-scan-item:last-child {
          border-bottom: none;
        }
        
        .recent-scan-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        
        .scan-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        
        .scan-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        
        .scan-name {
          font-weight: 500;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .scan-model {
          font-size: 0.8125rem;
          color: #64748b;
        }
        
        .scan-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
        }
        
        .scan-time {
          font-size: 0.8125rem;
        }
        
        .scan-arrow {
          transition: transform 0.2s ease;
        }
        
        .recent-scan-item:hover .scan-arrow {
          transform: translateX(4px);
        }
        
        /* Compliance Card */
        .compliance-card {
          grid-column: 2;
          grid-row: 2;
        }
        
        .compliance-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .compliance-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .compliance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .compliance-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #e2e8f0;
        }
        
        .compliance-score {
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .compliance-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .compliance-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 1s ease-out;
        }
        
        .compliance-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1.25rem;
          padding: 0.875rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #94a3b8;
          transition: all 0.2s ease;
        }
        
        .compliance-link:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
        }
        
        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 3rem 1.5rem;
          text-align: center;
        }
        
        .empty-icon {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
          border-radius: 50%;
          color: #64748b;
          margin-bottom: 1.25rem;
        }
        
        .empty-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.375rem 0;
        }
        
        .empty-desc {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0 0 1.25rem 0;
        }
        
        .empty-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          color: #030712;
          font-weight: 600;
          font-size: 0.875rem;
          border-radius: 10px;
          transition: all 0.2s ease;
        }
        
        .empty-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
          color: #030712;
        }
        
        /* Loading Skeleton */
        .loading-skeleton {
          padding: 1rem 1.5rem;
        }
        
        .skeleton-item {
          height: 64px;
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%);
          background-size: 200% 100%;
          border-radius: 10px;
          margin-bottom: 0.75rem;
          animation: shimmer 1.5s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        @media (max-width: 1024px) {
          .chart-card,
          .severity-card,
          .scans-card,
          .compliance-card {
            grid-column: 1;
            grid-row: auto;
          }
          
          .dashboard-hero {
            flex-direction: column;
            gap: 2rem;
            text-align: center;
          }
          
          .hero-content {
            align-items: center;
          }
          
          .hero-subtitle {
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}
