import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  FileCheck,
  Award,
  TrendingUp,
  Globe,
  Scale,
  Building2,
  Wifi,
  Lock,
  ExternalLink,
  Info,
  BarChart3,
  PieChart,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { scansAPI, complianceAPI } from '../api/client';

const FRAMEWORKS = [
  { 
    id: 'nist_ai_rmf', 
    name: 'NIST AI RMF', 
    fullName: 'AI Risk Management Framework',
    description: 'Comprehensive framework for managing AI risks throughout the AI lifecycle',
    icon: Shield,
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    region: 'United States'
  },
  { 
    id: 'iso_42001', 
    name: 'ISO/IEC 42001', 
    fullName: 'AI Management System',
    description: 'International standard for establishing an AI management system',
    icon: Award,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    region: 'International'
  },
  { 
    id: 'eu_ai_act', 
    name: 'EU AI Act', 
    fullName: 'Artificial Intelligence Act',
    description: 'European regulation on artificial intelligence with risk-based approach',
    icon: Scale,
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    region: 'European Union'
  },
  { 
    id: 'india_dpdp', 
    name: 'India DPDP', 
    fullName: 'Digital Personal Data Protection',
    description: 'India\'s framework for personal data protection and AI governance',
    icon: Lock,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    region: 'India'
  },
  { 
    id: 'telecom_iot', 
    name: 'Telecom/IoT', 
    fullName: 'Telecom & IoT Security',
    description: 'Security standards for telecommunications and IoT AI systems',
    icon: Wifi,
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    region: 'Global'
  },
];

const STATUS_CONFIG = {
  compliant: { 
    icon: CheckCircle, 
    color: '#22c55e', 
    bg: 'rgba(34, 197, 94, 0.1)', 
    border: 'rgba(34, 197, 94, 0.3)',
    label: 'Compliant',
    glow: '0 0 20px rgba(34, 197, 94, 0.3)'
  },
  partial: { 
    icon: AlertTriangle, 
    color: '#f59e0b', 
    bg: 'rgba(245, 158, 11, 0.1)', 
    border: 'rgba(245, 158, 11, 0.3)',
    label: 'Partial',
    glow: '0 0 20px rgba(245, 158, 11, 0.3)'
  },
  non_compliant: { 
    icon: XCircle, 
    color: '#ef4444', 
    bg: 'rgba(239, 68, 68, 0.1)', 
    border: 'rgba(239, 68, 68, 0.3)',
    label: 'Non-Compliant',
    glow: '0 0 20px rgba(239, 68, 68, 0.3)'
  },
  not_assessed: { 
    icon: Info, 
    color: '#64748b', 
    bg: 'rgba(100, 116, 139, 0.1)', 
    border: 'rgba(100, 116, 139, 0.3)',
    label: 'Not Assessed',
    glow: 'none'
  },
};

function AnimatedCounter({ value, duration = 1000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
}

function ComplianceGauge({ percentage, color, size = 140, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animatedOffset, setAnimatedOffset] = useState(circumference);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedOffset(circumference - (percentage / 100) * circumference);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);
  
  return (
    <div className="compliance-gauge" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gauge-gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#gauge-gradient-${color})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 10px ${color}40)`,
          }}
        />
        {/* Center glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - strokeWidth}
          fill={`${color}08`}
        />
      </svg>
      <div className="gauge-content">
        <span className="gauge-value" style={{ color }}>{percentage}%</span>
        <span className="gauge-label">Compliance</span>
      </div>
    </div>
  );
}

function MiniGauge({ percentage, color, size = 56 }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="mini-gauge" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: 'stroke-dashoffset 0.8s ease-out',
          }}
        />
      </svg>
      <span className="mini-gauge-value" style={{ color }}>{percentage}%</span>
    </div>
  );
}

function FrameworkCard({ framework, data, isSelected, onClick }) {
  const Icon = framework.icon;
  const percentage = data?.total > 0 
    ? Math.round((data.passed / data.total) * 100) 
    : 0;

  return (
    <div 
      className={`framework-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ '--fw-color': framework.color, '--fw-gradient': framework.gradient }}
    >
      <div className="fw-header">
        <div className="fw-icon">
          <Icon size={22} />
        </div>
        <MiniGauge percentage={percentage} color={framework.color} />
      </div>
      
      <div className="fw-content">
        <h3 className="fw-name">{framework.name}</h3>
        <p className="fw-fullname">{framework.fullName}</p>
        <div className="fw-region">
          <Globe size={12} />
          <span>{framework.region}</span>
        </div>
      </div>
      
      <div className="fw-footer">
        <div className="fw-stat">
          <span className="fw-stat-value">{data?.passed || 0}</span>
          <span className="fw-stat-label">Passed</span>
        </div>
        <div className="fw-stat-divider" />
        <div className="fw-stat">
          <span className="fw-stat-value">{data?.failed || 0}</span>
          <span className="fw-stat-label">Failed</span>
        </div>
        <div className="fw-stat-divider" />
        <div className="fw-stat">
          <span className="fw-stat-value">{data?.total || 0}</span>
          <span className="fw-stat-label">Total</span>
        </div>
      </div>
      
      <div className="fw-selection-indicator" />
    </div>
  );
}

function RequirementCard({ requirement, isExpanded, onToggle }) {
  const status = STATUS_CONFIG[requirement.compliance_status] || STATUS_CONFIG.not_assessed;
  const StatusIcon = status.icon;

  return (
    <div 
      className={`requirement-card ${isExpanded ? 'expanded' : ''}`}
      style={{ '--status-color': status.color, '--status-bg': status.bg, '--status-border': status.border }}
    >
      <div className="req-header" onClick={onToggle}>
        <div className="req-status-icon">
          <StatusIcon size={18} />
        </div>
        
        <div className="req-info">
          <div className="req-id">{requirement.requirement_id}</div>
          <div className="req-name">{requirement.requirement_name}</div>
        </div>
        
        <div className="req-status-badge">
          <StatusIcon size={14} />
          <span>{status.label}</span>
        </div>
        
        <button className="req-expand-btn">
          <ChevronDown size={18} className={isExpanded ? 'rotated' : ''} />
        </button>
      </div>
      
      {isExpanded && (
        <div className="req-body">
          {requirement.description && (
            <div className="req-section">
              <h5>Description</h5>
              <p>{requirement.description}</p>
            </div>
          )}
          {requirement.evidence && (
            <div className="req-section">
              <h5>Evidence</h5>
              <p>{requirement.evidence}</p>
            </div>
          )}
          {requirement.remediation && (
            <div className="req-section remediation">
              <h5>Remediation</h5>
              <p>{requirement.remediation}</p>
            </div>
          )}
          {requirement.reference_url && (
            <a href={requirement.reference_url} target="_blank" rel="noopener noreferrer" className="req-reference">
              <ExternalLink size={14} />
              <span>View Reference Documentation</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function StatusSummaryBar({ mappings }) {
  if (!mappings || mappings.length === 0) return null;
  
  const counts = mappings.reduce((acc, m) => {
    const status = m.compliance_status || 'not_assessed';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  const total = mappings.length;
  
  return (
    <div className="status-summary-bar">
      <div className="status-bar-track">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const count = counts[key] || 0;
          const percent = (count / total) * 100;
          if (percent === 0) return null;
          return (
            <div 
              key={key}
              className="status-bar-segment"
              style={{ 
                width: `${percent}%`, 
                background: config.color,
              }}
              title={`${config.label}: ${count}`}
            />
          );
        })}
      </div>
      <div className="status-bar-legend">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const count = counts[key] || 0;
          if (count === 0) return null;
          return (
            <div key={key} className="status-legend-item">
              <span className="legend-dot" style={{ background: config.color }} />
              <span className="legend-label">{config.label}</span>
              <span className="legend-count">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Compliance() {
  const [searchParams] = useSearchParams();
  const scanId = searchParams.get('scan');
  const [selectedFramework, setSelectedFramework] = useState('nist_ai_rmf');
  const [expandedReq, setExpandedReq] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: scans } = useQuery({
    queryKey: ['scans', 'completed'],
    queryFn: () => scansAPI.list({ status_filter: 'completed' }),
  });

  const [selectedScan, setSelectedScan] = useState(scanId || '');

  const { data: complianceSummary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['compliance-summary', selectedScan],
    queryFn: () => complianceAPI.getSummary(selectedScan),
    enabled: !!selectedScan,
  });

  const { data: mappings, isLoading: mappingsLoading } = useQuery({
    queryKey: ['compliance-mappings', selectedScan, selectedFramework],
    queryFn: () => complianceAPI.getMappings(selectedScan, selectedFramework),
    enabled: !!selectedScan && !!selectedFramework,
  });

  const filteredMappings = mappings?.filter(m => 
    !statusFilter || m.compliance_status === statusFilter
  );

  // Calculate overall compliance
  const overallStats = FRAMEWORKS.reduce((acc, fw) => {
    const data = complianceSummary?.[fw.id];
    if (data) {
      acc.passed += data.passed || 0;
      acc.total += data.total || 0;
    }
    return acc;
  }, { passed: 0, total: 0 });
  const overallPercentage = overallStats.total > 0 
    ? Math.round((overallStats.passed / overallStats.total) * 100) 
    : 0;

  const selectedFrameworkData = FRAMEWORKS.find(f => f.id === selectedFramework);

  return (
    <div className="compliance-page">
      {/* Hero Section */}
      <div className="compliance-hero">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>AI Governance</span>
          </div>
          <h1 className="hero-title">Compliance Dashboard</h1>
          <p className="hero-subtitle">
            Track and manage compliance across global AI security frameworks and regulations
          </p>
          
          <div className="hero-stats-row">
            <div className="hero-stat">
              <PieChart size={18} />
              <span className="stat-value">{FRAMEWORKS.length}</span>
              <span className="stat-label">Frameworks</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <BarChart3 size={18} />
              <span className="stat-value">{overallStats.total}</span>
              <span className="stat-label">Requirements</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <CheckCircle size={18} />
              <span className="stat-value">{overallStats.passed}</span>
              <span className="stat-label">Passed</span>
            </div>
          </div>
        </div>
        
        {selectedScan && complianceSummary && (
          <div className="hero-gauge">
            <ComplianceGauge percentage={overallPercentage} color="#22c55e" size={160} strokeWidth={14} />
          </div>
        )}
      </div>

      {/* Scan Selector */}
      <div className="scan-selector">
        <div className="selector-left">
          <div className="selector-icon">
            <FileCheck size={20} />
          </div>
          <div className="selector-info">
            <h3>Select Security Scan</h3>
            <p>Choose a completed scan to analyze compliance</p>
          </div>
        </div>
        
        <div className="selector-controls">
          <div className="select-wrapper">
            <select 
              value={selectedScan}
              onChange={(e) => setSelectedScan(e.target.value)}
              className="scan-select"
            >
              <option value="">Select a completed scan...</option>
              {scans?.map(scan => (
                <option key={scan.id} value={scan.id}>
                  {scan.name} — {scan.model_name}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="select-chevron" />
          </div>
          
          {selectedScan && (
            <>
              <button className="action-btn refresh" onClick={() => refetchSummary()} title="Refresh">
                <RefreshCw size={18} />
              </button>
              <button className="action-btn export">
                <Download size={18} />
                <span>Export Report</span>
              </button>
            </>
          )}
        </div>
      </div>

      {!selectedScan ? (
        <div className="empty-state">
          <div className="empty-illustration">
            <div className="empty-circle">
              <Shield size={48} />
            </div>
            <div className="empty-orbit" />
          </div>
          <h3>No Scan Selected</h3>
          <p>Select a completed security scan from the dropdown above to view detailed compliance analysis across multiple frameworks.</p>
        </div>
      ) : summaryLoading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Analyzing compliance data...</p>
        </div>
      ) : (
        <>
          {/* Frameworks Grid */}
          <div className="section-header">
            <h2>Compliance Frameworks</h2>
            <p>Select a framework to view detailed requirements</p>
          </div>
          
          <div className="frameworks-grid">
            {FRAMEWORKS.map(framework => (
              <FrameworkCard
                key={framework.id}
                framework={framework}
                data={complianceSummary?.[framework.id]}
                isSelected={selectedFramework === framework.id}
                onClick={() => setSelectedFramework(framework.id)}
              />
            ))}
          </div>

          {/* Requirements Section */}
          <div className="requirements-panel">
            <div className="panel-header">
              <div className="panel-title-section">
                <div 
                  className="panel-icon"
                  style={{ background: selectedFrameworkData?.gradient }}
                >
                  {selectedFrameworkData && <selectedFrameworkData.icon size={20} />}
                </div>
                <div>
                  <h2>{selectedFrameworkData?.name}</h2>
                  <p>{selectedFrameworkData?.fullName}</p>
                </div>
              </div>
              
              <div className="panel-controls">
                <div className="filter-wrapper">
                  <Filter size={16} />
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="compliant">Compliant</option>
                    <option value="partial">Partial</option>
                    <option value="non_compliant">Non-Compliant</option>
                    <option value="not_assessed">Not Assessed</option>
                  </select>
                </div>
                <span className="requirement-count">
                  {filteredMappings?.length || 0} requirements
                </span>
              </div>
            </div>
            
            <StatusSummaryBar mappings={mappings} />

            <div className="requirements-list">
              {mappingsLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton-card" />
                ))
              ) : filteredMappings?.length > 0 ? (
                filteredMappings.map(req => (
                  <RequirementCard
                    key={req.id}
                    requirement={req}
                    isExpanded={expandedReq === req.id}
                    onToggle={() => setExpandedReq(expandedReq === req.id ? null : req.id)}
                  />
                ))
              ) : (
                <div className="empty-requirements">
                  <CheckCircle size={44} />
                  <h4>No requirements found</h4>
                  <p>
                    {statusFilter 
                      ? 'No requirements match the selected filter.'
                      : 'No compliance mappings available for this framework.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      <style>{`
        .compliance-page {
          animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Hero Section */
        .compliance-hero {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2.5rem 3rem;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(6, 182, 212, 0.04) 50%, rgba(139, 92, 246, 0.04) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 24px;
          margin-bottom: 1.5rem;
          overflow: hidden;
        }
        
        .hero-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          pointer-events: none;
        }
        
        .hero-glow-1 {
          width: 300px;
          height: 300px;
          background: rgba(34, 197, 94, 0.3);
          top: -100px;
          left: -100px;
        }
        
        .hero-glow-2 {
          width: 200px;
          height: 200px;
          background: rgba(139, 92, 246, 0.3);
          bottom: -50px;
          right: 20%;
        }
        
        .hero-content {
          position: relative;
          z-index: 1;
        }
        
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 20px;
          color: #22c55e;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        
        .hero-title {
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        }
        
        .hero-subtitle {
          font-size: 1rem;
          color: #94a3b8;
          margin: 0 0 1.5rem 0;
          max-width: 450px;
          line-height: 1.6;
        }
        
        .hero-stats-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .hero-stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
        }
        
        .hero-stat svg {
          color: #22c55e;
        }
        
        .hero-stat .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
        }
        
        .hero-stat .stat-label {
          font-size: 0.875rem;
        }
        
        .hero-stat-divider {
          width: 1px;
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .hero-gauge {
          position: relative;
          z-index: 1;
        }
        
        /* Compliance Gauge */
        .compliance-gauge {
          position: relative;
        }
        
        .gauge-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        
        .gauge-value {
          display: block;
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        
        .gauge-label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        /* Mini Gauge */
        .mini-gauge {
          position: relative;
        }
        
        .mini-gauge-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.75rem;
          font-weight: 700;
        }
        
        /* Scan Selector */
        .scan-selector {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          padding: 1.25rem 1.5rem;
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          margin-bottom: 1.5rem;
        }
        
        .selector-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .selector-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(6, 182, 212, 0.15);
          border: 1px solid rgba(6, 182, 212, 0.3);
          border-radius: 12px;
          color: #22d3ee;
        }
        
        .selector-info h3 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.125rem 0;
        }
        
        .selector-info p {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0;
        }
        
        .selector-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .select-wrapper {
          position: relative;
          min-width: 320px;
        }
        
        .scan-select {
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 0.9375rem;
          color: #fff;
          appearance: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .scan-select:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        .scan-select:focus {
          outline: none;
          border-color: rgba(6, 182, 212, 0.5);
        }
        
        .select-chevron {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        
        .action-btn.refresh {
          padding: 0.75rem;
        }
        
        .action-btn.export {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border-color: transparent;
          color: #fff;
        }
        
        .action-btn.export:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
        }
        
        /* Section Header */
        .section-header {
          margin-bottom: 1rem;
        }
        
        .section-header h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.25rem 0;
        }
        
        .section-header p {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }
        
        /* Frameworks Grid */
        .frameworks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .framework-card {
          position: relative;
          padding: 1.25rem;
          background: rgba(17, 24, 39, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.25s ease;
          overflow: hidden;
        }
        
        .framework-card:hover {
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(-3px);
        }
        
        .framework-card.selected {
          border-color: var(--fw-color);
        }
        
        .framework-card.selected::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--fw-gradient);
          opacity: 0.05;
          pointer-events: none;
        }
        
        .fw-selection-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--fw-gradient);
          transform: scaleX(0);
          transition: transform 0.25s ease;
        }
        
        .framework-card.selected .fw-selection-indicator {
          transform: scaleX(1);
        }
        
        .fw-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .fw-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--fw-gradient);
          border-radius: 12px;
          color: white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .fw-content {
          margin-bottom: 1rem;
        }
        
        .fw-name {
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.25rem 0;
        }
        
        .fw-fullname {
          font-size: 0.8125rem;
          color: #94a3b8;
          margin: 0 0 0.5rem 0;
        }
        
        .fw-region {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          font-size: 0.6875rem;
          color: #64748b;
        }
        
        .fw-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .fw-stat {
          text-align: center;
          flex: 1;
        }
        
        .fw-stat-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
        }
        
        .fw-stat-label {
          font-size: 0.6875rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .fw-stat-divider {
          width: 1px;
          height: 28px;
          background: rgba(255, 255, 255, 0.08);
        }
        
        /* Requirements Panel */
        .requirements-panel {
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
        }
        
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .panel-title-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .panel-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: white;
        }
        
        .panel-title-section h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.125rem 0;
        }
        
        .panel-title-section p {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0;
        }
        
        .panel-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .filter-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
        }
        
        .filter-select {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 0.875rem;
          color: #fff;
          min-width: 140px;
          cursor: pointer;
        }
        
        .filter-select:focus {
          outline: none;
          border-color: rgba(6, 182, 212, 0.5);
        }
        
        .requirement-count {
          font-size: 0.8125rem;
          color: #64748b;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
        }
        
        /* Status Summary Bar */
        .status-summary-bar {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .status-bar-track {
          display: flex;
          height: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.75rem;
        }
        
        .status-bar-segment {
          transition: width 0.5s ease;
        }
        
        .status-bar-segment:first-child {
          border-radius: 4px 0 0 4px;
        }
        
        .status-bar-segment:last-child {
          border-radius: 0 4px 4px 0;
        }
        
        .status-bar-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .status-legend-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: #94a3b8;
        }
        
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .legend-count {
          color: #64748b;
        }
        
        /* Requirements List */
        .requirements-list {
          max-height: 600px;
          overflow-y: auto;
          padding: 0.5rem;
        }
        
        .requirement-card {
          margin-bottom: 0.5rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          transition: all 0.2s ease;
        }
        
        .requirement-card:hover {
          background: rgba(255, 255, 255, 0.04);
        }
        
        .requirement-card.expanded {
          border-color: var(--status-border);
          background: var(--status-bg);
        }
        
        .req-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          cursor: pointer;
        }
        
        .req-status-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--status-bg);
          border: 1px solid var(--status-border);
          border-radius: 10px;
          color: var(--status-color);
          flex-shrink: 0;
        }
        
        .req-info {
          flex: 1;
          min-width: 0;
        }
        
        .req-id {
          font-size: 0.6875rem;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          color: #64748b;
          margin-bottom: 0.125rem;
        }
        
        .req-name {
          font-size: 0.9375rem;
          font-weight: 500;
          color: #e2e8f0;
          line-height: 1.4;
        }
        
        .req-status-badge {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: var(--status-bg);
          border: 1px solid var(--status-border);
          border-radius: 20px;
          color: var(--status-color);
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }
        
        .req-expand-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .req-expand-btn:hover {
          color: #fff;
        }
        
        .req-expand-btn svg {
          transition: transform 0.2s ease;
        }
        
        .req-expand-btn svg.rotated {
          transform: rotate(180deg);
        }
        
        .req-body {
          padding: 0 1.25rem 1.25rem;
          padding-left: calc(1.25rem + 36px + 1rem);
          animation: slideDown 0.2s ease;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .req-section {
          margin-bottom: 1rem;
        }
        
        .req-section:last-child {
          margin-bottom: 0;
        }
        
        .req-section h5 {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 0.5rem 0;
        }
        
        .req-section p {
          font-size: 0.875rem;
          color: #94a3b8;
          line-height: 1.7;
          margin: 0;
        }
        
        .req-section.remediation {
          padding: 0.75rem;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 8px;
        }
        
        .req-section.remediation h5 {
          color: #22c55e;
        }
        
        .req-reference {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.2);
          border-radius: 6px;
          color: #22d3ee;
          font-size: 0.8125rem;
          transition: all 0.15s ease;
        }
        
        .req-reference:hover {
          background: rgba(6, 182, 212, 0.15);
          color: #22d3ee;
        }
        
        /* Empty States */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 5rem 2rem;
          text-align: center;
        }
        
        .empty-illustration {
          position: relative;
          width: 120px;
          height: 120px;
          margin-bottom: 2rem;
        }
        
        .empty-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
          border: 2px solid rgba(34, 197, 94, 0.2);
          border-radius: 50%;
          color: #22c55e;
        }
        
        .empty-orbit {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 2px dashed rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: orbit-spin 20s linear infinite;
        }
        
        @keyframes orbit-spin {
          to { transform: rotate(360deg); }
        }
        
        .empty-state h3 {
          font-size: 1.375rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.75rem 0;
        }
        
        .empty-state p {
          font-size: 0.9375rem;
          color: #64748b;
          margin: 0;
          max-width: 400px;
          line-height: 1.6;
        }
        
        .empty-requirements {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 3rem 2rem;
          text-align: center;
          color: #64748b;
        }
        
        .empty-requirements svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }
        
        .empty-requirements h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.5rem 0;
        }
        
        .empty-requirements p {
          font-size: 0.875rem;
          margin: 0;
        }
        
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem;
          gap: 1rem;
        }
        
        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: #22c55e;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .loading-state p {
          color: #64748b;
          font-size: 0.9375rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .skeleton-card {
          height: 72px;
          margin-bottom: 0.5rem;
          background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 100%);
          background-size: 200% 100%;
          border-radius: 12px;
          animation: shimmer 1.5s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        @media (max-width: 1024px) {
          .compliance-hero {
            flex-direction: column;
            gap: 2rem;
            text-align: center;
            padding: 2rem;
          }
          
          .hero-content {
            align-items: center;
          }
          
          .hero-subtitle {
            max-width: none;
          }
          
          .scan-selector {
            flex-direction: column;
            align-items: stretch;
          }
          
          .selector-left {
            justify-content: center;
          }
          
          .selector-controls {
            flex-direction: column;
          }
          
          .select-wrapper {
            min-width: 100%;
          }
          
          .panel-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
          
          .panel-controls {
            width: 100%;
            justify-content: space-between;
          }
        }
        
        @media (max-width: 640px) {
          .hero-stats-row {
            flex-direction: column;
            gap: 1rem;
          }
          
          .hero-stat-divider {
            display: none;
          }
          
          .frameworks-grid {
            grid-template-columns: 1fr;
          }
          
          .req-status-badge span {
            display: none;
          }
          
          .req-status-badge {
            padding: 0.375rem;
          }
        }
      `}</style>
    </div>
  );
}
