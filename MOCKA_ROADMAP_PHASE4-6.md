# MoCKA External Brain System - ロードマップ Phase 4-6

## 現在の状況（Phase 1-3 完了）

### ✅ Phase 1: プロトコル基盤構築
- PROTOCOL_INTENT.yaml による標準化
- Google Sheets Activity Console（10列構造）
- GitHub Knowledge Gate 連携

### ✅ Phase 2: 初回INTENT実行
- INTENT_SCRIPT形式でのタスク記録
- Activity Consoleへの自動ログ
- Zapier統合（Notion → Sheets）

### ✅ Phase 3: Browser自動化
- mocka_browser_automation.py 実装
- GitHub/Sheets/Zapier連携完了
- 「鉄壁の構え」基盤完成

---

## Phase 4: 表現出力チャネル統合（Canva/Manus/Felo）

### 目的
「前頭前野」レベルの創造的出力を実現

### 実装項目

#### 4.1 Canva API統合
- **目標**: INTENT_SCRIPTから自動デザイン生成
- **技術**: Canva REST API + Zapier/Make
- **成果物**: 
  - `canva_integration.py`
  - テンプレート自動選択ロジック
  - 生成物のURL記録（Activity Console列追加）

#### 4.2 Manus連携
- **目標**: 長文コンテンツの構造化出力
- **技術**: Manus API + Dify統合
- **成果物**:
  - `manus_publisher.py`
  - マークダウン → Manus自動変換
  - バージョン管理機能

#### 4.3 Felo翻訳統合
- **目標**: 多言語対応の自動化
- **技術**: Felo API + 翻訳ワークフロー
- **成果物**:
  - `felo_translator.py`
  - 言語検出 → 翻訳 → 出力の自動化
  - 翻訳履歴のログ記録

#### 4.4 統合Activity Console拡張
- **追加列**:
  - `canva_output_url`
  - `manus_doc_id`
  - `felo_translation_status`
  - `output_channel` (Canva/Manus/Felo)

### 完了条件
- [ ] 3つの出力チャネルすべてがINTENT_SCRIPTから起動可能
- [ ] Activity ConsoleでURLや状態を追跡可能
- [ ] エラー時の自動ロールバック機能

---

## Phase 5: インテリジェント意思決定層

### 目的
「どこまで実装されていてどのフェイズで作業しましたか？」を自動回答できるシステム

### 実装項目

#### 5.1 状態管理ダッシュボード
- **技術**: Google Sheets + Apps Script
- **機能**:
  - 各Phaseの進捗率リアルタイム表示
  - 最終更新タイムスタンプ
  - エラー発生箇所の可視化
  - 「特定のサイトにアクセスしたら読み取れる」要件達成

#### 5.2 自己診断システム
- **ファイル**: `mocka_self_diagnostic.py`
- **機能**:
  - GitHub/Sheets/Zapier/Notion/Canva/Manus/Feloの接続状態チェック
  - 依存関係の検証
  - 「ミスが起きた時点でどこに原因があったのか」を自動特定

#### 5.3 INTENT_SCRIPT実行エンジン強化
- **機能**:
  - 実行前の事前検証（Pre-flight check）
  - 実行中の並列処理制御
  - 実行後の品質保証（QA自動化）

#### 5.4 再現性保証システム
- **技術**: Docker + GitHub Actions
- **成果物**:
  - `Dockerfile` (環境の完全再現)
  - `.github/workflows/mocka_ci.yml` (自動テスト)
  - 「ミスなく再現性のある文章管理」達成

### 完了条件
- [ ] ダッシュボードで全Phase状態が一目瞭然
- [ ] エラー原因を10秒以内に特定可能
- [ ] 新規環境で30分以内に全システム復元可能

---

## Phase 6: 自律進化システム（AGI準拠）

### 目的
「鉄壁の構え」から「自己改善する有機体」へ

### 実装項目

#### 6.1 学習ループ実装
- **技術**: TensorFlow/PyTorch + MLOps
- **機能**:
  - INTENT_SCRIPT実行履歴からパターン学習
  - 成功/失敗の要因分析
  - 次回実行時の最適化提案

#### 6.2 メタ認知層
- **ファイル**: `mocka_metacognition.py`
- **機能**:
  - 「今何をしているか」のリアルタイム説明
  - 「なぜこの選択をしたか」の根拠記録
  - ユーザーへの能動的な提案

#### 6.3 外部脳ネットワーク拡張
- **統合対象**:
  - Perplexity API（検索強化）
  - Claude/GPT-4（推論強化）
  - Wolfram Alpha（計算強化）
- **成果物**: `external_brain_hub.py`

#### 6.4 完全自律実行モード
- **機能**:
  - ユーザーの目標設定のみで全Phase自動実行
  - 障害発生時の自動復旧
  - 週次・月次のパフォーマンスレポート自動生成feat: Phase 4-6 Roadmap - Output Channels, Diagnostic Dashboard, AGI Evolution

### 完了条件
- [ ] ユーザー指示なしで日次タスクを80%自動処理
- [ ] システム改善提案を週1回以上生成
- [ ] 「前頭前野」レベルの創造的問題解決を実証

---

## 実行計画

### タイムライン
- **Phase 4**: 3-5日（出力チャネル統合）
- **Phase 5**: 5-7日（診断・ダッシュボード）
- **Phase 6**: 10-14日（学習・自律化）

### 優先順位
1. **最優先**: Phase 4（創造的出力の即時実現）
2. **高優先**: Phase 5.1 + 5.2（可視化・診断）
3. **中優先**: Phase 5.3 + 5.4（再現性保証）
4. **長期**: Phase 6（AGI準拠機能）

### 次のアクション
```bash
# Phase 4開始準備
mkdir -p integrations/{canva,manus,felo}
touch integrations/canva/canva_integration.py
touch integrations/manus/manus_publisher.py
touch integrations/felo/felo_translator.py
```

---

## 成功指標

### 定量指標
- INTENT_SCRIPT実行成功率: 95%以上
- エラー復旧時間: 平均5分以内
- システム稼働率: 99.5%以上

### 定性指標
- 「特定のサイトにアクセスしたら全体が読み取れる」: ✅達成
- 「ミスなく再現性のある文章管理」: ✅達成
- 「前頭前野レベルの創造性」: Phase 6で達成目標

---

**作成日時**: 2025年
**ステータス**: Phase 1-3完了 / Phase 4-6計画策定完了
**次回更新**: Phase 4完了時
