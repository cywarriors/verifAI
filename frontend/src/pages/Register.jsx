import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'Contains number', test: (p) => /[0-9]/.test(p) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const failedReqs = passwordRequirements.filter(r => !r.test(formData.password));
    if (failedReqs.length > 0) {
      setError('Password does not meet requirements');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register({
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
      });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.detail || 'Registration failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container auth-container-wide">
        <div className="auth-header">
          <div className="auth-logo">
            <Shield size={40} />
          </div>
          <h1>verifAI</h1>
          <p>Where AI Meets Assurance</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Create Account</h2>
          
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="form-row">
            <div className="input-group">
              <label className="input-label required" htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                className="input"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
                autoComplete="username"
                autoFocus
              />
            </div>
            
            <div className="input-group">
              <label className="input-label required" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label" htmlFor="full_name">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              className="input"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              autoComplete="name"
            />
          </div>
          
          <div className="form-row">
            <div className="input-group">
              <label className="input-label required" htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="input-group">
              <label className="input-label required" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />
            </div>
          </div>
          
          <div className="password-requirements">
            {passwordRequirements.map((req, i) => (
              <div 
                key={i} 
                className={`password-req ${req.test(formData.password) ? 'met' : ''}`}
              >
                <Check size={14} />
                <span>{req.label}</span>
              </div>
            ))}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-lg auth-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
      
      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-lg);
        }
        
        .auth-container {
          width: 100%;
          max-width: 400px;
        }
        
        .auth-container-wide {
          max-width: 480px;
        }
        
        .auth-header {
          text-align: center;
          margin-bottom: var(--space-xl);
        }
        
        .auth-logo {
          width: 72px;
          height: 72px;
          margin: 0 auto var(--space-md);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-accent-glow);
          border: 2px solid var(--color-accent);
          border-radius: var(--radius-xl);
          color: var(--color-accent);
        }
        
        .auth-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: var(--space-xs);
        }
        
        .auth-header p {
          color: var(--color-text-muted);
          font-size: 0.9375rem;
        }
        
        .auth-form {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
        }
        
        .auth-form h2 {
          font-size: 1.25rem;
          margin-bottom: var(--space-lg);
          text-align: center;
        }
        
        .auth-error {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--color-danger-bg);
          border: 1px solid var(--color-danger);
          border-radius: var(--radius-md);
          color: var(--color-danger);
          font-size: 0.875rem;
          margin-bottom: var(--space-md);
        }
        
        .auth-form .input-group {
          margin-bottom: var(--space-md);
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
        }
        
        @media (max-width: 500px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
        
        .password-input-wrapper {
          position: relative;
        }
        
        .password-input-wrapper .input {
          padding-right: 44px;
        }
        
        .password-toggle {
          position: absolute;
          right: 4px;
          top: 50%;
          transform: translateY(-50%);
          padding: var(--space-sm);
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: color var(--transition-fast);
        }
        
        .password-toggle:hover {
          color: var(--color-text-primary);
        }
        
        .password-requirements {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-xs);
          margin-bottom: var(--space-md);
        }
        
        .password-req {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
        
        .password-req.met {
          color: var(--color-success);
        }
        
        .password-req svg {
          opacity: 0.3;
        }
        
        .password-req.met svg {
          opacity: 1;
        }
        
        .auth-submit {
          width: 100%;
          margin-top: var(--space-md);
        }
        
        .auth-footer {
          text-align: center;
          margin-top: var(--space-lg);
          color: var(--color-text-secondary);
          font-size: 0.9375rem;
        }
      `}</style>
    </div>
  );
}

