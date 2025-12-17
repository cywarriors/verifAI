import React from 'react';
import { Bell, Search } from 'lucide-react';

export default function Header({ title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div className="page-header-content">
        <div className="page-header-text">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        
        <div className="page-header-actions">
          {actions}
          
          <div className="header-search">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="header-search-input"
            />
          </div>
          
          <button className="btn btn-icon btn-ghost header-notification">
            <Bell size={20} />
            <span className="notification-dot" />
          </button>
        </div>
      </div>
      
      <style>{`
        .page-header {
          padding: var(--space-lg) var(--space-xl);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-bg-primary);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        
        .page-header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-lg);
        }
        
        .page-header-text {
          flex: 1;
          min-width: 0;
        }
        
        .page-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 2px;
        }
        
        .page-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }
        
        .page-header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        
        .header-search {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text-muted);
          transition: all var(--transition-fast);
        }
        
        .header-search:focus-within {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-glow);
        }
        
        .header-search-input {
          width: 200px;
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.875rem;
          color: var(--color-text-primary);
        }
        
        .header-search-input::placeholder {
          color: var(--color-text-muted);
        }
        
        .header-notification {
          position: relative;
        }
        
        .notification-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 8px;
          height: 8px;
          background: var(--color-danger);
          border-radius: 50%;
          border: 2px solid var(--color-bg-primary);
        }
        
        @media (max-width: 768px) {
          .header-search {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}

