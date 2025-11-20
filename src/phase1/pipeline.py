#!/usr/bin/env python3
"""
Phase 1 Pipeline - PILS to Colab/NotebookLM Integration
AI共有宣言から PILS を読み込み、自動的に NotebookLM と Colab に連携
"""

import os
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from notebooklm_client import NotebookLMClient
from colab_client import ColabClient

class Phase1Pipeline:
    def __init__(self):
        self.nlm_client = NotebookLMClient()
        self.colab_client = ColabClient()
        self.audit_log = []
        self.debug = os.getenv('DEBUG_MODE', 'false').lower() == 'true'

    def log_audit(self, action: str, target: str, status: str, details: str = ''):
        """Log action to audit trail"""
        entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': action,
            'target': target,
            'status': status,
            'actor': os.getenv('AUDIT_ACTOR_DEFAULT', 'SYSTEM'),
            'details': details
        }
        self.audit_log.append(entry)
        if self.debug:
            print(f"[AUDIT] {json.dumps(entry)}")

    def process_pils(self, pils_path: str) -> Dict:
        """Process PILS file and create NotebookLM notebook"""
        try:
            with open(pils_path, 'r', encoding='utf-8') as f:
                pils = json.load(f)
            
            # Create NotebookLM notebook
            nb_response = self.nlm_client.create_notebook(
                name=f"PILS-{pils.get('issue_id')}",
                description=pils.get('description', '')
            )
            
            self.log_audit('NOTEBOOK_CREATE', nb_response.get('id'), 'success')
            
            # Upload content to NotebookLM
            doc_response = self.nlm_client.upload_document(
                notebook_id=nb_response['id'],
                content=json.dumps(pils, ensure_ascii=False, indent=2),
                filename=f"pils-{pils.get('issue_id')}.json"
            )
            
            self.log_audit('DOCUMENT_UPLOAD', doc_response.get('id'), 'success')
            
            return {'status': 'success', 'notebook_id': nb_response['id'], 'document_id': doc_response['id']}
        except Exception as e:
            self.log_audit('PILS_PROCESS', pils_path, 'error', str(e))
            raise

    def generate_colab_notebook(self, pils_data: Dict) -> Dict:
        """Generate Colab notebook from PILS"""
        try:
            # Create Colab notebook
            colab_resp = self.colab_client.create_notebook(
                title=f"Analysis-{pils_data.get('issue_id')}",
                description=f"Auto-generated from PILS {pils_data.get('issue_id')}"
            )
            
            self.log_audit('COLAB_CREATE', colab_resp.get('id'), 'success')
            
            # Add initial analysis cell
            self.colab_client.add_cell(
                notebook_id=colab_resp['id'],
                content=f"# PILS Analysis\n\n## Issue: {pils_data.get('issue_id')}\n\nData summary: {json.dumps(pils_data.get('summary', ''))}",
                cell_type='markdown'
            )
            
            return {'status': 'success', 'colab_id': colab_resp['id']}
        except Exception as e:
            self.log_audit('COLAB_GENERATE', pils_data.get('issue_id'), 'error', str(e))
            raise

    def run(self, pils_dir: str = 'AI-SHARE-LOGS/PILS'):
        """Main pipeline execution"""
        pils_path = Path(pils_dir)
        results = []
        
        for pils_file in pils_path.glob('*.json'):
            pils_data = json.loads(pils_file.read_text())
            
            # Process with NotebookLM
            nlm_result = self.process_pils(str(pils_file))
            
            # Generate Colab notebook
            colab_result = self.generate_colab_notebook(pils_data)
            
            results.append({
                'pils_file': str(pils_file),
                'notebooklm': nlm_result,
                'colab': colab_result
            })
        
        return {'results': results, 'audit_log': self.audit_log}

if __name__ == '__main__':
    pipeline = Phase1Pipeline()
    output = pipeline.run()
    print(json.dumps(output, indent=2, ensure_ascii=False))
