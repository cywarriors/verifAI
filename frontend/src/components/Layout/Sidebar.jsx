import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Shield, 
  LayoutDashboard, 
  Scan, 
  FileCheck, 
  Settings,
  LogOut,
  Plus,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/scans', icon: Scan, label: 'Scans' },
  { path: '/scans/garak', icon: Zap, label: 'Garak Scanner' },
  { path: '/compliance', icon: FileCheck, label: 'Compliance' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Shield size={collapsed ? 24 : 28} />
          </div>
          {!collapsed && (
            <div className="logo-text">
              <span className="logo-name">verifAI</span>
              <span className="logo-tagline">AI Security</span>
            </div>
          )}
        </div>
        <button 
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      
      {/* New Scan CTA */}
      <div className="sidebar-cta-wrapper">
        <NavLink to="/scans/create" className="sidebar-cta">
          <Plus size={18} />
          {!collapsed && <span>New Scan</span>}
        </NavLink>
      </div>
      
      {/* Navigation */}
      <nav className="sidebar-nav">
        {!collapsed && <span className="nav-section-title">Menu</span>}
        <ul className="nav-list">
          {navItems.map(({ path, icon: Icon, label }) => (
            <li key={path}>
              <NavLink 
                to={path} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end={path === '/'}
                title={label}
              >
                <Icon size={20} />
                {!collapsed && <span>{label}</span>}
                {({ isActive }) => isActive && <div className="active-indicator" />}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* User */}
      <div className="sidebar-footer">
        <div className="user-section">
          <div className="user-avatar">
            {user?.full_name?.[0] || user?.username?.[0] || 'U'}
          </div>
          {!collapsed && (
            <div className="user-info">
              <span className="user-name">{user?.full_name || user?.username}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          )}
        </div>
        <button 
          className="logout-btn" 
          onClick={handleLogout} 
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
      
      <style>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 260px;
          background: rgba(17, 24, 39, 0.95);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: width 0.3s ease;
        }
        
        .sidebar.collapsed {
          width: 72px;
        }
        
        /* Header */
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .logo-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%);
          border-radius: 12px;
          color: white;
          box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
          flex-shrink: 0;
        }
        
        .logo-text {
          display: flex;
          flex-direction: column;
        }
        
        .logo-name {
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .logo-tagline {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          letter-spacing: 0.02em;
        }
        
        .collapse-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .collapse-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--color-text-primary);
        }
        
        .sidebar.collapsed .collapse-btn {
          display: none;
        }
        
        /* CTA */
        .sidebar-cta-wrapper {
          padding: 1rem;
        }
        
        .sidebar-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%);
          color: #030712;
          font-weight: 600;
          font-size: 0.875rem;
          border-radius: 10px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(6, 182, 212, 0.2);
        }
        
        .sidebar-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 30px rgba(6, 182, 212, 0.3);
          color: #030712;
        }
        
        /* Nav */
        .sidebar-nav {
          flex: 1;
          padding: 0 0.75rem;
          overflow-y: auto;
        }
        
        .nav-section-title {
          display: block;
          padding: 0.5rem 0.75rem;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
        }
        
        .nav-list {
          list-style: none;
        }
        
        .nav-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          color: var(--color-text-secondary);
          border-radius: 10px;
          margin-bottom: 2px;
          transition: all 0.15s ease;
          font-size: 0.9375rem;
        }
        
        .nav-link:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--color-text-primary);
        }
        
        .nav-link.active {
          background: rgba(6, 182, 212, 0.1);
          color: var(--color-accent);
        }
        
        .nav-link.active::before {
          content: '';
          position: absolute;
          left: -0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 24px;
          background: var(--color-accent);
          border-radius: 0 3px 3px 0;
        }
        
        .sidebar.collapsed .nav-link {
          justify-content: center;
          padding: 0.875rem;
        }
        
        .sidebar.collapsed .nav-link.active::before {
          left: 0;
        }
        
        /* Footer */
        .sidebar-footer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(0, 0, 0, 0.2);
        }
        
        .user-section {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }
        
        .user-avatar {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%);
          border: 1px solid rgba(6, 182, 212, 0.3);
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--color-accent);
          flex-shrink: 0;
        }
        
        .user-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        
        .user-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .user-email {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .logout-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid transparent;
          color: var(--color-text-muted);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #f87171;
        }
        
        .sidebar.collapsed .user-info {
          display: none;
        }
      `}</style>
    </aside>
  );
}

