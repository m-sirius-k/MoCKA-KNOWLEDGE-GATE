/**
 * Felo AI Search - Data Transformer
 * Transforms and normalizes data between Knowledge Gate and Felo formats
 */

const yaml = require('yaml');
const fs = require('fs');

class DataTransformer {
  constructor() {
    this.config = this.loadConfig();
    this.mappings = this.config?.felo_integration?.data_mapping || {};
  }

  loadConfig() {
    try {
      const configPath = './connection/connection-info.yaml';
      const content = fs.readFileSync(configPath, 'utf8');
      return yaml.parse(content);
    } catch (error) {
      console.warn('Could not load config:', error.message);
      return null;
    }
  }

  /**
   * Transform Knowledge Gate data to Felo format
   */
  transformKnowledgeGateToFelo(data) {
    console.log('Transforming Knowledge Gate -> Felo format');
    
    const mappings = this.mappings.knowledge_gate_to_felo || [];
    const transformed = {};

    mappings.forEach(mapping => {
      const sourceValue = data[mapping.source_field];
      const targetField = mapping.target_field;
      const transform = mapping.transform || 'identity';

      transformed[targetField] = this.applyTransform(
        sourceValue,
        transform,
        'forward'
      );
    });

    return transformed;
  }

  /**
   * Transform Felo data to Knowledge Gate format
   */
  transformFeloToKnowledgeGate(data) {
    console.log('Transforming Felo -> Knowledge Gate format');
    
    const mappings = this.mappings.felo_to_knowledge_gate || [];
    const transformed = {};

    mappings.forEach(mapping => {
      const sourceValue = data[mapping.source_field];
      const targetField = mapping.target_field;
      const transform = mapping.transform || 'identity';

      transformed[targetField] = this.applyTransform(
        sourceValue,
        transform,
        'backward'
      );
    });

    return transformed;
  }

  /**
   * Apply transformation function
   */
  applyTransform(value, transformType, direction) {
    if (value === null || value === undefined) {
      return null;
    }

    switch (transformType) {
      case 'identity':
        return value;

      case 'normalize_0_to_1':
        // Convert 0-100 scale to 0-1
        return Math.min(Math.max(parseFloat(value) / 100, 0), 1);

      case 'normalize_0_to_100':
        // Convert 0-1 scale to 0-100
        return Math.min(Math.max(Math.round(parseFloat(value) * 100), 0), 100);

      case 'to_string':
        return String(value);

      case 'to_number':
        return parseFloat(value);

      case 'to_boolean':
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true';
        }
        return Boolean(value);

      case 'iso_timestamp':
        // Convert to ISO 8601 timestamp
        if (typeof value === 'string') {
          return new Date(value).toISOString();
        }
        if (typeof value === 'number') {
          return new Date(value).toISOString();
        }
        return new Date().toISOString();

      case 'md5_hash':
        const crypto = require('crypto');
        return crypto.createHash('md5').update(String(value)).digest('hex');

      case 'uppercase':
        return String(value).toUpperCase();

      case 'lowercase':
        return String(value).toLowerCase();

      case 'truncate_255':
        return String(value).substring(0, 255);

      case 'json_stringify':
        return JSON.stringify(value);

      case 'json_parse':
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch (e) {
            console.warn('JSON parse error:', e.message);
            return value;
          }
        }
        return value;

      default:
        console.warn(`Unknown transform type: ${transformType}`);
        return value;
    }
  }

  /**
   * Validate transformed data
   */
  validateData(data, direction = 'forward') {
    const errors = [];

    // Check required fields
    const requiredFields = [
      'ISSUE-ID',
      'TRUST_SCORE',
      'rod-number'
    ];

    requiredFields.forEach(field => {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate TRUST_SCORE range
    if (data.TRUST_SCORE !== undefined) {
      const score = parseFloat(data.TRUST_SCORE);
      if (isNaN(score) || score < 0 || score > 100) {
        errors.push(`Invalid TRUST_SCORE: ${data.TRUST_SCORE}`);
      }
    }

    // Validate ISSUE-ID format
    if (data['ISSUE-ID']) {
      const issueIdRegex = /^[A-Z0-9-]+$/;
      if (!issueIdRegex.test(String(data['ISSUE-ID']))) {
        errors.push(`Invalid ISSUE-ID format: ${data['ISSUE-ID']}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Enrich data with metadata
   */
  enrichData(data, source = 'unknown') {
    return {
      ...data,
      _metadata: {
        source,
        transformed_at: new Date().toISOString(),
        version: '1.0',
      },
    };
  }

  /**
   * Batch transform multiple records
   */
  batchTransform(records, direction = 'forward') {
    return records.map(record => {
      const transformed = direction === 'forward'
        ? this.transformKnowledgeGateToFelo(record)
        : this.transformFeloToKnowledgeGate(record);

      return this.enrichData(transformed);
    });
  }
}

module.exports = DataTransformer;
