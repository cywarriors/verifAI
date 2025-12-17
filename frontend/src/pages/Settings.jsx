import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Bell, Palette, Save, Check } from 'lucide-react';
import Header from '../components/Layout/Header';
import toast from 'react-hot-toast';

function SettingsSection({ icon: Icon, title, children }) {
  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <Icon size={20} />
        <h3>{title}</h3>
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
    // Simulate API call
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

  return (
    <>
      <Header 
        title="Settings" 
        subtitle="Manage your account and preferences"
      />
      
      <div className="settings-page">
        <div className="settings-nav">
          <button 
            className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            <span>Profile</span>
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={18} />
            <span>Security</span>
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={18} />
            <span>Notifications</span>
          </button>
          <button 
            className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <Palette size={18} />
            <span>Appearance</span>
          </button>
        </div>
        
        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="animate-fade-in">
              <SettingsSection icon={User} title="Profile Information">
                <div className="settings-form">
                  <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <input
                      type="text"
                      className="input"
                      value={profile.full_name}
                      onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={profile.email}
                      onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Username</label>
                    <input
                      type="text"
                      className="input"
                      value={profile.username}
                      disabled
                    />
                    <span className="input-hint">Username cannot be changed</span>
                  </div>
                  
                  <button 
                    className="btn btn-primary"
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
              <SettingsSection icon={Lock} title="Change Password">
                <div className="settings-form">
                  <div className="input-group">
                    <label className="input-label">Current Password</label>
                    <input type="password" className="input" placeholder="Enter current password" />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">New Password</label>
                    <input type="password" className="input" placeholder="Enter new password" />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Confirm New Password</label>
                    <input type="password" className="input" placeholder="Confirm new password" />
                  </div>
                  
                  <button className="btn btn-primary">
                    <Lock size={18} />
                    Update Password
                  </button>
                </div>
              </SettingsSection>
              
              <SettingsSection icon={Lock} title="API Keys">
                <p className="text-secondary" style={{ marginBottom: 'var(--space-md)' }}>
                  Manage API keys for programmatic access to SecureAI.
                </p>
                <button className="btn btn-secondary">
                  Generate New API Key
                </button>
              </SettingsSection>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="animate-fade-in">
              <SettingsSection icon={Bell} title="Email Notifications">
                <div className="settings-toggles">
                  <label className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">Scan Complete</span>
                      <span className="toggle-description">Receive an email when a scan finishes</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle-input"
                      checked={notifications.scan_complete}
                      onChange={(e) => setNotifications(n => ({ ...n, scan_complete: e.target.checked }))}
                    />
                    <span className="toggle-switch" />
                  </label>
                  
                  <label className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">Scan Failed</span>
                      <span className="toggle-description">Get notified when a scan fails</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle-input"
                      checked={notifications.scan_failed}
                      onChange={(e) => setNotifications(n => ({ ...n, scan_failed: e.target.checked }))}
                    />
                    <span className="toggle-switch" />
                  </label>
                  
                  <label className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">Weekly Report</span>
                      <span className="toggle-description">Receive a weekly summary of all scans</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle-input"
                      checked={notifications.weekly_report}
                      onChange={(e) => setNotifications(n => ({ ...n, weekly_report: e.target.checked }))}
                    />
                    <span className="toggle-switch" />
                  </label>
                  
                  <label className="toggle-item">
                    <div className="toggle-info">
                      <span className="toggle-label">Security Alerts</span>
                      <span className="toggle-description">Critical vulnerability alerts</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle-input"
                      checked={notifications.security_alerts}
                      onChange={(e) => setNotifications(n => ({ ...n, security_alerts: e.target.checked }))}
                    />
                    <span className="toggle-switch" />
                  </label>
                </div>
                
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: 'var(--space-lg)' }}
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
              <SettingsSection icon={Palette} title="Theme">
                <p className="text-secondary" style={{ marginBottom: 'var(--space-md)' }}>
                  SecureAI uses a dark theme optimized for security workflows.
                </p>
                <div className="theme-options">
                  <div className="theme-option selected">
                    <div className="theme-preview theme-dark" />
                    <span>Dark</span>
                  </div>
                  <div className="theme-option disabled">
                    <div className="theme-preview theme-light" />
                    <span>Light (Coming Soon)</span>
                  </div>
                </div>
              </SettingsSection>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .settings-page {
          display: flex;
          gap: var(--space-xl);
          padding: var(--space-xl);
          animation: fadeIn var(--transition-base);
        }
        
        @media (max-width: 768px) {
          .settings-page {
            flex-direction: column;
          }
        }
        
        .settings-nav {
          width: 220px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        @media (max-width: 768px) {
          .settings-nav {
            width: 100%;
            flex-direction: row;
            overflow-x: auto;
          }
        }
        
        .settings-nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }
        
        .settings-nav-item:hover {
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
        }
        
        .settings-nav-item.active {
          background: var(--color-accent-glow);
          color: var(--color-accent);
        }
        
        .settings-content {
          flex: 1;
          max-width: 600px;
        }
        
        .settings-section {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-lg);
        }
        
        .settings-section-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md) var(--space-lg);
          border-bottom: 1px solid var(--color-border);
          color: var(--color-accent);
        }
        
        .settings-section-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }
        
        .settings-section-body {
          padding: var(--space-lg);
        }
        
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        
        .settings-toggles {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }
        
        .toggle-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-md);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
          cursor: pointer;
        }
        
        .toggle-info {
          display: flex;
          flex-direction: column;
        }
        
        .toggle-label {
          font-weight: 500;
        }
        
        .toggle-description {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }
        
        .toggle-input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }
        
        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          background: var(--color-border);
          border-radius: 12px;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }
        
        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: all var(--transition-fast);
        }
        
        .toggle-input:checked + .toggle-switch {
          background: var(--color-accent);
        }
        
        .toggle-input:checked + .toggle-switch::after {
          left: 22px;
        }
        
        .theme-options {
          display: flex;
          gap: var(--space-md);
        }
        
        .theme-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md);
          background: var(--color-bg-tertiary);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .theme-option.selected {
          border-color: var(--color-accent);
        }
        
        .theme-option.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .theme-preview {
          width: 80px;
          height: 50px;
          border-radius: var(--radius-sm);
        }
        
        .theme-dark {
          background: linear-gradient(135deg, #0a0e17 0%, #1a2234 100%);
        }
        
        .theme-light {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
      `}</style>
    </>
  );
}

