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
  Filter
} from 'lucide-react';
import Header from '../components/Layout/Header';
import { scansAPI, complianceAPI } from '../api/client';

const FRAMEWORKS = [
  { id: 'nist_ai_rmf', name: 'NIST AI RMF', description: 'National Institute of Standards and Technology AI Risk Management Framework' },
  { id: 'iso_42001', name: 'ISO/IEC 42001', description: 'AI Management System Standard' },
  { id: 'eu_ai_act', name: 'EU AI Act', description: 'European Union Artificial Intelligence Act' },
  { id: 'india_dpdp', name: 'India DPDP', description: 'Digital Personal Data Protection Act' },
  { id: 'telecom_iot', name: 'Telecom/IoT', description: 'Telecommunications and IoT Security Standards' },
];

const STATUS_ICONS = {
  compliant: { icon: CheckCircle, color: 'var(--color-success)', label: 'Compliant' },
  partial: { icon: AlertTriangle, color: 'var(--color-warning)', label: 'Partial' },
  non_compliant: { icon: XCircle, color: 'var(--color-danger)', label: 'Non-Compliant' },
  not_assessed: { icon: Shield, color: 'var(--color-text-muted)', label: 'Not Assessed' },
};

function RequirementRow({ requirement, isExpanded, onToggle }) {
  const status = STATUS_ICONS[requirement.compliance_status] || STATUS_ICONS.not_assessed;
  const StatusIcon = status.icon;

  return (
    <div className="requirement-row">
      <div className="requirement-header" onClick={onToggle}>
        <div className="requirement-status" style={{ color: status.color }}>
          <StatusIcon size={20} />
        </div>
        <div className="requirement-info">
          <span className="requirement-id">{requirement.requirement_id}</span>
          <span className="requirement-name">{requirement.requirement_name}</span>
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

function FrameworkCard({ framework, data, isSelected, onClick }) {
  const percentage = data?.total > 0 
    ? Math.round((data.passed / data.total) * 100) 
    : 0;

  return (
    <div 
      className={`framework-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="framework-header">
        <h3 className="framework-name">{framework.name}</h3>
        <span className={`framework-score ${percentage >= 80 ? 'good' : percentage >= 60 ? 'warning' : 'poor'}`}>
          {percentage}%
        </span>
      </div>
      <p className="framework-description">{framework.description}</p>
      <div className="progress" style={{ marginTop: 'var(--space-sm)' }}>
        <div 
          className={`progress-bar ${percentage >= 80 ? 'progress-bar-success' : percentage >= 60 ? 'progress-bar-warning' : 'progress-bar-danger'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="framework-detail">
        {data?.passed || 0}/{data?.total || 0} requirements met
      </span>
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

  return (
    <>
      <Header 
        title="Compliance" 
        subtitle="Track compliance against AI security frameworks"
        actions={
          selectedScan && (
            <button className="btn btn-secondary">
              <Download size={18} />
              <span>Export Report</span>
            </button>
          )
        }
      />
      
      <div className="compliance-page">
        <div className="compliance-controls">
          <div className="input-group" style={{ maxWidth: 300 }}>
            <label className="input-label">Select Scan</label>
            <select 
              className="input select"
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
          </div>
        </div>

        {!selectedScan ? (
          <div className="empty-state" style={{ marginTop: 'var(--space-2xl)' }}>
            <Shield size={64} />
            <h3 className="empty-state-title">Select a Scan</h3>
            <p className="empty-state-description">
              Choose a completed scan from the dropdown above to view its compliance report.
            </p>
          </div>
        ) : summaryLoading ? (
          <div className="loading-state">
            <div className="spinner spinner-lg" />
            <p>Loading compliance data...</p>
          </div>
        ) : (
          <>
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

            <div className="requirements-section">
              <div className="requirements-header">
                <h2>
                  {FRAMEWORKS.find(f => f.id === selectedFramework)?.name} Requirements
                </h2>
                <div className="requirements-filters">
                  <Filter size={16} className="text-muted" />
                  <select 
                    className="input select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: 160 }}
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
                    <div key={i} className="skeleton" style={{ height: 64, marginBottom: 8 }} />
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
                  <div className="empty-state">
                    <CheckCircle size={48} className="text-success" />
                    <h3 className="empty-state-title">No requirements found</h3>
                    <p className="empty-state-description">
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
      </div>
      
      <style>{`
        .compliance-page {
          padding: var(--space-xl);
          animation: fadeIn var(--transition-base);
        }
        
        .compliance-controls {
          margin-bottom: var(--space-xl);
        }
        
        .frameworks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }
        
        .framework-card {
          padding: var(--space-lg);
          background: var(--color-bg-secondary);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .framework-card:hover {
          border-color: var(--color-border-light);
        }
        
        .framework-card.selected {
          border-color: var(--color-accent);
          background: var(--color-accent-glow);
        }
        
        .framework-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--space-xs);
        }
        
        .framework-name {
          font-size: 1rem;
          font-weight: 600;
        }
        
        .framework-score {
          font-size: 1.25rem;
          font-weight: 700;
        }
        
        .framework-score.good { color: var(--color-success); }
        .framework-score.warning { color: var(--color-warning); }
        .framework-score.poor { color: var(--color-danger); }
        
        .framework-description {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          margin-bottom: var(--space-sm);
        }
        
        .framework-detail {
          display: block;
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-top: var(--space-xs);
        }
        
        .requirements-section {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        
        .requirements-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-lg);
          border-bottom: 1px solid var(--color-border);
        }
        
        .requirements-header h2 {
          font-size: 1.125rem;
        }
        
        .requirements-filters {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }
        
        .requirements-list {
          max-height: 600px;
          overflow-y: auto;
        }
        
        .requirement-row {
          border-bottom: 1px solid var(--color-border);
        }
        
        .requirement-row:last-child {
          border-bottom: none;
        }
        
        .requirement-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-md) var(--space-lg);
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        
        .requirement-header:hover {
          background: var(--color-bg-hover);
        }
        
        .requirement-status {
          flex-shrink: 0;
        }
        
        .requirement-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        
        .requirement-id {
          font-size: 0.75rem;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
        }
        
        .requirement-name {
          font-weight: 500;
        }
        
        .requirement-toggle {
          color: var(--color-text-muted);
        }
        
        .requirement-body {
          padding: var(--space-md) var(--space-lg);
          padding-left: calc(var(--space-lg) + 36px);
          background: var(--color-bg-tertiary);
        }
        
        .requirement-evidence h5 {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--space-xs);
        }
        
        .requirement-evidence p {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
        
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-2xl);
          color: var(--color-text-muted);
          gap: var(--space-md);
        }
      `}</style>
    </>
  );
}
