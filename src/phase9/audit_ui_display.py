# MoCKA 2.0 Phase 9 - Audit Logger for UI Display Events
# Logs UI display actions to audit log for transparency and traceability

import os
import json
import datetime
from typing import Dict, Any, Optional


class AuditUIDisplay:
    """Audit logger for UI display events and Perplexity interactions"""

    def __init__(self, root_dir: str = "."):
        self.root_dir = root_dir
        self.audit_file = os.path.join(root_dir, "AI-SHARE-LOGS", "AUDIT", "audit-log.jsonl")
        os.makedirs(os.path.dirname(self.audit_file), exist_ok=True)

    def append_audit_entry(self, entry: Dict[str, Any]) -> bool:
        """Append a single audit log entry"""
        try:
            entry["timestamp"] = datetime.datetime.utcnow().isoformat()
            with open(self.audit_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            return True
        except Exception as e:
            print(f"[AUDIT] Error appending entry: {e}")
            return False

    def log_ui_display(self, task_id: str, content: str, content_size: int = 0) -> bool:
        """Log a UI display event"""
        entry = {
            "actor": "PerplexityUIBridge",
            "role": "ui_bridge",
            "action": "UI_DISPLAY",
            "target": task_id,
            "status": "displayed",
            "content_size": content_size,
            "content_preview": content[:100] if len(content) > 100 else content
        }
        return self.append_audit_entry(entry)

    def log_task_execution(self, task_id: str, task_type: str, result_data: Dict[str, Any]) -> bool:
        """Log a task execution event"""
        entry = {
            "actor": "PerplexityExecutor",
            "role": "executor",
            "action": "TASK_EXECUTE",
            "target": task_id,
            "task_type": task_type,
            "status": "completed",
            "result_keys": list(result_data.keys())
        }
        return self.append_audit_entry(entry)

    def log_perplexity_interaction(self, task_id: str, endpoint: str, status: str) -> bool:
        """Log interaction with Perplexity API"""
        entry = {
            "actor": "PerplexityBridge",
            "role": "api_client",
            "action": "PERPLEXITY_CALL",
            "target": task_id,
            "endpoint": endpoint,
            "status": status
        }
        return self.append_audit_entry(entry)

    def log_audit_review(self, reviewer: str, audit_scope: str, findings_count: int) -> bool:
        """Log audit review event"""
        entry = {
            "actor": reviewer,
            "role": "auditor",
            "action": "AUDIT_REVIEW",
            "target": audit_scope,
            "status": "completed",
            "findings_count": findings_count
        }
        return self.append_audit_entry(entry)

    def get_recent_entries(self, limit: int = 10) -> list:
        """Retrieve recent audit log entries"""
        if not os.path.exists(self.audit_file):
            return []

        entries = []
        try:
            with open(self.audit_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        entries.append(json.loads(line))
            return entries[-limit:]
        except Exception as e:
            print(f"[AUDIT] Error reading entries: {e}")
            return []

    def get_entries_by_action(self, action: str) -> list:
        """Retrieve all entries for a specific action"""
        if not os.path.exists(self.audit_file):
            return []

        entries = []
        try:
            with open(self.audit_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        entry = json.loads(line)
                        if entry.get("action") == action:
                            entries.append(entry)
            return entries
        except Exception as e:
            print(f"[AUDIT] Error reading entries: {e}")
            return []

    def get_entries_by_target(self, target: str) -> list:
        """Retrieve all entries for a specific target (task_id)"""
        if not os.path.exists(self.audit_file):
            return []

        entries = []
        try:
            with open(self.audit_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        entry = json.loads(line)
                        if entry.get("target") == target:
                            entries.append(entry)
            return entries
        except Exception as e:
            print(f"[AUDIT] Error reading entries: {e}")
            return []

    def generate_summary(self) -> Dict[str, Any]:
        """Generate summary statistics from audit log"""
        if not os.path.exists(self.audit_file):
            return {"total_entries": 0, "actions": {}}

        summary = {"total_entries": 0, "actions": {}, "actors": {}}
        try:
            with open(self.audit_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        entry = json.loads(line)
                        summary["total_entries"] += 1
                        action = entry.get("action", "unknown")
                        summary["actions"][action] = summary["actions"].get(action, 0) + 1
                        actor = entry.get("actor", "unknown")
                        summary["actors"][actor] = summary["actors"].get(actor, 0) + 1
        except Exception as e:
            print(f"[AUDIT] Error generating summary: {e}")

        return summary


if __name__ == "__main__":
    audit = AuditUIDisplay(root_dir=".")

    # Example logging
    audit.log_task_execution(
        task_id="TASK-2025-11-22-NAGOYA",
        task_type="weather",
        result_data={"weather": "Sunny", "temp_max_c": 15}
    )

    audit.log_ui_display(
        task_id="TASK-2025-11-22-NAGOYA",
        content="【名古屋の天気予報】\n天気: Sunny\n最高気温: 15°C",
        content_size=65
    )

    audit.log_perplexity_interaction(
        task_id="TASK-2025-11-22-NAGOYA",
        endpoint="https://api.perplexity.ai/ui/assistant/display",
        status="success"
    )

    # Print summary
    summary = audit.generate_summary()
    print(f"[AUDIT] Summary: {json.dumps(summary, ensure_ascii=False, indent=2)}")
    print(f"[AUDIT] Recent entries: {json.dumps(audit.get_recent_entries(3), ensure_ascii=False, indent=2)}")
