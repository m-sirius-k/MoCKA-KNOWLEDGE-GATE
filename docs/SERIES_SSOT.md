# MoCKA Series SSOT
Generated: 2026-02-17T18:18:54
Base: C:\Users\sirok

## 1. Purpose
This document is the Single Source of Truth (SSOT) for the MoCKA Series layout, canonical entrypoints, and forbidden patterns.
Any execution or configuration outside this SSOT is non-canonical.

## 2. Series Layout (Map)
C:\Users\sirok\
  mocka-knowledge-gate\     (process and governance)
  mocka-pythonbridge\       (external brain and execution bridge)
  mocka-infield\            (infield experiments)

## 3. Repositories and Roles
### 3.1 mocka-knowledge-gate
Role: MoCKA process, governance, gates, SSOT documents.
Canonical docs:
- C:\Users\sirok\mocka-knowledge-gate\docs\SERIES_SSOT.md (this file)
Canonical gate:
- C:\Users\sirok\mocka-knowledge-gate\ops\check_series.ps1

Observed:
- HasGit: True
- Env files: gateway\.env, gateway\.env.example
- Python manifests: middleware\requirements.txt
- Entrypoints: many (tooling scripts)

### 3.2 mocka-pythonbridge
Role: execution bridge (browser automation, orchestrator, PoC).
Canonical runners directory:
- C:\Users\sirok\mocka-pythonbridge\run\

Canonical runners:
- run\run_browser_use_poc.ps1 (PoC runner)
- run\poc.ps1 (PoC one-command entry: optional Sync + Run)
- run\run_browser_use_api.ps1 (API runner)
- run\run_orchestrator.ps1 (orchestrator runner)

Observed env files:
- .env
- browser-use-api\.env
- browser-use-poc\.env.poc
- mocka_orchestrator\.env

Observed venv dirs:
- browser-use-api\.venv
- browser-use-poc\.venv
- mocka_orchestrator\.venv

PoC canonical constraints (current):
- PoC Python: 3.11.x (venv fixed to avoid native build failures on 3.13/3.14)
- PoC entry: browser-use-poc\main.py
- PoC requirements: browser-use-poc\requirements.txt

### 3.3 mocka-infield
Role: infield experiments.
Canonical entry is defined inside the repository.
Note: inventory observed minimal python manifests and one entrypoint.

## 4. Canonical Execution Policy
1) Do not execute random scripts across the series.
2) Use canonical runners in C:\Users\sirok\mocka-pythonbridge\run\ for pythonbridge execution.
3) Gate must pass before calling the series "consistent":
   - powershell -ExecutionPolicy Bypass -File C:\Users\sirok\mocka-knowledge-gate\ops\check_series.ps1

## 5. Forbidden Patterns (Hard Fail)
1) Multiple venv variants inside one project (example: .venv311) are forbidden.
2) Dependency installs outside canonical venv are forbidden.
3) Any auto-discovery of env files across repositories is forbidden.
   - env must be explicitly loaded by canonical runners or confined to project boundary.

## 6. Operating Ritual (Reproducible Procedure)
### 6.1 Gate
powershell -ExecutionPolicy Bypass -File C:\Users\sirok\mocka-knowledge-gate\ops\check_series.ps1

### 6.2 PoC
powershell -ExecutionPolicy Bypass -File C:\Users\sirok\mocka-pythonbridge\run\poc.ps1
powershell -ExecutionPolicy Bypass -File C:\Users\sirok\mocka-pythonbridge\run\poc.ps1 -Sync

## 7. Change Control
Any change to:
- env locations
- venv locations
- python version constraints
- canonical entrypoints
must be reflected in this SSOT, and validated by check_series.ps1.
