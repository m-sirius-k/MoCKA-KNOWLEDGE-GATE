import os, json, yaml

AUDIT_LOG = "AUDIT/audit-log.jsonl"
REVISION_LOG = "AI-SHARE-LOGS/revision-log.yaml"
TARGET_ID = "Perplexity00-20251120"  # チェック対象ID

def check_audit(target_id):
    entries = []
    if os.path.exists(AUDIT_LOG):
        with open(AUDIT_LOG, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    e = json.loads(line)
                    if e.get("target") == target_id:
                        entries.append(e)
    return entries

def check_revision(target_id):
    entries = []
    if os.path.exists(REVISION_LOG):
        with open(REVISION_LOG, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            if isinstance(data, list):
                for e in data:
                    if target_id in str(e):
                        entries.append(e)
    return entries

def main():
    audit_entries = check_audit(TARGET_ID)
    revision_entries = check_revision(TARGET_ID)

    print(f"=== MoCKA KNOWLEDGE GATE Check for {TARGET_ID} ===")
    print(f"監査ログ件数: {len(audit_entries)}")
    print(f"改訂ログ件数: {len(revision_entries)}")

    if audit_entries and revision_entries:
        print("✅ 正常稼動: 保存・改訂・監査が揃っています")
    elif audit_entries and not revision_entries:
        print("⚠️ 部分稼動: 監査はあるが改訂ログ未記録")
    elif not audit_entries and revision_entries:
        print("⚠️ 部分稼動: 改訂はあるが監査證跡未記録")
    else:
        print("❌ 未稼動: 保存・改訂・監査の證跡が揃っていません")

if __name__ == "__main__":
    main()
