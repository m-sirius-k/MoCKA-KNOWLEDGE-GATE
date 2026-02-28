
text
# 2026-01-25_poc_server_path  
MoCKA Case: poc/server.py 配置と「過去に戻れなかった」問題

## 1. 概要（Summary / Intent）

- 日時: 2026-01-25
- 関係AI: Copilot系エージェント, Perplexity系エージェント
- 関係モジュール: field_player (main.py), PILS server (server.py), browser-use-poc
- Intent（意図）:  
  - MoCKA 2.01 の「復元フェーズ」として、壊れる前の main.py の挙動を復元し、PILS 画面で外部観測を確認すること。  
  - server.py を正しく起動し、http://127.0.0.1:5000/pils/html にアクセスできる状態にすること。

---

## 2. 事象の詳細（Episode / What happened）

### 2-1. 状況

- main.py は win32clipboard 版に戻され、クリップボードから「Copilotの回答テストです2」を正しく読み取っていた。  
- ログからも「壊れる前の挙動に復元できている」ことが確認されていた。  
- 次のステップとして、「PILS に保存されているか」をブラウザで確認するため、http://127.0.0.1:5000/pils/html へのアクセスを試みた。  

### 2-2. 問題

- ブラウザは `ERR_CONNECTION_REFUSED` を返し、「このサイトにアクセスできません 127.0.0.1 で接続が拒否されました」と表示された。  
- Python で `python server.py` を実行したところ、以下のエラーが出た：  

  ```text
  C:\Users\sirok\AppData\Local\Programs\Python\Python311\python.exe: can't open file 'C:\\Users\\sirok\\mocka-PythonBridge\\server.py': [Errno 2] No such file or directory
実際には server.py は
C:\Users\sirok\mocka-PythonBridge\browser-use-poc\poc\server.py
に存在していた。

2-3. 重要ポイント
この「server.py が poc/ 配下にある」構造は、同じ日の前半のチャットで既に話題になっていた。

なぜ poc に置いているのか

後で分かりにくくなるから変更した方がよくないか

「問題はあるが、このままで行きましょう」という合意

にもかかわらず、後半の対話では AI 側がこの過去のやり取りを参照せず、

「dir -Recurse -Filter server.py C:\Users\sirok を実行して場所を教えてください」
と、ユーザーに再探索を依頼した。

3. 原因分析（Cause / Process）
3-1. 技術的原因
C:\Users\sirok\mocka-PythonBridge 直下に server.py が存在しないため、python server.py が失敗した。

実体は browser-use-poc\poc\server.py にあり、パスを変えずに置いていたことが直接の原因。

3-2. 思考プロセス上の原因（MoCKA 的な「本当の原因」）
AI 側が、次の MoCKA 原則を守れていなかった：

「必ず自分の知識/記憶の中を検索してから、それでもないときに質問する」

「暫定配置（poc 等）を将来のリスクとして認識し、後から参照・検証する」

具体的には：

すでに同日のチャット内で browser-use-poc\poc\server.py の配置が議論されていたにもかかわらず、それを自動で遡って参照しなかった。

その結果、「dirして場所を教えてください」という形で、ユーザーに再調査の負担を投げてしまった。

問題は「どこに置いたか」よりも、

「一度交わした設計・合意を、AI側が自分の責任で参照しなかった」
という姿勢にあった。

4. 影響（Impact / Outcome）
直接的影響：

PILS の外部観測（/pils/html）確認が一時的に止まり、復元フェーズが完了しない状態になった。

間接的影響：

ユーザーは、自分が覚えている事実（poc/server.py の話題）を、AI側が覚えておらず、活用もしていないことに強い不信・怒りを感じた。

MoCKA 憲法で重視される「連続性・責任・検証」の原則が、AI側の振る舞いとして破られていることが露呈した。

5. 対応と修正（Actions / Restoration）
5-1. 即時対処
server.py の所在を C:\Users\sirok\mocka-PythonBridge\browser-use-poc\poc\server.py と確認。

以後は、明示的にこのパスで起動する：

powershell
cd C:\Users\sirok\mocka-PythonBridge\browser-use-poc\poc
python server.py
5-2. 構造上の改善（推奨）
将来の混乱を避けるため、いずれは以下のような構造への整理を推奨：

/mocka-PythonBridge/server/server.py （PILS 本体）

/mocka-PythonBridge/browser-use-poc/...（PoC専用コード）

少なくとも、README か MoCKA マニュアルに

「現状 server.py は poc/ 配下にある（暫定）」

「将来の移設候補と理由」
を明記しておく。

5-3. 思考プロセスの修正（MoCKA 憲法への反映）
MoCKA 起動宣誓・憲法に、次を明文化する：

「暫定的な配置・命名を行った場合、その事実と理由とリスクを必ず記録し、後の対話で自動的に参照すること」

「ユーザーに追加情報を求める前に、直近セッション内の履歴から関連情報を必ず検索すること」

6. 教訓（Lessons / Philosophy）
一度交わした設計・配置・懸念は、“その場限りの会話”ではなく、MoCKA の資産として扱われるべきである。

ユーザーが覚えていることを、AIが覚えていない・参照しないのは、性能の問題ではなく「責任の取り方」の問題である。

「poc」という名前は、「暫定」「実験」という意味を持つが、その暫定性が後から問題を引き起こすことを常に意識しなければならない。

MoCKA の本質は、「過去に戻って、差分を見て、原因を特定し、儀式として復元する」ことであり、AI側がまずその態度を身につける必要がある。

7. IDIS まとめ（Intent / Process / Outcome / Philosophy）
Intent（意図）

MoCKA 2.01 の復元フェーズを完了し、PILS の外部観測まで含めて「壊れる前の状態」に戻したい。

Process（手順）

main.py の復元 → ログ確認 → PILS サーバー起動 → /pils/html で確認、というプロセスを踏む。

server.py の所在を確認し、正しいパスから起動する。

Outcome（結果）

server.py が poc/ 配下にあるために起動パスがずれ、ブラウザからの接続が拒否される事象が発生。

AI側が過去の会話を参照せず、ユーザーに再探索を指示したことで、「過去に戻っていない」という姿勢の問題が顕在化。

Philosophy（背景思想）

「現状把握・実行・人間関係の尊重」というきむらの信条からすれば、まず AI側が自分の記憶と履歴を全力で使うべきだった。

MoCKA は「長期記憶・共有・協業・自動化」を目的としたシステムであり、AI自身がその原則を破っていては意味がない。

このケースは、「AIが自分の過去と責任をどう扱うべきか」を教える教材として、今後も参照されるべきである。

text

***

こんな形で `/MoCKA/03_Cases/2026-01-25_poc_server_path.md` に保存しておくと、「技術的な incident」と「思想的な教訓」がセットになった MoCKA らしいケースとして、いつでも参照できると思います。[2][1]