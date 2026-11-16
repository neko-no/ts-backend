// 5.3.2 値のバリデーション（数値）: z.int() / min / max / 複数エラーの収集
import { assert, describe, expect, it } from 'vitest';
import { z } from 'zod';

const orderLineSchema = z.object({
  // 1 以上 99 以下の整数
  quantity: z.int().min(1).max(99),
  // 0 以上 50 以下の数値（小数を許す割引率[%]）
  discountPercent: z.number().min(0).max(50),
});

describe('safeParse: 境界値', () => {
  it.each([
    { quantity: 1, discountPercent: 0 }, // 下限ちょうど
    { quantity: 99, discountPercent: 50 }, // 上限ちょうど
    { quantity: 10, discountPercent: 12.5 }, // discountPercent は小数でもよい
  ])('quantity=$quantity, discountPercent=$discountPercent は成功', (input) => {
    const result = orderLineSchema.safeParse(input);
    assert(result.success);
    expect(result.data).toStrictEqual(input);
  });
});

describe('safeParse: quantity のエラー', () => {
  it.each([
    { quantity: 0, expectedCode: 'too_small' }, // 下限の1つ下
    { quantity: 100, expectedCode: 'too_big' }, // 上限の1つ上
    { quantity: 2.5, expectedCode: 'invalid_type' }, // 整数ではない
  ])('quantity=$quantity の場合 $expectedCode', ({ quantity, expectedCode }) => {
    const result = orderLineSchema.safeParse({ quantity, discountPercent: 0 });
    assert(!result.success);
    expect(result.error.issues).toStrictEqual([
      expect.objectContaining({ code: expectedCode, path: ['quantity'] }),
    ]);
  });

  it('too_small の issue には下限 minimum が入る', () => {
    const result = orderLineSchema.safeParse({ quantity: 0, discountPercent: 0 });
    assert(!result.success);
    const [issue] = result.error.issues;
    assert(issue?.code === 'too_small');
    console.log('too_small:', issue);
    expect(issue.minimum).toBe(1);
  });
});

describe('safeParse: discountPercent のエラー', () => {
  it.each([
    { discountPercent: -0.1, expectedCode: 'too_small' },
    { discountPercent: 50.1, expectedCode: 'too_big' },
  ])(
    'discountPercent=$discountPercent の場合 $expectedCode',
    ({ discountPercent, expectedCode }) => {
      const result = orderLineSchema.safeParse({ quantity: 1, discountPercent });
      assert(!result.success);
      expect(result.error.issues).toStrictEqual([
        expect.objectContaining({
          code: expectedCode,
          path: ['discountPercent'],
        }),
      ]);
    },
  );
});

describe('safeParse: 複数のプロパティが不正なとき', () => {
  it('エラーは1件で止まらず、すべて issues に集まる', () => {
    const result = orderLineSchema.safeParse({
      quantity: 0,
      discountPercent: 80,
    });
    assert(!result.success);
    console.log(
      'issues:',
      result.error.issues.map((i) => ({ code: i.code, path: i.path })),
    );
    expect(result.error.issues).toHaveLength(2);
  });
});
