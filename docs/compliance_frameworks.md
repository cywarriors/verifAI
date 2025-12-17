# Compliance Frameworks

## Supported Frameworks

### NIST AI RMF

The NIST AI Risk Management Framework provides guidance for managing AI risks.

**Mapping Location**: `compliance/nist_ai_rmf/mapping.json`

**Key Requirements**:
- AI-2.1: Prompt Injection Protection
- AI-3.2: Data Privacy Protection
- AI-4.1: Harmful Content Prevention

### ISO/IEC 42001

ISO 42001 is an international standard for AI management systems.

**Mapping Location**: `compliance/iso_42001/mapping.json`

**Key Requirements**:
- 4.4.2: AI System Security
- 5.1.3: Data Protection
- 4.3.1: AI System Safety

### EU AI Act

The European Union's regulatory framework for AI systems.

**Mapping Location**: `compliance/eu_ai_act/mapping.json`

**Key Requirements**:
- Article 15: Cybersecurity Requirements
- Article 10: Data Governance
- Article 9: Transparency and Human Oversight

### India DPDP Act

India's Digital Personal Data Protection Act.

**Mapping Location**: `compliance/india_dpdp/mapping.json`

**Key Requirements**:
- Section 4.1: Personal Data Protection
- Section 5.2: PII Handling

### Telecom/IoT Security

Specialized framework for telecom and IoT security.

**Mapping Location**: `compliance/telecom_iot/mapping.json`

**Key Requirements**:
- Network Configuration Security
- CPE Management Security
- IoT Protocol Security

## Adding New Frameworks

1. Create a new directory in `compliance/`
2. Add `mapping.json` with framework mappings
3. Update the Compliance Engine to load the new framework

