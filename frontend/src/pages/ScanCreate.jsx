import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Play, AlertCircle, Info, CheckSquare, Square } from 'lucide-react';
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
  { value: 'llmtopten', label: 'LLMTopTen', description: 'OWASP LLM Top 10 Scanner (Recommended for LLM testing)' },
  { value: 'agenttopten', label: 'AgentTopTen', description: 'OWASP Agentic AI Top 10 Scanner (Recommended for Agent testing)' },
  { value: 'garak', label: 'Garak', description: 'Garak LLM security framework' },
  { value: 'counterfit', label: 'Counterfit', description: 'Azure Counterfit (advanced ML attacks)' },
  { value: 'art', label: 'ART', description: 'Adversarial Robustness Toolbox' },
  { value: 'all', label: 'All Compatible', description: 'Combine all available scanners' },
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
  }
];

// OWASP Top 10 probe categories for SecureTopTen
const OWASP_LLM_CATEGORIES = [
  {
    id: 'llm_top10',
    label: 'OWASP LLM Top 10',
    description: 'Comprehensive tests for all 10 OWASP LLM vulnerabilities',
    probes: [
      'llm01_prompt_injection',
      'llm02_insecure_output_handling',
      'llm03_training_data_poisoning',
      'llm04_model_denial_of_service',
      'llm05_supply_chain_vulnerabilities',
      'llm06_sensitive_information_disclosure',
      'llm07_insecure_plugin_design',
      'llm08_excessive_agency',
      'llm09_overreliance',
      'llm10_model_theft'
    ]
  }
];

const OWASP_AGENTIC_CATEGORIES = [
  {
    id: 'agentic_top10',
    label: 'OWASP Agentic AI Top 10',
    description: 'Comprehensive tests for all 10 OWASP Agentic AI vulnerabilities',
    probes: [
      'aa01_agent_goal_hijack',
      'aa02_tool_misuse',
      'aa03_identity_privilege_abuse',
      'aa04_model_isolation_failure',
      'aa05_unauthorized_tool_access',
      'aa06_resource_exhaustion',
      'aa07_agent_orchestration_manipulation',
      'aa08_insecure_communication',
      'aa09_inadequate_agent_sandboxing',
      'aa10_insufficient_agent_monitoring'
    ]
  }
];

export default function ScanCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
      scanner_type: 'llmtopten',
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
  const [expandedCategories, setExpandedCategories] = useState(new Set());

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

  const toggleProbeCategory = (categoryId, event) => {
    // Prevent category toggle if clicking on expand/collapse area
    if (event && event.target.closest('.probe-expand')) {
      return;
    }
    
    // Find category in appropriate list based on scanner type
    let category;
    if (formData.scanner_type === 'llmtopten') {
      category = OWASP_LLM_CATEGORIES.find(c => c.id === categoryId);
    } else if (formData.scanner_type === 'agenttopten') {
      category = OWASP_AGENTIC_CATEGORIES.find(c => c.id === categoryId);
    } else {
      category = PROBE_CATEGORIES.find(c => c.id === categoryId);
    }
    
    if (!category) return;
    
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

  const toggleProbe = (probeName, categoryId, event) => {
    event.stopPropagation();
    
    const isSelected = formData.selected_probes.includes(probeName);
    
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        selected_probes: prev.selected_probes.filter(p => p !== probeName)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selected_probes: [...prev.selected_probes, probeName]
      }));
    }
  };

  const toggleCategoryExpand = (categoryId, event) => {
    event.stopPropagation();
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getAllProbesForScanner = () => {
    if (formData.scanner_type === 'llmtopten') {
      return OWASP_LLM_CATEGORIES.flatMap(c => c.probes);
    } else if (formData.scanner_type === 'agenttopten') {
      return OWASP_AGENTIC_CATEGORIES.flatMap(c => c.probes);
    } else {
      return PROBE_CATEGORIES.flatMap(c => c.probes);
    }
  };

  const handleSelectAllProbes = () => {
    const allProbes = getAllProbesForScanner();
    const allSelected = allProbes.every(p => formData.selected_probes.includes(p));
    
    if (allSelected) {
      // Deselect all
      setFormData(prev => ({
        ...prev,
        selected_probes: []
      }));
    } else {
      // Select all
      setFormData(prev => ({
        ...prev,
        selected_probes: [...new Set([...prev.selected_probes, ...allProbes])]
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Scan name is required';
    if (!formData.model_type) newErrors.model_type = 'Please select a model type';
    if (!formData.model_name.trim()) {
      newErrors.model_name = 'Model name is required';
    } else {
      // Validate model name format based on type
      const modelName = formData.model_name.trim();
      if (formData.model_type === 'huggingface') {
        // HuggingFace models should be in format: username/model-name
        // Allow simple names too (they might be local or custom)
        if (modelName.includes('/') && modelName.split('/').length !== 2) {
          newErrors.model_name = 'HuggingFace model should be in format: username/model-name (e.g., meta-llama/Llama-2-7b-hf)';
        }
      } else if (formData.model_type === 'openai') {
        // OpenAI models should not contain slashes
        if (modelName.includes('/')) {
          newErrors.model_name = 'OpenAI model names should not contain slashes (e.g., gpt-4, not openai/gpt-4)';
        }
      } else if (formData.model_type === 'anthropic') {
        // Anthropic models should not contain slashes
        if (modelName.includes('/')) {
          newErrors.model_name = 'Anthropic model names should not contain slashes (e.g., claude-3-opus-20240229)';
        }
      }
    }
    
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
    
    // Require probe selection for all scanners including llmtopten and agenttopten
    if (formData.selected_probes.length === 0) {
      toast.error('Please select at least one probe to run');
      return;
    }
    
    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      scanner_type: formData.scanner_type,
      model_type: formData.model_type,
      model_name: formData.model_name,
      llm_config: formData.model_config,
      selected_probes: formData.selected_probes,
    });
  };
  
  // Clear OWASP probes when switching away from LLMTopTen/AgentTopTen
  // Don't auto-select probes - let users choose explicitly
  useEffect(() => {
    if (!['llmtopten', 'agenttopten'].includes(formData.scanner_type) && 
        formData.selected_probes.some(p => p.startsWith('llm') || p.startsWith('aa'))) {
      // Clear OWASP probes when switching away from LLMTopTen/AgentTopTen
      setFormData(prev => ({
        ...prev,
        selected_probes: prev.selected_probes.filter(p => !p.startsWith('llm') && !p.startsWith('aa'))
      }));
    }
  }, [formData.scanner_type]);

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
                        placeholder={
                          formData.model_type === 'openai' ? 'e.g., gpt-4, gpt-3.5-turbo' :
                          formData.model_type === 'anthropic' ? 'e.g., claude-3-opus, claude-3-sonnet' :
                          formData.model_type === 'huggingface' ? 'e.g., meta-llama/Llama-2-7b-hf, microsoft/DialoGPT-medium' :
                          'e.g., your-model-name'
                        }
                      />
                      {errors.model_name && <span className="input-error-message">{errors.model_name}</span>}
                      {formData.model_type === 'huggingface' && (
                        <span className="input-hint">
                          Use format: username/model-name (e.g., meta-llama/Llama-2-7b-hf). 
                          Model must exist on HuggingFace Hub.
                        </span>
                      )}
                      {formData.model_type === 'openai' && (
                        <span className="input-hint">
                          Examples: gpt-4, gpt-4-turbo, gpt-3.5-turbo
                        </span>
                      )}
                      {formData.model_type === 'anthropic' && (
                        <span className="input-hint">
                          Examples: claude-3-opus-20240229, claude-3-sonnet-20240229, claude-2.1
                        </span>
                      )}
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
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>Select Security Probes</h3>
                    <span className="text-muted">
                      {formData.selected_probes.length} probes selected
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleSelectAllProbes}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      marginLeft: 'auto' 
                    }}
                  >
                    {getAllProbesForScanner().every(p => formData.selected_probes.includes(p)) ? (
                      <>
                        <Square size={16} />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare size={16} />
                        <span>Select All</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="card-body">
                  <div className="alert alert-info" style={{ marginBottom: 'var(--space-lg)' }}>
                    <Info size={20} />
                    <div className="alert-content">
                      {formData.scanner_type === 'llmtopten' 
                        ? 'Select OWASP LLM Top 10 probes to test. Expand categories to see individual probe names and select specific probes to run.'
                        : formData.scanner_type === 'agenttopten'
                        ? 'Select OWASP Agentic AI Top 10 probes to test. Expand categories to see individual probe names and select specific probes to run.'
                        : 'Select the categories of security tests to run against your model. Expand categories to see individual probe names and select specific probes to run.'}
                    </div>
                  </div>
                  <div className="probe-categories">
                    {formData.scanner_type === 'agenttopten' ? (
                      <>
                        {OWASP_AGENTIC_CATEGORIES.map(category => {
                          const isSelected = category.probes.some(p => formData.selected_probes.includes(p));
                          const isExpanded = expandedCategories.has(category.id);
                          const selectedCount = category.probes.filter(p => formData.selected_probes.includes(p)).length;
                          return (
                            <div
                              key={category.id}
                              className={`probe-category ${isSelected ? 'selected' : ''}`}
                            >
                              <div className="probe-category-header" onClick={(e) => toggleProbeCategory(category.id, e)}>
                                <div className="probe-checkbox">
                                  {isSelected && <span className="probe-check">✓</span>}
                                </div>
                                <div className="probe-content">
                                  <span className="probe-label">{category.label}</span>
                                  <span className="probe-description">{category.description}</span>
                                  <span className="probe-count">
                                    {selectedCount > 0 ? `${selectedCount}/${category.probes.length} selected` : `${category.probes.length} probes`}
                                  </span>
                                </div>
                                <button 
                                  className="probe-expand"
                                  onClick={(e) => toggleCategoryExpand(category.id, e)}
                                  title={isExpanded ? 'Collapse probes' : 'Expand to see probe names'}
                                >
                                  {isExpanded ? '−' : '+'}
                                </button>
                              </div>
                              {isExpanded && (
                                <div className="probe-list">
                                  {category.probes.map(probeName => {
                                    const probeSelected = formData.selected_probes.includes(probeName);
                                    return (
                                      <div
                                        key={probeName}
                                        className={`probe-item ${probeSelected ? 'selected' : ''}`}
                                        onClick={(e) => toggleProbe(probeName, category.id, e)}
                                      >
                                        <div className="probe-checkbox-small">
                                          {probeSelected && <span className="probe-check">✓</span>}
                                        </div>
                                        <span className="probe-name">{probeName}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    ) : formData.scanner_type === 'llmtopten' ? (
                      <>
                        {OWASP_LLM_CATEGORIES.map(category => {
                          const isSelected = category.probes.some(p => formData.selected_probes.includes(p));
                          const isExpanded = expandedCategories.has(category.id);
                          const selectedCount = category.probes.filter(p => formData.selected_probes.includes(p)).length;
                          return (
                            <div
                              key={category.id}
                              className={`probe-category ${isSelected ? 'selected' : ''}`}
                            >
                              <div className="probe-category-header" onClick={(e) => toggleProbeCategory(category.id, e)}>
                                <div className="probe-checkbox">
                                  {isSelected && <span className="probe-check">✓</span>}
                                </div>
                                <div className="probe-content">
                                  <span className="probe-label">{category.label}</span>
                                  <span className="probe-description">{category.description}</span>
                                  <span className="probe-count">
                                    {selectedCount > 0 ? `${selectedCount}/${category.probes.length} selected` : `${category.probes.length} probes`}
                                  </span>
                                </div>
                                <button 
                                  className="probe-expand"
                                  onClick={(e) => toggleCategoryExpand(category.id, e)}
                                  title={isExpanded ? 'Collapse probes' : 'Expand to see probe names'}
                                >
                                  {isExpanded ? '−' : '+'}
                                </button>
                              </div>
                              {isExpanded && (
                                <div className="probe-list">
                                  {category.probes.map(probeName => {
                                    const probeSelected = formData.selected_probes.includes(probeName);
                                    return (
                                      <div
                                        key={probeName}
                                        className={`probe-item ${probeSelected ? 'selected' : ''}`}
                                        onClick={(e) => toggleProbe(probeName, category.id, e)}
                                      >
                                        <div className="probe-checkbox-small">
                                          {probeSelected && <span className="probe-check">✓</span>}
                                        </div>
                                        <span className="probe-name">{probeName}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      PROBE_CATEGORIES.map(category => {
                        const isSelected = category.probes.some(p => formData.selected_probes.includes(p));
                        const isExpanded = expandedCategories.has(category.id);
                        const selectedCount = category.probes.filter(p => formData.selected_probes.includes(p)).length;
                        return (
                          <div
                            key={category.id}
                            className={`probe-category ${isSelected ? 'selected' : ''}`}
                          >
                            <div className="probe-category-header" onClick={(e) => toggleProbeCategory(category.id, e)}>
                              <div className="probe-checkbox">
                                {isSelected && <span className="probe-check">✓</span>}
                              </div>
                              <div className="probe-content">
                                <span className="probe-label">{category.label}</span>
                                <span className="probe-description">{category.description}</span>
                                <span className="probe-count">
                                  {selectedCount > 0 ? `${selectedCount}/${category.probes.length} selected` : `${category.probes.length} probes`}
                                </span>
                              </div>
                              <button 
                                className="probe-expand"
                                onClick={(e) => toggleCategoryExpand(category.id, e)}
                                title={isExpanded ? 'Collapse probes' : 'Expand to see probe names'}
                              >
                                {isExpanded ? '−' : '+'}
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="probe-list">
                                {category.probes.map(probeName => {
                                  const probeSelected = formData.selected_probes.includes(probeName);
                                  return (
                                    <div
                                      key={probeName}
                                      className={`probe-item ${probeSelected ? 'selected' : ''}`}
                                      onClick={(e) => toggleProbe(probeName, category.id, e)}
                                    >
                                      <div className="probe-checkbox-small">
                                        {probeSelected && <span className="probe-check">✓</span>}
                                      </div>
                                      <span className="probe-name">{probeName}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
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
          background: var(--color-bg-tertiary);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
          overflow: hidden;
        }
        
        .probe-category:hover {
          border-color: var(--color-border-light);
        }
        
        .probe-category.selected {
          border-color: var(--color-accent);
          background: var(--color-accent-glow);
        }
        
        .probe-category-header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-sm);
          padding: var(--space-md);
          cursor: pointer;
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
        
        .probe-expand {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-bg-secondary);
          color: var(--color-text);
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }
        
        .probe-expand:hover {
          background: var(--color-bg-tertiary);
          border-color: var(--color-accent);
        }
        
        .probe-list {
          padding: var(--space-sm) var(--space-md);
          padding-top: 0;
          border-top: 1px solid var(--color-border);
          background: var(--color-bg-secondary);
        }
        
        .probe-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          margin-bottom: var(--space-xs);
        }
        
        .probe-item:hover {
          background: var(--color-bg-tertiary);
        }
        
        .probe-item.selected {
          background: var(--color-accent-glow);
        }
        
        .probe-checkbox-small {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }
        
        .probe-item.selected .probe-checkbox-small {
          background: var(--color-accent);
          border-color: var(--color-accent);
        }
        
        .probe-item.selected .probe-checkbox-small .probe-check {
          font-size: 12px;
        }
        
        .probe-name {
          font-size: 0.875rem;
          font-family: 'Courier New', monospace;
          color: var(--color-text);
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
