# AI共有宣言保存構造 - 実装ガイド

日付: 2025-11-20
版: 1.0

## 概要

MoCKA KNOWLEDGE GATEの AI共有システムの保存構造實装ガイド。

根本概念：
- **AIごとの透明性**: 各AIの宣言を分离保存
- **即時性**: 新規宣言を既存を上書きせず自動追記
- **履歴管理**: 同じAIの複数回の宣言を連番管理
- **制度変更を分離**: 大規模改訂は revision-log.yaml で笅追

## 保存構造

### ディレクトリ枠組み

```
/docs/AI-SHARE-LOGS/
├── Copilot/
│   ├── Copilot00-20251120.yaml
│   ├── Copilot01-20251121.yaml
│   └── ...
├── Gemini/
│   ├── Gemini00-20251120.yaml
│   └── ...
├── Perplexity/
│   ├── Perplexity00-20251119.yaml
│   └── ...
└── revision-log.yaml
```

### ファイル命名形式

**患言ファイル**: `{AI_NAME}{SERIAL}-{YYYYMMDD}.yaml`

- `AI_NAME`: Copilot, Gemini, Perplexity 等
- `SERIAL`: 連番番号 (00-99)
- `YYYYMMDD`: 宣言日

例: `Copilot00-20251120.yaml`, `Gemini01-20251121.yaml`

## 宣言ファイルスキーマ

```yaml
ai_name: Copilot
serial: 0
date: "20251120"
fileName: "Copilot00-20251120"
summary: "宣言内容の概要"
shared_by: "Copilot Team"

details: |
  詳細な宣言内容
  複数行対応

created_at: "2025-11-20T13:00:00Z"
updated_at: "2025-11-20T13:00:00Z"
```

## 接となるステップ

1. **APIエンドポイント実装**: POST /api/ai-share-declarations
2. **自動連番付与機構**: serialの自動沈号
3. **ユーザーUI統合**: GUIで宣言アップロード
