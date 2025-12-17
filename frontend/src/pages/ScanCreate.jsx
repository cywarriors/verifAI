import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Play, AlertCircle, Info } from 'lucide-react';
import Header from '../components/Layout/Header';
import { scansAPI } from '../api/client';
import toast from 'react-hot-toast';

const MODEL_TYPES = [
  { value: 'openai', label: 'OpenAI (GPT-3.5, GPT-4)', description: 'ChatGPT and GPT models' },
  { value: 'anthropic', label: 'Anthropic (Claude)', description: 'Claude models' },
  { value: 'huggingface', label: 'Hugging Face', description: 'Open source models' },
  { value: 'custom', label: 'Custom API', description: 'Your own model endpoint' },
];

const SCANNER_TYPES = [
  { value: 'builtin', label: 'Built-in Probes', description: 'SecureAI first-party probes only' },
  { value: 'garak', label: 'Garak', description: 'Garak LLM security framework' },
  { value: 'counterfit', label: 'Counterfit', description: 'Azure Counterfit (advanced ML attacks)' },
  { value: 'art', label: 'ART', description: 'Adversarial Robustness Toolbox' },
  { value: 'all', label: 'All Compatible', description: 'Combine built-in and Garak where available' },
];

const PROBE_CATEGORIES = [
  { 
    id: 'injection', 
    label: 'Prompt Injection', 
    description: 'Tests for prompt injection vulnerabilities',
    probes: ['direct_injection', 'indirect_injection', 'jailbreak']
  },
  { 
    id: 'leakage', 
    label: 'Data Leakage', 
    description: 'Tests for PII and sensitive data exposure',
    probes: ['pii_leakage', 'training_data_extraction', 'system_prompt_leak']
  },
  { 
    id: 'hallucination', 
    label: 'Hallucination', 
    description: 'Tests for factual accuracy and fabrication',
    probes: ['factual_accuracy', 'citation_verification']
  },
  { 
    id: 'telecom', 
    label: 'Telecom/IoT', 
    description: 'Industry-specific security tests',
    probes: ['dhcp_injection', 'tr069_prompt', 'mqtt_abuse']
  },
];

export default function ScanCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scanner_type: 'builtin',
    model_type: '',
    model_name: '',
    model_config: {
      api_key: '',
      endpoint: '',
      temperature: 0.7,
    },
    selected_probes: [],
  });
  const [errors, setErrors] = useState({});

  const createMutation = useMutation({
    mutationFn: (data) => scansAPI.create(data),
    onSuccess: (scan) => {
      toast.success('Scan started successfully!');
      navigate(`/scans/${scan.id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create scan');
    },
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleConfigChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      model_config: { ...prev.model_config, [field]: value }
    }));
  };

  const toggleProbeCategory = (categoryId) => {
    const category = PROBE_CATEGORIES.find(c => c.id === categoryId);
    const isSelected = formData.selected_probes.some(p => category.probes.includes(p));
    
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        selected_probes: prev.selected_probes.filter(p => !category.probes.includes(p))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selected_probes: [...new Set([...prev.selected_probes, ...category.probes])]
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Scan name is required';
    if (!formData.model_type) newErrors.model_type = 'Please select a model type';
    if (!formData.model_name.trim()) newErrors.model_name = 'Model name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.selected_probes.length === 0) {
      toast.error('Please select at least one probe category');
      return;
    }
    
    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      scanner_type: formData.scanner_type,
      model_type: formData.model_type,
      model_name: formData.model_name,
      model_config: formData.model_config,
    });
  };

  return (
    <>
      <Header 
        title="Create New Scan" 
        subtitle="Configure and run a security scan on your LLM"
        actions={
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
        }
      />
      
      <div className="scan-create-page">
        <div className="scan-create-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Model Configuration</span>
          </div>
          <div className="step-connector" />
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Select Probes</span>
          </div>
        </div>
        
        <form className="scan-create-form" onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="form-step animate-fade-in">
              <div className="card">
                <div className="card-header">
                  <h3>Scan Details</h3>
                </div>
                <div className="card-body">
                  <div className="input-group">
                    <label className="input-label required">Scan Name</label>
                    <input
                      type="text"
                      className={`input ${errors.name ? 'input-error' : ''}`}
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g., Production GPT-4 Security Audit"
                    />
                    {errors.name && <span className="input-error-message">{errors.name}</span>}
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Description</label>
                    <textarea
                      className="input"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Optional description of what you're testing..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <h3>Model & Scanner Configuration</h3>
                </div>
                <div className="card-body">
                  <div className="input-group">
                    <label className="input-label required">Security Scanner</label>
                    <div className="model-type-grid">
                      {SCANNER_TYPES.map(type => (
                        <div
                          key={type.value}
                          className={`model-type-option ${formData.scanner_type === type.value ? 'selected' : ''}`}
                          onClick={() => handleChange('scanner_type', type.value)}
                        >
                          <span className="model-type-label">{type.label}</span>
                          <span className="model-type-desc">{type.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label required">Model Type</label>
                    <div className="model-type-grid">
                      {MODEL_TYPES.map(type => (
                        <div
                          key={type.value}
                          className={`model-type-option ${formData.model_type === type.value ? 'selected' : ''}`}
                          onClick={() => handleChange('model_type', type.value)}
                        >
                          <span className="model-type-label">{type.label}</span>
                          <span className="model-type-desc">{type.description}</span>
                        </div>
                      ))}
                    </div>
                    {errors.model_type && <span className="input-error-message">{errors.model_type}</span>}
                  </div>
                  
                  <div className="form-row">
                    <div className="input-group">
                      <label className="input-label required">Model Name</label>
                      <input
                        type="text"
                        className={`input ${errors.model_name ? 'input-error' : ''}`}
                        value={formData.model_name}
                        onChange={(e) => handleChange('model_name', e.target.value)}
                        placeholder="e.g., gpt-4, claude-2, llama-2-70b"
                      />
                      {errors.model_name && <span className="input-error-message">{errors.model_name}</span>}
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">API Key</label>
                      <input
                        type="password"
                        className="input"
                        value={formData.model_config.api_key}
                        onChange={(e) => handleConfigChange('api_key', e.target.value)}
                        placeholder="sk-..."
                      />
                      <span className="input-hint">Stored securely and never logged</span>
                    </div>
                  </div>
                  
                  {formData.model_type === 'custom' && (
                    <div className="input-group">
                      <label className="input-label">Custom Endpoint</label>
                      <input
                        type="url"
                        className="input"
                        value={formData.model_config.endpoint}
                        onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                        placeholder="https://your-api.com/v1/chat"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-primary btn-lg" onClick={handleNext}>
                  Continue to Probe Selection
                </button>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="form-step animate-fade-in">
              <div className="card">
                <div className="card-header">
                  <h3>Select Security Probes</h3>
                  <span className="text-muted">
                    {formData.selected_probes.length} probes selected
                  </span>
                </div>
                <div className="card-body">
                  <div className="alert alert-info" style={{ marginBottom: 'var(--space-lg)' }}>
                    <Info size={20} />
                    <div className="alert-content">
                      Select the categories of security tests to run against your model.
                      Each category contains multiple specialized probes.
                    </div>
                  </div>
                  
                  <div className="probe-categories">
                    {PROBE_CATEGORIES.map(category => {
                      const isSelected = category.probes.some(p => formData.selected_probes.includes(p));
                      return (
                        <div
                          key={category.id}
                          className={`probe-category ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleProbeCategory(category.id)}
                        >
                          <div className="probe-checkbox">
                            {isSelected && <span className="probe-check">✓</span>}
                          </div>
                          <div className="probe-content">
                            <span className="probe-label">{category.label}</span>
                            <span className="probe-description">{category.description}</span>
                            <span className="probe-count">{category.probes.length} probes</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary btn-lg" onClick={() => setStep(1)}>
                  Back
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <span className="spinner" />
                      Starting Scan...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Start Scan
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
      
      <style>{`
        .scan-create-page {
          padding: var(--space-xl);
          max-width: 800px;
          margin: 0 auto;
          animation: fadeIn var(--transition-base);
        }
        
        .scan-create-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }
        
        .step {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--color-text-muted);
        }
        
        .step.active {
          color: var(--color-accent);
        }
        
        .step.completed {
          color: var(--color-success);
        }
        
        .step-number {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid currentColor;
          border-radius: 50%;
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .step.active .step-number,
        .step.completed .step-number {
          background: currentColor;
          color: var(--color-bg-primary);
        }
        
        .step-label {
          font-weight: 500;
        }
        
        .step-connector {
          width: 60px;
          height: 2px;
          background: var(--color-border);
        }
        
        .scan-create-form .card {
          margin-bottom: var(--space-lg);
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
        }
        
        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
        
        .model-type-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-sm);
        }
        
        .model-type-option {
          padding: var(--space-md);
          background: var(--color-bg-tertiary);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .model-type-option:hover {
          border-color: var(--color-border-light);
        }
        
        .model-type-option.selected {
          border-color: var(--color-accent);
          background: var(--color-accent-glow);
        }
        
        .model-type-label {
          display: block;
          font-weight: 500;
          margin-bottom: 2px;
        }
        
        .model-type-desc {
          display: block;
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }
        
        .probe-categories {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }
        
        .probe-category {
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
          padding: var(--space-md);
          background: var(--color-bg-tertiary);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .probe-category:hover {
          border-color: var(--color-border-light);
        }
        
        .probe-category.selected {
          border-color: var(--color-accent);
          background: var(--color-accent-glow);
        }
        
        .probe-checkbox {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-sm);
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .probe-category.selected .probe-checkbox {
          background: var(--color-accent);
          border-color: var(--color-accent);
        }
        
        .probe-check {
          color: var(--color-text-inverse);
          font-weight: 700;
          font-size: 14px;
        }
        
        .probe-content {
          flex: 1;
        }
        
        .probe-label {
          display: block;
          font-weight: 500;
          margin-bottom: 2px;
        }
        
        .probe-description {
          display: block;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: 4px;
        }
        
        .probe-count {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-md);
          padding-top: var(--space-md);
        }
      `}</style>
    </>
  );
}
