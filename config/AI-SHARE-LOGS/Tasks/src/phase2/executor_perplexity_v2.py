import os, json
from datetime import datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
QUE = os.path.join(ROOT, "AI-SHARE-LOGS", "Queues", "Q-Perplexity.json")
RESULTS = os.path.join(ROOT, "AI-SHARE-LOGS", "Results")
AUDIT = os.path.join(ROOT, "AUDIT", "audit-log.jsonl")

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

def already_done(pils, ikey):
    links = pils.get("links", {})
    return bool(links.get("notebooklm_id")) and bool(links.get("drive_file_id")) and pils.get("meta", {}).get("idempotency_key") == ikey

def run():
    if not os.path.exists(QUE):
        return
    q = load_json(QUE)
    changed = False
    for t in q.get("tasks", []):
        if t["status"] not in ["Ready", "Preview"]:
            continue
        ikey = t.get("idempotency_key")
        pils_id = t["inputs"].get("pils_id")
        if not pils_id:
            continue
        pils_path = os.path.join(ROOT, "AI-SHARE-LOGS", "PILS", f"{pils_id}.json")
        if not os.path.exists(pils_path):
            append_audit({"actor": "Perplexity", "role": "ingest", "action": "TASK_SKIP", "target": t["task_id"], "result": "missing_pils"})
            continue
        pils = load_json(pils_path)
        if t["status"] == "Preview":
            append_audit({"actor": "Perplexity", "role": "ingest", "action": "DRY_RUN", "target": t["task_id"], "result": "ok", "notes": {"pils_id": pils_id}})
            continue
        if already_done(pils, ikey):
            t["status"] = "Completed"
            changed = True
            append_audit({"actor": "Perplexity", "role": "ingest", "action": "IDEMPOTENT_SKIP", "target": t["task_id"], "result": "ok"})
            continue
        file_id = f"drive-{pils_id}"
        nlm_id = f"nlm-{pils_id}"
        links = pils.get("links", {})
        links["drive_file_id"] = file_id
        links["notebooklm_id"] = nlm_id
        pils["links"] = links
        pils.setdefault("meta", {})["idempotency_key"] = ikey
        save_json(pils_path, pils)
        res = {
            "result_id": f"RES-{pils_id}-Perplexity",
            "task_id": t["task_id"],
            "ai": "Perplexity",
            "links": {"drive_file_id": file_id, "notebooklm_id": nlm_id},
            "status": "Completed",
            "notes": "Ingest complete"
        }
        save_json(os.path.join(RESULTS, f"RES-{pils_id}-Perplexity.json"), res)
        t["status"] = "Completed"
        changed = True
        append_audit({"actor": "Perplexity", "role": "ingest", "action": "TASK_EXECUTE", "target": t["task_id"], "result": "ok"})
    if changed:
        save_json(QUE, q)

if __name__ == "__main__":
    run()
