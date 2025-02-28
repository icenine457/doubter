import { NEVER, NumberShape } from '../../main';
import {
  CODE_NUMBER_FINITE,
  CODE_NUMBER_GT,
  CODE_NUMBER_GTE,
  CODE_NUMBER_LT,
  CODE_NUMBER_LTE,
  CODE_NUMBER_MULTIPLE_OF,
  CODE_TYPE,
  MESSAGE_NUMBER_FINITE,
  MESSAGE_NUMBER_TYPE,
} from '../../main/constants';
import { TYPE_ARRAY, TYPE_BOOLEAN, TYPE_DATE, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../../main/Type';

describe('NumberShape', () => {
  test('parses a number', () => {
    expect(new NumberShape().parse(111)).toBe(111);
  });

  test('raises if value is not a number', () => {
    expect(new NumberShape().try('111')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: '111', param: TYPE_NUMBER, message: MESSAGE_NUMBER_TYPE }],
    });

    expect(new NumberShape().try(NaN)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: NaN, param: TYPE_NUMBER, message: expect.any(String) }],
    });

    expect(new NumberShape().gt(2).parse(3)).toBe(3);
  });

  test('allows infinity', () => {
    expect(new NumberShape().parse(Infinity)).toBe(Infinity);
  });

  test('raises if value is an infinity', () => {
    expect(new NumberShape().finite().try(Infinity)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_FINITE, input: Infinity, message: MESSAGE_NUMBER_FINITE }],
    });
  });

  test('overrides message for type issue', () => {
    expect(new NumberShape({ message: 'aaa', meta: 'bbb' }).try('ccc')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'ccc', param: TYPE_NUMBER, message: 'aaa', meta: 'bbb' }],
    });
  });

  test('raises a single issue', () => {
    expect(new NumberShape().gt(2).multipleOf(3).try(1)).toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_GT, input: 1, param: 2, message: 'Must be greater than 2' }],
    });
  });

  test('raises multiple issues in verbose mode', () => {
    expect(new NumberShape().gt(2).multipleOf(3).try(1, { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: CODE_NUMBER_GT, input: 1, param: 2, message: 'Must be greater than 2' },
        { code: CODE_NUMBER_MULTIPLE_OF, input: 1, param: 3, message: 'Must be a multiple of 3' },
      ],
    });
  });

  test('applies checks', () => {
    expect(new NumberShape().check(() => [{ code: 'xxx' }]).try(111)).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  test('supports async validation', async () => {
    await expect(new NumberShape().gt(3).tryAsync(2)).resolves.toEqual({
      ok: false,
      issues: [{ code: CODE_NUMBER_GT, input: 2, param: 3, message: 'Must be greater than 3' }],
    });
  });

  describe('isFinite', () => {
    test('returns true if the shape constrains finite numbers', () => {
      expect(new NumberShape().isFinite).toBe(false);
      expect(new NumberShape().finite().isFinite).toBe(true);
      expect(new NumberShape().integer().isFinite).toBe(true);
    });
  });

  describe('isInteger', () => {
    test('returns true if the shape constrains integers', () => {
      expect(new NumberShape().isInteger).toBe(false);
      expect(new NumberShape().finite().isInteger).toBe(false);
      expect(new NumberShape().integer().isInteger).toBe(true);
    });
  });

  describe('nan', () => {
    test('allows NaN', () => {
      expect(new NumberShape().nan().try(NaN)).toEqual({ ok: true, value: NaN });
    });

    test('undefined can be used as a default value', () => {
      expect(new NumberShape().nan(undefined).try(NaN)).toEqual({ ok: true, value: undefined });
    });
  });

  describe('gt', () => {
    test('raises if value is not greater than', () => {
      expect(new NumberShape().gt(2).try(2)).toEqual({
        ok: false,
        issues: [{ code: CODE_NUMBER_GT, input: 2, param: 2, message: 'Must be greater than 2' }],
      });

      expect(new NumberShape().gt(2).parse(3)).toBe(3);
    });

    test('overrides message', () => {
      expect(new NumberShape().gt(2, { message: 'xxx', meta: 'yyy' }).try(0)).toEqual({
        ok: false,
        issues: [{ code: CODE_NUMBER_GT, input: 0, param: 2, message: 'xxx', meta: 'yyy' }],
      });
    });
  });

  describe('gte/min', () => {
    test('raises if value is not greater than or equal', () => {
      expect(new NumberShape().gte(2).try(1)).toEqual({
        ok: false,
        issues: [{ code: CODE_NUMBER_GTE, input: 1, param: 2, message: 'Must be greater than or equal to 2' }],
      });

      expect(new NumberShape().min(2).try(1)).toEqual({
        ok: false,
        issues: [{ code: CODE_NUMBER_GTE, input: 1, param: 2, message: 'Must be greater than or equal to 2' }],
      });

      expect(new NumberShape().gte(2).parse(2)).toBe(2);
    });

    test('overrides message', () => {
      expect(new NumberShape().gte(2, { message: 'xxx', meta: 'yyy' }).try(0)).toEqual({
        ok: false,
        issues: [{ code: CODE_NUMBER_GTE, input: 0, param: 2, message: 'xxx', meta: 'yyy' }],
      });
    });
  });

  describe('lt', () => {
    test('raises if value is not less than', () => {
      expect(new NumberShape().lt(2).try(3)).toEqual({
        ok: false,
        issues: [{ code: CODE_NUMBER_LT, input: 3, param: 2, message: 'Must be less than 2' }],
      });

      expect(new NumberShape().lt(2).try(2)).toEqual({
        ok: false,
        issues: [{ code: CODE_NUMBER_LT, input: 2, param: 2, message: 'Must be less than 2' }],
      });

      expect(new NumberShape().lt(2).parse(1)).toBe(1);
    });

    test('overrides message', () => {
      expect(new NumberShape().lt(2, { message: 'xxx', meta: 'yyy' }).try(3)).toEqual({
        ok: false,
        issues: [{ code: CODE_NUMBER_LT, input: 3, param: 2, message: 'xxx', meta: 'yyy' }],
      });
    });
  });

  describe('lte/max', () => {
    test('raises if value is not less than or equal', () => {
      expect(new NumberShape().lte(2).try(3)).toEqual({
        ok: false,
        issues: [{ code: CODE_NUMBER_LTE, input: 3, param: 2, message: 'Must be less than or equal to 2' }],
      });

      expect(new NumberShape().max(2).try(3)).toEqual({
        ok: false,
        issues: [{ code: CODE_NUMBER_LTE, input: 3, param: 2, message: 'Must be less than or equal to 2' }],
      });

      expect(new NumberShape().lte(2).parse(2)).toBe(2);
    });

    test('overrides message', () => {
      expect(new NumberShape().lte(2, { message: 'xxx', meta: 'yyy' }).try(3)).toEqual({
        ok: false,
        issues: [{ code: CODE_NUMBER_LTE, input: 3, param: 2, message: 'xxx', meta: 'yyy' }],
      });
    });
  });

  describe('multipleOf', () => {
    test('raises if value is not a multiple of a divisor', () => {
      expect(new NumberShape().multipleOf(2).try(3)).toEqual({
        ok: false,
        issues: [{ code: CODE_NUMBER_MULTIPLE_OF, input: 3, param: 2, message: 'Must be a multiple of 2' }],
      });

      expect(new NumberShape().multipleOf(2).parse(4)).toBe(4);
    });
  });

  describe('positive/nonNegative', () => {
    test('raises if value is not positive', () => {
      expect(new NumberShape().positive().try(-111).ok).toBe(false);
      expect(new NumberShape().nonNegative().try(-111).ok).toBe(false);

      expect(new NumberShape().positive().try(222).ok).toBe(true);
      expect(new NumberShape().nonNegative().try(222).ok).toBe(true);
    });
  });

  describe('negative/nonPositive', () => {
    test('raises if value is not negative', () => {
      expect(new NumberShape().negative().try(111).ok).toBe(false);
      expect(new NumberShape().nonPositive().try(111).ok).toBe(false);

      expect(new NumberShape().negative().try(-222).ok).toBe(true);
      expect(new NumberShape().nonPositive().try(-222).ok).toBe(true);
    });
  });

  describe('coerce', () => {
    test('updates inputs when coerced', () => {
      const shape = new NumberShape().coerce();

      expect(shape.inputs).toEqual([
        TYPE_NUMBER,
        TYPE_OBJECT,
        TYPE_STRING,
        TYPE_BOOLEAN,
        TYPE_ARRAY,
        TYPE_DATE,
        null,
        undefined,
      ]);
    });

    test('coerces an input', () => {
      expect(new NumberShape().coerce().parse('111')).toBe(111);
      expect(new NumberShape().coerce().parse(true)).toBe(1);
      expect(new NumberShape().coerce().parse([111])).toBe(111);
      expect(new NumberShape().parse([111], { coerced: true })).toBe(111);
    });

    test('raises an issue if coercion fails', () => {
      expect(new NumberShape().coerce().try(['aaa'])).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: ['aaa'], message: MESSAGE_NUMBER_TYPE, param: TYPE_NUMBER }],
      });
    });
  });

  describe('_coerce', () => {
    test('coerces a Number wrapper', () => {
      expect(new NumberShape()['_coerce'](Number(111))).toBe(111);
      expect(new NumberShape()['_coerce']([Number(111)])).toBe(111);
    });

    test('coerces a String wrapper', () => {
      expect(new NumberShape()['_coerce'](String('111'))).toBe(111);
      expect(new NumberShape()['_coerce']([String('111')])).toBe(111);
    });

    test('coerces a string', () => {
      expect(new NumberShape()['_coerce']('111')).toBe(111);
      expect(new NumberShape()['_coerce']('111.222')).toBe(111.222);

      expect(new NumberShape()['_coerce']('aaa')).toBe(NEVER);
    });

    test('does not coerce NaN', () => {
      expect(new NumberShape()['_coerce'](NaN)).toBe(NEVER);
      expect(new NumberShape().finite()['_coerce'](NaN)).toBe(NEVER);
      expect(new NumberShape().integer()['_coerce'](NaN)).toBe(NEVER);
    });

    test('coerce Infinity only in an unconstrained number mode', () => {
      expect(new NumberShape()['_coerce'](Infinity)).toBe(Infinity);
      expect(new NumberShape()['_coerce']([-Infinity])).toBe(-Infinity);
      expect(new NumberShape().finite()['_coerce'](Infinity)).toBe(NEVER);
      expect(new NumberShape().finite()['_coerce']([-Infinity])).toBe(NEVER);
      expect(new NumberShape().integer()['_coerce'](Infinity)).toBe(NEVER);
      expect(new NumberShape().integer()['_coerce']([-Infinity])).toBe(NEVER);
    });

    test('coerces a boolean', () => {
      expect(new NumberShape()['_coerce'](true)).toBe(1);
      expect(new NumberShape()['_coerce'](false)).toBe(0);
    });

    test('coerces null and undefined values', () => {
      expect(new NumberShape()['_coerce'](null)).toBe(0);
      expect(new NumberShape()['_coerce'](undefined)).toBe(0);
    });

    test('coerces an array with a single number element', () => {
      expect(new NumberShape()['_coerce']([111])).toBe(111);
      expect(new NumberShape()['_coerce'](['111'])).toBe(111);

      expect(new NumberShape()['_coerce']([[111]])).toBe(NEVER);
      expect(new NumberShape()['_coerce']([['111']])).toBe(NEVER);
      expect(new NumberShape()['_coerce']([BigInt(111), 'aaa'])).toBe(NEVER);
      expect(new NumberShape()['_coerce']([BigInt(111), BigInt(111)])).toBe(NEVER);
      expect(new NumberShape()['_coerce'](['aaa'])).toBe(NEVER);
    });

    test('does not coerce objects and functions', () => {
      expect(new NumberShape()['_coerce']({ key1: 111 })).toBe(NEVER);
      expect(new NumberShape()['_coerce'](() => undefined)).toBe(NEVER);
    });

    test('does not coerce a symbol', () => {
      expect(new NumberShape()['_coerce'](Symbol())).toBe(NEVER);
    });
  });
});
