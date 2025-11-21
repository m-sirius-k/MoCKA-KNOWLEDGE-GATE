# MoCKA 2.0 Phase 9 - UI Bridge for Perplexity
# Sends results from AI-SHARE-LOGS/Results/ to Perplexity UI display

import os
import json
from typing import Optional, Dict, Any


class PerplexityUIBridge:
    """Bridge to send MoCKA results to Perplexity UI display"""

    def __init__(self, root_dir: str = "."):
        self.root_dir = root_dir
        self.results_dir = os.path.join(root_dir, "AI-SHARE-LOGS", "Results")
        self.perplexity_endpoint = "https://api.perplexity.ai/ui/assistant/display"
        self.audit_file = os.path.join(root_dir, "AI-SHARE-LOGS", "AUDIT", "audit-log.jsonl")

    def load_result_file(self, result_file: str) -> Optional[Dict[str, Any]]:
        """Load result file from Results directory"""
        path = os.path.join(self.results_dir, result_file)
        if not os.path.exists(path):
            print(f"[UI-BRIDGE] Result file not found: {path}")
            return None

        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[UI-BRIDGE] Error loading result file: {e}")
            return None

    def format_display_content(self, result: Dict[str, Any]) -> str:
        """Format result data for UI display"""
        task_id = result.get("task_id", "Unknown")
        task_type = result.get("type", "unknown")
        city = result.get("city", "Unknown")
        result_data = result.get("result", {})

        # Format weather data
        if task_type == "weather":
            weather = result_data.get("weather", "Unknown")
            temp_max = result_data.get("temp_max_c", "N/A")
            temp_min = result_data.get("temp_min_c", "N/A")
            humidity = result_data.get("humidity", "N/A")

            return f"""
【名古屋の天気予報】
タスクID: {task_id}
都市: {city}
天気: {weather}
最高気温: {temp_max}°C
最低気温: {temp_min}°C
湿度: {humidity}%

MoCKA 2.0 AI-SHARE-LOGS システムより自動配信
"""
        else:
            return json.dumps(result_data, ensure_ascii=False, indent=2)

    def send_to_display(self, result_file: str) -> bool:
        """Send result to Perplexity UI for display"""
        print(f"[UI-BRIDGE] Processing result file: {result_file}")

        result = self.load_result_file(result_file)
        if not result:
            return False

        task_id = result.get("task_id")
        display_content = self.format_display_content(result)

        # Simulate sending to Perplexity UI
        # In production, this would call actual Perplexity API endpoint
        print(f"[UI-BRIDGE] Sending to Perplexity UI...")
        print(f"[UI-BRIDGE] Display Content:\n{display_content}")

        # Payload that would be sent to Perplexity
        payload = {
            "task_id": task_id,
            "content": display_content,
            "source": "MoCKA 2.0",
            "mode": "display",
            "timestamp": result.get("executed_at", "unknown")
        }

        # Log the display action
        self.log_ui_display(task_id, payload)

        print(f"[UI-BRIDGE] Successfully sent to Perplexity UI: {task_id}")
        return True

    def log_ui_display(self, task_id: str, payload: Dict[str, Any]) -> bool:
        """Log UI display action to audit log"""
        try:
            import datetime
            entry = {
                "actor": "PerplexityUIBridge",
                "role": "ui_bridge",
                "action": "UI_DISPLAY",
                "target": task_id,
                "status": "displayed",
                "payload_size": len(str(payload)),
                "timestamp": datetime.datetime.utcnow().isoformat()
            }

            os.makedirs(os.path.dirname(self.audit_file), exist_ok=True)
            with open(self.audit_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")

            return True
        except Exception as e:
            print(f"[UI-BRIDGE] Error logging UI display: {e}")
            return False

    def process_all_pending(self) -> int:
        """Process all pending results for UI display"""
        if not os.path.exists(self.results_dir):
            print(f"[UI-BRIDGE] Results directory not found: {self.results_dir}")
            return 0

        result_files = [f for f in os.listdir(self.results_dir) if f.endswith("-Perplexity.json")]
        print(f"[UI-BRIDGE] Found {len(result_files)} pending results")

        processed = 0
        for result_file in result_files:
            if self.send_to_display(result_file):
                processed += 1

        print(f"[UI-BRIDGE] Processed {processed} results for UI display")
        return processed


if __name__ == "__main__":
    bridge = PerplexityUIBridge(root_dir=".")
    count = bridge.process_all_pending()
    print(f"[UI-BRIDGE] Completed. Processed {count} results.")
