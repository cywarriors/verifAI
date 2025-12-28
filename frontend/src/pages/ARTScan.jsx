import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  AlertCircle, 
  Play, 
  Crosshair, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  Loader2,
  Eye,
  EyeOff,
  Shuffle,
  Maximize2,
  Minimize2,
  RotateCcw,
  Target,
  Layers,
  Palette,
  Move
} from 'lucide-react';
import toast from 'react-hot-toast';
import client, { scansAPI } from '../api/client';

// ART Attack Categories
const ART_ATTACK_CATEGORIES = [
  { id: 'evasion', name: 'Evasion Attacks', icon: Eye, description: 'Modify inputs to evade detection', color: '#22d3ee' },
  { id: 'poisoning', name: 'Poisoning Attacks', icon: Shuffle, description: 'Corrupt training data to degrade model', color: '#ef4444' },
  { id: 'extraction', name: 'Model Extraction', icon: Target, description: 'Steal model parameters or structure', color: '#f59e0b' },
  { id: 'inference', name: 'Inference Attacks', icon: EyeOff, description: 'Infer sensitive training information', color: '#8b5cf6' },
];

// Specific Attack Types
const ATTACK_TYPES = {
  evasion: [
    { id: 'fgsm', name: 'FGSM', description: 'Fast Gradient Sign Method' },
    { id: 'pgd', name: 'PGD', description: 'Projected Gradient Descent' },
    { id: 'carlini_wagner', name: 'C&W', description: 'Carlini & Wagner Attack' },
    { id: 'deepfool', name: 'DeepFool', description: 'Minimal perturbation attack' },
    { id: 'square', name: 'Square Attack', description: 'Black-box query attack' },
    { id: 'hopskipjump', name: 'HopSkipJump', description: 'Decision-based attack' },
  ],
  poisoning: [
    { id: 'backdoor', name: 'Backdoor Attack', description: 'Inject hidden triggers' },
    { id: 'clean_label', name: 'Clean-Label', description: 'Poison without label changes' },
    { id: 'bullseye', name: 'Bullseye', description: 'Targeted data poisoning' },
  ],
  extraction: [
    { id: 'copycat', name: 'CopyCat CNN', description: 'Model stealing via queries' },
    { id: 'knockoff', name: 'KnockoffNets', description: 'Functionality stealing' },
    { id: 'functionally_equivalent', name: 'Func. Equivalent', description: 'Extract exact model' },
  ],
  inference: [
    { id: 'membership', name: 'Membership Inference', description: 'Detect training data' },
    { id: 'attribute', name: 'Attribute Inference', description: 'Infer sensitive attributes' },
    { id: 'model_inversion', name: 'Model Inversion', description: 'Reconstruct training data' },
  ],
};

const DEFENSE_OPTIONS = [
  { id: 'none', name: 'No Defense', description: 'Test without any defenses' },
  { id: 'adversarial_training', name: 'Adversarial Training', description: 'Train on adversarial examples' },
  { id: 'input_preprocessing', name: 'Input Preprocessing', description: 'Feature squeezing, JPEG compression' },
  { id: 'certified_defense', name: 'Certified Defense', description: 'Randomized smoothing' },
  { id: 'detector', name: 'Adversarial Detector', description: 'Detect adversarial inputs' },
];

const MODEL_TYPES = [
  { id: 'pytorch', name: 'PyTorch', formats: ['.pt', '.pth'] },
  { id: 'tensorflow', name: 'TensorFlow/Keras', formats: ['.h5', '.pb', '.savedmodel'] },
  { id: 'onnx', name: 'ONNX', formats: ['.onnx'] },
  { id: 'sklearn', name: 'Scikit-Learn', formats: ['.pkl', '.joblib'] },
];

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: XCircle },
  high: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', icon: AlertTriangle },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: AlertCircle },
  low: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', icon: CheckCircle },
};

export default function ARTScan() {
  const [scanName, setScanName] = useState('');
  const [scanDescription, setScanDescription] = useState('');
  const [modelType, setModelType] = useState('pytorch');
  const [modelPath, setModelPath] = useState('');
  const [datasetPath, setDatasetPath] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('evasion');
  const [selectedAttacks, setSelectedAttacks] = useState([]);
  const [selectedDefense, setSelectedDefense] = useState('none');
  const [epsilon, setEpsilon] = useState(0.3);
  const [maxIterations, setMaxIterations] = useState(100);
  const [activeScanId, setActiveScanId] = useState(null);

  // Create scan mutation
  const createScanMutation = useMutation({
    mutationFn: async (scanData) => {
      const data = await scansAPI.create(scanData);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`ART scan "${data.name}" started!`);
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
    queryKey: ['artStatus', activeScanId],
    queryFn: async () => {
      if (!activeScanId) return null;
      const data = await scansAPI.get(activeScanId);
      return data;
    },
    refetchInterval: activeScanId ? 3000 : false,
    enabled: !!activeScanId,
  });

  // Get scan results
  const { data: scanResults } = useQuery({
    queryKey: ['artResults', activeScanId],
    queryFn: async () => {
      if (!activeScanId) return null;
      const response = await client.get(`/scans/${activeScanId}/vulnerabilities`);
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
    const categoryAttacks = ATTACK_TYPES[selectedCategory].map(a => a.id);
    if (categoryAttacks.every(id => selectedAttacks.includes(id))) {
      setSelectedAttacks(prev => prev.filter(id => !categoryAttacks.includes(id)));
    } else {
      setSelectedAttacks(prev => [...new Set([...prev, ...categoryAttacks])]);
    }
  };

  const handleSubmitScan = async (e) => {
    e.preventDefault();

    if (!scanName.trim()) {
      toast.error('Scan name is required');
      return;
    }

    if (!modelPath.trim()) {
      toast.error('Model path is required');
      return;
    }

    if (selectedAttacks.length === 0) {
      toast.error('Select at least one attack to test');
      return;
    }

    const scanData = {
      name: scanName,
      description: scanDescription,
      model_type: modelType,
      model_name: modelPath,
      scanner_type: 'art',
      llm_config: {
        dataset_path: datasetPath,
        attack_category: selectedCategory,
        attacks: selectedAttacks,
        defense: selectedDefense,
        epsilon: epsilon,
        max_iterations: maxIterations,
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

  const getCategoryIcon = () => {
    const category = ART_ATTACK_CATEGORIES.find(c => c.id === selectedCategory);
    return category?.icon || Target;
  };

  return (
    <div className="art-page">
      {/* Hero */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-icon">
            <Crosshair size={32} />
          </div>
          <div>
            <h1 className="hero-title">Adversarial Robustness Toolbox</h1>
            <p className="hero-subtitle">Test ML model robustness against adversarial attacks</p>
          </div>
        </div>
        <div className="hero-badges">
          <span className="badge badge-primary">IBM ART</span>
          <span className="badge badge-secondary">ML Security</span>
          <span className="badge badge-accent">Adversarial</span>
        </div>
      </div>

      <div className="scan-grid">
        {/* Configuration Panel */}
        <div className="config-panel">
          <div className="panel-header">
            <h2>Attack Configuration</h2>
            <p>Configure adversarial robustness testing</p>
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
                  placeholder="My ART Security Test"
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
              <div className="form-group">
                <label>Model Framework</label>
                <div className="select-wrapper">
                  <select
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    className="form-select"
                  >
                    {MODEL_TYPES.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.formats.join(', ')})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="select-icon" />
                </div>
              </div>
              <div className="form-group">
                <label>Model Path *</label>
                <input
                  type="text"
                  value={modelPath}
                  onChange={(e) => setModelPath(e.target.value)}
                  placeholder="/path/to/model.pt or https://..."
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Dataset Path (Optional)</label>
                <input
                  type="text"
                  value={datasetPath}
                  onChange={(e) => setDatasetPath(e.target.value)}
                  placeholder="/path/to/test_data or MNIST, CIFAR10..."
                  className="form-input"
                />
              </div>
            </div>

            {/* Attack Category */}
            <div className="form-section">
              <h3>Attack Category</h3>
              <div className="category-tabs">
                {ART_ATTACK_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      className={`category-tab ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setSelectedAttacks([]);
                      }}
                      style={{ '--cat-color': category.color }}
                    >
                      <Icon size={18} />
                      <span>{category.name}</span>
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
                  {ATTACK_TYPES[selectedCategory].every(a => selectedAttacks.includes(a.id)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="attacks-grid">
                {ATTACK_TYPES[selectedCategory].map((attack) => {
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
                  <label>Epsilon (ε): {epsilon}</label>
                  <input
                    type="range"
                    min="0.01"
                    max="1"
                    step="0.01"
                    value={epsilon}
                    onChange={(e) => setEpsilon(parseFloat(e.target.value))}
                    className="form-range"
                  />
                </div>
                <div className="form-group">
                  <label>Max Iterations</label>
                  <input
                    type="number"
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                    min="1"
                    max="1000"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Defense Selection */}
            <div className="form-section">
              <h3>Defense (Optional)</h3>
              <div className="defense-grid">
                {DEFENSE_OPTIONS.map((defense) => (
                  <div
                    key={defense.id}
                    className={`defense-card ${selectedDefense === defense.id ? 'selected' : ''}`}
                    onClick={() => setSelectedDefense(defense.id)}
                  >
                    <span className="defense-name">{defense.name}</span>
                    <span className="defense-desc">{defense.description}</span>
                  </div>
                ))}
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
                  Start ART Scan
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
              <Crosshair size={48} />
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
              {Array.isArray(scanResults) && (
                <>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <span className="metric-value">{scanResults.length || 0}</span>
                      <span className="metric-label">Vulnerabilities</span>
                    </div>
                    <div className="metric-card adversarial">
                      <span className="metric-value">{scanResults.filter(v => v.severity === 'critical' || v.severity === 'high').length || 0}</span>
                      <span className="metric-label">High Risk</span>
                    </div>
                  </div>

                  <div className="vulnerabilities-list">
                    {scanResults.map((finding, idx) => {
                      const severity = SEVERITY_CONFIG[(finding.severity || 'medium').toLowerCase()] || SEVERITY_CONFIG.medium;
                      const SeverityIcon = severity.icon;
                      return (
                        <div key={idx} className="vulnerability-card" style={{ '--severity-color': severity.color, '--severity-bg': severity.bg }}>
                          <div className="vuln-header">
                            <div className="vuln-severity">
                              <SeverityIcon size={18} />
                              <span>{finding.severity}</span>
                            </div>
                            <span className="vuln-category">{finding.probe_category}</span>
                          </div>
                          <h4 className="vuln-title">{finding.title}</h4>
                          <p className="vuln-description">{finding.description}</p>
                          {finding.evidence && (
                            <div className="vuln-metrics">
                              <strong>Evidence:</strong> {finding.evidence}
                            </div>
                          )}
                          {finding.remediation && (
                            <div className="vuln-metrics">
                              <strong>Remediation:</strong> {finding.remediation}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {scanResults.length === 0 && (
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
        .art-page {
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
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%);
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
          background: rgba(6, 182, 212, 0.15);
          color: #22d3ee;
          border: 1px solid rgba(6, 182, 212, 0.3);
        }

        .badge-secondary {
          background: rgba(139, 92, 246, 0.15);
          color: #a78bfa;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .badge-accent {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
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
          border-color: rgba(6, 182, 212, 0.5);
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
          background: #22d3ee;
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

        /* Category Tabs */
        .category-tabs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }

        .category-tab {
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

        .category-tab:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .category-tab.selected {
          background: rgba(6, 182, 212, 0.1);
          border-color: var(--cat-color);
          color: var(--cat-color);
        }

        .category-tab span {
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
          background: rgba(6, 182, 212, 0.05);
          border-color: rgba(6, 182, 212, 0.3);
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

        /* Defense Grid */
        .defense-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        .defense-card {
          display: flex;
          flex-direction: column;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .defense-card:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .defense-card.selected {
          background: rgba(34, 197, 94, 0.05);
          border-color: rgba(34, 197, 94, 0.3);
        }

        .defense-name {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #e2e8f0;
        }

        .defense-desc {
          font-size: 0.6875rem;
          color: #64748b;
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
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(6, 182, 212, 0.3);
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
          background: rgba(6, 182, 212, 0.15);
          color: #22d3ee;
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
          background: linear-gradient(90deg, #06b6d4 0%, #22d3ee 100%);
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
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .metric-card.adversarial {
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

          .category-tabs {
            grid-template-columns: repeat(2, 1fr);
          }

          .defense-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
