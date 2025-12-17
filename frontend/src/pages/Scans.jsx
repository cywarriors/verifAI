import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Play,
  XCircle,
  Eye,
  Download,
  Scan as ScanIcon
} from 'lucide-react';
import Header from '../components/Layout/Header';
import { scansAPI } from '../api/client';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending: { label: 'Pending', class: 'badge-neutral' },
  running: { label: 'Running', class: 'badge-info' },
  completed: { label: 'Completed', class: 'badge-success' },
  failed: { label: 'Failed', class: 'badge-danger' },
  cancelled: { label: 'Cancelled', class: 'badge-warning' },
};

function ScanRow({ scan, onCancel }) {
  const [showMenu, setShowMenu] = useState(false);
  const status = STATUS_CONFIG[scan.status] || STATUS_CONFIG.pending;

  return (
    <tr>
      <td>
        <Link to={`/scans/${scan.id}`} className="scan-name-link">
          {scan.name}
        </Link>
      </td>
      <td>
        <span className="font-mono text-secondary">{scan.model_name}</span>
      </td>
      <td>
        <span className={`badge ${status.class}`}>
          {scan.status === 'running' && <span className="spinner" style={{ width: 12, height: 12 }} />}
          {status.label}
        </span>
      </td>
      <td>
        <span className="text-muted">
          {scan.vulnerability_count ?? '—'}
        </span>
      </td>
      <td>
        <span className="text-secondary">
          {format(new Date(scan.created_at), 'MMM d, yyyy HH:mm')}
        </span>
      </td>
      <td>
        <div className="dropdown">
          <button 
            className="btn btn-icon btn-ghost"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={16} />
          </button>
          {showMenu && (
            <>
              <div className="dropdown-backdrop" onClick={() => setShowMenu(false)} />
              <div className="dropdown-menu">
                <Link to={`/scans/${scan.id}`} className="dropdown-item">
                  <Eye size={16} />
                  <span>View Details</span>
                </Link>
                {scan.status === 'running' && (
                  <button 
                    className="dropdown-item"
                    onClick={() => { onCancel(scan.id); setShowMenu(false); }}
                  >
                    <XCircle size={16} />
                    <span>Cancel Scan</span>
                  </button>
                )}
                {scan.status === 'completed' && (
                  <a href={`/api/v1/reports/${scan.id}/pdf/download`} className="dropdown-item">
                    <Download size={16} />
                    <span>Download Report</span>
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function Scans() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const { data: scans, isLoading, refetch } = useQuery({
    queryKey: ['scans', statusFilter],
    queryFn: () => scansAPI.list({ status_filter: statusFilter || undefined }),
  });

  const handleCancel = async (scanId) => {
    try {
      await scansAPI.cancel(scanId);
      refetch();
    } catch (error) {
      console.error('Failed to cancel scan:', error);
    }
  };

  const filteredScans = scans?.filter(scan => 
    scan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scan.model_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Header 
        title="Scans" 
        subtitle="Manage and monitor your security scans"
        actions={
          <Link to="/scans/create" className="btn btn-primary">
            <Plus size={18} />
            <span>New Scan</span>
          </Link>
        }
      />
      
      <div className="scans-page">
        <div className="scans-toolbar">
          <div className="scans-search">
            <Search size={18} />
            <input 
              type="text"
              placeholder="Search scans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="scans-search-input"
            />
          </div>
          
          <div className="scans-filters">
            <Filter size={16} className="text-muted" />
            <select 
              className="input select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 150 }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        
        <div className="card">
          <div className="table-container">
            <table className="table table-clickable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Vulnerabilities</th>
                  <th>Created</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton skeleton-text" style={{ width: '60%' }} /></td>
                      <td><div className="skeleton skeleton-text" style={{ width: '40%' }} /></td>
                      <td><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
                      <td><div className="skeleton skeleton-text" style={{ width: 30 }} /></td>
                      <td><div className="skeleton skeleton-text" style={{ width: '50%' }} /></td>
                      <td></td>
                    </tr>
                  ))
                ) : filteredScans?.length > 0 ? (
                  filteredScans.map(scan => (
                    <ScanRow key={scan.id} scan={scan} onCancel={handleCancel} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <ScanIcon size={48} className="empty-state-icon" />
                        <h3 className="empty-state-title">No scans found</h3>
                        <p className="empty-state-description">
                          {searchQuery || statusFilter 
                            ? 'Try adjusting your filters'
                            : 'Get started by creating your first security scan'}
                        </p>
                        {!searchQuery && !statusFilter && (
                          <Link to="/scans/create" className="btn btn-primary">
                            <Plus size={18} />
                            Create Scan
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <style>{`
        .scans-page {
          padding: var(--space-xl);
          animation: fadeIn var(--transition-base);
        }
        
        .scans-toolbar {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }
        
        .scans-search {
          flex: 1;
          max-width: 400px;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text-muted);
        }
        
        .scans-search:focus-within {
          border-color: var(--color-accent);
        }
        
        .scans-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.9375rem;
          color: var(--color-text-primary);
        }
        
        .scans-search-input::placeholder {
          color: var(--color-text-muted);
        }
        
        .scans-filters {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }
        
        .scan-name-link {
          font-weight: 500;
          color: var(--color-text-primary);
        }
        
        .scan-name-link:hover {
          color: var(--color-accent);
        }
        
        .dropdown {
          position: relative;
        }
        
        .dropdown-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99;
        }
        
        .dropdown-menu {
          z-index: 100;
        }
      `}</style>
    </>
  );
}

