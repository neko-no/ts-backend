// 2.2.2 関数の定義: データ（Period 型）と振る舞い（関数）を分離した版
// 引数の順序は「データが先」（data-first）。まだパイプラインには載せられない形
import { addDays, addHours, isAfter, isBefore, isEqual } from 'date-fns';

// 振る舞いを持たない、データだけの型
interface Period {
  readonly start: Date;
  readonly end: Date;
}

// モジュール内だけで使うので export しない
const isSameOrAfter = (date: Date, dateToCompare: Date): boolean =>
  isAfter(date, dateToCompare) || isEqual(date, dateToCompare);

const isSameOrBefore = (date: Date, dateToCompare: Date): boolean =>
  isBefore(date, dateToCompare) || isEqual(date, dateToCompare);

const contains = (period: Period, dateToCompare: Date): boolean => {
  const { start, end } = period;
  return (
    isSameOrBefore(start, dateToCompare) && isSameOrAfter(end, dateToCompare)
  );
};

// 引数の period は変更せず、新しい Period を返す（純粋関数）
const postpone = (
  period: Period,
  delayDays: number,
  delayHours: number,
): Period => {
  const { start, end } = period;
  return {
    start: addHours(addDays(start, delayDays), delayHours),
    end: addHours(addDays(end, delayDays), delayHours),
  };
};

const extend = (
  period: Period,
  extensionDays: number,
  extensionHours: number,
): Period => {
  const { start, end } = period;
  return {
    start: new Date(start),
    end: addHours(addDays(end, extensionDays), extensionHours),
  };
};

export { extend, contains, postpone, type Period };
