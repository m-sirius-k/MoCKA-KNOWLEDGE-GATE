README-MOCKA2-PHASE7.md# Phase 7: MoCKA 2.0 透明性と外部参加フェーズ

## 概要

Phase 7 は MoCKA 2.0 を「透明で参加可能な制度」として外部に開くフェーズです。  
内部監査と外部監査の二重保証体制をベースに、リアルタイム可視化と外部参加制度を確立します。

## 主要コンポーネント

### 1. BigQuery リアルタイム可視化

**データセット:**
- `mocka_results` - タスク実行結果とKPI指標
- `mocka_audit` - 監査トレイルと監査アクション

**スキーマ:**
- タスクID、AI名、ステータス、信頼スコア
- SLA遵守状況、完了時間、改善提案
- 監査アクション、タイムスタンプ

### 2. 外部監査者ロール

**招待対象:** 外部監査組織、規制機関、ステークホルダー

**権限レベル:**
- Viewer（読み取り専用）：Lookerダッシュボード参照
- Auditor-External（提案版）：監査所見の提出

**招待コード例:** `INVITE-PHASE7-AUDITOR-001`

### 3. Looker ダッシュボード

**KPI 指標:**
- タスク完了率（%）
- SLA遵守率（%）
- 改善提案数
- 平均信頼スコア
- 再投入率

**参照可能者:** 外部監査者、内部ステークホルダー

## 外部参加ガイドライン

### アクセス要件

1. Google Cloud IAM メンバー登録
2. Firebase Authentication による認証
3. Looker ダッシュボード契約
4. 監査合意書への署名

### データ保護

- エンドツーエンド暗号化（TLS 1.3+）
- アクセスログ記録と監査
- 99.99% SLA保証
- GDPR準拠デリート機能

### フィードバック提出プロセス

```
Monitoring Dashboard
    ↓ [Anomaly Detected]
    ↓
Audit Review Form
    ↓ [Submit Finding]
    ↓
Firebase Audit Collection
    ↓ [Auto-trigger]
    ↓
Internal Review Workflow
    ↓ [Resolution]
    ↓
External Report Delivery
```

## 本番移行テスト

**ステップ:**
1. サンプルタスク ステータス: Preview → Ready
2. Claude 改善提案が Results に自動保存
3. Audit トレイルに「TASK_EXECUTE」が記録
4. 外部監査者が Looker ダッシュボード確認可能

## 次フェーズ

**Phase 8: グローバル展開**
- 多言語対応（英語、中国語、スペイン語）
- 国別規制対応（GDPR、カリフォルニア法）
- 国際監査パートナーシップ

---

**最終更新:** 2025-11-21  
**メンテナー:** MoCKA 運用チーム  
**ライセンス:** MIT
