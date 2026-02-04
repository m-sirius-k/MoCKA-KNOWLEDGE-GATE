#!/usr/bin/env python3
"""
MoCKA Phase 4 - Canva Integration Module
プロトタイプ実装: INTENT_SCRIPTからCanvaデザイン自動生成

主要機能:
1. INTENT_SCRIPTで指定されたデザイン要件を解析
2. Canva APIを使用してテンプレート自動選択
3. デザイン生成とURL取得
4. Activity Consoleへのログ記録

依存:
- Canva API (REST)
- Google Sheets API (Activity Console更新用)
"""

import os
import json
import requests
from datetime import datetime
from typing import Dict, Optional


class CanvaIntegration:
    """
    Canva API統合クラス
    """

    def __init__(self, api_key: str = None):
        """
        初期化
        
        Args:
            api_key: Canva APIキー（環境変数CANVA_API_KEYから読み取り可能）
        """
        self.api_key = api_key or os.getenv("CANVA_API_KEY")
        self.base_url = "https://api.canva.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def analyze_intent(self, intent_script: str) -> Dict:
        """
        INTENT_SCRIPTからデザイン要件を抽出
        
        Args:
            intent_script: INTENT_SCRIPT形式のテキスト
            
        Returns:
            デザイン要件辞書
        """
        # プロトタイプ: キーワードベースの簡易解析
        design_type = "social_media_post"  # デフォルト
        
        if "presentation" in intent_script.lower():
            design_type = "presentation"
        elif "infographic" in intent_script.lower():
            design_type = "infographic"
        elif "instagram" in intent_script.lower():
            design_type = "instagram_post"
        elif "twitter" in intent_script.lower() or "x.com" in intent_script.lower():
            design_type = "twitter_post"
        
        return {
            "design_type": design_type,
            "keywords": self._extract_keywords(intent_script),
            "timestamp": datetime.now().isoformat()
        }

    def _extract_keywords(self, text: str) -> list:
        """
        キーワード抽出（簡易版）
        """
        # プロトタイプ: 基本的な単語分割
        stopwords = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for"}
        words = text.lower().split()
        return [w for w in words if len(w) > 3 and w not in stopwords][:10]

    def select_template(self, design_requirements: Dict) -> Optional[str]:
        """
        デザイン要件に基づき最適なテンプレートを選択
        
        Args:
            design_requirements: analyze_intent()の出力
            
        Returns:
            テンプレートID
        """
        # プロトタイプ: モック実装
        # 実装時にCanva APIのテンプレート検索エンドポイントを使用
        template_map = {
            "presentation": "template_pres_001",
            "infographic": "template_info_001",
            "instagram_post": "template_ig_001",
            "twitter_post": "template_tw_001",
            "social_media_post": "template_social_001"
        }
        
        design_type = design_requirements.get("design_type", "social_media_post")
        return template_map.get(design_type, "template_social_001")

    def create_design(self, intent_script: str) -> Dict:
        """
        INTENT_SCRIPTからデザインを生成
        
        Args:
            intent_script: INTENT_SCRIPT形式のテキスト
            
        Returns:
            生成結果（design_id, url, status）
        """
        # Step 1: INTENT解析
        design_req = self.analyze_intent(intent_script)
        
        # Step 2: テンプレート選択
        template_id = self.select_template(design_req)
        
        # Step 3: Canva API呼び出し（プロトタイプはモック）
        # 実装例:
        # payload = {
        #     "design_type": design_req["design_type"],
        #     "template_id": template_id,
        #     "title": f"MoCKA Design {datetime.now().strftime('%Y%m%d_%H%M%S')}"
        # }
        # response = requests.post(
        #     f"{self.base_url}/designs",
        #     headers=self.headers,
        #     json=payload
        # )
        # result = response.json()
        
        # プロトタイプのモックレスポンス
        mock_design_id = f"canva_design_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        mock_url = f"https://www.canva.com/design/{mock_design_id}/view"
        
        return {
            "design_id": mock_design_id,
            "url": mock_url,
            "template_id": template_id,
            "design_type": design_req["design_type"],
            "status": "SUCCESS",
            "timestamp": datetime.now().isoformat()
        }

    def log_to_activity_console(self, design_result: Dict, sheets_api):
        """
        Activity Consoleへのログ追加
        
        Args:
            design_result: create_design()の出力
            sheets_api: Google Sheets APIインスタンス
        """
        log_entry = {
            "Timestamp": design_result["timestamp"],
            "Actor": "NSJP_kimura",
            "Action Type": "CREATE",
            "Target": f"Canva:{design_result['design_type']}",
            "Source PILS ID": "Phase4:CanvaIntegration",
            "Result": design_result["status"],
            "Error Message": "",
            "INTENT_SCRIPT Log Link": f"INTENT_CANVA_DESIGN: {design_result['design_id']}",
            "Artifact Link": design_result["url"]
        }
        
        # sheets_api.append_row(log_entry)  # 実装時に有効化
        print(f"[Activity Console] Logged: {json.dumps(log_entry, ensure_ascii=False)}")


def main():
    """
    テスト実行用
    """
    # サンプルINTENT_SCRIPT
    sample_intent = """
    INTENT_CREATE_DESIGN:
    - Create an Instagram post for MoCKA External Brain System launch
    - Theme: AI + Neuroscience + Innovation
    - Colors: Blue, Purple, White
    - Include: Brain network visualization
    """
    
    # Canva統合実行
    canva = CanvaIntegration()
    result = canva.create_design(sample_intent)
    
    print("\n=== Canva Integration Result ===")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print("\n✅ Phase 4.1: Canva Integration - PROTOTYPE COMPLETE")


if __name__ == "__main__":
    main()
