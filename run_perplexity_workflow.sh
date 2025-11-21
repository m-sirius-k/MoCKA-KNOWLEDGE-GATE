#!/usr/bin/env bash
set -e

# 1) Executor 
python src/phase9/executor_perplexity_v2.py

# 2) UI 
python src/phase9/ui_bridge_perplexity.py

# 3) Audit
python src/phase9/audit_ui_display.py
