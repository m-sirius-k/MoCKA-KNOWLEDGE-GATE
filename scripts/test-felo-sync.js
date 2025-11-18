#!/usr/bin/env node
/**
 * Test suite for Felo AI Search integration
 */

const DataTransformer = require('./data-transformer');

class FeloSyncTester {
  constructor() {
    this.transformer = new DataTransformer();
    this.results = { passed: 0, failed: 0, tests: [] };
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
  }

  testKnowledgeGateToFelo() {
    try {
      const inputData = {
        'ISSUE-ID': 'MOCKA-001',
        'TRUST_SCORE': 85,
        'rod-number': 'ROD-12345',
      };
      const result = this.transformer.transformKnowledgeGateToFelo(inputData);
      const validation = this.transformer.validateData(result);
      if (validation.valid) {
        this.log('pass', 'KG to Felo transformation successful');
        this.results.passed++;
      } else {
        throw new Error('Validation failed');
      }
    } catch (error) {
      this.log('fail', `KG to Felo: ${error.message}`);
      this.results.failed++;
    }
  }

  testFeloToKnowledgeGate() {
    try {
      const inputData = {
        'search_result_id': 'SR-001',
        'relevance_score': 0.95,
      };
      const result = this.transformer.transformFeloToKnowledgeGate(inputData);
      if (result['ISSUE-ID']) {
        this.log('pass', 'Felo to KG transformation successful');
        this.results.passed++;
      } else {
        throw new Error('Mapping incorrect');
      }
    } catch (error) {
      this.log('fail', `Felo to KG: ${error.message}`);
      this.results.failed++;
    }
  }

  testValidation() {
    try {
      const validData = {
        'ISSUE-ID': 'TEST-001',
        'TRUST_SCORE': 50,
        'rod-number': 'ROD-999',
      };
      const validation = this.transformer.validateData(validData);
      if (validation.valid) {
        this.log('pass', 'Data validation passed');
        this.results.passed++;
      } else {
        throw new Error('Validation should pass');
      }
    } catch (error) {
      this.log('fail', `Validation: ${error.message}`);
      this.results.failed++;
    }
  }

  testInvalidDataDetection() {
    try {
      const invalidData = {
        'ISSUE-ID': 'TEST-001',
        'TRUST_SCORE': 150,
        'rod-number': 'ROD-999',
      };
      const validation = this.transformer.validateData(invalidData);
      if (!validation.valid && validation.errors.length > 0) {
        this.log('pass', 'Invalid data correctly detected');
        this.results.passed++;
      } else {
        throw new Error('Should detect invalid data');
      }
    } catch (error) {
      this.log('fail', `Invalid detection: ${error.message}`);
      this.results.failed++;
    }
  }

  testBatchTransform() {
    try {
      const records = [
        { 'ISSUE-ID': 'BATCH-001', 'TRUST_SCORE': 75, 'rod-number': 'ROD-1' },
        { 'ISSUE-ID': 'BATCH-002', 'TRUST_SCORE': 90, 'rod-number': 'ROD-2' },
      ];
      const results = this.transformer.batchTransform(records);
      if (results.length === 2 && results[0]._metadata) {
        this.log('pass', 'Batch transformation successful');
        this.results.passed++;
      } else {
        throw new Error('Batch output incorrect');
      }
    } catch (error) {
      this.log('fail', `Batch transform: ${error.message}`);
      this.results.failed++;
    }
  }

  runAllTests() {
    console.log('\n=== Felo Integration Test Suite ===\n');
    this.testKnowledgeGateToFelo();
    this.testFeloToKnowledgeGate();
    this.testValidation();
    this.testInvalidDataDetection();
    this.testBatchTransform();
    this.printSummary();
  }

  printSummary() {
    console.log('\n=== Test Results ===');
    console.log(`PASSED: ${this.results.passed}`);
    console.log(`FAILED: ${this.results.failed}`);
    console.log(`TOTAL:  ${this.results.passed + this.results.failed}`);
    if (this.results.failed === 0) {
      console.log('\n✓ All tests passed!\n');
      process.exit(0);
    } else {
      console.log(`\n✗ ${this.results.failed} test(s) failed\n`);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const tester = new FeloSyncTester();
  tester.runAllTests();
}

module.exports = FeloSyncTester;
