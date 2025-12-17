import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Shield, 
  LayoutDashboard, 
  Scan, 
  FileCheck, 
  Settings,
  LogOut,
  Plus
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/scans', icon: Scan, label: 'Scans' },
  { path: '/compliance', icon: FileCheck, label: 'Compliance' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Shield size={28} />
        </div>
        <div className="sidebar-brand">
          <span className="sidebar-title">SecureAI</span>
          <span className="sidebar-subtitle">Security Scanner</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/scans/create" className="sidebar-cta">
          <Plus size={18} />
          <span>New Scan</span>
        </NavLink>
        
        <div className="sidebar-section">
          <span className="sidebar-section-title">Menu</span>
          <ul className="sidebar-menu">
            {navItems.map(({ path, icon: Icon, label }) => (
              <li key={path}>
                <NavLink 
                  to={path} 
                  className={({ isActive }) => 
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                  end={path === '/'}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.full_name?.[0] || user?.username?.[0] || 'U'}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.full_name || user?.username}</span>
            <span className="sidebar-user-email">{user?.email}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Sign out">
          <LogOut size={18} />
        </button>
      </div>
      
      <style>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: var(--color-bg-secondary);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          z-index: 100;
        }
        
        .sidebar-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-lg);
          border-bottom: 1px solid var(--color-border);
        }
        
        .sidebar-logo {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-accent-glow);
          border: 1px solid var(--color-accent);
          border-radius: var(--radius-md);
          color: var(--color-accent);
        }
        
        .sidebar-brand {
          display: flex;
          flex-direction: column;
        }
        
        .sidebar-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }
        
        .sidebar-subtitle {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
        
        .sidebar-nav {
          flex: 1;
          padding: var(--space-md);
          overflow-y: auto;
        }
        
        .sidebar-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--color-accent);
          color: var(--color-text-inverse);
          font-weight: 500;
          border-radius: var(--radius-md);
          margin-bottom: var(--space-lg);
          transition: all var(--transition-fast);
        }
        
        .sidebar-cta:hover {
          background: var(--color-accent-light);
          color: var(--color-text-inverse);
          box-shadow: var(--shadow-glow);
        }
        
        .sidebar-section {
          margin-bottom: var(--space-lg);
        }
        
        .sidebar-section-title {
          display: block;
          padding: var(--space-sm) var(--space-md);
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
        }
        
        .sidebar-menu {
          list-style: none;
        }
        
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-sm) var(--space-md);
          color: var(--color-text-secondary);
          border-radius: var(--radius-md);
          margin-bottom: 2px;
          transition: all var(--transition-fast);
        }
        
        .sidebar-link:hover {
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
        }
        
        .sidebar-link.active {
          background: var(--color-accent-glow);
          color: var(--color-accent);
        }
        
        .sidebar-link.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 24px;
          background: var(--color-accent);
          border-radius: 0 2px 2px 0;
        }
        
        .sidebar-footer {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md);
          border-top: 1px solid var(--color-border);
        }
        
        .sidebar-user {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          min-width: 0;
        }
        
        .sidebar-avatar {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-hover);
          border-radius: var(--radius-full);
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--color-accent);
          flex-shrink: 0;
        }
        
        .sidebar-user-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        
        .sidebar-user-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .sidebar-user-email {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .sidebar-logout {
          padding: var(--space-sm);
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .sidebar-logout:hover {
          background: var(--color-danger-bg);
          color: var(--color-danger);
        }
      `}</style>
    </aside>
  );
}

