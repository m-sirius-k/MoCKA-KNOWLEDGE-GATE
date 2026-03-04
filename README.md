# MoCKA Knowledge Gate

MoCKA Knowledge Gate is the institutional memory layer of the MoCKA Ecosystem.
It preserves reasoning traces, hypothesis evolution, and governance artifacts as structured, reproducible evidence.

This repository is not a documentation store.
It is a canonical trace registry.

## Architecture Overview

Knowledge Gate operates between execution (MoCKA) and transparency layers.
It ensures that state transitions and reasoning artifacts remain durable and verifiable.

![MoCKA Architecture Overview](docs/architecture/mocka_architecture_overview.png)

## Security Model

Threat assumptions:

- Historical rewrite (retroactive alteration of records)
- Selective memory deletion
- Drift between public proof and internal state
- Loss of hypothesis evolution trail

Controls:

- Deterministic indexing of artifacts
- Hash chaining for structural continuity
- Separation between canonical state and export state
- Cryptographic signing for governance artifacts

The Knowledge Gate does not modify history.
It anchors it.

## Repository Responsibility

This repository focuses on:

- Structured storage of reasoning traces
- Indexing of phase artifacts
- Maintaining cross-reference integrity
- Enabling reproducible historical inspection

## Relationship to Ecosystem

- MoCKA: produces deterministic artifacts
- Transparency: publishes verifiable extracts
- Civilization: defines governance doctrine
- External Brain: connects auxiliary knowledge sources

---

# MoCKA Knowledge Gate（日本語）

MoCKA Knowledge Gate は、MoCKA エコシステムの制度的記憶層です。
推論痕跡・仮説進化・統治成果物を、再現可能な証拠として構造保存します。

これは単なるドキュメント保存庫ではありません。
「正本痕跡レジストリ」です。

## Architecture Overview（全体図）

Knowledge Gate は実行層（MoCKA）と透明性層の間に位置します。
状態遷移と推論成果物を、耐久かつ検証可能な形で保持します。

![MoCKA Architecture Overview](docs/architecture/mocka_architecture_overview.png)

## Security Model（脅威と対策）

想定脅威：

- 履歴の書き換え
- 選択的な記録削除
- 公開証拠と内部状態の乖離
- 仮説進化履歴の喪失

対策：

- 成果物の決定的インデックス化
- ハッシュ連鎖による構造的連続性維持
- 正本状態と公開状態の分離
- 統治成果物への暗号署名

Knowledge Gate は履歴を書き換えません。
履歴を固定します。

## 本リポジトリの責務

- 推論痕跡の構造保存
- フェーズ成果物の索引管理
- 参照整合性の維持
- 再現可能な歴史検証の実現

## エコシステム関係

- MoCKA：決定成果物を生成
- Transparency：公開検証を実施
- Civilization：統治定義を策定
- External Brain：補助知識接続
