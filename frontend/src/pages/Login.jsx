import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(username, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      const message = err.response?.data?.detail || 'Invalid credentials';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <Shield size={40} />
          </div>
          <h1>verifAI</h1>
          <p>Where AI Meets Assurance</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Sign In</h2>
          
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="input-group">
            <label className="input-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
              autoFocus
            />
          </div>
          
          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
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
          
          <button 
            type="submit" 
            className="btn btn-primary btn-lg auth-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
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

