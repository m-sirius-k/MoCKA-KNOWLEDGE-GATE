#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MoCKA 2.0 Validation Module
Gate validation for Consent/Role/SLA
"""

import json
import yaml
from datetime import datetime
from typing import Dict, List, Tuple, Any

class GateValidator:
    """Validates Consent, Role, and SLA gates."""
    
    def __init__(self, policy_path: str = 'config/policy.yaml'):
        with open(policy_path, 'r', encoding='utf-8') as f:
            self.policy = yaml.safe_load(f)
    
    def validate_consent(self, task: Dict[str, Any]) -> Tuple[bool, str]:
        """Validate Consent Gate."""
        consent = task.get('consent', {})
        
        if not consent.get('approved', False):
            return False, 'Consent not approved'
        
        if not consent.get('timestamp'):
            return False, 'Consent timestamp missing'
        
        return True, 'Consent approved'
    
    def validate_role(self, task: Dict[str, Any]) -> Tuple[bool, str]:
        """Validate Role Gate."""
        role_info = task.get('role', {})
        required = set(role_info.get('required', []))
        user_roles = set(role_info.get('user', []))
        
        if not required.issubset(user_roles):
            missing = required - user_roles
            return False, f'Missing roles: {missing}'
        
        return True, 'Role requirements met'
    
    def validate_sla(self, task: Dict[str, Any]) -> Tuple[bool, str]:
        """Validate SLA Gate."""
        sla = task.get('sla', {})
        timeout = sla.get('timeout_seconds', 3600)
        max_retries = sla.get('max_retries', 3)
        
        if timeout <= 0:
            return False, 'Invalid timeout value'
        
        if max_retries < 0:
            return False, 'Invalid max_retries value'
        
        return True, 'SLA constraints valid'
    
    def validate_all_gates(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Validate all gates and return comprehensive result."""
        results = {
            'timestamp': datetime.now().isoformat(),
            'task_id': task.get('task_id'),
            'gates': {}
        }
        
        # Validate each gate
        consent_ok, consent_msg = self.validate_consent(task)
        results['gates']['consent'] = {'pass': consent_ok, 'message': consent_msg}
        
        role_ok, role_msg = self.validate_role(task)
        results['gates']['role'] = {'pass': role_ok, 'message': role_msg}
        
        sla_ok, sla_msg = self.validate_sla(task)
        results['gates']['sla'] = {'pass': sla_ok, 'message': sla_msg}
        
        # Overall result
        results['all_passed'] = consent_ok and role_ok and sla_ok
        
        return results


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print('Usage: python3 validation.py <task.json>')
        sys.exit(1)
    
    task_file = sys.argv[1]
    with open(task_file, 'r', encoding='utf-8') as f:
        task = json.load(f)
    
    validator = GateValidator()
    result = validator.validate_all_gates(task)
    
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    sys.exit(0 if result['all_passed'] else 1)
