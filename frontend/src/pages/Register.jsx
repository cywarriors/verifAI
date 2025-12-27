import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Check, 
  ArrowRight,
  Sparkles,
  User,
  Mail,
  Lock,
  UserPlus,
  ShieldCheck,
  Zap,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

// Floating particles background
function ParticleField() {
  return (
    <div className="particle-field">
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

// Animated security shield
function SecurityShield() {
  return (
    <div className="security-shield">
      <div className="shield-ring ring-1" />
      <div className="shield-ring ring-2" />
      <div className="shield-ring ring-3" />
      <div className="shield-core">
        <UserPlus size={40} />
      </div>
      <div className="shield-pulse" />
    </div>
  );
}

// Floating icons
function FloatingIcons() {
  const icons = [
    { Icon: ShieldCheck, delay: 0, x: 8, y: 15 },
    { Icon: Zap, delay: 1, x: 88, y: 12 },
    { Icon: BarChart3, delay: 2, x: 82, y: 75 },
    { Icon: Lock, delay: 0.5, x: 12, y: 80 },
  ];

  return (
    <div className="floating-icons">
      {icons.map(({ Icon, delay, x, y }, i) => (
        <div
          key={i}
          className="floating-icon"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            animationDelay: `${delay}s`,
          }}
        >
          <Icon size={22} />
        </div>
      ))}
    </div>
  );
}

const features = [
  {
    icon: ShieldCheck,
    title: '500+ Security Probes',
    color: '#06b6d4',
  },
  {
    icon: Zap,
    title: 'Real-time Detection',
    color: '#f59e0b',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    color: '#8b5cf6',
  },
];

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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef(null);

  // Track mouse for gradient effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8, icon: '8+' },
    { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p), icon: 'A' },
    { label: 'Lowercase letter', test: (p) => /[a-z]/.test(p), icon: 'a' },
    { label: 'Number', test: (p) => /[0-9]/.test(p), icon: '1' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
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
    <div className="register-page">
      {/* Hero Section */}
      <div 
        className="hero-section" 
        ref={heroRef}
        style={{
          '--mouse-x': `${mousePos.x}%`,
          '--mouse-y': `${mousePos.y}%`,
        }}
      >
        <ParticleField />
        <FloatingIcons />
        
        <div className="hero-content">
          {/* Animated Logo */}
          <div className="logo-section">
            <SecurityShield />
            <div className="logo-text">
              <span className="logo-name">verifAI</span>
              <span className="logo-tagline">Where AI Meets Assurance</span>
            </div>
          </div>

          {/* Headline */}
          <div className="headline-section">
            <div className="headline-badge">
              <div className="badge-dot" />
              <span>Join 1,000+ Security Teams</span>
              <Sparkles size={14} />
            </div>
            
            <h1>
              Start Protecting<br />
              <span className="highlight">Your AI Today</span>
            </h1>
            
            <p className="headline-description">
              Create your account and get instant access to advanced LLM security 
              testing, compliance monitoring, and threat detection.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="feature-pills">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-pill" 
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  '--feature-color': feature.color 
                }}
              >
                <feature.icon size={16} />
                <span>{feature.title}</span>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="benefits-list">
            <div className="benefit-item">
              <Check size={18} />
              <span>Free tier available</span>
            </div>
            <div className="benefit-item">
              <Check size={18} />
              <span>No credit card required</span>
            </div>
            <div className="benefit-item">
              <Check size={18} />
              <span>Setup in minutes</span>
            </div>
          </div>
        </div>

        {/* Gradient overlay that follows mouse */}
        <div className="mouse-gradient" />
      </div>

      {/* Form Section */}
      <div className="form-section">
        <div className="form-wrapper">
          {/* Mobile logo */}
          <div className="mobile-logo">
            <Shield size={32} />
            <span>verifAI</span>
          </div>

          <div className="form-glass">
            <div className="form-header">
              <h2>Create Account</h2>
              <p>Get started with verifAI in seconds</p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-row">
                <div className="input-wrapper">
                  <label htmlFor="username">
                    <User size={14} />
                    Username
                  </label>
                  <div className="input-field">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="johndoe"
                      required
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="input-wrapper">
                  <label htmlFor="email">
                    <Mail size={14} />
                    Email
                  </label>
                  <div className="input-field">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
              </div>

              <div className="input-wrapper">
                <label htmlFor="full_name">Full Name (Optional)</label>
                <div className="input-field">
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-wrapper">
                  <label htmlFor="password">
                    <Lock size={14} />
                    Password
                  </label>
                  <div className="input-field">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="input-wrapper">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-field">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="password-requirements">
                {passwordRequirements.map((req, i) => (
                  <div 
                    key={i} 
                    className={`password-req ${req.test(formData.password) ? 'met' : ''}`}
                  >
                    <div className="req-icon">{req.icon}</div>
                    <span>{req.label}</span>
                    {req.test(formData.password) && <Check size={12} />}
                  </div>
                ))}
              </div>

              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="loader" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </div>
          </div>

          <div className="terms-text">
            By creating an account, you agree to our{' '}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
          </div>
        </div>
      </div>
      
      <style>{`
        .register-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          background: #030712;
        }

        @media (max-width: 1024px) {
          .register-page {
            grid-template-columns: 1fr;
          }
          .hero-section {
            display: none;
          }
        }

        /* ===== Hero Section ===== */
        .hero-section {
          position: relative;
          background: linear-gradient(135deg, #030712 0%, #0f172a 50%, #1e1b4b 100%);
          padding: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .mouse-gradient {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
          left: var(--mouse-x);
          top: var(--mouse-y);
          transform: translate(-50%, -50%);
          pointer-events: none;
          transition: left 0.3s ease, top 0.3s ease;
        }

        /* Particles */
        .particle-field {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: rgba(139, 92, 246, 0.6);
          border-radius: 50%;
          animation: float-particle linear infinite;
        }

        @keyframes float-particle {
          0%, 100% {
            opacity: 0;
            transform: translateY(0) scale(0);
          }
          10% {
            opacity: 1;
            transform: scale(1);
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(0);
          }
        }

        /* Floating Icons */
        .floating-icons {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .floating-icon {
          position: absolute;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: rgba(139, 92, 246, 0.5);
          animation: float 6s ease-in-out infinite;
          backdrop-filter: blur(4px);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        /* Security Shield Animation */
        .security-shield {
          position: relative;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shield-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid;
          animation: pulse-ring 3s ease-in-out infinite;
        }

        .ring-1 {
          width: 100%;
          height: 100%;
          border-color: rgba(139, 92, 246, 0.3);
          animation-delay: 0s;
        }

        .ring-2 {
          width: 130%;
          height: 130%;
          border-color: rgba(139, 92, 246, 0.2);
          animation-delay: 0.5s;
        }

        .ring-3 {
          width: 160%;
          height: 160%;
          border-color: rgba(139, 92, 246, 0.1);
          animation-delay: 1s;
        }

        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }

        .shield-core {
          position: relative;
          z-index: 2;
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border-radius: 18px;
          color: white;
          box-shadow: 
            0 0 40px rgba(139, 92, 246, 0.4),
            0 0 80px rgba(139, 92, 246, 0.2);
        }

        .shield-pulse {
          position: absolute;
          width: 72px;
          height: 72px;
          background: rgba(139, 92, 246, 0.4);
          border-radius: 18px;
          animation: shield-glow 2s ease-in-out infinite;
        }

        @keyframes shield-glow {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0; }
        }

        /* Hero Content */
        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 500px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-bottom: 2.5rem;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .logo-name {
          font-size: 1.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .logo-tagline {
          font-size: 0.8125rem;
          color: #64748b;
          letter-spacing: 0.05em;
        }

        /* Headline */
        .headline-section {
          margin-bottom: 2rem;
        }

        .headline-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 100px;
          font-size: 0.8125rem;
          color: #a78bfa;
          margin-bottom: 1.25rem;
          animation: badge-pulse 2s ease-in-out infinite;
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          background: #a78bfa;
          border-radius: 50%;
          animation: dot-blink 1.5s ease-in-out infinite;
        }

        @keyframes badge-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.2); }
          50% { box-shadow: 0 0 0 8px rgba(139, 92, 246, 0); }
        }

        @keyframes dot-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .headline-section h1 {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #fff 0%, #e2e8f0 50%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .headline-section h1 .highlight {
          color: #a78bfa;
          -webkit-text-fill-color: #a78bfa;
        }

        .headline-description {
          font-size: 1rem;
          line-height: 1.7;
          color: #94a3b8;
          max-width: 450px;
        }

        /* Feature Pills */
        .feature-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .feature-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 100px;
          font-size: 0.8125rem;
          color: #e2e8f0;
          animation: slide-up 0.6s ease-out backwards;
        }

        .feature-pill svg {
          color: var(--feature-color);
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Benefits */
        .benefits-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9375rem;
          color: #94a3b8;
        }

        .benefit-item svg {
          color: #22c55e;
        }

        /* ===== Form Section ===== */
        .form-section {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(180deg, #030712 0%, #0a0e17 100%);
          overflow-y: auto;
        }

        .form-wrapper {
          width: 100%;
          max-width: 480px;
        }

        .mobile-logo {
          display: none;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
          color: #8b5cf6;
        }

        .mobile-logo span {
          font-size: 1.5rem;
          font-weight: 700;
        }

        @media (max-width: 1024px) {
          .mobile-logo {
            display: flex;
          }
        }

        .form-glass {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 2rem;
          backdrop-filter: blur(20px);
          box-shadow: 
            0 0 0 1px rgba(255, 255, 255, 0.05) inset,
            0 20px 50px rgba(0, 0, 0, 0.5);
        }

        .form-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .form-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.375rem;
          background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .form-header p {
          color: #64748b;
          font-size: 0.875rem;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          color: #f87171;
          font-size: 0.8125rem;
          margin-bottom: 1.25rem;
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 500px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }

        .input-wrapper {
          margin-bottom: 1rem;
        }

        .input-wrapper label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #94a3b8;
          margin-bottom: 0.375rem;
        }

        .input-wrapper label svg {
          color: #64748b;
        }

        .input-field {
          position: relative;
        }

        .input-field input {
          width: 100%;
          padding: 0.75rem 1rem;
          font-family: inherit;
          font-size: 0.9375rem;
          color: #fff;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          transition: all 0.2s ease;
        }

        .input-field input::placeholder {
          color: #475569;
        }

        .input-field input:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .input-field input:focus {
          outline: none;
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .toggle-password {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          padding: 0.375rem;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .toggle-password:hover {
          color: #fff;
        }

        /* Password Requirements */
        .password-requirements {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }

        .password-req {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #64748b;
          transition: all 0.2s ease;
        }

        .password-req.met {
          color: #22c55e;
        }

        .req-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          font-size: 0.6875rem;
          font-weight: 600;
        }

        .password-req.met .req-icon {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .password-req svg {
          margin-left: auto;
          color: #22c55e;
        }

        .submit-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.875rem 1.5rem;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .submit-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }

        .submit-button:hover:not(:disabled)::before {
          transform: translateX(100%);
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 
            0 10px 40px rgba(139, 92, 246, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loader {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .form-footer {
          text-align: center;
          margin-top: 1.25rem;
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .form-footer a {
          color: #a78bfa;
          font-weight: 500;
          transition: color 0.15s ease;
        }

        .form-footer a:hover {
          color: #c4b5fd;
        }

        .terms-text {
          text-align: center;
          margin-top: 1.25rem;
          font-size: 0.75rem;
          color: #64748b;
        }

        .terms-text a {
          color: #94a3b8;
          transition: color 0.15s ease;
        }

        .terms-text a:hover {
          color: #a78bfa;
        }
      `}</style>
    </div>
  );
}

