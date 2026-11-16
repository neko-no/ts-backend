// 5.3.3 独自関数による値のバリデーション: superRefine（複数プロパティにまたがるルール）
import { assert, describe, expect, it } from 'vitest';
import { z } from 'zod';

// 宿泊予約。チェックイン日はチェックアウト日より前でなければならない。
// 大部屋（dormitory）は 1 人からでよいが、個室（private）は 2 人以上の予約のみ受け付ける。
const reservationSchema = z
  .object({
    checkInDay: z.int().min(1).max(31),
    checkOutDay: z.int().min(1).max(31),
    roomType: z.enum(['dormitory', 'private']),
    guests: z.int().min(1),
  })
  .superRefine((data, ctx) => {
    // 1 つのコールバック内で、条件ごとに issue を追加できる
    if (data.checkInDay >= data.checkOutDay) {
      ctx.addIssue({
        code: 'custom',
        message: 'チェックアウトはチェックインより後にしてください',
        // どのプロパティのエラーかを path で指定する（省略すると path は []）
        path: ['checkOutDay'],
      });
    }
    if (data.roomType === 'private' && data.guests < 2) {
      ctx.addIssue({
        code: 'custom',
        message: '個室は 2 人以上から予約できます',
        path: ['guests'],
      });
    }
  });

const valid = {
  checkInDay: 10,
  checkOutDay: 12,
  roomType: 'private',
  guests: 2,
} as const;

describe('superRefine', () => {
  it('成功: すべてのルールを満たす', () => {
    const result = reservationSchema.safeParse(valid);
    assert(result.success);
    expect(result.data).toStrictEqual(valid);
  });

  it('エラー: 日付の前後関係（同じ日も不可）', () => {
    const result = reservationSchema.safeParse({ ...valid, checkOutDay: 10 });
    assert(!result.success);
    expect(result.error.issues).toStrictEqual([
      expect.objectContaining({
        code: 'custom',
        path: ['checkOutDay'],
        message: 'チェックアウトはチェックインより後にしてください',
      }),
    ]);
  });

  it('エラー: 個室を 1 人で予約', () => {
    const result = reservationSchema.safeParse({ ...valid, guests: 1 });
    assert(!result.success);
    expect(result.error.issues).toStrictEqual([
      expect.objectContaining({ code: 'custom', path: ['guests'] }),
    ]);
  });

  it('エラー: 2 つのルールに違反すると、issue が 2 件追加される', () => {
    const result = reservationSchema.safeParse({
      ...valid,
      checkOutDay: 5,
      guests: 1,
    });
    assert(!result.success);
    expect(result.error.issues.map((i) => i.path)).toStrictEqual([
      ['checkOutDay'],
      ['guests'],
    ]);
  });

  it('大部屋なら 1 人でも成功する', () => {
    const result = reservationSchema.safeParse({
      ...valid,
      roomType: 'dormitory',
      guests: 1,
    });
    assert(result.success);
  });
});

describe('superRefine が実行される条件', () => {
  it('型の検証に失敗したプロパティがあると、superRefine は実行されない', () => {
    // checkOutDay が文字列 → invalid_type のみ。日付の前後関係や個室の人数は検証されない
    const result = reservationSchema.safeParse({
      ...valid,
      checkOutDay: 'x',
      guests: 1,
    });
    assert(!result.success);
    console.log(
      'issues:',
      result.error.issues.map((i) => ({ code: i.code, path: i.path })),
    );
    expect(result.error.issues.every((i) => i.code !== 'custom')).toBe(true);
  });
});
