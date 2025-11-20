#!/usr/bin/env python3
"""
Google Colab API Client - Phase 1
Google Colab との連携を担当するモジュール
"""

import os
import json
import requests
from typing import Dict, Optional, List
from datetime import datetime

class ColabClient:
    def __init__(self, api_base: str = None, api_key: str = None, template_id: str = None):
        self.api_base = api_base or os.getenv('COLAB_API_BASE')
        self.api_key = api_key or os.getenv('COLAB_API_KEY')
        self.template_id = template_id or os.getenv('COLAB_TEMPLATE_ID')
        self.headers = {'Authorization': f'Bearer {self.api_key}'}

    def create_notebook(self, title: str, description: str = '') -> Dict:
        """Create a new Colab notebook from template"""
        url = f"{self.api_base}/notebooks"
        data = {
            'title': title,
            'description': description,
            'template_id': self.template_id
        }
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()

    def add_cell(self, notebook_id: str, content: str, cell_type: str = 'code') -> Dict:
        """Add code or text cell to notebook"""
        url = f"{self.api_base}/notebooks/{notebook_id}/cells"
        data = {'content': content, 'type': cell_type}
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()

    def execute_notebook(self, notebook_id: str) -> Dict:
        """Execute all cells in notebook"""
        url = f"{self.api_base}/notebooks/{notebook_id}/execute"
        response = requests.post(url, headers=self.headers)
        return response.json()

    def get_notebook(self, notebook_id: str) -> Dict:
        """Retrieve notebook metadata and cells"""
        url = f"{self.api_base}/notebooks/{notebook_id}"
        response = requests.get(url, headers=self.headers)
        return response.json()

    def export_notebook(self, notebook_id: str, format: str = 'ipynb') -> bytes:
        """Export notebook in specified format"""
        url = f"{self.api_base}/notebooks/{notebook_id}/export?format={format}"
        response = requests.get(url, headers=self.headers)
        return response.content
