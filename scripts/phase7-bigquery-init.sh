scripts/phase7-bigquery-init.sh#!/bin/bash
# Phase 7: BigQuery Dataset & Table Initialization
# Automates creation of mocka_results and mocka_audit datasets with schemas

set -e

PROJECT_ID="mocka-knowledge-gate"
DATASET_RESULTS="mocka_results"
DATASET_AUDIT="mocka_audit"
LOCATION="asia-northeast1"

echo "[Phase 7] Initializing BigQuery datasets..."

# Create Results Dataset
echo "Creating dataset: ${DATASET_RESULTS}"
bq mk --dataset \
  --location=${LOCATION} \
  --description="MoCKA 2.0 Results & KPI Tracking" \
  --project_id=${PROJECT_ID} \
  ${DATASET_RESULTS} || echo "Dataset already exists: ${DATASET_RESULTS}"

# Create Audit Dataset  
echo "Creating dataset: ${DATASET_AUDIT}"
bq mk --dataset \
  --location=${LOCATION} \
  --description="MoCKA 2.0 Audit Trail & Verification" \
  --project_id=${PROJECT_ID} \
  ${DATASET_AUDIT} || echo "Dataset already exists: ${DATASET_AUDIT}"

# Create Results Table Schema
echo "Creating table: ${DATASET_RESULTS}.task_results"
bq mk --table \
  --project_id=${PROJECT_ID} \
  --schema ./schemas/mocka-results-schema.json \
  --description="Task execution results with KPI metrics" \
  ${DATASET_RESULTS}.task_results || echo "Table already exists"

# Create Audit Table Schema
echo "Creating table: ${DATASET_AUDIT}.audit_trail"
bq mk --table \
  --project_id=${PROJECT_ID} \
  --schema ./schemas/mocka-audit-schema.json \
  --description="Audit trail for all task activities" \
  ${DATASET_AUDIT}.audit_trail || echo "Table already exists"

echo "[Phase 7] BigQuery initialization complete!"
echo "Next: Deploy Looker dashboard and Firebase external auditor role"
