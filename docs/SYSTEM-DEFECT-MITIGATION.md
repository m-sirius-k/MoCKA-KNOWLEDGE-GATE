# MoCKA制度 システム欠陥と対策

## 概要
本ドキュメントは、MoCKA制度における3つの主要な欠陥カテゴリと、それぞれの軽減策を定義します。

---

## 1. 制度間の摩擦とボトルネック

### 1.1 TRUST_SCORE硬直化 (AI-SHARE-014, 013関連)

**欠陥**: ピアレビュー制度とTRUST_SCORE制度は知識品質を保証しますが、検証AI群の専門家バイアスにより、新しい知見や異分野の意見に対して過度に低いスコアが付与される可能性があります。

**対策**:
- 乖離度スコア (Divergence Score) の導入: 既存知識体系との乖離度を計測し、乖離度が高い知見については別途追跡
- 特別レビュー会制度 (Divergence Review Board): 乖離度スコア > 80 の知見に対し、PJLが直接介入する特別レビュー会を開催
- 多様性指標 (Diversity Index): PILS層全体の多様性を KPI として監視

**実装**:
```json
{
  "divergence_score": 85,
  "divergence_reason": "Novel cross-disciplinary approach",
  "requires_special_review": true,
  "special_review_date": "2025-11-26",
  "pjl_intervention": "Project Lead approval required"
}
```

### 1.2 ログ過剰負荷 (AI-SHARE-004, 006, 010関連)

**欠陥**: すべてのイベント・アクセス・資料に追跡コードが付与される結果、ログ検索・解析自体がボトルネックとなり、リアルタイムの監査や意思決定を妨げる。

**対策**:
- 二層化ログシステム (Dual-Layer Logging):
  - L1: リアルタイム監査用（軽量）- 要約情報のみ
  - L2: 永続化アーカイブ用（完全）- 完全な監査証跡
- ダッシュボード要約化: PJLが参照する進捗ダッシュボード（021）に要約された監査リスク指標のみを表示
- キャッシング戦略: 頻繁にアクセスされるログセットを メモリキャッシュ化

**実装**:
```json
{
  "log_layer": "L1",
  "summary": "3 API calls, 1 auth failure, 2 data modifications",
  "risk_index": 0.15,
  "needs_detail_audit": false,
  "archive_reference": "L2:LOG-2025-1119-007138"
}
```

---

## 2. PJLの監督責任に関する欠陥

### 2.1 Accountability Trace深度チェック (AI-SHARE-035, 016関連)

**欠陥**: PJLはAccountability Traceテンプレート（035, 016）を埋める義務がありますが、このプロセスが形式的となり、採用/棄却理由が簡略化される可能性があります。

**対策**:
- 倫理・コンプライアンスAI による自動深度チェック
  - 最小文字数: 500字以上
  - 必須キーワード: decision_rationale, stakeholder_impact, risk_assessment
  - 深度スコア (Depth Score): 0-100
- 深度スコア < 60 の場合、PJLに自動で再提出を要求

**実装**:
```json
{
  "accountability_trace_id": "AT-2025-1119-001",
  "depth_score": 78,
  "status": "ACCEPTED",
  "validation": {
    "min_length_ok": true,
    "required_keywords_present": true,
    "coherence_score": 82
  }
}
```

### 2.2 PJLハンドオーバー Joint Sign-off (AI-SHARE-019, 020関連)

**欠陥**: ハンドオーバー時に、引き継ぎ資料の解釈の齟齬やデッドロックが生じる可能性があります。

**対策**:
- Joint Sign-off制度 (共同署名制度) の必須化
  - 引き継ぐPJLと引き継ぐ先のPJLが共同で確認・署名
  - ロッド番号付きで記録され、双方の理解と責任移行を明確化

**実装**:
```json
{
  "handover_id": "HO-2025-1119-014",
  "from_pjl": "Project-Lead-A",
  "to_pjl": "Project-Lead-B",
  "rod_number": "ROD-7139",
  "joint_signature": {
    "from_pjl_signature": "sha256:xxxxx",
    "to_pjl_signature": "sha256:yyyyy",
    "timestamp": "2025-11-19T07:00:00Z",
    "status": "COMPLETED"
  }
}
```

---

## 3. ヒューマン・インターフェースの欠陥

### 3.1 DRきむら様負荷軽減 (AI-SHARE-001, 026, 028関連)

**欠陥**: 制度の最終意思決定者への負荷が過剰になると、制度全体のレビューと改善サイクルが遅延します。

**対策**:
- 制度健全性KPI (System Health KPI) の導入
  - メトリクス1: "レビュー会におけるDRきむら様の承認所要時間" (SLA: 5営業日以内)
  - メトリクス2: "未処理改善提案の累積数" (SLA: 10件以下)
  - メトリクス3: "制度改善のサイクルタイム" (SLA: 30日以内)
- 優先度自動調整メカニズム
  - SLAを超過した場合、PJLが改善提案の優先度を自動的に調整
  - 低優先度の提案は次期レビュー会に延期

**実装**:
```json
{
  "health_kpi": {
    "approval_turnaround_days": 4,
    "status": "OK",
    "pending_proposals": 7,
    "cycle_time_days": 25,
    "auto_deprioritized": 0
  }
}
```

---

## 実装スケジュール

| 対策 | Phase | Due Date | Owner |
|------|-------|----------|-------|
| 乖離度スコア + 特別レビュー会 | 1 | 2025-11-26 | 倫理・コンプライアンスAI |
| 二層化ログシステム | 2 | 2025-12-03 | セキュリティ・監査AI |
| Accountability Trace深度チェック | 2 | 2025-12-03 | 倫理・コンプライアンスAI |
| Joint Sign-off | 1 | 2025-11-26 | PJLメタ協調委員会 |
| 制度健全性KPI | 1 | 2025-11-26 | プロジェクト・リードAI |

---

## KPI監視

進捗ダッシュボード (AI-SHARE-021) にて以下を監視します:
- システム欠陥発見率
- 対策の実装完了率
- DRきむら様の負荷指標
- 制度改善サイクルタイム
