-- MoCKA 2.0 器と道 Supabase PostgreSQL Schema
-- Firestore→Suabase事実記録テーブル

-- イベントログテーブル
CREATE TABLE IF NOT EXISTS ai_event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firestore_doc_id VARCHAR(255) NOT NULL,
    instruction JSONB NOT NULL,
    knock VARCHAR(255),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(firestore_doc_id)
);

-- リレイスタータステーブル
CREATE TABLE IF NOT EXISTS ai_relay_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES ai_event_log(id) ON DELETE CASCADE,
    relay_status VARCHAR(50),
    relay_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_ai_event_log_firestore_doc_id ON ai_event_log(firestore_doc_id);
CREATE INDEX IF NOT EXISTS idx_ai_event_log_status ON ai_event_log(status);
CREATE INDEX IF NOT EXISTS idx_ai_event_log_created_at ON ai_event_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_relay_status_event_id ON ai_relay_status(event_id);

-- トリガー: updated_atを自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_event_log_updated_at BEFORE UPDATE ON ai_event_log
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
