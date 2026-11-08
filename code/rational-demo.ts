// 3.3 の Rational（関数版）を動かして、不変条件が守られることを確認する
import assert from 'node:assert';
import { Rational } from './rational.ts';

// export は `export { Rational }` の1行。型としても値としても使えることを、型注釈で確認する
const half: Rational = Rational.build(2, 4);
console.log('約分 2/4      :', half);
assert.deepStrictEqual(half, { reducedNumerator: 1, reducedDenominator: 2 });

// 通分して足す: 1/2 + 1/3 = 5/6
const sum = Rational.add(Rational.build(1, 2), Rational.build(1, 3));
console.log('加算 1/2+1/3  :', sum);
assert.deepStrictEqual(sum, { reducedNumerator: 5, reducedDenominator: 6 });

// 足した結果も約分済み: 1/2 + 1/2 = 1/1
const one = Rational.add(Rational.build(1, 2), Rational.build(1, 2));
console.log('加算 1/2+1/2  :', one);
assert.deepStrictEqual(one, { reducedNumerator: 1, reducedDenominator: 1 });

// 不変条件違反は assert で例外になる（3.3 の「契約」）
assert.throws(() => Rational.build(1, 0), /分母は0以外/);
assert.throws(() => Rational.build(1.5, 2), /分子は整数/);
assert.throws(() => Rational.build(1, 2.5), /分母は整数/);
console.log('不変条件違反  : 3件とも例外になった');

// 入力を変更しない（不変）
const a = Rational.build(1, 2);
Rational.add(a, Rational.build(1, 3));
assert.deepStrictEqual(a, { reducedNumerator: 1, reducedDenominator: 2 });
console.log('入力は不変    : true');

// 境界値の観察（正誤の判断はしない。結果をそのまま表示する）
const probe = (n: number, d: number) => {
  try {
    const r = Rational.build(n, d);
    console.log(
      `build(${n}, ${d})`.padEnd(14),
      r,
      Object.is(r.reducedNumerator, -0) ? '← 分子が -0' : '',
    );
  } catch (e) {
    console.log(`build(${n}, ${d})`.padEnd(14), '例外:', (e as Error).message);
  }
};
probe(0, 5);
probe(-4, 6);
probe(4, -6);
probe(0, -3);
probe(6, 3);
