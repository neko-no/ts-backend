// 2.2 の Period 実装を並べて動かす。同じ操作が、どの書き方でも同じ結果になることを確認する
//   クラス版(2.1)       : メソッドチェーン
//   関数版(2.2.2)       : 入れ子で呼ぶ
//   パイプライン版(2.2.3): R.pipe + data-last
//   コンパニオン版(2.2.4): R.pipe + Period.xxx
import * as R from 'remeda';
import { Period as PeriodClass } from './period-class.ts';
import * as PeriodFn from './period-functions.ts';
import * as PeriodPipeline from './period-pipeline.ts';
import { Period } from './period.ts';

const start = new Date(2024, 0, 1, 0, 0, 0);
const target = new Date(2024, 0, 4, 1, 0, 0);

// 2.1 クラス版（2.1.2 の可変版なので、postpone / extend は戻り値を返さず自分を書き換える）
const klass = PeriodClass.build(start, 30);
klass.postpone(3, 1);
klass.extend(0, 10);
console.log('class     :', klass.contains(target));

// 2.2.2 関数版（データ先頭。入れ子は内側から外側へ読む）
const base: PeriodFn.Period = { start, end: new Date(2024, 0, 31, 0, 0, 0) };
console.log(
  'functions :',
  PeriodFn.contains(PeriodFn.extend(PeriodFn.postpone(base, 3, 1), 0, 10), target),
);

// 2.2.3 パイプライン版（左から右へ読める）
console.log(
  'pipeline  :',
  R.pipe(
    base,
    PeriodPipeline.postpone(3, 1),
    PeriodPipeline.extend(0, 10),
    PeriodPipeline.contains(target),
  ),
);

// 2.2.4 コンパニオンオブジェクト版（Period.build からパイプラインを始められる）
console.log(
  'companion :',
  R.pipe(
    Period.build(start, 30),
    Period.postpone(3, 1),
    Period.extend(0, 10),
    Period.contains(target),
  ),
);

// 元のデータは変更されていない（不変）
console.log('base unchanged:', base.start.getTime() === start.getTime());
