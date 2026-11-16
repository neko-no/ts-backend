// 5.3.1 型のバリデーション: z.object / parse / safeParse / error.issues
import { assert, describe, expect, it } from 'vitest';
import { z } from 'zod';

// 値の制約は付けない（型の検証だけ）
const productSchema = z.object({
  name: z.string(),
  price: z.number(),
});

describe('parse', () => {
  it('成功: スキーマから推論された型の値が返る', () => {
    const product = productSchema.parse({ name: 'ペン', price: 120 });
    expect(product).toStrictEqual({ name: 'ペン', price: 120 });
  });

  it('エラー: price が文字列だと ZodError が例外として送出される', () => {
    expect(() => productSchema.parse({ name: 'ペン', price: '120' })).toThrow(
      z.ZodError,
    );
  });
});

describe('safeParse', () => {
  it('成功: success が true のとき data を参照できる', () => {
    const result = productSchema.safeParse({ name: 'ペン', price: 120 });
    // assert で success: true の側に絞り込まれる
    assert(result.success);
    expect(result.data).toStrictEqual({ name: 'ペン', price: 120 });
  });

  it('エラー: オブジェクトではない', () => {
    const result = productSchema.safeParse(['ペン', 120]);
    assert(!result.success);
    expect(result.error.issues).toStrictEqual([
      expect.objectContaining({ code: 'invalid_type', path: [] }),
    ]);
  });

  it('エラー: price が文字列（path で原因のプロパティが分かる）', () => {
    const result = productSchema.safeParse({ name: 'ペン', price: '120' });
    assert(!result.success);
    expect(result.error.issues).toStrictEqual([
      expect.objectContaining({ code: 'invalid_type', path: ['price'] }),
    ]);
  });

  it('エラー: ZodIssue の中身を確認する', () => {
    const result = productSchema.safeParse({ name: 'ペン', price: '120' });
    assert(!result.success);
    const [issue] = result.error.issues;
    assert(issue !== undefined);
    assert(issue.code === 'invalid_type');
    // code が invalid_type のとき、期待する型を表す expected を参照できる
    console.log('issue:', issue);
    expect(issue.expected).toBe('number');
    expect(typeof issue.message).toBe('string');
  });
});
