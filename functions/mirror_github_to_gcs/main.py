import functions_framework
import json
import datetime
from typing import List, Dict

import requests
from google.cloud import storage


def build_raw_url(repository: str, branch: str, path: str) -> str:
    # 例: https://raw.githubusercontent.com/nsjpkimura-del/MoCKA-KNOWLEDGE-GATE/main/ARCHITECTURE.md
    return f"https://raw.githubusercontent.com/{repository}/{branch}/{path}"


def upload_to_gcs(bucket_name: str, object_name: str, content: bytes) -> int:
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)
    blob.upload_from_string(content)
    return len(content)


@functions_framework.http
def mirror_github_to_gcs(request):
    try:
        body = request.get_json(silent=True) or {}
    except Exception:
        return ("Invalid JSON", 400, {"Content-Type": "text/plain"})

    repository = body.get("repository")
    branch = body.get("branch", "main")
    paths: List[str] = body.get("paths") or []
    gcs_bucket = body.get("gcs_bucket")
    gcs_base_path = body.get("gcs_base_path", "repo_mirror/")

    if not repository or not gcs_bucket or not paths:
        return (
            json.dumps({
                "status": "error",
                "message": "repository, gcs_bucket, paths are required"
            }),
            400,
            {"Content-Type": "application/json"},
        )

    mirrored: List[Dict] = []

    for path in paths:
        raw_url = build_raw_url(repository, branch, path)
        resp = requests.get(raw_url)
        if resp.status_code != 200:
            mirrored.append(
                {
                    "source": path,
                    "target": None,
                    "size": 0,
                    "status": "error",
                    "http_status": resp.status_code,
                    "raw_url": raw_url
                }
            )
            continue

        content = resp.content
        target_object = f"{gcs_base_path.rstrip('/')}/{path}"
        size = upload_to_gcs(gcs_bucket, target_object, content)

        mirrored.append(
            {
                "source": path,
                "target": f"gs://{gcs_bucket}/{target_object}",
                "size": size,
                "status": "ok"
            }
        )

    now = datetime.datetime.now().isoformat()
    result = {
        "status": "success",
        "mirrored_files": mirrored,
        "timestamp": now
    }
    return (json.dumps(result), 200, {"Content-Type": "application/json"})
