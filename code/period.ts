// 2.2.4 コンパニオンオブジェクトによるモジュール設計
// 型と同じ名前の値（オブジェクト）を定義し、Period という 1 つの名前で公開する
import { addDays, addHours, isAfter, isBefore, isEqual } from 'date-fns/fp';
import * as R from 'remeda';

interface Period {
  readonly start: Date;
  readonly end: Date;
}

const isSameOrBefore =
  (dateToCompare: Date) =>
  (date: Date): boolean =>
    R.pipe(date, isBefore(dateToCompare)) ||
    R.pipe(date, isEqual(dateToCompare));

const isSameOrAfter =
  (dateToCompare: Date) =>
  (date: Date): boolean =>
    R.pipe(date, isAfter(dateToCompare)) ||
    R.pipe(date, isEqual(dateToCompare));

// 開始日時と日数から Period を生成するファクトリー関数
const build = (start: Date, periodDays: number): Period => ({
  start: new Date(start),
  end: R.pipe(new Date(start), addDays(periodDays)),
});

const contains =
  (dateToCompare: Date) =>
  (period: Period): boolean => {
    const { start, end } = period;
    return (
      R.pipe(start, isSameOrBefore(dateToCompare)) &&
      R.pipe(end, isSameOrAfter(dateToCompare))
    );
  };

const postpone =
  (delayDays: number, delayHours: number) =>
  (period: Period): Period => {
    const { start, end } = period;
    return {
      start: R.pipe(start, addDays(delayDays), addHours(delayHours)),
      end: R.pipe(end, addDays(delayDays), addHours(delayHours)),
    };
  };

const extend =
  (extensionDays: number, extensionHours: number) =>
  (period: Period): Period => {
    const { start, end } = period;
    return {
      start: new Date(start),
      end: R.pipe(end, addDays(extensionDays), addHours(extensionHours)),
    };
  };

// 型 Period と、値 Period（オブジェクト）が同じ名前で共存する
const Period = {
  build,
  contains,
  extend,
  postpone,
} as const;

export { Period };
