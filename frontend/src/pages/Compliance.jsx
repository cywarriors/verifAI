import React, { useState } from 'react';
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
  TrendingUp
} from 'lucide-react';
import { scansAPI, complianceAPI } from '../api/client';

const FRAMEWORKS = [
  { id: 'nist_ai_rmf', name: 'NIST AI RMF', description: 'National Institute of Standards and Technology AI Risk Management Framework', color: '#06b6d4' },
  { id: 'iso_42001', name: 'ISO/IEC 42001', description: 'AI Management System Standard', color: '#8b5cf6' },
  { id: 'eu_ai_act', name: 'EU AI Act', description: 'European Union Artificial Intelligence Act', color: '#22c55e' },
  { id: 'india_dpdp', name: 'India DPDP', description: 'Digital Personal Data Protection Act', color: '#f59e0b' },
  { id: 'telecom_iot', name: 'Telecom/IoT', description: 'Telecommunications and IoT Security Standards', color: '#ef4444' },
];

const STATUS_ICONS = {
  compliant: { icon: CheckCircle, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', label: 'Compliant' },
  partial: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Partial' },
  non_compliant: { icon: XCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Non-Compliant' },
  not_assessed: { icon: Shield, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', label: 'Not Assessed' },
};

function RequirementRow({ requirement, isExpanded, onToggle }) {
  const status = STATUS_ICONS[requirement.compliance_status] || STATUS_ICONS.not_assessed;
  const StatusIcon = status.icon;

  return (
    <div className="requirement-row">
      <div className="requirement-header" onClick={onToggle}>
        <div className="requirement-status" style={{ background: status.bg, color: status.color }}>
          <StatusIcon size={16} />
        </div>
        <div className="requirement-info">
          <span className="requirement-id">{requirement.requirement_id}</span>
          <span className="requirement-name">{requirement.requirement_name}</span>
        </div>
        <div className="requirement-badge" style={{ background: status.bg, color: status.color }}>
          {status.label}
        </div>
        <div className="requirement-toggle">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </div>
      
      {isExpanded && requirement.evidence && (
        <div className="requirement-body">
          <div className="requirement-evidence">
            <h5>Evidence</h5>
            <p>{requirement.evidence}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ComplianceRing({ percentage, color, size = 100 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="compliance-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: 'stroke-dashoffset 1s ease-out',
          }}
        />
      </svg>
      <div className="ring-content">
        <span className="ring-value" style={{ color }}>{percentage}%</span>
      </div>
    </div>
  );
}

function FrameworkCard({ framework, data, isSelected, onClick }) {
  const percentage = data?.total > 0 
    ? Math.round((data.passed / data.total) * 100) 
    : 0;

  return (
    <div 
      className={`framework-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ '--framework-color': framework.color }}
    >
      <div className="framework-top">
        <div className="framework-icon" style={{ background: `${framework.color}20`, color: framework.color }}>
          <FileCheck size={20} />
        </div>
        <ComplianceRing percentage={percentage} color={framework.color} size={70} />
      </div>
      <h3 className="framework-name">{framework.name}</h3>
      <p className="framework-description">{framework.description}</p>
      <div className="framework-stats">
        <div className="framework-stat">
          <span className="stat-value">{data?.passed || 0}</span>
          <span className="stat-label">Passed</span>
        </div>
        <div className="framework-divider" />
        <div className="framework-stat">
          <span className="stat-value">{data?.total || 0}</span>
          <span className="stat-label">Total</span>
        </div>
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

  // Get list of completed scans for selection
  const { data: scans } = useQuery({
    queryKey: ['scans', 'completed'],
    queryFn: () => scansAPI.list({ status_filter: 'completed' }),
  });

  const [selectedScan, setSelectedScan] = useState(scanId || '');

  // Get compliance summary for selected scan
  const { data: complianceSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['compliance-summary', selectedScan],
    queryFn: () => complianceAPI.getSummary(selectedScan),
    enabled: !!selectedScan,
  });

  // Get detailed mappings for selected framework
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

  return (
    <div className="compliance-page">
      {/* Hero Section */}
      <div className="compliance-hero">
        <div className="hero-content">
          <div className="hero-icon">
            <Award size={32} />
          </div>
          <div className="hero-text">
            <h1 className="hero-title">Compliance Dashboard</h1>
            <p className="hero-subtitle">Track compliance against major AI security frameworks and regulations</p>
          </div>
        </div>
        {selectedScan && complianceSummary && (
          <div className="hero-stats">
            <div className="overall-score">
              <ComplianceRing percentage={overallPercentage} color="#06b6d4" size={100} />
              <span className="overall-label">Overall Compliance</span>
            </div>
          </div>
        )}
      </div>

      {/* Scan Selector */}
      <div className="scan-selector-card">
        <div className="selector-header">
          <Shield size={20} className="selector-icon" />
          <div className="selector-text">
            <h3>Select Scan</h3>
            <p>Choose a completed scan to view its compliance report</p>
          </div>
        </div>
        <div className="selector-dropdown">
          <select 
            className="scan-select"
            value={selectedScan}
            onChange={(e) => setSelectedScan(e.target.value)}
          >
            <option value="">Choose a completed scan...</option>
            {scans?.map(scan => (
              <option key={scan.id} value={scan.id}>
                {scan.name} - {scan.model_name}
              </option>
            ))}
          </select>
          <ChevronDown size={18} className="select-chevron" />
        </div>
        {selectedScan && (
          <button className="export-btn">
            <Download size={18} />
            Export Report
          </button>
        )}
      </div>

      {!selectedScan ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Shield size={56} />
          </div>
          <h3>No Scan Selected</h3>
          <p>Select a completed scan from the dropdown above to view its compliance report against various security frameworks.</p>
        </div>
      ) : summaryLoading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading compliance data...</p>
        </div>
      ) : (
        <>
          {/* Frameworks Grid */}
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
          <div className="requirements-section">
            <div className="requirements-header">
              <div className="req-header-left">
                <h2>{FRAMEWORKS.find(f => f.id === selectedFramework)?.name} Requirements</h2>
                <span className="req-count">{filteredMappings?.length || 0} requirements</span>
              </div>
              <div className="requirements-filters">
                <Filter size={16} className="filter-icon" />
                <select 
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="compliant">Compliant</option>
                  <option value="partial">Partial</option>
                  <option value="non_compliant">Non-Compliant</option>
                  <option value="not_assessed">Not Assessed</option>
                </select>
              </div>
            </div>

            <div className="requirements-list">
              {mappingsLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton-row" />
                ))
              ) : filteredMappings?.length > 0 ? (
                filteredMappings.map(req => (
                  <RequirementRow
                    key={req.id}
                    requirement={req}
                    isExpanded={expandedReq === req.id}
                    onToggle={() => setExpandedReq(expandedReq === req.id ? null : req.id)}
                  />
                ))
              ) : (
                <div className="empty-requirements">
                  <CheckCircle size={40} className="success-icon" />
                  <h3>No requirements found</h3>
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
        
        /* Hero */
        .compliance-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem 2.5rem;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          margin-bottom: 1.5rem;
        }
        
        .hero-content {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
        }
        
        .hero-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border-radius: 16px;
          color: white;
          box-shadow: 0 8px 30px rgba(34, 197, 94, 0.3);
        }
        
        .hero-title {
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
        }
        
        .hero-subtitle {
          font-size: 1rem;
          color: #94a3b8;
          margin: 0;
          max-width: 500px;
        }
        
        .hero-stats {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        
        .overall-label {
          font-size: 0.8125rem;
          color: #64748b;
        }
        
        /* Compliance Ring */
        .compliance-ring {
          position: relative;
        }
        
        .ring-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        
        .ring-value {
          font-size: 1.25rem;
          font-weight: 700;
        }
        
        /* Scan Selector */
        .scan-selector-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.25rem 1.5rem;
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          margin-bottom: 1.5rem;
        }
        
        .selector-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .selector-icon {
          color: #06b6d4;
        }
        
        .selector-text h3 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }
        
        .selector-text p {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0;
        }
        
        .selector-dropdown {
          flex: 1;
          max-width: 400px;
          position: relative;
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
        
        .export-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-left: auto;
        }
        
        .export-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        
        /* Frameworks Grid */
        .frameworks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .framework-card {
          padding: 1.5rem;
          background: rgba(17, 24, 39, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .framework-card:hover {
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }
        
        .framework-card.selected {
          border-color: var(--framework-color);
          background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%);
        }
        
        .framework-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .framework-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }
        
        .framework-name {
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.375rem 0;
        }
        
        .framework-description {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0 0 1rem 0;
          line-height: 1.5;
        }
        
        .framework-stats {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .framework-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .framework-stat .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
        }
        
        .framework-stat .stat-label {
          font-size: 0.6875rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .framework-divider {
          width: 1px;
          height: 32px;
          background: rgba(255, 255, 255, 0.1);
        }
        
        /* Requirements Section */
        .requirements-section {
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
        }
        
        .requirements-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .req-header-left h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }
        
        .req-count {
          font-size: 0.8125rem;
          color: #64748b;
        }
        
        .requirements-filters {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .filter-icon {
          color: #64748b;
        }
        
        .filter-select {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 0.875rem;
          color: #fff;
          min-width: 150px;
        }
        
        .requirements-list {
          max-height: 600px;
          overflow-y: auto;
        }
        
        .requirement-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        
        .requirement-row:last-child {
          border-bottom: none;
        }
        
        .requirement-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        
        .requirement-header:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        
        .requirement-status {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          flex-shrink: 0;
        }
        
        .requirement-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        
        .requirement-id {
          font-size: 0.75rem;
          font-family: 'JetBrains Mono', monospace;
          color: #64748b;
        }
        
        .requirement-name {
          font-weight: 500;
          color: #e2e8f0;
        }
        
        .requirement-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .requirement-toggle {
          color: #64748b;
        }
        
        .requirement-body {
          padding: 1rem 1.5rem 1.5rem;
          padding-left: calc(1.5rem + 52px);
          background: rgba(0, 0, 0, 0.2);
        }
        
        .requirement-evidence h5 {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 0.5rem 0;
        }
        
        .requirement-evidence p {
          font-size: 0.875rem;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0;
        }
        
        /* Empty States */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4rem 2rem;
          text-align: center;
        }
        
        .empty-icon {
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 50%;
          color: #64748b;
          margin-bottom: 1.5rem;
        }
        
        .empty-state h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.5rem 0;
        }
        
        .empty-state p {
          font-size: 0.9375rem;
          color: #64748b;
          margin: 0;
          max-width: 400px;
        }
        
        .empty-requirements {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 3rem 2rem;
          text-align: center;
        }
        
        .empty-requirements .success-icon {
          color: #22c55e;
          margin-bottom: 1rem;
        }
        
        .empty-requirements h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.375rem 0;
        }
        
        .empty-requirements p {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }
        
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          color: #64748b;
          gap: 1rem;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: #06b6d4;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .skeleton-row {
          height: 64px;
          background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
          margin: 1px 0;
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
          }
          
          .hero-content {
            flex-direction: column;
            align-items: center;
          }
          
          .scan-selector-card {
            flex-direction: column;
            align-items: stretch;
          }
          
          .selector-dropdown {
            max-width: none;
          }
          
          .export-btn {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}
