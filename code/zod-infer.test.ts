// 5.4 スキーマからの型推論: z.input / z.output / z.infer
// 型の確認は expectTypeOf で行う（`tsc --noEmit` で検証される。実行時には何も起きない）
import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';

describe('入力型と出力型が同じスキーマ', () => {
  const pointSchema = z.object({ x: z.number(), y: z.number() });

  it('z.input と z.output は同じ型になる', () => {
    type PointInput = z.input<typeof pointSchema>;
    type PointOutput = z.output<typeof pointSchema>;
    expectTypeOf<PointInput>().toEqualTypeOf<{ x: number; y: number }>();
    expectTypeOf<PointOutput>().toEqualTypeOf<{ x: number; y: number }>();
  });
});

describe('transform: 入力型と出力型が変わる', () => {
  // 文字列（カンマ区切りの数字）→ 数値の配列
  const csvNumbersSchema = z
    .string()
    .transform((value) => value.split(',').map(Number));

  it('入力型は string、出力型は number[]', () => {
    type Input = z.input<typeof csvNumbersSchema>;
    type Output = z.output<typeof csvNumbersSchema>;
    expectTypeOf<Input>().toEqualTypeOf<string>();
    expectTypeOf<Output>().toEqualTypeOf<number[]>();
  });

  it('parse が返す値は出力型', () => {
    const result = csvNumbersSchema.parse('1,2,3');
    expectTypeOf(result).toEqualTypeOf<number[]>();
    expect(result).toStrictEqual([1, 2, 3]);
  });
});

describe('default: 入力では省略できるが、出力では必ずある', () => {
  const settingSchema = z.object({
    theme: z.string().default('light'),
  });

  it('入力型の theme は省略可能（undefined を許す）、出力型は string', () => {
    type Input = z.input<typeof settingSchema>;
    type Output = z.output<typeof settingSchema>;
    expectTypeOf<Input>().toEqualTypeOf<{ theme?: string | undefined }>();
    expectTypeOf<Output>().toEqualTypeOf<{ theme: string }>();
  });

  it('省略するとデフォルト値が入る', () => {
    expect(settingSchema.parse({})).toStrictEqual({ theme: 'light' });
    expect(settingSchema.parse({ theme: 'dark' })).toStrictEqual({
      theme: 'dark',
    });
  });
});

describe('z.infer は z.output のエイリアス', () => {
  const schema = z.string().transform((value) => value.length);

  it('z.infer と z.output は同じ型', () => {
    expectTypeOf<z.infer<typeof schema>>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<z.infer<typeof schema>>().toEqualTypeOf<number>();
  });
});

describe('値の制約は型に反映されない', () => {
  const nameSchema = z.string().min(1).max(10);
  const evenSchema = z.number().refine((n) => n % 2 === 0);

  it('min / max / refine を付けても、出力型は string / number のまま', () => {
    expectTypeOf<z.output<typeof nameSchema>>().toEqualTypeOf<string>();
    expectTypeOf<z.output<typeof evenSchema>>().toEqualTypeOf<number>();
  });

  it('制約は実行時のバリデーションにだけ効く', () => {
    expect(nameSchema.safeParse('').success).toBe(false);
    expect(evenSchema.safeParse(3).success).toBe(false);
    expect(evenSchema.safeParse(4).success).toBe(true);
  });
});

describe('brand: 出力型にだけブランドが付く', () => {
  const quantitySchema = z.int().min(1).brand<'Quantity'>();

  it('入力型は number、出力型は number & Brand', () => {
    type Input = z.input<typeof quantitySchema>;
    type Output = z.output<typeof quantitySchema>;
    expectTypeOf<Input>().toEqualTypeOf<number>();
    expectTypeOf<Output>().toEqualTypeOf<number & z.$brand<'Quantity'>>();
  });

  it('素の number は出力型に代入できない（parse を通す必要がある）', () => {
    type Quantity = z.output<typeof quantitySchema>;
    expectTypeOf<number>().not.toExtend<Quantity>();
    expectTypeOf(quantitySchema.parse(3)).toEqualTypeOf<Quantity>();
  });
});
