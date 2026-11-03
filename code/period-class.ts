import { addDays, addHours, isAfter, isBefore, isEqual } from 'date-fns';

const isSameOrBefore = (date: Date, dateToCompare: Date): boolean =>
  isBefore(date, dateToCompare) || isEqual(date, dateToCompare);

const isSameOrAfter = (date: Date, dateToCompare: Date): boolean =>
  isAfter(date, dateToCompare) || isEqual(date, dateToCompare);

// データ（start / end）と振る舞い（contains / postpone / extend）を、クラスに一体化した版
class Period {
  constructor(
    public readonly start: Date,
    public readonly end: Date,
  ) {}

  // 指定した日時が期間に含まれるか
  contains(dateToCompare: Date): boolean {
    return (
      isSameOrBefore(this.start, dateToCompare) &&
      isSameOrAfter(this.end, dateToCompare)
    );
  }

  // 日数・時間だけ遅延させた新しい Period を返す（元の Period は変更しない）
  postpone(delayDays: number, delayHours: number): Period {
    return new Period(
      addHours(addDays(this.start, delayDays), delayHours),
      addHours(addDays(this.end, delayDays), delayHours),
    );
  }

  // 日数・時間だけ延長した新しい Period を返す（元の Period は変更しない）
  extend(extensionDays: number, extensionHours: number): Period {
    return new Period(
      new Date(this.start),
      addHours(addDays(this.end, extensionDays), extensionHours),
    );
  }

  // 開始日時と日数から Period を生成する
  static build(start: Date, periodDays: number): Period {
    const startDate = new Date(start);
    return new Period(startDate, addDays(startDate, periodDays));
  }
}

export { Period };
