---
name: multi-note-review
description: 学習ノート（notes/）と実践コード（code/）を、Claude・Codex CLI・Antigravity CLI (agy) の3者で独立にレビューし、生出力の保存と、根拠検証済みの匿名化統合レポート（reviews/）の作成までを行う。このリポジトリ専用。
argument-hint: notes/chXX.md
disable-model-invocation: true
---

# multi-note-review

対象: `$ARGUMENTS`（例: `notes/ch01.md`）

手順とコマンドの正本は **`CLAUDE.md` §2（Step 1〜6）**、守るべき規約の正本は **`AGENTS.md`** である。
重複による食い違いを避けるため、このファイルには手順を複製しない。**即興で手順を変えず、`CLAUDE.md` §2 をそのまま実行すること。**

## 実行前の確認（満たさなければ中止して報告）
1. `$ARGUMENTS` が空、または該当ファイルが存在しない場合は、実行せずに人間へ確認する。
2. `command -v codex agy` で両CLIが存在することを確認する。無いCLIがあれば、どれが無いかを報告し、レビュアーを減らして続行してよいかを人間に確認する（黙って省略しない）。
3. `git status --porcelain -- notes code` の出力が空であること。未コミットの変更（未追跡ファイルを含む）があれば、実行せずに中止し、コミットを促す（コミットは人間が判断する。Claude は頼まれたときだけ行う）。
4. 外部CLIにノートとコードの内容が送信される。これは本スキルの目的どおりだが、`notes/` や `code/` に秘密情報（APIキー等）が含まれていないかを、実行前に軽く確認する。

## 実行順序（`CLAUDE.md` §2 の対応）
| Step | 内容 | 要点 |
| --- | --- | --- |
| 1 | 文脈特定 | 対応コードは、ノート冒頭の記載があればそれを優先し、なければ `git diff --name-only main...HEAD -- code` の結果とする。どちらでも特定できなければ推測せず「対応不明」と報告する。`chXX` は `notes/` 配下のファイルのベース名（拡張子なし）とする |
| 2 | Claude一次レビューの先行保存 | **他AIの出力を読む前に** `reviews/raw/<run_id>/claude_raw.md` へ保存する。`run_id` と `mkdir` の手順は `CLAUDE.md` §2 Step 2。あわせて `head.txt`（実行時点のコミット）と `target_code.txt`（対応コードの一覧）も同じディレクトリに保存する |
| 3 | 外部CLIの並列実行 | `CLAUDE.md` §2 Step 3 のスクリプトを、1回のBash呼び出しで実行する |
| 4 | 安全監査 | 終了コード、非空、agy の `status` / `response` 非空 / `denied_actions` 空、実行前後スナップショットの `diff`。差分があれば統合を中止して報告する |
| 5 | 検証と証拠スコアリング | 行番号・コード断片の実在を `Read` / `Grep` で確認する。採点基準は未設定。点数を創作せず、「検証済み / 未検証 / 虚偽参照」の区分で記録する |
| 6 | 統合レポート | `reviews/summary/<chXX>_<run_id>.md` に、レビュアー名を匿名化（Reviewer A / B / C）して出力する |

## 厳守事項（`AGENTS.md` / `CLAUDE.md` の要約。詳細は正本を参照）
- `notes/` と `code/` を**変更しない**。書き込み先は `reviews/` 配下のみ。
- 監査で変更を検知しても、`git checkout` や `git restore` などで**勝手に巻き戻さない**。変更の事実を報告して人間に判断を委ねる。
- 外部CLIは `< /dev/null` で標準入力を遮断し、読み取り専用で起動する。`--dangerously-skip-permissions`、`--yolo`、`--dangerously-bypass-approvals-and-sandbox` は使わない。
- 一次情報（書籍・`book-v1.0.0`・公式ドキュメント・実行結果）の根拠が無い指摘は、「要確認」として扱い、正解扱いにしない。
- ネタバレ方針（`AGENTS.md` §5）に従う。参照元の実装や完成形のコードをそのまま提示しない。
- 参照元にあって本リポジトリに未実装のものを、「不足」として指摘しない。
- `mise run //ec-example:test` などが実行できない場合は、報告してスキップする。結果を捏造しない。
- 失敗したレビュアーは、統合レポートに「失敗」と明記する。

## 完了時の報告
- 生出力の保存先（`reviews/raw/<run_id>/`）と、統合レポートのパスを示す。
- 各レビュアーの成否、監査結果、スキップした検証を簡潔に列挙する。
- `reviews/ledger/findings.jsonl`（正誤判定台帳）は**人間が記入する**。Claudeは書き込まない。
