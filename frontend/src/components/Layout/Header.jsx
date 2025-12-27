import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Moon, Sun } from 'lucide-react';

const pageTitles = {
  '/': 'Dashboard',
  '/scans': 'Security Scans',
  '/scans/create': 'Create New Scan',
  '/scans/garak': 'Garak LLM Scanner',
  '/compliance': 'Compliance',
  '/settings': 'Settings',
};

export default function Header() {
  const location = useLocation();
  
  const getTitle = () => {
    // Check for scan detail page
    if (location.pathname.match(/^\/scans\/[^/]+$/)) {
      return 'Scan Details';
    }
    return pageTitles[location.pathname] || 'Dashboard';
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="page-title">{getTitle()}</h1>
          <span className="page-breadcrumb">
            {location.pathname === '/' ? 'Overview' : location.pathname.replace(/\//g, ' / ').trim()}
          </span>
        </div>
        
        <div className="header-right">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="search-input"
            />
            <span className="search-shortcut">⌘K</span>
          </div>
          
          <div className="header-actions">
            <button className="action-btn notification-btn">
              <Bell size={18} />
              <span className="notification-badge" />
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        .app-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(17, 24, 39, 0.7);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          padding: 1rem 2rem;
          max-width: 100%;
        }
        
        .header-left {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        
        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }
        
        .page-breadcrumb {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          text-transform: capitalize;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        /* Search */
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .search-icon {
          position: absolute;
          left: 0.875rem;
          color: var(--color-text-muted);
          pointer-events: none;
        }
        
        .search-input {
          width: 240px;
          padding: 0.625rem 0.875rem 0.625rem 2.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 0.875rem;
          color: var(--color-text-primary);
          transition: all 0.2s ease;
        }
        
        .search-input::placeholder {
          color: var(--color-text-muted);
        }
        
        .search-input:focus {
          outline: none;
          border-color: rgba(6, 182, 212, 0.5);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }
        
        .search-shortcut {
          position: absolute;
          right: 0.625rem;
          padding: 0.125rem 0.375rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          font-family: system-ui, sans-serif;
        }
        
        /* Actions */
        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .action-btn {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          color: var(--color-text-primary);
        }
        
        .notification-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          border: 2px solid rgba(17, 24, 39, 0.9);
        }
        
        @media (max-width: 768px) {
          .header-content {
            padding: 1rem;
          }
          
          .search-box {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
