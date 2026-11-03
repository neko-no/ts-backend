// 2.2.3 パイプライン適合のための関数設計: pipe・カリー化・data-last の基礎
import * as R from 'remeda';

// 1. R.pipe: 前の関数の戻り値が、次の関数の引数になる
const sum = (arr: Array<number>): number => arr.reduce((a, b) => a + b, 0);
const toString = (x: number): string => x.toString();

const result = R.pipe([1, 2, 3, 4], sum, toString);
console.log(result, typeof result); // '10' string

// 2. カリー化: 多引数関数を 1 引数関数の連鎖にする
const add = (a: number, b: number, c: number): number => a + b + c;
const curriedAdd =
  (a: number) =>
  (b: number) =>
  (c: number): number =>
    a + b + c;

console.log(add(1, 2, 3), curriedAdd(1)(2)(3));

// 部分適用: 一部の引数だけ与えると、残りを受け取る関数が返る
const add1 = curriedAdd(1);
const add1and2 = add1(2);
console.log(add1and2(3));

// 3. data-last: 操作対象のデータを最後の引数にすると、pipe に載せられる
interface Period {
  readonly start: Date;
  readonly end: Date;
}

const isSameOrBefore = (date: Date, dateToCompare: Date): boolean =>
  date.getTime() <= dateToCompare.getTime();
const isSameOrAfter = (date: Date, dateToCompare: Date): boolean =>
  date.getTime() >= dateToCompare.getTime();

const contains =
  (dateToCompare: Date) =>
  (period: Period): boolean =>
    isSameOrBefore(period.start, dateToCompare) &&
    isSameOrAfter(period.end, dateToCompare);

const period: Period = {
  start: new Date(2024, 0, 1, 0, 0, 0),
  end: new Date(2024, 1, 1, 0, 0, 0),
};

// contains(日付) を部分適用すると、Period => boolean の関数になる
const containsJan4 = contains(new Date(2024, 0, 4, 1, 0, 0));
console.log(R.pipe(period, containsJan4)); // true
