import os, json, glob, hashlib, yaml
from datetime import datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TASKS_DIR = os.path.join(ROOT, "AI-SHARE-LOGS", "Tasks")
QUEUES_DIR = os.path.join(ROOT, "AI-SHARE-LOGS", "Queues")
AUDIT = os.path.join(ROOT, "AUDIT", "audit-log.jsonl")
POLICY_PATH = os.path.join(ROOT, "config", "policy.yaml")

def load_json(p):
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(p, d):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)

def append_audit(e):
    os.makedirs(os.path.dirname(AUDIT), exist_ok=True)
    with open(AUDIT, "a", encoding="utf-8") as f:
        f.write(json.dumps({**e, "timestamp": datetime.utcnow().isoformat()}) + "\n")

def idempotency_key(task):
    payload = json.dumps({"task_id": task["task_id"], "assigned": task.get("assigned", [])}, ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def validate_task(task, policy):
    missing = [k for k in policy["sla"]["required_task_fields"] if k not in task]
    if missing:
        return False, f"missing_fields:{','.join(missing)}"
    if policy["consent"]["require_explicit"]:
        if not task.get("consent", {}).get("approved", False):
            return False, "consent_not_approved"
    for a in task.get("assigned", []):
        ai, role = a["ai"], a["role"]
        allowed = policy["consent"]["allowed_actions"].get(ai, [])
        if role not in allowed:
            return False, f"role_not_allowed:{ai}:{role}"
    return True, "ok"

def distribute_task(task, policy, debug=False):
    per_ai_count = {}
    for a in task.get("assigned", []):
        ai = a["ai"]
        per_ai_count[ai] = per_ai_count.get(ai, 0) + 1
        if per_ai_count[ai] > policy["safety"]["max_parallel_per_ai"]:
            append_audit({"actor": "Coordinator", "action": "TASK_LIMIT_BLOCK", "target": task["task_id"], "result": "blocked"})
            return
    ikey = idempotency_key(task)
    task.setdefault("meta", {})["idempotency_key"] = ikey
    for a in task.get("assigned", []):
        ai = a["ai"]
        queue_path = os.path.join(QUEUES_DIR, f"Q-{ai}.json")
        q = load_json(queue_path) if os.path.exists(queue_path) else {"queue_id": f"Q-{ai}", "ai": ai, "tasks": []}
        q["tasks"].append({
            "task_id": task["task_id"],
            "role": a["role"],
            "inputs": task.get("inputs", {}),
            "status": "Ready" if not debug else "Preview",
            "priority": task.get("priority", "Normal"),
            "idempotency_key": ikey
        })
        save_json(queue_path, q)
    append_audit({"actor": "Coordinator", "role": "system", "action": "TASK_DISTRIBUTED", "target": task["task_id"], "result": "ok", "notes": {"debug": debug}})

def main():
    policy = yaml.safe_load(open(POLICY_PATH, "r", encoding="utf-8"))
    debug = os.environ.get(policy["safety"]["debug_mode_env_key"], "false").lower() == "true"
    paths = sorted(glob.glob(os.path.join(TASKS_DIR, "*.json")))
    for p in paths:
        t = load_json(p)
        if t.get("status") not in ["New", "Requeue"]:
            continue
        ok, msg = validate_task(t, policy)
        if not ok:
            t["status"] = "Blocked"
            t["error"] = msg
            save_json(p, t)
            append_audit({"actor": "Coordinator", "action": "TASK_BLOCKED", "target": t["task_id"], "result": "error", "notes": {"reason": msg}})
            continue
        distribute_task(t, policy, debug)
        t["status"] = "Distributed"
        save_json(p, t)

if __name__ == "__main__":
    main()
