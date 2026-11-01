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
レビューはコミット済みの内容に対して行う。次の順に確認する。

1. **未コミットの確認**: `git status --porcelain -- notes code` の出力が空であること（未追跡ファイルも含む）。出力があれば、実行せずに中止し、コミットを促す。コミットは人間が判断し、Claude は頼まれたときだけ行う。
2. **対象のノート**: `notes/chXX.md`。
3. **対応コード**（`code/` は章ごとに分けない）:
   - ノート冒頭に対応コードの記載があれば、それを優先する。
   - 記載がなければ、`git diff --name-only main...HEAD -- code` に出たファイルとする。
   - どちらでも特定できない場合、または別の章のコードが混ざっていそうな場合は、推測せず「対応不明」と報告して人間に確認する。

### Step 2: Claude一次レビューの先行保存
他AIの出力を見る前に、Claude単体でのレビューを `reviews/raw/<run_id>/claude_raw.md` に保存する。

`<run_id>` は実行開始時刻から `YYYYMMDD-HHMM`（例: `20261101-1530`）の形式で生成する（`date +%Y%m%d-%H%M`）。同一の実行内では、すべての成果物（`reviews/raw/` と `reviews/summary/`）で同じ `<run_id>` を使う。

出力先は、実行前に次のように作成する。末尾のディレクトリには `-p` を付けない。同じ `<run_id>` が既に存在する場合は失敗するため、上書きせずに中止し、1分以上待って再実行する。

```bash
RUN_ID=$(date +%Y%m%d-%H%M)
mkdir -p reviews/raw reviews/summary
mkdir "reviews/raw/$RUN_ID"
```

どの版をレビューしたかを再現できるよう、実行時点のコミットと、Step 1 で特定した対応コードの一覧を、同じディレクトリに保存する（`target_code.txt` は1行1ファイル。ノート冒頭の記載から特定した場合は、その一覧を書き出す）。

```bash
git rev-parse HEAD > "reviews/raw/$RUN_ID/head.txt"
git diff --name-only main...HEAD -- code > "reviews/raw/$RUN_ID/target_code.txt"
```

### Step 3: 外部CLIの非対話・読み取り専用実行
リポジトリ直下で、Bashツールの1回の呼び出しとして次を実行する（2つを並列起動し、両方の終了を待つ）。

- 子エージェントには AGENTS.md の保存先規定（`reviews/raw/` への書き出し）が見えるが、保存は司令塔（Claude）がリダイレクトで行う。そのため、プロンプトで「標準出力のみに出力し、ファイルは作らない」と明示する。
- Codex の出力はテキスト（Markdown）なので `.md`、agy の出力は JSON なので `.json` で保存する（`--json` は付けない）。
- agy はヘッドレスで許可を確認できず、リポジトリ外のファイルの `read_file` を自動拒否し、コマンド実行（`curl` など）も拒否するため Web を取得できない。書籍と外部資料はリポジトリ外にあるため、`--add-dir` で作業領域に追加する（`--dangerously-skip-permissions` は使わない）。Codex は `--sandbox read-only` のままリポジトリ外を読めるが、Web 検索も使えてしまう。3者を同じ条件にするため、プロンプトで「Web は使わず、渡したローカルのファイルだけを読む」と指示する。
- agy は、コマンドが拒否されると、そのターンで止まり、レビュー本文のない応答（`status` は `SUCCESS`、`denied_actions` あり）を返すことがある。`AGENTS.md` に git を使う記述があると、レビュアーが確認しようとして起こる（run_id `20261101-1448` で発生）。git による確認は司令塔の手順なので、プロンプトで「済ませている。コマンドは使わない」と伝える。

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
# 外部資料のローカルコピー（メモリ `book-local-location` から補う。リポジトリ外にある）
TSDOCS="<TypeScript 公式ドキュメントのクローンの絶対パス>"      # 本文は $TSDOCS/packages/documentation/copy/en
SURVIVAL="<サバイバルTypeScriptのクローンの絶対パス>"            # 本文は $SURVIVAL/docs

PROMPT="$(cat AGENTS.md)

対象: notes/chXX.md と、Step 1 で特定した対応コード（$RAW/target_code.txt に一覧がある。code/ 配下）
書籍の場所: $BOOK
（章ごとの抽出テキストは $BOOK/text/chNN.txt。読めなければ『読めない』と報告し、推測で補わないこと）
外部資料の場所（ローカル。Web は使わず、これらのファイルだけを読むこと）:
- TypeScript 公式ドキュメント: $TSDOCS/packages/documentation/copy/en
- サバイバルTypeScript: $SURVIVAL/docs
指示: 上記の規約に従って対象をレビューし、結果を標準出力のみに出力すること。ファイルの作成・変更は一切行わないこと（保存は呼び出し側が行う）。
注意: 未コミットの確認と、対応コードの特定は、呼び出し側が済ませている（未コミットの変更なし。対応コードは上記の一覧）。コマンドは実行できない環境があるため、git などのコマンドは使わず、ファイルの読み取りだけでレビューすること。"

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
  --add-dir "$TSDOCS" \
  --add-dir "$SURVIVAL" \
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
