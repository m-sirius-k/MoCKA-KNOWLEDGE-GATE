# MoCKA 2.0 器と道 Utility Functions
# Firestore→Suabase事実記録用utility。

import os
import json
from typing import Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class FirestoreEventValidator:
    """Firestoreを検証しインテンショントコンビット「確認を取った」を確認。"""
    
    @staticmethod
    def validate_instruction(instruction: Dict[str, Any]) -> bool:
        """
        インテンションJSONを検証。
        """
        required_fields = ['user_id', 'action', 'timestamp']
        for field in required_fields:
            if field not in instruction:
                logger.warning(f"Missing field: {field}")
                return False
        return True
    
    @staticmethod
    def validate_knock(knock: str) -> bool:
        """
        確認ユーザーを検証。
        """
        if not knock or len(knock.strip()) == 0:
            return False
        return True

class EventLogger:
    """Suabaseにinsertするイベントを記録。"""
    
    @staticmethod
    def format_event(firestore_doc_id: str, instruction: Dict, knock: str, status: str) -> Dict:
        """
        イベントをstandardized formatに変換。
        """
        return {
            'firestore_doc_id': firestore_doc_id,
            'instruction': json.dumps(instruction),
            'knock': knock,
            'status': status,
            'logged_at': datetime.utcnow().isoformat()
        }

class EnvironmentConfig:
    """Environment変数を管理。"""
    
    @staticmethod
    def get_firebase_creds_path() -> str:
        return os.getenv('FIREBASE_CREDS_PATH', './firebase-key.json')
    
    @staticmethod
    def get_supabase_url() -> str:
        return os.getenv('SUPABASE_URL', 'http://localhost:5432')
    
    @staticmethod
    def get_supabase_credentials() -> Dict[str, str]:
        return {
            'host': os.getenv('SUPABASE_HOST', 'localhost'),
            'port': int(os.getenv('SUPABASE_PORT', 5432)),
            'database': os.getenv('SUPABASE_DB', 'postgres'),
            'user': os.getenv('SUPABASE_USER', 'postgres'),
            'password': os.getenv('SUPABASE_PASSWORD', '')
        }
