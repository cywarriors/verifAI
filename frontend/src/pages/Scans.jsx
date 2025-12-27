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
  Scan as ScanIcon,
  ChevronRight,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { scansAPI } from '../api/client';
import { format, formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: Clock },
  running: { label: 'Running', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', icon: Play },
  completed: { label: 'Completed', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', icon: CheckCircle },
  failed: { label: 'Failed', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: XCircle },
  cancelled: { label: 'Cancelled', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', icon: XCircle },
};

function ScanCard({ scan, onCancel }) {
  const [showMenu, setShowMenu] = useState(false);
  const status = STATUS_CONFIG[scan.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  return (
    <div className="scan-card">
      <div className="scan-card-header">
        <div className="scan-status" style={{ background: status.bg, color: status.color }}>
          {scan.status === 'running' ? (
            <div className="pulse-dot" style={{ background: status.color }} />
          ) : (
            <StatusIcon size={14} />
          )}
          <span>{status.label}</span>
        </div>
        <div className="scan-menu">
          <button 
            className="menu-trigger"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={16} />
          </button>
          {showMenu && (
            <>
              <div className="menu-backdrop" onClick={() => setShowMenu(false)} />
              <div className="menu-dropdown">
                <Link to={`/scans/${scan.id}`} className="menu-item">
                  <Eye size={16} />
                  <span>View Details</span>
                </Link>
                {scan.status === 'running' && (
                  <button 
                    className="menu-item danger"
                    onClick={() => { onCancel(scan.id); setShowMenu(false); }}
                  >
                    <XCircle size={16} />
                    <span>Cancel Scan</span>
                  </button>
                )}
                {scan.status === 'completed' && (
                  <a href={`/api/v1/reports/${scan.id}/pdf/download`} className="menu-item">
                    <Download size={16} />
                    <span>Download Report</span>
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      <Link to={`/scans/${scan.id}`} className="scan-card-body">
        <h3 className="scan-name">{scan.name}</h3>
        <span className="scan-model">{scan.model_name}</span>
      </Link>
      
      <div className="scan-card-footer">
        <div className="scan-stats">
          {scan.vulnerability_count != null && (
            <div className="scan-stat">
              <AlertTriangle size={14} />
              <span>{scan.vulnerability_count} issues</span>
            </div>
          )}
          <div className="scan-stat">
            <Clock size={14} />
            <span>{formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}</span>
          </div>
        </div>
        <Link to={`/scans/${scan.id}`} className="scan-view-btn">
          <ChevronRight size={18} />
        </Link>
      </div>
    </div>
  );
}

export default function Scans() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
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

  const stats = {
    total: scans?.length || 0,
    running: scans?.filter(s => s.status === 'running').length || 0,
    completed: scans?.filter(s => s.status === 'completed').length || 0,
    failed: scans?.filter(s => s.status === 'failed').length || 0,
  };

  return (
    <div className="scans-page">
      {/* Hero Section */}
      <div className="scans-hero">
        <div className="hero-content">
          <h1 className="hero-title">Security Scans</h1>
          <p className="hero-subtitle">Monitor and manage your AI security assessments</p>
        </div>
        <Link to="/scans/create" className="hero-cta">
          <Zap size={18} />
          New Scan
        </Link>
      </div>
      
      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="quick-stat">
          <span className="quick-stat-value">{stats.total}</span>
          <span className="quick-stat-label">Total Scans</span>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-value" style={{ color: '#06b6d4' }}>{stats.running}</span>
          <span className="quick-stat-label">Running</span>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-value" style={{ color: '#22c55e' }}>{stats.completed}</span>
          <span className="quick-stat-label">Completed</span>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-value" style={{ color: '#ef4444' }}>{stats.failed}</span>
          <span className="quick-stat-label">Failed</span>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="scans-toolbar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            placeholder="Search scans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="toolbar-actions">
          <div className="filter-group">
            <Filter size={16} />
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Scans Grid */}
      <div className="scans-container">
        {isLoading ? (
          <div className="scans-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="scan-card skeleton-card">
                <div className="skeleton-header" />
                <div className="skeleton-body">
                  <div className="skeleton-line" style={{ width: '70%' }} />
                  <div className="skeleton-line" style={{ width: '40%' }} />
                </div>
                <div className="skeleton-footer" />
              </div>
            ))}
          </div>
        ) : filteredScans?.length > 0 ? (
          <div className="scans-grid">
            {filteredScans.map(scan => (
              <ScanCard key={scan.id} scan={scan} onCancel={handleCancel} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <ScanIcon size={48} />
            </div>
            <h3 className="empty-title">No scans found</h3>
            <p className="empty-desc">
              {searchQuery || statusFilter 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first security scan'}
            </p>
            {!searchQuery && !statusFilter && (
              <Link to="/scans/create" className="empty-cta">
                <Plus size={18} />
                Create Your First Scan
              </Link>
            )}
          </div>
        )}
      </div>
      
      <style>{`
        .scans-page {
          animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Hero */
        .scans-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem 2.5rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          margin-bottom: 1.5rem;
        }
        
        .hero-title {
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.375rem 0;
        }
        
        .hero-subtitle {
          font-size: 1rem;
          color: #64748b;
          margin: 0;
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
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
        }
        
        .hero-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(6, 182, 212, 0.4);
          color: #030712;
        }
        
        /* Quick Stats */
        .quick-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .quick-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.25rem;
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
        }
        
        .quick-stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
        }
        
        .quick-stat-label {
          font-size: 0.8125rem;
          color: #64748b;
          margin-top: 0.25rem;
        }
        
        /* Toolbar */
        .scans-toolbar {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .search-wrapper {
          flex: 1;
          max-width: 400px;
          position: relative;
        }
        
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }
        
        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 0.9375rem;
          color: #fff;
          transition: all 0.2s ease;
        }
        
        .search-input::placeholder {
          color: #64748b;
        }
        
        .search-input:focus {
          outline: none;
          border-color: rgba(6, 182, 212, 0.5);
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }
        
        .toolbar-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
        }
        
        .filter-select {
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 0.875rem;
          color: #fff;
          cursor: pointer;
          min-width: 140px;
        }
        
        .filter-select:focus {
          outline: none;
          border-color: rgba(6, 182, 212, 0.5);
        }
        
        /* Scans Grid */
        .scans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.25rem;
        }
        
        .scan-card {
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        
        .scan-card:hover {
          border-color: rgba(6, 182, 212, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }
        
        .scan-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        
        .scan-status {
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
        
        .scan-menu {
          position: relative;
        }
        
        .menu-trigger {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #64748b;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .menu-trigger:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }
        
        .menu-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99;
        }
        
        .menu-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          min-width: 160px;
          background: rgba(17, 24, 39, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0.5rem;
          z-index: 100;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }
        
        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          width: 100%;
          padding: 0.625rem 0.75rem;
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 0.875rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .menu-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }
        
        .menu-item.danger:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
        }
        
        .scan-card-body {
          display: block;
          padding: 1.25rem;
        }
        
        .scan-name {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.375rem 0;
          transition: color 0.15s ease;
        }
        
        .scan-card:hover .scan-name {
          color: #06b6d4;
        }
        
        .scan-model {
          font-size: 0.8125rem;
          color: #64748b;
          font-family: 'JetBrains Mono', monospace;
        }
        
        .scan-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.04);
        }
        
        .scan-stats {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .scan-stat {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: #64748b;
        }
        
        .scan-view-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: #64748b;
          transition: all 0.15s ease;
        }
        
        .scan-view-btn:hover {
          background: rgba(6, 182, 212, 0.2);
          color: #06b6d4;
        }
        
        /* Empty State */
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
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
          border-radius: 50%;
          color: #64748b;
          margin-bottom: 1.5rem;
        }
        
        .empty-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.5rem 0;
        }
        
        .empty-desc {
          font-size: 0.9375rem;
          color: #64748b;
          margin: 0 0 1.5rem 0;
        }
        
        .empty-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          color: #030712;
          font-weight: 600;
          font-size: 0.9375rem;
          border-radius: 12px;
          transition: all 0.2s ease;
        }
        
        .empty-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
          color: #030712;
        }
        
        /* Skeleton Loading */
        .skeleton-card {
          background: rgba(17, 24, 39, 0.6);
          animation: shimmer 1.5s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        
        .skeleton-header {
          height: 48px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        
        .skeleton-body {
          padding: 1.25rem;
        }
        
        .skeleton-line {
          height: 14px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          margin-bottom: 0.75rem;
        }
        
        .skeleton-footer {
          height: 56px;
          background: rgba(0, 0, 0, 0.2);
        }
        
        @media (max-width: 768px) {
          .scans-hero {
            flex-direction: column;
            gap: 1.5rem;
            text-align: center;
          }
          
          .quick-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .scans-toolbar {
            flex-direction: column;
          }
          
          .search-wrapper {
            max-width: none;
            width: 100%;
          }
          
          .scans-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

