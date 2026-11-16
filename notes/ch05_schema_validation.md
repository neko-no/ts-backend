スキーマを用いたバリデーション処理

読了範囲: 5.1 〜 5.4（第5章すべて）
対応コード:
- `code/zod-basic.test.ts`（5.3.1 `parse` / `safeParse` / `error.issues`）
- `code/zod-value.test.ts`（5.3.2 数値の `min` / `max` / `z.int()`、複数エラーの収集）
- `code/zod-super-refine.test.ts`（5.3.3 `superRefine`）
- `code/zod-infer.test.ts`（5.4 `z.input` / `z.output` / `z.infer`、`transform` / `default` / `brand`）
- 確認コードが無い範囲: 5.1、5.2、5.3.3 の `refine`、5.3.4（通知メッセージの設定）

Zodによるバリデーション

- 定義したスキーマから型を推論できる
- 型のバリデーションには、parseメソッドを用いる
  - parse  エラーの場合は、例外
  - safeParse  バリデーションの可否を成否として返却



独自関数によるバリデーション

- refine　単一の要素に対して、任意の検査を実行する
- superRefine 複数の要素に対して、任意の検査を実行する



エラーメッセージの設定方法

- スキーマ定義中に、文言の指定ができる
- 内容に応じて生成したい場合は、errorプロパティに対して、コールバック関数を設定する



スキーマから型推論

- z.inferによって抽出できる。ただし、書籍では、z.output,z.inputを利用して、入力と出力型を明示的に取得するようにしている。



&nbsp;

&nbsp;