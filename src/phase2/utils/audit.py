#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MoCKA 2.0 Audit Logging Module
Append-only audit trail recording
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

class AuditLogger:
    """Manages append-only audit trail logging."""
    
    def __init__(self, audit_file: str = 'AI-SHARE-LOGS/audit.jsonl'):
        self.audit_file = Path(audit_file)
        self.audit_file.parent.mkdir(parents=True, exist_ok=True)
    
    def log_event(self, event_type: str, task_id: str, user: str, 
                  status: str, details: Dict[str, Any]) -> None:
        """Log event to append-only audit trail."""
        
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'event_type': event_type,
            'task_id': task_id,
            'user': user,
            'status': status,
            'details': details
        }
        
        # Append-only write (no truncation)
        with open(self.audit_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')
    
    def log_consent_approval(self, task_id: str, user: str, approved: bool) -> None:
        """Log consent gate decision."""
        self.log_event(
            event_type='CONSENT_GATE',
            task_id=task_id,
            user=user,
            status='APPROVED' if approved else 'REJECTED',
            details={'gate': 'consent', 'approved': approved}
        )
    
    def log_role_check(self, task_id: str, user: str, passed: bool, 
                       required: list, user_roles: list) -> None:
        """Log role gate decision."""
        self.log_event(
            event_type='ROLE_GATE',
            task_id=task_id,
            user=user,
            status='PASSED' if passed else 'FAILED',
            details={
                'gate': 'role',
                'required_roles': required,
                'user_roles': user_roles,
                'passed': passed
            }
        )
    
    def log_execution(self, task_id: str, executor: str, status: str, 
                      duration: float, result: Any = None) -> None:
        """Log task execution."""
        self.log_event(
            event_type='TASK_EXECUTION',
            task_id=task_id,
            user=executor,
            status=status,
            details={
                'executor': executor,
                'status': status,
                'duration_seconds': duration,
                'result': str(result) if result else None
            }
        )
    
    def read_audit_logs(self, limit: int = None) -> list:
        """Read audit logs from JSONL file."""
        logs = []
        
        if not self.audit_file.exists():
            return logs
        
        with open(self.audit_file, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                if limit and i >= limit:
                    break
                if line.strip():
                    logs.append(json.loads(line))
        
        return logs


if __name__ == '__main__':
    logger = AuditLogger()
    print('Audit logger initialized.')
