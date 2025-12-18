# MoCKA 2.0 器と道 Python Relay API Server
# FastAPIを使用しFirestore→Supabase関数を中窙。

import os
import json
import logging
from datetime import datetime
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import firebase_admin
from firebase_admin import firestore, credentials
import psycopg2
from psycopg2.extras import Json

# 初期化
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MoCKA Relay API")

# Firebase初期化
if not firebase_admin.get_app():
    cred = credentials.Certificate(os.getenv('FIREBASE_CREDS_PATH', './firebase-key.json'))
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Suabase PostgreSQL接続
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('SUPABASE_HOST'),
        port=int(os.getenv('SUPABASE_PORT', 5432)),
        database=os.getenv('SUPABASE_DB'),
        user=os.getenv('SUPABASE_USER'),
        password=os.getenv('SUPABASE_PASSWORD')
    )

class FirestoreEvent(BaseModel):
    firestore_doc_id: str
    instruction: dict
    knock: str
    status: str

@app.post("/api/relay/firestore-event")
async def relay_firestore_event(event: FirestoreEvent):
    """
    Firestoreを騎原としてSuabaseに計掴を中窙。
    """
    try:
        # Firestoreを検証
        doc_ref = db.collection('ai_instructions').document(event.firestore_doc_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Suabaseにinsert
        conn = get_db_connection()
        cursor = conn.cursor()
        
        event_id = str(uuid4())
        timestamp = datetime.now()
        
        cursor.execute(
            """
            INSERT INTO ai_event_log (id, firestore_doc_id, instruction, knock, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (event_id, event.firestore_doc_id, Json(event.instruction), event.knock, event.status, timestamp)
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Event relayed: {event_id}")
        
        return {
            "status": "success",
            "event_id": event_id,
            "timestamp": timestamp.isoformat()
        }
    
    except Exception as e:
        logger.error(f"Relay error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
