// 4.2.5 の andThrough / andTee を動かして、挙動を確認する
import assert from 'node:assert';
import { err, ok, type Result } from 'neverthrow';

interface ParseError {
  kind: 'ParseError';
  message: string;
}

interface ValidationError {
  kind: 'ValidationError';
  message: string;
}

interface User {
  id: string;
  name: string;
}


const rOk: Result<User, ParseError> = ok({id: "user-1", name: 'Alice'});
const rErr: Result<User, ParseError> = err({kind: 'ParseError', message: 'parse error'});


const validateName = (user: User): Result<void, ValidationError> => 
  user.name === ''
    ? err({kind: 'ValidationError', message: 'name is empty'})
    : ok(undefined);

// 成功して、r1にはrOkの内容が入る
const r1 = rOk.andThrough(validateName);

// そもそも実行すらされずに、rErrの内容が入る
const r2 = rErr.andThrough(validateName);

// rOk と同じ Ok だが、name が空のため validateName が Err を返し、その ValidationError が結果になる
const rOkEmpty: Result<User, ParseError> = ok({ id: 'user-2', name: '' });
const r3 = rOkEmpty.andThrough(validateName);


// ---- andTee: 成功値は変えずに、ログ出力などの副作用を差し込む ----

// logInfo が何回呼ばれたかを数える（Err のとき呼ばれないことの確認用）
let logCalls = 0;
const logInfo = (message: string): void => {
  logCalls += 1;
  console.log(message);
};

// Ok のとき: 関数が実行され（ログが出力される）、結果は元の User のまま
const t1 = rOk.andTee((user) => {
  logInfo(`user=${user.id}`);
});
assert.deepStrictEqual(t1, rOk);
assert.strictEqual(logCalls, 1);

// Err のとき: 関数は実行されず、元の ParseError を引き継ぐ
const t2 = rErr.andTee((user) => {
  logInfo(`user=${user.id}`);
});
assert.deepStrictEqual(t2, rErr);
assert.strictEqual(logCalls, 1);

// 関数が例外を投げても、結果には反映されず、元の Ok のまま（andThrough との違い）
const t3 = rOk.andTee(() => {
  throw new Error('log failed');
});
assert.deepStrictEqual(t3, rOk);

// 関数の戻り値も結果に反映されない（Err を返しても、元の Ok のまま）
const t4 = rOk.andTee(() => validateName({ id: 'user-3', name: '' }));
assert.deepStrictEqual(t4, rOk);

// 比較: 同じ検証を andThrough に渡すと、Err が結果になる
const t5 = rOkEmpty.andThrough(validateName);
const t6 = rOkEmpty.andTee(validateName);
assert.ok(t5.isErr());
assert.ok(t6.isOk());
console.log('andThrough:', JSON.stringify(t5), '/ andTee:', JSON.stringify(t6));
