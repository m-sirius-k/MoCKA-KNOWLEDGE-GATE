#!/usr/bin/env python3
"""
Mem.ai to GitHub Import Script

This script creates Mem.ai notes from GitHub markdown files and repository content.
It uses the Mem.ai API to create notes and organize them into collections.

Prerequisites:
  - MEM_API_KEY: Mem.ai API key
  - MEM_COLLECTION_ID: Target Mem collection ID

Usage:
  MEM_API_KEY=xxx MEM_COLLECTION_ID=yyy python3 mem-ai-import.py
"""

import os
import sys
import json
import requests
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

# Configuration
MEM_API_KEY = os.getenv('MEM_API_KEY')
MEM_COLLECTION_ID = os.getenv('MEM_COLLECTION_ID')
MEM_API_BASE = 'https://api.mem.ai/v0'
SOURCE_DIR = os.getenv('SOURCE_DIR', './docs')

if not MEM_API_KEY:
    raise ValueError('MEM_API_KEY environment variable is required')
if not MEM_COLLECTION_ID:
    raise ValueError('MEM_COLLECTION_ID environment variable is required')

class MemAIClient:
    """Client for interacting with Mem.ai API"""
    
    def __init__(self, api_key: str, base_url: str = MEM_API_BASE):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def create_mem(self, content: str, collection_ids: Optional[List[str]] = None) -> Dict:
        """Create a new mem (note) in Mem.ai"""
        data = {'content': content}
        if collection_ids:
            data['collection_ids'] = collection_ids
        
        try:
            response = requests.post(
                f'{self.base_url}/mems',
                headers=self.headers,
                json=data,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f'Error creating mem: {e}')
            return None
    
    def append_to_mem(self, mem_id: str, content: str) -> bool:
        """Append content to existing mem"""
        try:
            response = requests.post(
                f'{self.base_url}/mems/{mem_id}/append',
                headers=self.headers,
                json={'content': content},
                timeout=30
            )
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            print(f'Error appending to mem {mem_id}: {e}')
            return False

def read_markdown_file(file_path: Path) -> str:
    """Read markdown file content"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f'Error reading file {file_path}: {e}')
        return None

def add_metadata(content: str, file_path: Path) -> str:
    """Add metadata to content"""
    metadata = {
        'source': str(file_path),
        'imported_at': datetime.now().isoformat(),
        'from_github': True
    }
    
    metadata_str = '---\n'
    for key, value in metadata.items():
        if isinstance(value, str):
            metadata_str += f'{key}: {value}\n'
        else:
            metadata_str += f'{key}: {json.dumps(value)}\n'
    metadata_str += '---\n\n'
    
    return metadata_str + content

def import_files_to_mems(source_dir: str, collection_ids: Optional[List[str]] = None) -> int:
    """Import all markdown files from directory as mems"""
    client = MemAIClient(MEM_API_KEY)
    source_path = Path(source_dir)
    
    if not source_path.exists():
        print(f'Error: Source directory {source_dir} does not exist')
        return 0
    
    markdown_files = list(source_path.glob('**/*.md'))
    
    if not markdown_files:
        print(f'No markdown files found in {source_dir}')
        return 0
    
    print(f'Found {len(markdown_files)} markdown files to import')
    
    success_count = 0
    
    for file_path in markdown_files:
        print(f'\nProcessing: {file_path.relative_to(source_path)}')
        
        # Read file content
        content = read_markdown_file(file_path)
        if not content:
            continue
        
        # Add metadata
        content_with_metadata = add_metadata(content, file_path)
        
        # Create mem
        result = client.create_mem(content_with_metadata, collection_ids)
        
        if result:
            mem_id = result.get('id', 'unknown')
            print(f'  ✓ Created mem: {mem_id}')
            success_count += 1
        else:
            print(f'  ✗ Failed to create mem')
    
    return success_count

def main():
    """Main entry point"""
    print('\n=== Mem.ai GitHub Import ===' )
    print(f'Configuration:')
    print(f'  Source Directory: {SOURCE_DIR}')
    print(f'  Collection ID: {MEM_COLLECTION_ID}')
    print(f'  API Base: {MEM_API_BASE}\n')
    
    collection_ids = [MEM_COLLECTION_ID] if MEM_COLLECTION_ID else None
    
    try:
        success_count = import_files_to_mems(SOURCE_DIR, collection_ids)
        
        print(f'\n=== Import Complete ===')
        print(f'Successfully imported: {success_count} mems\n')
        
        return 0 if success_count > 0 else 1
    
    except Exception as e:
        print(f'Fatal error: {e}', file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())
