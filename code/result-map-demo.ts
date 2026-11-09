// 4.2 の Result.map を動かして、Ok のときだけ関数が適用されることを確認する
import assert from 'node:assert';
import { err, ok, type Result } from 'neverthrow';

// f が何回呼ばれたかを数える（Err のとき呼ばれないことの確認用）
let calls = 0;
const f = (n: number): string => {
  calls += 1;
  return `値は${n}`;
};

// r が Ok か Err かは、型の上では決まっていない（Result<number, string>）
const okResult: Result<number, string> = ok(3);
const errResult: Result<number, string> = err('x');

// Ok のとき: f が成功値に適用され、新しい Ok になる。成功値の型は number → string に変わる
const r1: Result<string, string> = okResult.map(f);
console.log('Ok.map(f)  :', r1.isOk() ? r1.value : r1.error, '/ f の呼び出し回数', calls);
assert.ok(r1.isOk() && r1.value === '値は3');
assert.strictEqual(calls, 1);

// Err のとき: f は呼ばれず、エラーはそのまま引き継がれる。エラー値の型 E は変わらない
const r2: Result<string, string> = errResult.map(f);
console.log('Err.map(f) :', r2.isOk() ? r2.value : r2.error, '/ f の呼び出し回数', calls);
assert.ok(r2.isErr() && r2.error === 'x');
assert.strictEqual(calls, 1);

// 元の Result は変更されない（map は新しい Result を返す）
assert.ok(okResult.isOk() && okResult.value === 3);
console.log('元の r は不変:', okResult.isOk() && okResult.value === 3);

// map はつなげられる。途中で Err になったら、以降の関数は呼ばれない
const double = (n: number): number => n * 2;
const chained = okResult.map(double).map(double).map(f);
assert.ok(chained.isOk() && chained.value === '値は12');
const chainedErr = errResult.map(double).map(double).map(f);
assert.ok(chainedErr.isErr() && chainedErr.error === 'x');
assert.strictEqual(calls, 2); // chained の f の1回だけ増えた
console.log('map の連結   :', chained.value, '/ Err 側は', chainedErr.error);
