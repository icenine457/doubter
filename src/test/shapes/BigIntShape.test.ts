import { BigIntShape } from '../../main';
import {
  CODE_TYPE,
  MESSAGE_BIGINT_TYPE,
  TYPE_ARRAY,
  TYPE_BIGINT,
  TYPE_BOOLEAN,
  TYPE_NULL,
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_UNDEFINED,
} from '../../main/constants';

describe('BigIntShape', () => {
  test('creates a string shape', () => {
    const shape = new BigIntShape();

    expect(shape.isAsync).toBe(false);
    expect(shape.inputTypes).toEqual([TYPE_BIGINT]);
  });

  test('parses bigint values', () => {
    const value = BigInt(111);

    expect(new BigIntShape().parse(value)).toBe(value);
  });

  test('raises an issue if an input is not a bigint', () => {
    expect(new BigIntShape().try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 'aaa', param: TYPE_BIGINT, message: 'Must be a bigint' }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new BigIntShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 111, param: TYPE_BIGINT, message: 'aaa', meta: 'bbb' }],
    });
  });

  test('updates input types when coerced', () => {
    const shape = new BigIntShape().coerce();

    expect(shape.inputTypes).toEqual([
      TYPE_BIGINT,
      TYPE_STRING,
      TYPE_NUMBER,
      TYPE_BOOLEAN,
      TYPE_ARRAY,
      TYPE_UNDEFINED,
      TYPE_NULL,
    ]);
  });

  test('coerces an input', () => {
    expect(new BigIntShape().coerce().parse(111)).toBe(BigInt(111));
    expect(new BigIntShape().coerce().parse(true)).toBe(BigInt(1));
    expect(new BigIntShape().parse(true, { coerced: true })).toBe(BigInt(1));
  });

  test('raises an issue if coercion fails', () => {
    expect(new BigIntShape().coerce().try(['aaa'])).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE,
          input: ['aaa'],
          message: MESSAGE_BIGINT_TYPE,
          param: TYPE_BIGINT,
          path: [],
        },
      ],
    });
  });

  describe('coercion', () => {
    test('coerces a string', () => {
      expect(new BigIntShape()['_coerce']('111')).toBe(BigInt(111));

      expect(new BigIntShape()['_coerce']('aaa')).toBe(null);
    });

    test('coerces a number', () => {
      expect(new BigIntShape()['_coerce'](111)).toBe(BigInt(111));

      expect(new BigIntShape()['_coerce'](111.222)).toBe(null);
      expect(new BigIntShape()['_coerce'](NaN)).toBe(null);
      expect(new BigIntShape()['_coerce'](Infinity)).toBe(null);
      expect(new BigIntShape()['_coerce'](-Infinity)).toBe(null);
    });

    test('coerces a boolean', () => {
      expect(new BigIntShape()['_coerce'](true)).toBe(BigInt(1));
      expect(new BigIntShape()['_coerce'](false)).toBe(BigInt(0));
    });

    test('coerces null and undefined values', () => {
      expect(new BigIntShape()['_coerce'](null)).toBe(BigInt(0));
      expect(new BigIntShape()['_coerce'](undefined)).toBe(BigInt(0));
    });

    test('coerces an array with a single bigint element', () => {
      expect(new BigIntShape()['_coerce']([BigInt(111)])).toBe(BigInt(111));
    });

    test('does not coerce unsuitable array', () => {
      expect(new BigIntShape()['_coerce']([BigInt(111), 'aaa'])).toBe(null);
      expect(new BigIntShape()['_coerce']([BigInt(111), BigInt(111)])).toBe(null);
      expect(new BigIntShape()['_coerce'](['aaa'])).toBe(null);
    });

    test('does not coerce objects and functions', () => {
      expect(new BigIntShape()['_coerce']({ key1: 111 })).toBe(null);
      expect(new BigIntShape()['_coerce'](() => undefined)).toBe(null);
    });
  });
});
