# AI Simulation Results Storage - Usage Guide

## Quick Start

### 1. Store Simulation Results via GitHub Actions

The easiest way to store simulation results is using the GitHub Actions workflow.

#### Step 1: Navigate to Actions
1. Go to your repository: https://github.com/nsjpkimura-del/MoCKA-KNOWLEDGE-GATE
2. Click on the **Actions** tab
3. Select **AI Simulation Results Storage** workflow
4. Click **Run workflow**

#### Step 2: Fill in Workflow Inputs

The workflow requires the following inputs:

- **Issue ID**: GitHub Issue identifier (format: `ISSUE-XXX`)
  - Example: `ISSUE-001`, `ISSUE-123`
  - Must match pattern: `^ISSUE-[0-9]{3,}$`

- **Rod Number**: Rod identifier (format: `ROD-XXX`)
  - Example: `ROD-001`, `ROD-456`
  - Must match pattern: `^ROD-[0-9]{3,}$`

- **Model Provider**: Select from dropdown
  - `claude`: For Claude models
  - `openai`: For OpenAI models

- **Model Name**: Specific model version
  - Default: `claude-3-sonnet-20250219`
  - Examples: `claude-3-opus-20250514`, `gpt-4-turbo`, `gpt-4o`

- **Simulation Input** (JSON): Input data for simulation
  ```json
  {
    "prompt": "Your prompt here",
    "context": {"key": "value"}
  }
  ```

- **Simulation Output** (JSON): Simulation results
  ```json
  {
    "response": "Model output here",
    "tokens_used": 512,
    "finish_reason": "stop"
  }
  ```

- **Confidence Score**: Optional (default: `0.95`)
  - Range: `0.0` to `1.0`

### 2. Programmatic Storage (Node.js)

If you want to store results programmatically, use the `simulation-storage.js` module:

```javascript
const { saveSimulationResult } = require('./scripts/simulation-storage.js');

(async () => {
  try {
    const result = await saveSimulationResult({
      issueId: 'ISSUE-001',
      rodNumber: 'ROD-001',
      modelProvider: 'claude',
      modelName: 'claude-3-sonnet-20250219',
      input: {
        prompt: 'Your prompt here',
        context: {}
      },
      output: {
        response: 'Model response here',
        tokens_used: 512,
        finish_reason: 'stop'
      },
      confidenceScore: 0.95
    });
    console.log('Simulation stored:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
```

## Directory Structure

Simulation results are automatically organized:

```
docs/AI-SIMULATION/
├── claude/
│   └── ISSUE-001/
│       ├── ROD-001/
│       │   ├── simulation_2025-11-18_15-30-00.json
│       │   └── metadata.json
│       └── index.json
├─┐ openai/
│   └── ISSUE-001/
```

## File Descriptions

### `simulation_[YYYY-MM-DD_HH-mm-ss].json`
- **Purpose**: Complete simulation result with metadata, input, and output
- **Format**: JSON
- **Updated**: Each time a simulation runs
- **Content**: Metadata + Input + Output + Analysis

### `metadata.json`
- **Purpose**: Summary metadata for the rod-number
- **Format**: JSON
- **Updated**: After each simulation
- **Content**: Issue ID, rod number, model info, timestamp, status

### `index.json`
- **Purpose**: Index of all simulations for an ISSUE-ID and model provider
- **Format**: JSON
- **Location**: `docs/AI-SIMULATION/[model]/[ISSUE-ID]/index.json`
- **Content**: List of all simulation records with timestamps

## Validation Rules

Before submitting, ensure:

1. **Issue ID Format**
   - ✓ Valid: `ISSUE-001`, `ISSUE-123`, `ISSUE-9999`
   - ✗ Invalid: `ISSUE-1`, `ISSUE-AB`, `ISSUE-123-456`

2. **Rod Number Format**
   - ✓ Valid: `ROD-001`, `ROD-456`, `ROD-9999`
   - ✗ Invalid: `ROD-1`, `ROD-AB`, `ROD-123-456`

3. **Model Provider**
   - Must be exactly: `claude` or `openai`

4. **Confidence Score**
   - Must be between `0.0` and `1.0`
   - Example: `0.95`, `0.5`, `0.99`

5. **JSON Fields**
   - Both input and output must be valid JSON
   - No trailing commas
   - Properly quoted strings

## Retrieving Results

To find stored simulation results:

1. **Via GitHub**:
   - Navigate to `docs/AI-SIMULATION/[model]/[ISSUE-ID]/[rod-number]/`
   - View simulation files and metadata

2. **Via Code**:
   ```javascript
   const { getSimulationResults } = require('./scripts/simulation-storage.js');
   
   const results = await getSimulationResults('ISSUE-001', 'ROD-001', 'claude');
   ```

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid ISSUE-ID format" | Wrong format | Use `ISSUE-XXX` format with 3+ digits |
| "Invalid rod-number format" | Wrong format | Use `ROD-XXX` format with 3+ digits |
| "Invalid model provider" | Typo in provider | Must be `claude` or `openai` |
| "Invalid JSON" | Malformed JSON | Check for syntax errors, missing quotes |

## Examples

### Example 1: Claude Simulation
**Issue ID**: `ISSUE-001`
**Rod Number**: `ROD-001`
**Model**: `claude-3-sonnet-20250219`

### Example 2: OpenAI Simulation
**Issue ID**: `ISSUE-002`
**Rod Number**: `ROD-002`
**Model**: `gpt-4-turbo`

## Support

For issues or questions:
1. Check the SCHEMA.md for detailed specifications
2. Review stored examples in `docs/AI-SIMULATION/`
3. Check GitHub Actions logs for workflow errors
