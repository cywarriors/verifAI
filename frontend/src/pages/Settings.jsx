import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Bell, Palette, Save, Check, Shield, Key, Moon, Sun, ChevronRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

function SettingsSection({ icon: Icon, title, description, iconColor = '#06b6d4', children }) {
  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <div className="section-icon" style={{ background: `${iconColor}15`, color: iconColor }}>
          <Icon size={20} />
        </div>
        <div className="section-info">
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
      </div>
      <div className="settings-section-body">
        {children}
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    username: user?.username || '',
  });
  
  const [notifications, setNotifications] = useState({
    scan_complete: true,
    scan_failed: true,
    weekly_report: false,
    security_alerts: true,
  });

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Profile updated successfully');
    setIsSaving(false);
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Notification preferences saved');
    setIsSaving(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="settings-page">
      {/* Hero Section */}
      <div className="settings-hero">
        <div className="hero-content">
          <div className="hero-icon">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="hero-title">Settings</h1>
            <p className="hero-subtitle">Manage your account preferences and security settings</p>
          </div>
        </div>
        <div className="hero-user">
          <div className="user-avatar">
            {user?.full_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.full_name || user?.username || 'User'}</span>
            <span className="user-email">{user?.email || 'user@example.com'}</span>
          </div>
        </div>
      </div>

      <div className="settings-layout">
        {/* Navigation Sidebar */}
        <nav className="settings-nav">
          <div className="nav-header">
            <Sparkles size={16} />
            <span>Settings Menu</span>
          </div>
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              <ChevronRight size={16} className="nav-arrow" />
            </button>
          ))}
        </nav>
        
        {/* Content Area */}
        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="animate-fade-in">
              <SettingsSection 
                icon={User} 
                title="Profile Information"
                description="Update your personal information and public profile"
                iconColor="#22c55e"
              >
                <div className="settings-form">
                  <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={profile.full_name}
                      onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <input
                      type="email"
                      className="settings-input"
                      value={profile.email}
                      onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Username</label>
                    <input
                      type="text"
                      className="settings-input disabled"
                      value={profile.username}
                      disabled
                    />
                    <span className="input-hint">Username cannot be changed</span>
                  </div>
                  
                  <button 
                    className="save-btn"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </SettingsSection>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="animate-fade-in">
              <SettingsSection 
                icon={Lock} 
                title="Change Password"
                description="Update your password to keep your account secure"
                iconColor="#f59e0b"
              >
                <div className="settings-form">
                  <div className="input-group">
                    <label className="input-label">Current Password</label>
                    <input type="password" className="settings-input" placeholder="Enter current password" />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">New Password</label>
                    <input type="password" className="settings-input" placeholder="Enter new password" />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Confirm New Password</label>
                    <input type="password" className="settings-input" placeholder="Confirm new password" />
                  </div>
                  
                  <button className="save-btn">
                    <Lock size={18} />
                    Update Password
                  </button>
                </div>
              </SettingsSection>
              
              <SettingsSection 
                icon={Key} 
                title="API Keys"
                description="Manage API keys for programmatic access"
                iconColor="#8b5cf6"
              >
                <div className="api-keys-empty">
                  <div className="empty-icon">
                    <Key size={24} />
                  </div>
                  <p>No API keys generated yet</p>
                  <button className="generate-btn">
                    <Sparkles size={16} />
                    Generate New API Key
                  </button>
                </div>
              </SettingsSection>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="animate-fade-in">
              <SettingsSection 
                icon={Bell} 
                title="Email Notifications"
                description="Configure when and how you receive email alerts"
                iconColor="#06b6d4"
              >
                <div className="settings-toggles">
                  <label className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">Scan Complete</span>
                      <span className="toggle-description">Receive an email when a scan finishes</span>
                    </div>
                    <div className="toggle-wrapper">
                      <input 
                        type="checkbox" 
                        className="toggle-input"
                        checked={notifications.scan_complete}
                        onChange={(e) => setNotifications(n => ({ ...n, scan_complete: e.target.checked }))}
                      />
                      <span className="toggle-switch" />
                    </div>
                  </label>
                  
                  <label className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">Scan Failed</span>
                      <span className="toggle-description">Get notified when a scan fails</span>
                    </div>
                    <div className="toggle-wrapper">
                      <input 
                        type="checkbox" 
                        className="toggle-input"
                        checked={notifications.scan_failed}
                        onChange={(e) => setNotifications(n => ({ ...n, scan_failed: e.target.checked }))}
                      />
                      <span className="toggle-switch" />
                    </div>
                  </label>
                  
                  <label className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">Weekly Report</span>
                      <span className="toggle-description">Receive a weekly summary of all scans</span>
                    </div>
                    <div className="toggle-wrapper">
                      <input 
                        type="checkbox" 
                        className="toggle-input"
                        checked={notifications.weekly_report}
                        onChange={(e) => setNotifications(n => ({ ...n, weekly_report: e.target.checked }))}
                      />
                      <span className="toggle-switch" />
                    </div>
                  </label>
                  
                  <label className="toggle-item highlight">
                    <div className="toggle-info">
                      <span className="toggle-label">
                        <Shield size={14} style={{ marginRight: '6px', color: '#ef4444' }} />
                        Security Alerts
                      </span>
                      <span className="toggle-description">Critical vulnerability alerts (recommended)</span>
                    </div>
                    <div className="toggle-wrapper">
                      <input 
                        type="checkbox" 
                        className="toggle-input"
                        checked={notifications.security_alerts}
                        onChange={(e) => setNotifications(n => ({ ...n, security_alerts: e.target.checked }))}
                      />
                      <span className="toggle-switch" />
                    </div>
                  </label>
                </div>
                
                <button 
                  className="save-btn" 
                  style={{ marginTop: '1.5rem' }}
                  onClick={handleSaveNotifications}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Save Preferences
                    </>
                  )}
                </button>
              </SettingsSection>
            </div>
          )}
          
          {activeTab === 'appearance' && (
            <div className="animate-fade-in">
              <SettingsSection 
                icon={Palette} 
                title="Theme"
                description="Customize the look and feel of verifAI"
                iconColor="#ec4899"
              >
                <div className="theme-options">
                  <div className="theme-option selected">
                    <div className="theme-preview theme-dark">
                      <Moon size={20} />
                    </div>
                    <div className="theme-info">
                      <span className="theme-name">Dark Mode</span>
                      <span className="theme-desc">Optimized for low-light environments</span>
                    </div>
                    <div className="theme-check">
                      <Check size={16} />
                    </div>
                  </div>
                  <div className="theme-option disabled">
                    <div className="theme-preview theme-light">
                      <Sun size={20} />
                    </div>
                    <div className="theme-info">
                      <span className="theme-name">Light Mode</span>
                      <span className="theme-desc">Coming Soon</span>
                    </div>
                  </div>
                </div>
              </SettingsSection>
              
              <SettingsSection 
                icon={Sparkles} 
                title="Accent Color"
                description="Choose your preferred accent color"
                iconColor="#06b6d4"
              >
                <div className="accent-colors">
                  <button className="accent-option selected" style={{ '--accent': '#06b6d4' }} title="Cyan">
                    <Check size={14} />
                  </button>
                  <button className="accent-option" style={{ '--accent': '#8b5cf6' }} title="Purple"></button>
                  <button className="accent-option" style={{ '--accent': '#22c55e' }} title="Green"></button>
                  <button className="accent-option" style={{ '--accent': '#f59e0b' }} title="Amber"></button>
                  <button className="accent-option" style={{ '--accent': '#ec4899' }} title="Pink"></button>
                  <button className="accent-option" style={{ '--accent': '#ef4444' }} title="Red"></button>
                </div>
              </SettingsSection>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .settings-page {
          animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease;
        }
        
        /* Hero */
        .settings-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem 2.5rem;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
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
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          border-radius: 16px;
          color: white;
          box-shadow: 0 8px 30px rgba(6, 182, 212, 0.3);
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
        }
        
        .hero-user {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
        }
        
        .user-avatar {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border-radius: 12px;
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
        }
        
        .user-name {
          font-weight: 600;
          color: #fff;
        }
        
        .user-email {
          font-size: 0.8125rem;
          color: #64748b;
        }
        
        /* Layout */
        .settings-layout {
          display: flex;
          gap: 1.5rem;
        }
        
        /* Navigation */
        .settings-nav {
          width: 240px;
          flex-shrink: 0;
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 0.75rem;
          height: fit-content;
          position: sticky;
          top: 1rem;
        }
        
        .nav-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .settings-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.875rem 1rem;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: #94a3b8;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }
        
        .settings-nav-item:hover {
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
        }
        
        .settings-nav-item.active {
          background: rgba(6, 182, 212, 0.1);
          color: #06b6d4;
        }
        
        .nav-arrow {
          margin-left: auto;
          opacity: 0;
          transition: all 0.15s ease;
        }
        
        .settings-nav-item:hover .nav-arrow,
        .settings-nav-item.active .nav-arrow {
          opacity: 1;
        }
        
        /* Content */
        .settings-content {
          flex: 1;
          max-width: 700px;
        }
        
        /* Section Card */
        .settings-section {
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          margin-bottom: 1rem;
          overflow: hidden;
        }
        
        .settings-section-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .section-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          flex-shrink: 0;
        }
        
        .section-info h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.25rem 0;
        }
        
        .section-info p {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0;
        }
        
        .settings-section-body {
          padding: 1.5rem;
        }
        
        /* Form */
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .input-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #94a3b8;
        }
        
        .settings-input {
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 0.9375rem;
          color: #fff;
          transition: all 0.15s ease;
        }
        
        .settings-input:focus {
          outline: none;
          border-color: rgba(6, 182, 212, 0.5);
          background: rgba(255, 255, 255, 0.05);
        }
        
        .settings-input::placeholder {
          color: #475569;
        }
        
        .settings-input.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .input-hint {
          font-size: 0.75rem;
          color: #64748b;
        }
        
        /* Save Button */
        .save-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          border: none;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          width: fit-content;
        }
        
        .save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(6, 182, 212, 0.3);
        }
        
        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* API Keys */
        .api-keys-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          text-align: center;
        }
        
        .api-keys-empty .empty-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 50%;
          color: #64748b;
          margin-bottom: 1rem;
        }
        
        .api-keys-empty p {
          font-size: 0.9375rem;
          color: #64748b;
          margin: 0 0 1.25rem 0;
        }
        
        .generate-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #a78bfa;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .generate-btn:hover {
          background: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.5);
        }
        
        /* Toggle Switches */
        .settings-toggles {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .toggle-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .toggle-item:hover {
          background: rgba(255, 255, 255, 0.04);
        }
        
        .toggle-item.highlight {
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.1);
        }
        
        .toggle-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .toggle-label {
          display: flex;
          align-items: center;
          font-weight: 500;
          color: #e2e8f0;
        }
        
        .toggle-description {
          font-size: 0.8125rem;
          color: #64748b;
        }
        
        .toggle-wrapper {
          position: relative;
        }
        
        .toggle-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-switch {
          display: block;
          width: 48px;
          height: 26px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 13px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .toggle-input:checked + .toggle-switch {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        }
        
        .toggle-input:checked + .toggle-switch::after {
          left: 25px;
        }
        
        /* Theme Options */
        .theme-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .theme-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 2px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .theme-option:hover:not(.disabled) {
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .theme-option.selected {
          border-color: #06b6d4;
          background: rgba(6, 182, 212, 0.05);
        }
        
        .theme-option.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .theme-preview {
          width: 56px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }
        
        .theme-dark {
          background: linear-gradient(135deg, #0a0e17 0%, #1a2234 100%);
          color: #94a3b8;
        }
        
        .theme-light {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          color: #64748b;
        }
        
        .theme-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        
        .theme-name {
          font-weight: 600;
          color: #fff;
        }
        
        .theme-desc {
          font-size: 0.8125rem;
          color: #64748b;
        }
        
        .theme-check {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #06b6d4;
          border-radius: 50%;
          color: white;
        }
        
        /* Accent Colors */
        .accent-colors {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        
        .accent-option {
          width: 44px;
          height: 44px;
          background: var(--accent);
          border: 3px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .accent-option:hover {
          transform: scale(1.1);
        }
        
        .accent-option.selected {
          border-color: white;
          box-shadow: 0 4px 15px color-mix(in srgb, var(--accent) 50%, transparent);
        }
        
        /* Responsive */
        @media (max-width: 900px) {
          .settings-hero {
            flex-direction: column;
            gap: 1.5rem;
            text-align: center;
          }
          
          .hero-content {
            flex-direction: column;
            align-items: center;
          }
          
          .settings-layout {
            flex-direction: column;
          }
          
          .settings-nav {
            width: 100%;
            position: static;
          }
          
          .nav-header {
            display: none;
          }
          
          .settings-content {
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}

