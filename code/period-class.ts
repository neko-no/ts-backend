import { addDays, addHours, isAfter, isBefore, isEqual } from 'date-fns';

const isSameOrBefore = (date: Date, dateToCompare: Date): boolean =>
  isBefore(date, dateToCompare) || isEqual(date, dateToCompare);

const isSameOrAfter = (date: Date, dateToCompare: Date): boolean =>
  isAfter(date, dateToCompare) || isEqual(date, dateToCompare);

// 2.1.2: 状態を private に隠し（カプセル化）、メソッドで状態を書き換える版
class Period {
  constructor(
    private start: Date,
    private end: Date,
  ) {}

  // 指定した日時が期間に含まれるか
  contains(dateToCompare: Date): boolean {
    return (
      isSameOrBefore(this.start, dateToCompare) &&
      isSameOrAfter(this.end, dateToCompare)
    );
  }

  // this の状態を書き換える（戻り値は void）
  postpone(delayDays: number, delayHours: number): void {
    this.start = addHours(addDays(this.start, delayDays), delayHours);
    this.end = addHours(addDays(this.end, delayDays), delayHours);
  }

  // this の状態を書き換える（戻り値は void）
  extend(extensionDays: number, extensionHours: number): void {
    this.end = addHours(addDays(this.end, extensionDays), extensionHours);
  }

  get startDate(): Date {
    return this.start;
  }

  get endDate(): Date {
    return this.end;
  }

  // 開始日時と日数から Period を生成する
  static build(start: Date, periodDays: number): Period {
    const startDate = new Date(start);
    return new Period(startDate, addDays(startDate, periodDays));
  }
}

export { Period };
