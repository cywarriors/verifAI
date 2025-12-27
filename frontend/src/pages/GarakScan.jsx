import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AlertCircle, Play, Zap, Shield, CheckCircle, AlertTriangle, XCircle, Clock, BarChart3, ChevronDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';

const GarakScan = () => {
  const [scanName, setScanName] = useState('');
  const [scanDescription, setScanDescription] = useState('');
  const [modelType, setModelType] = useState('openai');
  const [modelName, setModelName] = useState('gpt-3.5-turbo');
  const [apiKey, setApiKey] = useState('');
  const [selectedProbes, setSelectedProbes] = useState([]);
  const [maxConcurrent, setMaxConcurrent] = useState(3);
  const [timeout, setTimeout] = useState(60);
  const [activeScanId, setActiveScanId] = useState(null);

  const MODEL_OPTIONS = {
    openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    huggingface: ['meta-llama/Llama-2-7b', 'mistralai/Mistral-7B'],
    custom: ['custom-endpoint'],
  };

  // Fetch available Garak probes
  const { data: probes, isLoading: probesLoading, error: probesError } = useQuery({
    queryKey: ['garakProbes'],
    queryFn: async () => {
      const response = await client.get('/garak/probes');
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Create Garak scan mutation
  const createScanMutation = useMutation({
    mutationFn: async (scanData) => {
      const response = await client.post('/garak/scan', scanData);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Garak scan "${data.name}" started successfully!`);
      setActiveScanId(data.id);
      setScanName('');
      setScanDescription('');
      setSelectedProbes([]);
    },
    onError: (error) => {
      const message = error.response?.data?.detail || error.message;
      toast.error(`Failed to start scan: ${message}`);
    },
  });

  // Poll scan status
  const { data: scanStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['garakScanStatus', activeScanId],
    queryFn: async () => {
      if (!activeScanId) return null;
      const response = await client.get(`/garak/status/${activeScanId}`);
      return response.data;
    },
    refetchInterval: activeScanId ? 3000 : false,
    enabled: !!activeScanId,
  });

  // Get scan results
  const { data: scanResults, isLoading: resultsLoading } = useQuery({
    queryKey: ['garakScanResults', activeScanId],
    queryFn: async () => {
      if (!activeScanId) return null;
      const response = await client.get(`/garak/results/${activeScanId}`);
      return response.data;
    },
    refetchInterval: scanStatus?.status !== 'COMPLETED' && scanStatus?.status !== 'FAILED' ? 5000 : false,
    enabled: !!activeScanId && scanStatus?.status === 'COMPLETED',
  });

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

    const scanData = {
      name: scanName,
      description: scanDescription,
      model_type: modelType,
      model_name: modelName,
      probes: selectedProbes.length > 0 ? selectedProbes : [],
      max_concurrent: maxConcurrent,
      timeout: timeout,
      llm_config: {
        api_key: apiKey,
      },
    };

    createScanMutation.mutate(scanData);
  };

  const toggleProbe = (probeName) => {
    setSelectedProbes((prev) =>
      prev.includes(probeName)
        ? prev.filter((p) => p !== probeName)
        : [...prev, probeName]
    );
  };

  const toggleAllProbes = () => {
    if (!probes) return;
    const all = Object.values(probes).flat();
    setSelectedProbes((prev) => (prev.length === all.length ? [] : all));
  };

  const getSeverityConfig = (severity) => {
    const configs = {
      critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
      high: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
      medium: { color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' },
      low: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    };
    return configs[severity] || { color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' };
  };

  return (
    <div className="garak-page">
      {/* Hero Section */}
      <div className="garak-hero">
        <div className="hero-content">
          <div className="hero-icon">
            <Zap size={32} />
          </div>
          <div className="hero-text">
            <h1 className="hero-title">Garak LLM Security Scanner</h1>
            <p className="hero-subtitle">
              Advanced vulnerability scanning for Large Language Models using the Garak framework
            </p>
          </div>
        </div>
        <div className="hero-badges">
          <span className="hero-badge">
            <Shield size={14} /> OWASP Top 10
          </span>
          <span className="hero-badge">
            <AlertTriangle size={14} /> Prompt Injection
          </span>
          <span className="hero-badge">
            <Zap size={14} /> Jailbreak Detection
          </span>
        </div>
      </div>

      <div className="garak-grid">
        {/* Scan Configuration Panel */}
        <div className="garak-card config-panel">
          <div className="card-header">
            <Zap size={20} className="card-icon" />
            <h2>Scan Configuration</h2>
          </div>

          <form onSubmit={handleSubmitScan} className="scan-form">
            {/* Scan Name */}
            <div className="form-group">
              <label className="form-label">
                Scan Name <span className="required">*</span>
              </label>
              <input
                type="text"
                value={scanName}
                onChange={(e) => setScanName(e.target.value)}
                placeholder="e.g., GPT-4 Security Assessment"
                className="form-input"
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={scanDescription}
                onChange={(e) => setScanDescription(e.target.value)}
                placeholder="Optional scan description"
                rows={3}
                className="form-textarea"
              />
            </div>

            {/* Model Configuration */}
            <div className="form-section">
              <h3 className="section-title">Model Configuration</h3>

              <div className="form-group">
                <label className="form-label">
                  Model Provider <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    value={modelType}
                    onChange={(e) => {
                      setModelType(e.target.value);
                      setModelName(MODEL_OPTIONS[e.target.value][0]);
                    }}
                    className="form-select"
                  >
                    <option value="openai">OpenAI (GPT)</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="huggingface">Hugging Face</option>
                    <option value="custom">Custom API</option>
                  </select>
                  <ChevronDown size={16} className="select-icon" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Model Name <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="form-select"
                  >
                    {MODEL_OPTIONS[modelType]?.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="select-icon" />
                </div>
              </div>

              {modelType !== 'huggingface' && (
                <div className="form-group">
                  <label className="form-label">
                    API Key <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Enter your ${modelType} API key`}
                    className="form-input"
                  />
                </div>
              )}
            </div>

            {/* Scan Options */}
            <div className="form-section">
              <h3 className="section-title">Scan Options</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Max Concurrent Probes</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxConcurrent}
                    onChange={(e) => setMaxConcurrent(parseInt(e.target.value))}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Timeout (seconds)</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={timeout}
                    onChange={(e) => setTimeout(parseInt(e.target.value))}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Probe Selection */}
            {probes && (
              <div className="form-section">
                <div className="section-header">
                  <h3 className="section-title">Select Probes</h3>
                  <button
                    type="button"
                    onClick={toggleAllProbes}
                    className="toggle-all-btn"
                  >
                    {selectedProbes.length === Object.values(probes).flat().length
                      ? 'Clear all'
                      : 'Select all'}
                  </button>
                </div>
                <p className="section-desc">Leave empty to run all available probes</p>
                <div className="probes-container">
                  {Object.entries(probes).map(([category, categoryProbes]) => (
                    <div key={category} className="probe-category">
                      <span className="category-name">{category}</span>
                      <div className="probe-list">
                        {categoryProbes.map((probe) => (
                          <label key={probe} className="probe-item">
                            <input
                              type="checkbox"
                              checked={selectedProbes.includes(probe)}
                              onChange={() => toggleProbe(probe)}
                              className="probe-checkbox"
                            />
                            <span className="probe-name">{probe}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={createScanMutation.isPending || !scanName.trim()}
              className="submit-btn"
            >
              {createScanMutation.isPending ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Starting Scan...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Start Garak Scan
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="garak-card results-panel">
          <div className="card-header">
            <Shield size={20} className="card-icon success" />
            <h2>Scan Results</h2>
          </div>

          <div className="results-content">
            {!activeScanId ? (
              <div className="empty-results">
                <div className="empty-icon">
                  <BarChart3 size={48} />
                </div>
                <h3>No Active Scan</h3>
                <p>Configure and start a scan to see results here</p>
              </div>
            ) : (
              <div className="results-body">
                {/* Scan Status */}
                <div className="status-section">
                  <h3 className="results-section-title">Scan Status</h3>
                  {statusLoading ? (
                    <div className="status-loading">
                      <Loader2 size={20} className="spin" />
                      <span>Loading status...</span>
                    </div>
                  ) : scanStatus ? (
                    <div className="status-card">
                      <div className="status-row">
                        <span className="status-label">Status</span>
                        <span className={`status-value status-${scanStatus.status?.toLowerCase()}`}>
                          {scanStatus.status}
                        </span>
                      </div>
                      <div className="status-row">
                        <span className="status-label">Progress</span>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${scanStatus.progress || 0}%` }}
                          />
                        </div>
                        <span className="progress-text">{scanStatus.progress || 0}%</span>
                      </div>
                      <div className="status-row">
                        <span className="status-label">Vulnerabilities</span>
                        <span className="status-value vuln-count">
                          {scanStatus.vulnerabilities_found || 0}
                        </span>
                      </div>
                      <div className="status-row">
                        <span className="status-label">Model</span>
                        <span className="status-value model-name">{scanStatus.model}</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Vulnerabilities */}
                {scanStatus?.status === 'COMPLETED' && (
                  <div className="vulns-section">
                    <h3 className="results-section-title">Vulnerabilities Found</h3>
                    {resultsLoading ? (
                      <div className="status-loading">
                        <Loader2 size={20} className="spin" />
                        <span>Loading results...</span>
                      </div>
                    ) : scanResults ? (
                      <div className="vulns-list">
                        {scanResults.vulnerabilities.length === 0 ? (
                          <div className="success-message">
                            <CheckCircle size={24} />
                            <span>No vulnerabilities found! Your model passed all tests.</span>
                          </div>
                        ) : (
                          scanResults.vulnerabilities.map((vuln) => {
                            const severity = getSeverityConfig(vuln.severity);
                            return (
                              <div 
                                key={vuln.id} 
                                className="vuln-item"
                                style={{ 
                                  borderLeftColor: severity.color,
                                  background: severity.bg 
                                }}
                              >
                                <div className="vuln-header">
                                  <div className="vuln-icon" style={{ color: severity.color }}>
                                    {vuln.severity === 'critical' ? (
                                      <XCircle size={18} />
                                    ) : (
                                      <AlertTriangle size={18} />
                                    )}
                                  </div>
                                  <div className="vuln-title">{vuln.type}</div>
                                  <span 
                                    className="vuln-severity"
                                    style={{ 
                                      background: severity.bg,
                                      color: severity.color,
                                      borderColor: severity.color
                                    }}
                                  >
                                    {vuln.severity?.toUpperCase()}
                                  </span>
                                </div>
                                <div className="vuln-details">
                                  <p><strong>Probe:</strong> {vuln.probe}</p>
                                  {vuln.evidence && (
                                    <p><strong>Evidence:</strong> {vuln.evidence}</p>
                                  )}
                                  {vuln.remediation && (
                                    <p><strong>Remediation:</strong> {vuln.remediation}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .garak-page {
          animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        /* Hero */
        .garak-hero {
          padding: 2rem 2.5rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 50%, rgba(34, 197, 94, 0.05) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          margin-bottom: 1.5rem;
        }
        
        .hero-content {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }
        
        .hero-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          border-radius: 16px;
          color: white;
          box-shadow: 0 8px 30px rgba(139, 92, 246, 0.3);
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
          max-width: 500px;
        }
        
        .hero-badges {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.875rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          font-size: 0.8125rem;
          color: #94a3b8;
        }
        
        /* Grid Layout */
        .garak-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        
        @media (max-width: 1200px) {
          .garak-grid {
            grid-template-columns: 1fr;
          }
        }
        
        /* Cards */
        .garak-card {
          background: rgba(17, 24, 39, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
        }
        
        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .card-icon {
          color: #06b6d4;
        }
        
        .card-icon.success {
          color: #22c55e;
        }
        
        .card-header h2 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
          color: #fff;
        }
        
        /* Form Styles */
        .scan-form {
          padding: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 1.25rem;
        }
        
        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #e2e8f0;
          margin-bottom: 0.5rem;
        }
        
        .required {
          color: #ef4444;
        }
        
        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 0.9375rem;
          color: #fff;
          transition: all 0.2s ease;
        }
        
        .form-input::placeholder,
        .form-textarea::placeholder {
          color: #64748b;
        }
        
        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          outline: none;
          border-color: rgba(6, 182, 212, 0.5);
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }
        
        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }
        
        .select-wrapper {
          position: relative;
        }
        
        .select-icon {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }
        
        .form-select {
          appearance: none;
          padding-right: 2.5rem;
          cursor: pointer;
        }
        
        .form-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 1rem 0;
        }
        
        .section-desc {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0 0 1rem 0;
        }
        
        .toggle-all-btn {
          background: transparent;
          border: none;
          color: #06b6d4;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        
        .toggle-all-btn:hover {
          color: #22d3ee;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        
        /* Probes */
        .probes-container {
          max-height: 200px;
          overflow-y: auto;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
        }
        
        .probe-category {
          margin-bottom: 1rem;
        }
        
        .probe-category:last-child {
          margin-bottom: 0;
        }
        
        .category-name {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-bottom: 0.5rem;
        }
        
        .probe-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-left: 0.5rem;
        }
        
        .probe-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.25rem 0;
        }
        
        .probe-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #06b6d4;
        }
        
        .probe-name {
          font-size: 0.875rem;
          color: #94a3b8;
        }
        
        /* Submit Button */
        .submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          color: #030712;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 1.5rem;
        }
        
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(6, 182, 212, 0.4);
        }
        
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Results Panel */
        .results-content {
          padding: 1.5rem;
          min-height: 500px;
        }
        
        .empty-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }
        
        .empty-icon {
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 50%;
          color: #64748b;
          margin-bottom: 1.5rem;
        }
        
        .empty-results h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 0.5rem 0;
        }
        
        .empty-results p {
          font-size: 0.9375rem;
          color: #64748b;
          margin: 0;
        }
        
        .results-body {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .results-section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 1rem 0;
        }
        
        .status-loading {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #64748b;
        }
        
        .status-card {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          padding: 1.25rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
        }
        
        .status-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .status-label {
          flex: 0 0 120px;
          font-size: 0.875rem;
          color: #64748b;
        }
        
        .status-value {
          font-size: 0.875rem;
          font-weight: 500;
          color: #fff;
        }
        
        .status-completed { color: #22c55e; }
        .status-running { color: #06b6d4; }
        .status-failed { color: #ef4444; }
        .status-pending { color: #f59e0b; }
        
        .progress-bar {
          flex: 1;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #06b6d4, #22c55e);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .progress-text {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #06b6d4;
          min-width: 40px;
          text-align: right;
        }
        
        .vuln-count {
          color: #f59e0b;
        }
        
        .model-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8125rem;
        }
        
        /* Vulnerabilities List */
        .vulns-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .success-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 12px;
          color: #22c55e;
          font-weight: 500;
        }
        
        .vuln-item {
          padding: 1rem 1.25rem;
          border-radius: 12px;
          border-left: 4px solid;
        }
        
        .vuln-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        
        .vuln-title {
          flex: 1;
          font-weight: 600;
          color: #fff;
        }
        
        .vuln-severity {
          padding: 0.25rem 0.625rem;
          border: 1px solid;
          border-radius: 6px;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.03em;
        }
        
        .vuln-details {
          font-size: 0.875rem;
          color: #94a3b8;
        }
        
        .vuln-details p {
          margin: 0 0 0.375rem 0;
        }
        
        .vuln-details p:last-child {
          margin-bottom: 0;
        }
        
        .vuln-details strong {
          color: #e2e8f0;
        }
        
        @media (max-width: 768px) {
          .garak-hero {
            padding: 1.5rem;
          }
          
          .hero-content {
            flex-direction: column;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default GarakScan;
