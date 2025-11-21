# MoCKA 2.0 Phase 9 - Perplexity Task Executor Engine
# Executes tasks from Q-Perplexity.json queue, stores results, records audit events

import os
import json
import datetime
from typing import Dict, Any, Optional


class PerplexityExecutor:
    """Execute Perplexity tasks and manage results/audit logs"""

    def __init__(self, root_dir: str = "."):
        self.root_dir = root_dir
        self.queue_file = os.path.join(root_dir, "AI-SHARE-LOGS", "Queues", "Q-Perplexity.json")
        self.results_dir = os.path.join(root_dir, "AI-SHARE-LOGS", "Results")
        self.audit_file = os.path.join(root_dir, "AI-SHARE-LOGS", "AUDIT", "audit-log.jsonl")
        os.makedirs(self.results_dir, exist_ok=True)
        os.makedirs(os.path.dirname(self.audit_file), exist_ok=True)

    def load_json(self, path: str) -> Optional[Dict[str, Any]]:
        """Load JSON file safely"""
        if not os.path.exists(path):
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {path}: {e}")
            return None

    def save_json(self, path: str, data: Dict[str, Any]) -> bool:
        """Save JSON file safely"""
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Error saving {path}: {e}")
            return False

    def append_audit(self, entry: Dict[str, Any]) -> bool:
        """Append audit log entry"""
        try:
            entry["timestamp"] = datetime.datetime.utcnow().isoformat()
            with open(self.audit_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            return True
        except Exception as e:
            print(f"Error appending audit: {e}")
            return False

    def execute_weather_task(self, task_id: str, city: str) -> Dict[str, Any]:
        """Simulate weather data retrieval from Perplexity"""
        # In production, this would call actual Perplexity API
        weather_data = {
            "Nagoya": {"weather": "Sunny", "temp_max_c": 15, "temp_min_c": 4, "humidity": 60},
            "Tokyo": {"weather": "Cloudy", "temp_max_c": 12, "temp_min_c": 5, "humidity": 65},
            "Osaka": {"weather": "Rainy", "temp_max_c": 14, "temp_min_c": 8, "humidity": 75},
        }
        return weather_data.get(city, {"weather": "Unknown", "temp_max_c": 0, "temp_min_c": 0})

    def execute_task(self, task: Dict[str, Any]) -> bool:
        """Execute a single task from queue"""
        task_id = task.get("task_id")
        task_type = task.get("type", "weather")
        city = task.get("city", "Nagoya")
        date = task.get("date", datetime.date.today().isoformat())

        print(f"[EXECUTOR] Processing task {task_id}")

        # Execute task based on type
        if task_type == "weather":
            result_data = self.execute_weather_task(task_id, city)
        else:
            result_data = {"status": "unknown_task_type"}

        # Create result file
        result = {
            "result_id": f"{task_id}-Perplexity",
            "task_id": task_id,
            "ai": "Perplexity",
            "type": task_type,
            "city": city,
            "date": date,
            "status": "Completed",
            "result": result_data,
            "executed_at": datetime.datetime.utcnow().isoformat()
        }

        result_file = os.path.join(self.results_dir, f"{task_id}-Perplexity.json")
        if not self.save_json(result_file, result):
            return False

        # Record execution in audit
        audit_entry = {
            "actor": "PerplexityExecutor",
            "role": "executor",
            "action": "TASK_EXECUTE",
            "target": task_id,
            "result_file": result_file,
            "status": "completed",
            "result_data": result_data
        }
        if not self.append_audit(audit_entry):
            return False

        print(f"[EXECUTOR] Task {task_id} executed successfully -> {result_file}")
        return True

    def run(self) -> int:
        """Process all ready tasks in queue"""
        if not os.path.exists(self.queue_file):
            print(f"[EXECUTOR] Queue file not found: {self.queue_file}")
            return 0

        queue_data = self.load_json(self.queue_file)
        if not queue_data:
            return 0

        tasks = queue_data.get("tasks", [])
        processed = 0
        changed = False

        for task in tasks:
            if task.get("status") != "Ready":
                continue

            if self.execute_task(task):
                task["status"] = "Completed"
                task["completed_at"] = datetime.datetime.utcnow().isoformat()
                processed += 1
                changed = True
            else:
                task["status"] = "Error"
                changed = True

        if changed:
            if self.save_json(self.queue_file, queue_data):
                print(f"[EXECUTOR] Queue updated: {processed} tasks completed")
            else:
                print("[EXECUTOR] Failed to update queue")

        return processed


if __name__ == "__main__":
    executor = PerplexityExecutor(root_dir=".")
    count = executor.run()
    print(f"[EXECUTOR] Execution complete. Processed {count} tasks.")
