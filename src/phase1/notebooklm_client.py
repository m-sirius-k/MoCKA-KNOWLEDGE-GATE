#!/usr/bin/env python3
"""
NotebookLM API Client - Phase 1
NotebookLM API との連携を担当するモジュール
"""

import os
import json
import requests
from typing import Dict, Optional, List
from datetime import datetime

class NotebookLMClient:
    def __init__(self, api_base: str = None, api_key: str = None):
        self.api_base = api_base or os.getenv('NOTEBOOKLM_API_BASE')
        self.api_key = api_key or os.getenv('NOTEBOOKLM_API_KEY')
        self.headers = {'Authorization': f'Bearer {self.api_key}'}

    def create_notebook(self, name: str, description: str = '') -> Dict:
        """Create a new NotebookLM notebook"""
        url = f"{self.api_base}/notebooks"
        data = {'name': name, 'description': description}
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()

    def upload_document(self, notebook_id: str, content: str, filename: str) -> Dict:
        """Upload document to NotebookLM"""
        url = f"{self.api_base}/notebooks/{notebook_id}/documents"
        files = {'file': (filename, content.encode())}
        response = requests.post(url, files=files, headers=self.headers)
        return response.json()

    def generate_summary(self, notebook_id: str) -> Dict:
        """Generate summary from notebook"""
        url = f"{self.api_base}/notebooks/{notebook_id}/summary"
        response = requests.get(url, headers=self.headers)
        return response.json()

    def get_notebook(self, notebook_id: str) -> Dict:
        """Retrieve notebook metadata"""
        url = f"{self.api_base}/notebooks/{notebook_id}"
        response = requests.get(url, headers=self.headers)
        return response.json()
