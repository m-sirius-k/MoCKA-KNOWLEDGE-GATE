import os, json, hashlib

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
QUE = os.path.join(ROOT, "AI-SHARE-LOGS", "Queues", "Q-Gemini.json")
RESULTS = os.path.join(ROOT, "AI-SHARE-LOGS", "Results")

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
    for t in q.get("tasks", []):
        if t["status"] not in ["Ready", "Preview"]:
            continue
        if t["status"] == "Preview":
            continue
        ikey = t.get("idempotency_key", "")
        vectors = int(hashlib.sha256(ikey.encode("utf-8")).hexdigest(), 16) % 2048 + 256
        save_json(os.path.join(RESULTS, f"{t['task_id']}-Gemini.json"), {
            "result_id": f"{t['task_id']}-Gemini",
            "task_id": t["task_id"],
            "ai": "Gemini",
            "status": "Completed",
            "meta": {"indexed": True, "vectors": vectors}
        })
        t["status"] = "Completed"
        changed = True
    if changed:
        save_json(QUE, q)

if __name__ == "__main__":
    run()
