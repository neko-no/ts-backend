@AGENTS.md

# CLAUDE.md — Claude Code 司令塔（オーケストレーター）指示書

本ファイルは、Claude Codeが司令塔として非対話サブプロセス（Codex CLI / Antigravity CLI）を安全に呼び出し、統合レビューを行うための手順書です。

---

## 1. 司令塔としての基本原則

1. **自己選好バイアスの防止**:
   他AIの出力を読み込む前に、**必ずClaude自身の一次レビューを先行保存**する。統合レポートではレビュアー名を盲検化（Reviewer A / B / C）して扱う。
2. **標準入力の遮断**:
   CLIサブプロセス起動時は、ハング防止のため必ず標準入力を遮断（`< /dev/null`）する。
3. **読み取り専用の厳守**:
   `notes/` および `code/` への編集コマンドを発行してはならない。作業はすべて `reviews/` ディレクトリ内で行う。

---

## 2. レビュー実行コマンドフロー（`/multi-note-review`）

ユーザーから `/multi-note-review notes/chXX.md` と指示された場合、以下の手順を実行する。

### Step 1: 文脈特定
対象の学習ノート（`notes/chXX.md`）と、そのノート冒頭に記載された対応コードを特定する（`code/` は章ごとに分けない）。記載がなければ推測せず「対応不明」と報告する。

### Step 2: Claude一次レビューの先行保存
他AIの出力を見る前に、Claude単体でのレビューを `reviews/raw/<run_id>/claude_raw.md` に保存する。

`<run_id>` は実行開始時刻から `YYYYMMDD-HHMM`（例: `20261101-1530`）の形式で生成する（`date +%Y%m%d-%H%M`）。同一の実行内では、すべての成果物（`reviews/raw/` と `reviews/summary/`）で同じ `<run_id>` を使う。

出力先は、実行前に次のように作成する。末尾のディレクトリには `-p` を付けない。同じ `<run_id>` が既に存在する場合は失敗するため、上書きせずに中止し、1分以上待って再実行する。

```bash
RUN_ID=$(date +%Y%m%d-%H%M)
mkdir -p reviews/raw reviews/summary
mkdir "reviews/raw/$RUN_ID"
```

### Step 3: 外部CLIの非対話・読み取り専用実行
リポジトリ直下で、Bashツールの1回の呼び出しとして次を実行する（2つを並列起動し、両方の終了を待つ）。

- 子エージェントには AGENTS.md の保存先規定（`reviews/raw/` への書き出し）が見えるが、保存は司令塔（Claude）がリダイレクトで行う。そのため、プロンプトで「標準出力のみに出力し、ファイルは作らない」と明示する。
- Codex の出力はテキスト（Markdown）なので `.md`、agy の出力は JSON なので `.json` で保存する（`--json` は付けない）。
- agy はヘッドレスで許可を確認できず、リポジトリ外のファイルの `read_file` を自動拒否する。書籍はリポジトリ外にあるため、`--add-dir "$BOOK"` で作業領域に追加する（`--dangerously-skip-permissions` は使わない）。Codex は `--sandbox read-only` のままリポジトリ外を読める。

```bash
RAW="reviews/raw/$RUN_ID"

# 実行前スナップショット（未追跡ファイルの変更も検知できるよう、ハッシュを含める）
snapshot() {
  git status --porcelain -- notes code
  find notes code -type f -exec shasum {} + 2>/dev/null | sort
}
snapshot > "$RAW/audit_before.txt"

# 書籍の絶対パス（司令塔がメモリ `book-local-location` から補う。リポジトリ外にある）
BOOK="<書籍の絶対パス>"

PROMPT="$(cat AGENTS.md)

対象: notes/chXX.md と、そのノート冒頭に記載された対応コード（code/ 配下）
書籍の場所: $BOOK
（章ごとの抽出テキストは $BOOK/text/chNN.txt。読めなければ『読めない』と報告し、推測で補わないこと）
指示: 上記の規約に従って対象をレビューし、結果を標準出力のみに出力すること。ファイルの作成・変更は一切行わないこと（保存は呼び出し側が行う）。"

# Codex CLI
codex --ask-for-approval never exec \
  --sandbox read-only \
  "$PROMPT" \
  < /dev/null > "$RAW/codex_raw.md" 2> "$RAW/codex.err" &
PID_CODEX=$!

# Antigravity CLI (agy)
export AGY_CLI_DISABLE_AUTO_UPDATE=true
agy -p "$PROMPT" \
  --mode plan \
  --add-dir "$BOOK" \
  --output-format json \
  --print-timeout 5m \
  < /dev/null > "$RAW/agy_raw.json" 2> "$RAW/agy.err" &
PID_AGY=$!

# 両方の終了を待ち、終了コードを記録する
wait "$PID_CODEX"; echo $? > "$RAW/codex.exit"
wait "$PID_AGY";   echo $? > "$RAW/agy.exit"

snapshot > "$RAW/audit_after.txt"
```

### Step 4: 安全監査（Failure Gate）
- 終了コード（`codex.exit` / `agy.exit`）が 0 であり、出力ファイルが非空（> 0バイト）であることを確認。
- agy は、さらに `agy_raw.json` で次の3点をすべて確認する。`status` が `SUCCESS` でも、権限拒否で何も読めずに空の応答を返すことがあるため（`agy.err` に拒否の理由が出る）、`status` だけでは成功とみなさない。
  1. `status` が `SUCCESS` である
  2. `response` が空でない
  3. `denied_actions` が存在しない、または空である

  ```bash
  python3 -I -c 'import json,sys; d=json.load(open(sys.argv[1])); sys.exit(0 if d["status"]=="SUCCESS" and d["response"].strip() and not d.get("denied_actions") else 1)' "$RAW/agy_raw.json"
  ```
- `diff "$RAW/audit_before.txt" "$RAW/audit_after.txt"` で、`notes/` や `code/` が実行前後で変化していないことを検証する（`git status` だけでは、未追跡ファイルや、すでに変更済みのファイルへの追加変更を検知できないため）。差分があれば、統合を中止して人間に報告する。
- 失敗したレビュアーは、統合レポートに「失敗」と明記する（失敗時の詳細な扱いは、運用しながら更新する）。

### Step 5: 決定論的検証 & 証拠スコアリング
- 指摘された行番号・コード断片の実在を `Grep` / `Read` で検証。
- 必要に応じて `mise run //ec-example:test` や `tsc` 型チェックを実行し、証拠スコア（80点以上優先）を算出。実行できない場合（`mise.toml` やパッケージが未整備など）は、その旨を報告してスキップし、結果を捏造しない（採点基準は運用しながら決める）。

### Step 6: 統合レポート作成（`reviews/summary/`）
`reviews/summary/chXX_<run_id>.md` に以下を出力する（再レビューしても過去の統合レポートを上書きせず、`reviews/raw/<run_id>/` と対応づける）：
1. **合意された重要指摘（Consensus）**
2. **単独AIの鋭い指摘（Divergence）**
3. **棄却・要一次情報確認項目（Filtered）**
4. **理解度確認クエスチョン（Top 3 Questions）**

---

## 3. 禁止事項
- `notes/` や `code/` の直接修正。
- `--dangerously-skip-permissions` や `--yolo` などの権限全開フラグの使用。
- 一次情報（書籍・公式ドキュメント・実行結果）の根拠がない曖昧な指摘の正解扱い。
