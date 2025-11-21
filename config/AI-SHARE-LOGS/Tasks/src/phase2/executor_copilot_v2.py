import os, json, yaml

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
QUE = os.path.join(ROOT, "AI-SHARE-LOGS", "Queues", "Q-Copilot.json")
RESULTS = os.path.join(ROOT, "AI-SHARE-LOGS", "Results")
POLICY = os.path.join(ROOT, "config", "policy.yaml")

def load_json(p):
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(p, d):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)

def run():
    if not os.path.exists(QUE):
        return
    q = load_json(QUE)
    changed = False
    pol = yaml.safe_load(open(POLICY, "r", encoding="utf-8"))
    for t in q.get("tasks", []):
        if t["status"] not in ["Ready", "Preview"]:
            continue
        if t["status"] == "Preview":
            continue
        checks = {
            "consent_required": pol["consent"]["require_explicit"],
            "safety_parallel_limit": pol["safety"]["max_parallel_per_ai"] >= 1,
            "roles_defined": len(pol.get("roles", {})) >= 2
        }
        save_json(os.path.join(RESULTS, f"{t['task_id']}-Copilot.json"), {
            "result_id": f"{t['task_id']}-Copilot",
            "task_id": t["task_id"],
            "ai": "Copilot",
            "status": "Completed",
            "checks": checks
        })
        t["status"] = "Completed"
        changed = True
    if changed:
        save_json(QUE, q)

if __name__ == "__main__":
    run()
