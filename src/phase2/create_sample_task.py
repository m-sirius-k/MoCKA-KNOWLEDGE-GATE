src/phase2/create_sample_task.py#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MoCKA 2.0 Sample Task Injection
Tasks → Dry-run → Queues Distribution → Results Capture
"""

import os
import json
import datetime
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TASKS_DIR = os.path.join(ROOT, "AI-SHARE-LOGS", "Tasks")

def create_task(task_id, title, objective, assigned, inputs, 
                classification="Restricted", dry_run=False):
    """
    Create and inject sample task into Tasks directory.
    dry_run=True: Distribution only (Dry-run Preview)
    dry_run=False: Full execution
    """
    
    task = {
        "task_id": task_id,
        "title": title,
        "objective": objective,
        "priority": "High",
        "due": (datetime.datetime.utcnow() + 
                datetime.timedelta(days=2)).strftime("%Y-%m-%d"),
        "assigned": assigned,
        "inputs": inputs,
        "classification": classification,
        "consent": {
            "approved": True,
            "issued_by": "MoCKA-SYSTEM",
            "timestamp": datetime.datetime.utcnow().isoformat()
        },
        "dry_run": dry_run,
        "status": "New",
        "meta": {
            "action_required": [
                "coordinator_distribute",
                "executor_run",
                "audit_record"
            ],
            "created_at": datetime.datetime.utcnow().isoformat()
        }
    }
    
    # Create directory if not exists
    os.makedirs(TASKS_DIR, exist_ok=True)
    
    # Write task file
    path = os.path.join(TASKS_DIR, f"{task_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(task, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Task {task_id} created at {path}")
    print(f"   Mode: {'DRY-RUN' if dry_run else 'PRODUCTION'}")
    return path

if __name__ == "__main__":
    # Dry-run sample task
    create_task(
        "TASK-2025-11-21-DRYRUN-001",
        "MoCKA 2.0 Dry-run Distribution Test",
        "Test task distribution to all AI executors",
        [
            {"ai": "Perplexity", "role": "coordinator"},
            {"ai": "Gemini", "role": "semantic_index"},
            {"ai": "Copilot", "role": "protocol_check"}
        ],
        {"test_id": "TEST-2025-11-21-DRYRUN"},
        dry_run=True  # Dry-run mode
    )
    
    # Production sample task
    create_task(
        "TASK-2025-11-21-PROD-001",
        "MoCKA 2.0 Production Execution Test",
        "Full production workflow test",
        [
            {"ai": "Perplexity", "role": "ingest"},
            {"ai": "Gemini", "role": "semantic_index"},
            {"ai": "Copilot", "role": "protocol_check"}
        ],
        {"test_id": "TEST-2025-11-21-PROD"},
        dry_run=False  # Production mode
    )
    
    print("\n✅ All sample tasks created successfully!")
    print(f"   Location: {TASKS_DIR}")
