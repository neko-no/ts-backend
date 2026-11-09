// 3.3 不変条件を、関数（クラスなし）で維持する Rational（有理数）
// 生成関数 build が不変条件を確認し、add も build を通して新しい Rational を作る
import assert from 'node:assert';

// 振る舞いを持たない、データだけの型（約分済みの分子と分母）
interface Rational {
  readonly reducedNumerator: number;
  readonly reducedDenominator: number;
}

// ユークリッドの互除法で最大公約数を求める。モジュール内だけで使うので export しない
const calculateGcd = (a: number, b: number): number =>
  b === 0 ? a : calculateGcd(b, a % b);

// build 関数内で、不変条件を確認している
const build = (numerator: number, denominator: number): Rational => {
  assert(denominator !== 0, '分母は0以外になるようにしてください');
  assert(Number.isInteger(numerator), '分子は整数になるようにしてください');
  assert(Number.isInteger(denominator), '分母は整数になるようにしてください');
  const gcd = calculateGcd(numerator, denominator);
  return {
    reducedNumerator: numerator / gcd,
    reducedDenominator: denominator / gcd,
  };
};

// add 関数でも、build 関数を利用して不変条件を確認している
const add = (a: Rational, b: Rational): Rational =>
  build(
    a.reducedNumerator * b.reducedDenominator +
      b.reducedNumerator * a.reducedDenominator,
    a.reducedDenominator * b.reducedDenominator,
  );

// 型 Rational と値 Rational を同じ名前で export する（コンパニオンオブジェクト）
const Rational = {
  build,
  add,
};

export { Rational };
