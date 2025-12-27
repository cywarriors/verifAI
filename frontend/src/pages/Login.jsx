import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Zap, 
  Lock, 
  BarChart3,
  ArrowRight,
  Sparkles,
  Globe,
  Cpu,
  ShieldCheck,
  Target,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

// Animated typing text
function TypeWriter({ words, speed = 100, pause = 2000 }) {
  const [text, setText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(currentWord.substring(0, text.length + 1));
        if (text === currentWord) {
          setTimeout(() => setIsDeleting(true), pause);
        }
      } else {
        setText(currentWord.substring(0, text.length - 1));
        if (text === '') {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, speed, pause]);

  return <span className="typewriter-text">{text}<span className="cursor">|</span></span>;
}

// Animated counter
function AnimatedCounter({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return <span ref={countRef}>{count}{suffix}</span>;
}

// Floating particles background
function ParticleField() {
  return (
    <div className="particle-field">
      {[...Array(50)].map((_, i) => (
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
        <Shield size={48} />
      </div>
      <div className="shield-pulse" />
    </div>
  );
}

// Floating icons
function FloatingIcons() {
  const icons = [
    { Icon: Globe, delay: 0, x: 10, y: 20 },
    { Icon: Cpu, delay: 1, x: 85, y: 15 },
    { Icon: Target, delay: 2, x: 75, y: 70 },
    { Icon: Layers, delay: 0.5, x: 15, y: 75 },
    { Icon: ShieldCheck, delay: 1.5, x: 90, y: 45 },
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
          <Icon size={24} />
        </div>
      ))}
    </div>
  );
}

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Detection',
    description: 'Advanced ML models identify vulnerabilities in real-time',
    gradient: 'from-amber-500 to-orange-600'
  },
  {
    icon: Lock,
    title: 'Zero-Trust Security',
    description: 'Enterprise-grade protection with continuous verification',
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Actionable insights powered by threat intelligence',
    gradient: 'from-violet-500 to-purple-600'
  }
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const heroRef = useRef(null);
  
  const from = location.state?.from?.pathname || '/';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();
      
      if (!trimmedUsername || !trimmedPassword) {
        setError('Username and password are required');
        setIsLoading(false);
        return;
      }
      
      await login(trimmedUsername, trimmedPassword);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Invalid credentials';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
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

          {/* Dynamic Headline */}
          <div className="headline-section">
            <div className="headline-badge">
              <div className="badge-dot" />
              <span>Now with Garak Integration</span>
              <Sparkles size={14} />
            </div>
            
            <h1>
              Protect Your LLMs Against
              <br />
              <TypeWriter 
                words={['Prompt Injection', 'Data Leakage', 'Jailbreaks', 'Adversarial Attacks', 'Bias & Toxicity']}
                speed={80}
                pause={1500}
              />
            </h1>
            
            <p className="headline-description">
              The next-generation security platform for Large Language Models.
              Continuous monitoring, automated testing, and compliance in one place.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="feature-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="feature-icon-wrapper">
                  <feature.icon size={22} />
                </div>
                <div className="feature-content">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="stats-section">
            <div className="stat-item">
              <span className="stat-value"><AnimatedCounter end={500} suffix="+" /></span>
              <span className="stat-label">Security Probes</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value"><AnimatedCounter end={99} suffix="%" /></span>
              <span className="stat-label">Detection Rate</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value"><AnimatedCounter end={5} /></span>
              <span className="stat-label">Compliance Frameworks</span>
            </div>
          </div>

          {/* Trust Logos */}
          <div className="trust-section">
            <span>Compliant with</span>
            <div className="trust-badges">
              <div className="trust-badge">NIST AI RMF</div>
              <div className="trust-badge">ISO 42001</div>
              <div className="trust-badge">EU AI Act</div>
            </div>
          </div>
        </div>

        {/* Gradient overlay that follows mouse */}
        <div className="mouse-gradient" />
      </div>

      {/* Login Form Section */}
      <div className="form-section">
        <div className="form-wrapper">
          {/* Mobile logo */}
          <div className="mobile-logo">
            <Shield size={32} />
            <span>verifAI</span>
          </div>

          <div className="form-glass">
            <div className="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to access your security dashboard</p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="input-wrapper">
                <label htmlFor="username">Username</label>
                <div className="input-field">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="input-wrapper">
                <label htmlFor="password">Password</label>
                <div className="input-field">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
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

              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="loader" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p>
                New to verifAI? <Link to="/register">Create account</Link>
              </p>
            </div>
          </div>

          <Link to="/scans/garak" className="explore-link">
            <Sparkles size={16} />
            <span>Explore 500+ Security Probes</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          background: #030712;
        }

        @media (max-width: 1024px) {
          .login-page {
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
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%);
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
          background: rgba(6, 182, 212, 0.6);
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
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: rgba(6, 182, 212, 0.5);
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
          width: 120px;
          height: 120px;
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
          border-color: rgba(6, 182, 212, 0.3);
          animation-delay: 0s;
        }

        .ring-2 {
          width: 130%;
          height: 130%;
          border-color: rgba(6, 182, 212, 0.2);
          animation-delay: 0.5s;
        }

        .ring-3 {
          width: 160%;
          height: 160%;
          border-color: rgba(6, 182, 212, 0.1);
          animation-delay: 1s;
        }

        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }

        .shield-core {
          position: relative;
          z-index: 2;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          border-radius: 20px;
          color: white;
          box-shadow: 
            0 0 40px rgba(6, 182, 212, 0.4),
            0 0 80px rgba(6, 182, 212, 0.2);
        }

        .shield-pulse {
          position: absolute;
          width: 80px;
          height: 80px;
          background: rgba(6, 182, 212, 0.4);
          border-radius: 20px;
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
          max-width: 600px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .logo-name {
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .logo-tagline {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          letter-spacing: 0.05em;
        }

        /* Headline */
        .headline-section {
          margin-bottom: 2.5rem;
        }

        .headline-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.2);
          border-radius: 100px;
          font-size: 0.8125rem;
          color: var(--color-accent);
          margin-bottom: 1.5rem;
          animation: badge-pulse 2s ease-in-out infinite;
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          background: var(--color-accent);
          border-radius: 50%;
          animation: dot-blink 1.5s ease-in-out infinite;
        }

        @keyframes badge-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.2); }
          50% { box-shadow: 0 0 0 8px rgba(6, 182, 212, 0); }
        }

        @keyframes dot-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .headline-section h1 {
          font-size: 2.75rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.25rem;
          background: linear-gradient(135deg, #fff 0%, #e2e8f0 50%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .typewriter-text {
          color: var(--color-accent);
          -webkit-text-fill-color: var(--color-accent);
        }

        .cursor {
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .headline-description {
          font-size: 1.0625rem;
          line-height: 1.7;
          color: var(--color-text-secondary);
          max-width: 500px;
        }

        /* Feature Grid */
        .feature-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        .feature-card {
          display: flex;
          gap: 1rem;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          backdrop-filter: blur(8px);
          transition: all 0.3s ease;
          animation: slide-up 0.6s ease-out backwards;
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(6, 182, 212, 0.3);
          transform: translateX(8px);
          box-shadow: 0 8px 32px rgba(6, 182, 212, 0.1);
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

        .feature-icon-wrapper {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.05) 100%);
          border-radius: 12px;
          color: var(--color-accent);
          flex-shrink: 0;
        }

        .feature-content h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .feature-content p {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          line-height: 1.5;
        }

        /* Stats */
        .stats-section {
          display: flex;
          align-items: center;
          gap: 2rem;
          padding: 1.5rem 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 1.5rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(135deg, var(--color-accent) 0%, #22d3ee 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-label {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
        }

        /* Trust Section */
        .trust-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: var(--color-text-muted);
          font-size: 0.8125rem;
        }

        .trust-badges {
          display: flex;
          gap: 0.5rem;
        }

        .trust-badge {
          padding: 0.375rem 0.75rem;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-success);
        }

        /* ===== Form Section ===== */
        .form-section {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(180deg, #030712 0%, #0a0e17 100%);
        }

        .form-wrapper {
          width: 100%;
          max-width: 420px;
        }

        .mobile-logo {
          display: none;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
          color: var(--color-accent);
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
          padding: 2.5rem;
          backdrop-filter: blur(20px);
          box-shadow: 
            0 0 0 1px rgba(255, 255, 255, 0.05) inset,
            0 20px 50px rgba(0, 0, 0, 0.5);
        }

        .form-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .form-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .form-header p {
          color: var(--color-text-muted);
          font-size: 0.9375rem;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: #f87171;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .input-wrapper {
          margin-bottom: 1.25rem;
        }

        .input-wrapper label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          margin-bottom: 0.5rem;
        }

        .input-field {
          position: relative;
        }

        .input-field input {
          width: 100%;
          padding: 0.875rem 1rem;
          font-family: var(--font-sans);
          font-size: 1rem;
          color: var(--color-text-primary);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .input-field input::placeholder {
          color: var(--color-text-muted);
        }

        .input-field input:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .input-field input:focus {
          outline: none;
          border-color: var(--color-accent);
          background: rgba(6, 182, 212, 0.05);
          box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.1);
        }

        .toggle-password {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          padding: 0.5rem;
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .toggle-password:hover {
          color: var(--color-text-primary);
        }

        .submit-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          font-family: var(--font-sans);
          font-size: 1rem;
          font-weight: 600;
          color: #030712;
          background: linear-gradient(135deg, var(--color-accent) 0%, #22d3ee 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
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
            0 10px 40px rgba(6, 182, 212, 0.4),
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
          width: 20px;
          height: 20px;
          border: 2px solid rgba(3, 7, 18, 0.3);
          border-top-color: #030712;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .form-footer {
          text-align: center;
          margin-top: 1.5rem;
          color: var(--color-text-secondary);
          font-size: 0.9375rem;
        }

        .form-footer a {
          color: var(--color-accent);
          font-weight: 500;
          transition: color 0.15s ease;
        }

        .form-footer a:hover {
          color: var(--color-accent-light);
        }

        .explore-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
          padding: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-muted);
          background: transparent;
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .explore-link:hover {
          color: var(--color-accent);
          border-color: rgba(6, 182, 212, 0.3);
          border-style: solid;
          background: rgba(6, 182, 212, 0.05);
        }
      `}</style>
    </div>
  );
}

