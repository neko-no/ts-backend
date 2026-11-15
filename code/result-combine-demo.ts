// 4.4 の Result.combine を動かして、挙動を確認する
import assert from 'node:assert';
import { err, ok, Result } from 'neverthrow';
import { SomethingError } from './something-error.ts';


// 成功値がそのまま配列として格納
const results1 = [ok(1), ok(2)];
const r1 = Result.combine(results1);

// 成功値は切り捨てられ、Err内容だけが返される
const results2 = [ok(1), err(SomethingError.create('err!')),ok(2)];
const r2 = Result.combine(results2);


// ---- タプル: 要素ごとに型が違う Result をまとめる ----

// すべて Ok: 成功値がタプルにまとまる（Result<[number, boolean], never>）
const tupleOk: [Result<number, never>, Result<boolean, never>] = [
  ok(10),
  ok(true),
];
const t1 = Result.combine(tupleOk);
assert.ok(t1.isOk());
assert.deepStrictEqual(t1.value, [10, true]);

// Err を含む: 入力順で最初の Err が結果になる。
// エラー型は、各要素のエラー型のユニオン（Result<[number, boolean], SomethingError | string>）
const tupleErr: [Result<number, SomethingError>, Result<boolean, string>] = [
  err(SomethingError.create('first')),
  err('second'),
];
const t2 = Result.combine(tupleErr);
assert.ok(t2.isErr());
assert.deepStrictEqual(t2.error, SomethingError.create('first'));

// 先頭が Ok でも、後ろに Err があればその Err が結果になる（型は t2 と同じ）
const tupleErrSecond: [Result<number, SomethingError>, Result<boolean, string>] = [
  ok(10),
  err('second'),
];
const t3 = Result.combine(tupleErrSecond);
assert.ok(t3.isErr());
assert.strictEqual(t3.error, 'second');

console.log('t1:', JSON.stringify(t1), '/ t2:', JSON.stringify(t2), '/ t3:', JSON.stringify(t3));
