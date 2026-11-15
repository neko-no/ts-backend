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
