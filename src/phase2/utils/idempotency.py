#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MoCKA 2.0 Idempotency Module
Hash-based duplicate detection
"""

import hashlib
import json
from pathlib import Path
from typing import Dict, Any, Tuple

class IdempotencyManager:
    """Manages idempotency via hash-based duplicate detection."""
    
    def __init__(self, hash_file: str = 'AI-SHARE-LOGS/executed_hashes.json'):
        self.hash_file = Path(hash_file)
        self.hash_file.parent.mkdir(parents=True, exist_ok=True)
        self.executed_hashes = self._load_hashes()
    
    def _load_hashes(self) -> Dict[str, Any]:
        """Load executed hashes from file."""
        if self.hash_file.exists():
            with open(self.hash_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def _save_hashes(self) -> None:
        """Save executed hashes to file."""
        with open(self.hash_file, 'w', encoding='utf-8') as f:
            json.dump(self.executed_hashes, f, indent=2, ensure_ascii=False)
    
    @staticmethod
    def generate_hash(task_id: str, timestamp: str, parameters: Dict[str, Any]) -> str:
        """Generate SHA256 hash for task."""
        data = json.dumps({
            'task_id': task_id,
            'timestamp': timestamp,
            'parameters': parameters
        }, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(data.encode('utf-8')).hexdigest()
    
    def is_duplicate(self, task_hash: str) -> bool:
        """Check if task has been executed."""
        return task_hash in self.executed_hashes
    
    def record_execution(self, task_hash: str, task_id: str, result: Any) -> None:
        """Record task execution."""
        self.executed_hashes[task_hash] = {
            'task_id': task_id,
            'result': result
        }
        self._save_hashes()
    
    def get_cached_result(self, task_hash: str) -> Any:
        """Get cached result for duplicate task."""
        if task_hash in self.executed_hashes:
            return self.executed_hashes[task_hash].get('result')
        return None


if __name__ == '__main__':
    manager = IdempotencyManager()
    print('Idempotency module initialized.')
