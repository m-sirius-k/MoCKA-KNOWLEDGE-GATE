#!/usr/bin/env python3
import os, json, datetime, glob

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".." ,".."))
TASKS_DIR = os.path.join(ROOT, "AI-SHARE-LOGS", "Tasks")
AUDIT = os.path.join(ROOT, "AUDIT", "audit-log.jsonl")

def append_audit(e):
    os.makedirs(os.path.dirname(AUDIT), exist_ok=True)
    with open(AUDIT, "a", encoding="utf-8") as f:
        f.write(json.dumps({**e, "timestamp": datetime.datetime.utcnow().isoformat()}, ensure_ascii=False) + "\n")

def run():
    """Monitor SLA due dates and auto-requeue expired tasks."""
    if not os.path.exists(TASKS_DIR):
        os.makedirs(TASKS_DIR, exist_ok=True)
        return
    
    requeued_count = 0
    for p in glob.glob(os.path.join(TASKS_DIR, "*.json")):
        try:
            with open(p, "r", encoding="utf-8") as f:
                t = json.load(f)
            
            if t.get("status") in ["Distributed", "New"]:
                due_str = t.get("due", "2100-01-01")
                try:
                    due = datetime.datetime.strptime(due_str, "%Y-%m-%d")
                except ValueError:
                    continue
                
                if datetime.datetime.utcnow() > due:
                    t["status"] = "Requeue"
                    with open(p, "w", encoding="utf-8") as f:
                        json.dump(t, f, ensure_ascii=False, indent=2)
                    append_audit({
                        "actor": "SLA-Monitor",
                        "action": "TASK_REQUEUE",
                        "target": t.get("task_id", "unknown"),
                        "reason": "due_exceeded",
                        "result": "success"
                    })
                    requeued_count += 1
        except Exception as e:
            append_audit({
                "actor": "SLA-Monitor",
                "action": "SLA_CHECK_ERROR",
                "target": os.path.basename(p),
                "error": str(e),
                "result": "error"
            })
    
    if requeued_count > 0:
        print(f"SLA Monitor: {requeued_count} task(s) requeued due to SLA expiry")

if __name__ == "__main__":
    run()
