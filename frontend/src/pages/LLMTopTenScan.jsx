import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  AlertCircle, 
  Play, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ChevronDown, 
  Loader2,
  FileWarning,
  Skull,
  Eye,
  Lock,
  Database,
  Bug,
  Workflow,
  Server,
  RefreshCw,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';

// OWASP LLM Top 10 Categories
const LLM_TOP_10_CATEGORIES = [
  { id: 'LLM01', name: 'Prompt Injection', icon: FileWarning, description: 'Direct and indirect prompt injection attacks', color: '#ef4444' },
  { id: 'LLM02', name: 'Insecure Output Handling', icon: AlertTriangle, description: 'Failure to properly validate LLM outputs', color: '#f59e0b' },
  { id: 'LLM03', name: 'Training Data Poisoning', icon: Skull, description: 'Manipulation of training data to introduce vulnerabilities', color: '#dc2626' },
  { id: 'LLM04', name: 'Model Denial of Service', icon: Server, description: 'Resource exhaustion attacks against LLM services', color: '#8b5cf6' },
  { id: 'LLM05', name: 'Supply Chain Vulnerabilities', icon: Workflow, description: 'Risks from third-party components and data', color: '#06b6d4' },
  { id: 'LLM06', name: 'Sensitive Information Disclosure', icon: Eye, description: 'Unintended exposure of confidential data', color: '#ec4899' },
  { id: 'LLM07', name: 'Insecure Plugin Design', icon: Bug, description: 'Security flaws in LLM extensions and plugins', color: '#f97316' },
  { id: 'LLM08', name: 'Excessive Agency', icon: Layers, description: 'Overly permissive actions without human oversight', color: '#14b8a6' },
  { id: 'LLM09', name: 'Overreliance', icon: RefreshCw, description: 'Trusting LLM outputs without validation', color: '#6366f1' },
  { id: 'LLM10', name: 'Model Theft', icon: Lock, description: 'Unauthorized access to proprietary models', color: '#a855f7' },
];

const MODEL_OPTIONS = {
  openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
  anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  huggingface: ['meta-llama/Llama-2-7b', 'mistralai/Mistral-7B'],
  custom: ['custom-endpoint'],
};

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: XCircle },
  high: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', icon: AlertTriangle },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: AlertCircle },
  low: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', icon: CheckCircle },
};

export default function LLMTopTenScan() {
  const [scanName, setScanName] = useState('');
  const [scanDescription, setScanDescription] = useState('');
  const [modelType, setModelType] = useState('openai');
  const [modelName, setModelName] = useState('gpt-3.5-turbo');
  const [apiKey, setApiKey] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [activeScanId, setActiveScanId] = useState(null);

  // Create scan mutation
  const createScanMutation = useMutation({
    mutationFn: async (scanData) => {
      const response = await client.post('/llmtopten/scan', scanData);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`LLM Top 10 scan "${data.name}" started!`);
      setActiveScanId(data.id);
      setScanName('');
      setScanDescription('');
      setSelectedCategories([]);
    },
    onError: (error) => {
      const message = error.response?.data?.detail || error.message;
      toast.error(`Failed to start scan: ${message}`);
    },
  });

  // Poll scan status
  const { data: scanStatus } = useQuery({
    queryKey: ['llmtoptenStatus', activeScanId],
    queryFn: async () => {
      if (!activeScanId) return null;
      const response = await client.get(`/llmtopten/status/${activeScanId}`);
      return response.data;
    },
    refetchInterval: activeScanId ? 3000 : false,
    enabled: !!activeScanId,
  });

  // Get scan results
  const { data: scanResults } = useQuery({
    queryKey: ['llmtoptenResults', activeScanId],
    queryFn: async () => {
      if (!activeScanId) return null;
      const response = await client.get(`/llmtopten/results/${activeScanId}`);
      return response.data;
    },
    refetchInterval: scanStatus?.status !== 'COMPLETED' && scanStatus?.status !== 'FAILED' ? 5000 : false,
    enabled: !!activeScanId && scanStatus?.status === 'COMPLETED',
  });

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectAllCategories = () => {
    if (selectedCategories.length === LLM_TOP_10_CATEGORIES.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(LLM_TOP_10_CATEGORIES.map(c => c.id));
    }
  };

  const handleSubmitScan = async (e) => {
    e.preventDefault();

    if (!scanName.trim()) {
      toast.error('Scan name is required');
      return;
    }

    if (!apiKey.trim() && modelType !== 'huggingface') {
      toast.error('API key is required');
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error('Select at least one category to test');
      return;
    }

    const scanData = {
      name: scanName,
      description: scanDescription,
      model_type: modelType,
      model_name: modelName,
      categories: selectedCategories,
      llm_config: {
        api_key: apiKey,
      },
    };

    createScanMutation.mutate(scanData);
  };

  const getProgress = () => {
    if (!scanStatus) return 0;
    if (scanStatus.status === 'COMPLETED') return 100;
    if (scanStatus.status === 'FAILED') return 100;
    return scanStatus.progress || 0;
  };

  return (
    <div className="llmtopten-page">
      {/* Hero */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-icon">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="hero-title">OWASP LLM Top 10 Scanner</h1>
            <p className="hero-subtitle">Comprehensive security testing against the OWASP LLM Top 10 vulnerabilities</p>
          </div>
        </div>
        <div className="hero-badges">
          <span className="badge badge-primary">OWASP</span>
          <span className="badge badge-secondary">10 Categories</span>
          <span className="badge badge-accent">AI Security</span>
        </div>
      </div>

      <div className="scan-grid">
        {/* Configuration Panel */}
        <div className="config-panel">
          <div className="panel-header">
            <h2>Scan Configuration</h2>
            <p>Configure your LLM Top 10 security assessment</p>
          </div>

          <form onSubmit={handleSubmitScan} className="config-form">
            {/* Basic Info */}
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-group">
                <label>Scan Name *</label>
                <input
                  type="text"
                  value={scanName}
                  onChange={(e) => setScanName(e.target.value)}
                  placeholder="My LLM Security Scan"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={scanDescription}
                  onChange={(e) => setScanDescription(e.target.value)}
                  placeholder="Describe the purpose of this scan..."
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>

            {/* Model Config */}
            <div className="form-section">
              <h3>Model Configuration</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Provider</label>
                  <div className="select-wrapper">
                    <select
                      value={modelType}
                      onChange={(e) => {
                        setModelType(e.target.value);
                        setModelName(MODEL_OPTIONS[e.target.value][0]);
                      }}
                      className="form-select"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="huggingface">HuggingFace</option>
                      <option value="custom">Custom</option>
                    </select>
                    <ChevronDown size={16} className="select-icon" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Model</label>
                  <div className="select-wrapper">
                    <select
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="form-select"
                    >
                      {MODEL_OPTIONS[modelType].map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="select-icon" />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>API Key *</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="form-input"
                />
              </div>
            </div>

            {/* Categories Selection */}
            <div className="form-section">
              <div className="section-header">
                <h3>Test Categories</h3>
                <button type="button" className="select-all-btn" onClick={selectAllCategories}>
                  {selectedCategories.length === LLM_TOP_10_CATEGORIES.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="categories-grid">
                {LLM_TOP_10_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategories.includes(category.id);
                  return (
                    <div
                      key={category.id}
                      className={`category-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleCategory(category.id)}
                      style={{ '--category-color': category.color }}
                    >
                      <div className="category-icon">
                        <Icon size={20} />
                      </div>
                      <div className="category-info">
                        <span className="category-id">{category.id}</span>
                        <span className="category-name">{category.name}</span>
                      </div>
                      <div className="category-check">
                        {isSelected && <CheckCircle size={16} />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="selection-count">{selectedCategories.length} of 10 categories selected</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="submit-btn"
              disabled={createScanMutation.isPending}
            >
              {createScanMutation.isPending ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Starting Scan...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Start LLM Top 10 Scan
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="results-panel">
          <div className="panel-header">
            <h2>Scan Results</h2>
            {scanStatus && (
              <span className={`status-badge status-${scanStatus.status?.toLowerCase()}`}>
                {scanStatus.status}
              </span>
            )}
          </div>

          {!activeScanId ? (
            <div className="empty-results">
              <Shield size={48} />
              <h3>No Active Scan</h3>
              <p>Configure and start a scan to see results here</p>
            </div>
          ) : (
            <div className="results-content">
              {/* Progress */}
              {scanStatus && scanStatus.status !== 'COMPLETED' && scanStatus.status !== 'FAILED' && (
                <div className="progress-section">
                  <div className="progress-header">
                    <span>Scanning...</span>
                    <span>{getProgress()}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${getProgress()}%` }} />
                  </div>
                  <p className="progress-detail">{scanStatus.current_category || 'Initializing...'}</p>
                </div>
              )}

              {/* Results */}
              {scanResults && (
                <div className="vulnerabilities-list">
                  {scanResults.findings?.map((finding, idx) => {
                    const severity = SEVERITY_CONFIG[finding.severity?.toLowerCase()] || SEVERITY_CONFIG.medium;
                    const SeverityIcon = severity.icon;
                    return (
                      <div key={idx} className="vulnerability-card" style={{ '--severity-color': severity.color, '--severity-bg': severity.bg }}>
                        <div className="vuln-header">
                          <div className="vuln-severity">
                            <SeverityIcon size={18} />
                            <span>{finding.severity}</span>
                          </div>
                          <span className="vuln-category">{finding.category}</span>
                        </div>
                        <h4 className="vuln-title">{finding.title}</h4>
                        <p className="vuln-description">{finding.description}</p>
                        {finding.recommendation && (
                          <div className="vuln-recommendation">
                            <strong>Recommendation:</strong> {finding.recommendation}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {scanResults.findings?.length === 0 && (
                    <div className="no-vulnerabilities">
                      <CheckCircle size={48} />
                      <h3>No Vulnerabilities Found</h3>
                      <p>Your model passed all selected security tests</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .llmtopten-page {
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        /* Hero */
        .hero-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem 2.5rem;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          margin-bottom: 1.5rem;
        }

        .hero-content {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .hero-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-radius: 16px;
          color: white;
          box-shadow: 0 8px 30px rgba(239, 68, 68, 0.3);
        }

        .hero-title {
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0 0 0.5rem 0;
        }

        .hero-subtitle {
          font-size: 1rem;
          color: #94a3b8;
          margin: 0;
        }

        .hero-badges {
          display: flex;
          gap: 0.5rem;
        }

        .badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .badge-primary {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .badge-secondary {
          background: rgba(249, 115, 22, 0.15);
          color: #fb923c;
          border: 1px solid rgba(249, 115, 22, 0.3);
        }

        .badge-accent {
          background: rgba(6, 182, 212, 0.15);
          color: #22d3ee;
          border: 1px solid rgba(6, 182, 212, 0.3);
        }

        /* Grid Layout */
        .scan-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 1200px) {
          .scan-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Panels */
        .config-panel, .results-panel {
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .panel-header h2 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
        }

        .panel-header p {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0.25rem 0 0 0;
        }

        /* Form */
        .config-form {
          padding: 1.5rem;
        }

        .form-section {
          margin-bottom: 1.5rem;
        }

        .form-section h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #94a3b8;
          margin: 0 0 1rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .section-header h3 {
          margin: 0;
        }

        .select-all-btn {
          padding: 0.375rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #94a3b8;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .select-all-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #94a3b8;
          margin-bottom: 0.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-input, .form-textarea, .form-select {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 0.9375rem;
          color: #fff;
          transition: all 0.15s ease;
        }

        .form-input:focus, .form-textarea:focus, .form-select:focus {
          outline: none;
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(255, 255, 255, 0.05);
        }

        .form-input::placeholder, .form-textarea::placeholder {
          color: #475569;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .select-wrapper {
          position: relative;
        }

        .form-select {
          appearance: none;
          padding-right: 2.5rem;
          cursor: pointer;
        }

        .select-icon {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }

        /* Categories Grid */
        .categories-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .category-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .category-card:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .category-card.selected {
          background: rgba(239, 68, 68, 0.05);
          border-color: var(--category-color);
        }

        .category-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          color: var(--category-color);
          flex-shrink: 0;
        }

        .category-card.selected .category-icon {
          background: var(--category-color);
          color: white;
        }

        .category-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .category-id {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #64748b;
        }

        .category-name {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .category-check {
          color: #22c55e;
        }

        .selection-count {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0.75rem 0 0 0;
          text-align: center;
        }

        /* Submit Button */
        .submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(239, 68, 68, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Status Badge */
        .status-badge {
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-running, .status-pending {
          background: rgba(249, 115, 22, 0.15);
          color: #fb923c;
        }

        .status-completed {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .status-failed {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }

        /* Empty State */
        .empty-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          color: #64748b;
        }

        .empty-results svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-results h3 {
          font-size: 1.125rem;
          color: #fff;
          margin: 0 0 0.5rem 0;
        }

        .empty-results p {
          margin: 0;
        }

        /* Progress */
        .results-content {
          padding: 1.5rem;
        }

        .progress-section {
          margin-bottom: 1.5rem;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ef4444 0%, #f97316 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-detail {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0.5rem 0 0 0;
        }

        /* Vulnerabilities */
        .vulnerabilities-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .vulnerability-card {
          padding: 1.25rem;
          background: var(--severity-bg);
          border: 1px solid var(--severity-color);
          border-radius: 12px;
        }

        .vuln-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .vuln-severity {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--severity-color);
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: uppercase;
        }

        .vuln-category {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          color: #94a3b8;
        }

        .vuln-title {
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.5rem 0;
        }

        .vuln-description {
          font-size: 0.875rem;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0;
        }

        .vuln-recommendation {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.8125rem;
          color: #94a3b8;
        }

        .vuln-recommendation strong {
          color: #22c55e;
        }

        .no-vulnerabilities {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 3rem;
          text-align: center;
          color: #22c55e;
        }

        .no-vulnerabilities h3 {
          color: #fff;
          margin: 1rem 0 0.5rem 0;
        }

        .no-vulnerabilities p {
          color: #64748b;
          margin: 0;
        }

        @media (max-width: 768px) {
          .hero-section {
            flex-direction: column;
            text-align: center;
            gap: 1.5rem;
          }

          .hero-content {
            flex-direction: column;
          }

          .form-row, .categories-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
