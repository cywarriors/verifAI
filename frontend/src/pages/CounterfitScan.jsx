import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  AlertCircle, 
  Play, 
  Swords, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  Loader2,
  Shield,
  Target,
  Crosshair,
  Maximize2,
  Zap,
  Code,
  FileCode,
  Database,
  Cpu,
  Binary
} from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';

// Counterfit Attack Frameworks
const ATTACK_FRAMEWORKS = [
  { id: 'textattack', name: 'TextAttack', icon: FileCode, description: 'NLP adversarial attacks', color: '#f97316' },
  { id: 'art', name: 'ART', icon: Shield, description: 'Adversarial Robustness Toolbox', color: '#22d3ee' },
  { id: 'augly', name: 'AugLy', icon: Maximize2, description: 'Data augmentation attacks', color: '#8b5cf6' },
  { id: 'custom', name: 'Custom', icon: Code, description: 'Custom attack definitions', color: '#ec4899' },
];

// Attack Types by Framework
const ATTACK_TYPES = {
  textattack: [
    { id: 'textfooler', name: 'TextFooler', description: 'Word-level perturbations' },
    { id: 'bert_attack', name: 'BERT-Attack', description: 'BERT-based adversarial examples' },
    { id: 'deepwordbug', name: 'DeepWordBug', description: 'Character-level perturbations' },
    { id: 'bae', name: 'BAE', description: 'BERT-based Adversarial Examples' },
    { id: 'pruthi', name: 'Pruthi Attack', description: 'Typo-based attacks' },
    { id: 'checklist', name: 'CheckList', description: 'Behavioral testing' },
  ],
  art: [
    { id: 'fgsm', name: 'FGSM', description: 'Fast Gradient Sign Method' },
    { id: 'pgd', name: 'PGD', description: 'Projected Gradient Descent' },
    { id: 'carlini', name: 'C&W Attack', description: 'Carlini & Wagner L2' },
    { id: 'boundary', name: 'Boundary Attack', description: 'Decision-based attack' },
    { id: 'zoo', name: 'ZOO Attack', description: 'Zeroth-order optimization' },
  ],
  augly: [
    { id: 'text_augment', name: 'Text Augmentation', description: 'Simulated typos, insertions' },
    { id: 'image_augment', name: 'Image Augmentation', description: 'Blur, noise, transforms' },
    { id: 'audio_augment', name: 'Audio Augmentation', description: 'Pitch, speed, noise' },
    { id: 'video_augment', name: 'Video Augmentation', description: 'Frame manipulation' },
  ],
  custom: [
    { id: 'manual', name: 'Manual Inputs', description: 'Upload custom adversarial examples' },
    { id: 'script', name: 'Custom Script', description: 'Python attack script' },
  ],
};

// Target Types
const TARGET_TYPES = [
  { id: 'mlflow', name: 'MLflow Model', icon: Database, description: 'MLflow model registry' },
  { id: 'azureml', name: 'Azure ML', icon: Cpu, description: 'Azure ML endpoint' },
  { id: 'local', name: 'Local Model', icon: FileCode, description: 'Local model file' },
  { id: 'api', name: 'REST API', icon: Binary, description: 'Model API endpoint' },
];

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: XCircle },
  high: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', icon: AlertTriangle },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: AlertCircle },
  low: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', icon: CheckCircle },
};

export default function CounterfitScan() {
  const [scanName, setScanName] = useState('');
  const [scanDescription, setScanDescription] = useState('');
  const [targetType, setTargetType] = useState('api');
  const [targetEndpoint, setTargetEndpoint] = useState('');
  const [targetCredentials, setTargetCredentials] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('textattack');
  const [selectedAttacks, setSelectedAttacks] = useState([]);
  const [maxQueries, setMaxQueries] = useState(1000);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [activeScanId, setActiveScanId] = useState(null);

  // Create scan mutation
  const createScanMutation = useMutation({
    mutationFn: async (scanData) => {
      const response = await client.post('/counterfit/scan', scanData);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Counterfit scan "${data.name}" started!`);
      setActiveScanId(data.id);
      setScanName('');
      setScanDescription('');
      setSelectedAttacks([]);
    },
    onError: (error) => {
      const message = error.response?.data?.detail || error.message;
      toast.error(`Failed to start scan: ${message}`);
    },
  });

  // Poll scan status
  const { data: scanStatus } = useQuery({
    queryKey: ['counterfitStatus', activeScanId],
    queryFn: async () => {
      if (!activeScanId) return null;
      const response = await client.get(`/counterfit/status/${activeScanId}`);
      return response.data;
    },
    refetchInterval: activeScanId ? 3000 : false,
    enabled: !!activeScanId,
  });

  // Get scan results
  const { data: scanResults } = useQuery({
    queryKey: ['counterfitResults', activeScanId],
    queryFn: async () => {
      if (!activeScanId) return null;
      const response = await client.get(`/counterfit/results/${activeScanId}`);
      return response.data;
    },
    refetchInterval: scanStatus?.status !== 'COMPLETED' && scanStatus?.status !== 'FAILED' ? 5000 : false,
    enabled: !!activeScanId && scanStatus?.status === 'COMPLETED',
  });

  const toggleAttack = (attackId) => {
    setSelectedAttacks(prev => 
      prev.includes(attackId) 
        ? prev.filter(id => id !== attackId)
        : [...prev, attackId]
    );
  };

  const selectAllAttacks = () => {
    const frameworkAttacks = ATTACK_TYPES[selectedFramework].map(a => a.id);
    if (frameworkAttacks.every(id => selectedAttacks.includes(id))) {
      setSelectedAttacks(prev => prev.filter(id => !frameworkAttacks.includes(id)));
    } else {
      setSelectedAttacks(prev => [...new Set([...prev, ...frameworkAttacks])]);
    }
  };

  const handleSubmitScan = async (e) => {
    e.preventDefault();

    if (!scanName.trim()) {
      toast.error('Scan name is required');
      return;
    }

    if (!targetEndpoint.trim()) {
      toast.error('Target endpoint/path is required');
      return;
    }

    if (selectedAttacks.length === 0) {
      toast.error('Select at least one attack to test');
      return;
    }

    const scanData = {
      name: scanName,
      description: scanDescription,
      target_type: targetType,
      target_endpoint: targetEndpoint,
      target_credentials: targetCredentials,
      attack_framework: selectedFramework,
      attacks: selectedAttacks,
      config: {
        max_queries: maxQueries,
        confidence_threshold: confidenceThreshold,
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
    <div className="counterfit-page">
      {/* Hero */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-icon">
            <Swords size={32} />
          </div>
          <div>
            <h1 className="hero-title">Microsoft Counterfit</h1>
            <p className="hero-subtitle">AI security assessment automation tool by Microsoft</p>
          </div>
        </div>
        <div className="hero-badges">
          <span className="badge badge-primary">Microsoft</span>
          <span className="badge badge-secondary">Multi-Framework</span>
          <span className="badge badge-accent">Automation</span>
        </div>
      </div>

      <div className="scan-grid">
        {/* Configuration Panel */}
        <div className="config-panel">
          <div className="panel-header">
            <h2>Attack Configuration</h2>
            <p>Configure Counterfit security assessment</p>
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
                  placeholder="My Counterfit Assessment"
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

            {/* Target Config */}
            <div className="form-section">
              <h3>Target Configuration</h3>
              <div className="target-grid">
                {TARGET_TYPES.map((target) => {
                  const Icon = target.icon;
                  const isSelected = targetType === target.id;
                  return (
                    <div
                      key={target.id}
                      className={`target-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setTargetType(target.id)}
                    >
                      <Icon size={20} />
                      <span className="target-name">{target.name}</span>
                    </div>
                  );
                })}
              </div>
              <div className="form-group">
                <label>Target Endpoint/Path *</label>
                <input
                  type="text"
                  value={targetEndpoint}
                  onChange={(e) => setTargetEndpoint(e.target.value)}
                  placeholder={targetType === 'api' ? 'https://api.example.com/predict' : '/path/to/model'}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Credentials/API Key (Optional)</label>
                <input
                  type="password"
                  value={targetCredentials}
                  onChange={(e) => setTargetCredentials(e.target.value)}
                  placeholder="Bearer token or API key..."
                  className="form-input"
                />
              </div>
            </div>

            {/* Attack Framework */}
            <div className="form-section">
              <h3>Attack Framework</h3>
              <div className="framework-tabs">
                {ATTACK_FRAMEWORKS.map((framework) => {
                  const Icon = framework.icon;
                  const isSelected = selectedFramework === framework.id;
                  return (
                    <button
                      key={framework.id}
                      type="button"
                      className={`framework-tab ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedFramework(framework.id);
                        setSelectedAttacks([]);
                      }}
                      style={{ '--fw-color': framework.color }}
                    >
                      <Icon size={18} />
                      <span>{framework.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Attack Types */}
            <div className="form-section">
              <div className="section-header">
                <h3>Attack Types</h3>
                <button type="button" className="select-all-btn" onClick={selectAllAttacks}>
                  {ATTACK_TYPES[selectedFramework].every(a => selectedAttacks.includes(a.id)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="attacks-grid">
                {ATTACK_TYPES[selectedFramework].map((attack) => {
                  const isSelected = selectedAttacks.includes(attack.id);
                  return (
                    <div
                      key={attack.id}
                      className={`attack-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleAttack(attack.id)}
                    >
                      <div className="attack-info">
                        <span className="attack-name">{attack.name}</span>
                        <span className="attack-desc">{attack.description}</span>
                      </div>
                      <div className="attack-check">
                        {isSelected && <CheckCircle size={16} />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="selection-count">{selectedAttacks.length} attacks selected</p>
            </div>

            {/* Attack Parameters */}
            <div className="form-section">
              <h3>Attack Parameters</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Max Queries</label>
                  <input
                    type="number"
                    value={maxQueries}
                    onChange={(e) => setMaxQueries(parseInt(e.target.value))}
                    min="10"
                    max="100000"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Confidence Threshold: {confidenceThreshold}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="form-range"
                  />
                </div>
              </div>
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
                  Start Counterfit Scan
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
              <Swords size={48} />
              <h3>No Active Scan</h3>
              <p>Configure and start a scan to see results here</p>
            </div>
          ) : (
            <div className="results-content">
              {/* Progress */}
              {scanStatus && scanStatus.status !== 'COMPLETED' && scanStatus.status !== 'FAILED' && (
                <div className="progress-section">
                  <div className="progress-header">
                    <span>Running Attacks...</span>
                    <span>{getProgress()}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${getProgress()}%` }} />
                  </div>
                  <p className="progress-detail">{scanStatus.current_attack || 'Initializing...'}</p>
                </div>
              )}

              {/* Results Summary */}
              {scanResults && (
                <>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <span className="metric-value">{scanResults.total_attacks || 0}</span>
                      <span className="metric-label">Attacks Run</span>
                    </div>
                    <div className="metric-card success">
                      <span className="metric-value">{scanResults.successful_attacks || 0}</span>
                      <span className="metric-label">Successful</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-value">{scanResults.queries_used || 0}</span>
                      <span className="metric-label">Queries Used</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-value">{((scanResults.success_rate || 0) * 100).toFixed(1)}%</span>
                      <span className="metric-label">Success Rate</span>
                    </div>
                  </div>

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
                            <span className="vuln-category">{finding.attack_type}</span>
                          </div>
                          <h4 className="vuln-title">{finding.title}</h4>
                          <p className="vuln-description">{finding.description}</p>
                          {finding.example && (
                            <div className="vuln-example">
                              <strong>Example:</strong>
                              <code>{finding.example}</code>
                            </div>
                          )}
                          {finding.confidence_drop && (
                            <div className="vuln-metrics">
                              <span>Confidence Drop: {(finding.confidence_drop * 100).toFixed(1)}%</span>
                              <span>Queries: {finding.queries_used}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {scanResults.findings?.length === 0 && (
                      <div className="no-vulnerabilities">
                        <CheckCircle size={48} />
                        <h3>Model is Robust</h3>
                        <p>Your model resisted all selected attacks</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .counterfit-page {
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
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%);
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
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          border-radius: 16px;
          color: white;
          box-shadow: 0 8px 30px rgba(249, 115, 22, 0.3);
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
          background: rgba(249, 115, 22, 0.15);
          color: #fb923c;
          border: 1px solid rgba(249, 115, 22, 0.3);
        }

        .badge-secondary {
          background: rgba(139, 92, 246, 0.15);
          color: #a78bfa;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .badge-accent {
          background: rgba(236, 72, 153, 0.15);
          color: #f472b6;
          border: 1px solid rgba(236, 72, 153, 0.3);
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
          border-color: rgba(249, 115, 22, 0.5);
          background: rgba(255, 255, 255, 0.05);
        }

        .form-input::placeholder, .form-textarea::placeholder {
          color: #475569;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-range {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          appearance: none;
          cursor: pointer;
        }

        .form-range::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          background: #f97316;
          border-radius: 50%;
          cursor: pointer;
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

        /* Target Grid */
        .target-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .target-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .target-card:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .target-card.selected {
          background: rgba(249, 115, 22, 0.1);
          border-color: rgba(249, 115, 22, 0.3);
          color: #f97316;
        }

        .target-name {
          font-size: 0.75rem;
          font-weight: 500;
        }

        /* Framework Tabs */
        .framework-tabs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }

        .framework-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .framework-tab:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .framework-tab.selected {
          background: rgba(249, 115, 22, 0.1);
          border-color: var(--fw-color);
          color: var(--fw-color);
        }

        .framework-tab span {
          font-size: 0.75rem;
          font-weight: 500;
        }

        /* Attacks Grid */
        .attacks-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .attack-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .attack-card:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .attack-card.selected {
          background: rgba(249, 115, 22, 0.05);
          border-color: rgba(249, 115, 22, 0.3);
        }

        .attack-info {
          display: flex;
          flex-direction: column;
        }

        .attack-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #e2e8f0;
        }

        .attack-desc {
          font-size: 0.75rem;
          color: #64748b;
        }

        .attack-check {
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
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
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
          box-shadow: 0 8px 30px rgba(249, 115, 22, 0.3);
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
          background: linear-gradient(90deg, #f97316 0%, #fb923c 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-detail {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0.5rem 0 0 0;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .metric-card {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .metric-card.success {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
        }

        .metric-label {
          font-size: 0.75rem;
          color: #94a3b8;
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

        .vuln-example {
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          font-size: 0.8125rem;
        }

        .vuln-example strong {
          color: #f97316;
        }

        .vuln-example code {
          display: block;
          margin-top: 0.5rem;
          color: #e2e8f0;
          font-family: 'Fira Code', monospace;
          font-size: 0.75rem;
          word-break: break-all;
        }

        .vuln-metrics {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 1.5rem;
          font-size: 0.75rem;
          color: #94a3b8;
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

          .form-row {
            grid-template-columns: 1fr;
          }

          .target-grid, .framework-tabs {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
