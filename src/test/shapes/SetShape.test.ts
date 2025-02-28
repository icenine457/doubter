import { ApplyOptions, ObjectShape, Ok, Result, SetShape, Shape, StringShape } from '../../main';
import { CODE_SET_MAX, CODE_SET_MIN, CODE_TYPE, MESSAGE_SET_TYPE, MESSAGE_STRING_TYPE } from '../../main/constants';
import { TYPE_ARRAY, TYPE_OBJECT, TYPE_SET, TYPE_STRING } from '../../main/Type';

describe('SetShape', () => {
  class AsyncShape extends Shape {
    protected _isAsync(): boolean {
      return true;
    }

    protected _applyAsync(input: unknown, options: ApplyOptions) {
      return new Promise<Result>(resolve => resolve(Shape.prototype['_apply'].call(this, input, options)));
    }
  }

  let asyncShape: AsyncShape;

  beforeEach(() => {
    asyncShape = new AsyncShape();
  });

  test('creates a SetShape', () => {
    const shape = new Shape();

    const setShape = new SetShape(shape);

    expect(setShape.shape).toEqual(shape);
    expect(setShape.inputs).toEqual([TYPE_SET]);
  });

  test('raises an issue if an input is not a Set', () => {
    const setShape = new SetShape(new Shape());

    const result = setShape.try('aaa');

    expect(result).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_SET_TYPE, param: TYPE_SET }],
    });
  });

  test('parses values in a Set', () => {
    const shape = new Shape();

    const applySpy = jest.spyOn<Shape, any>(shape, '_apply');

    const setShape = new SetShape(shape);

    const set = new Set([111, 222]);
    const result = setShape.try(set) as Ok<unknown>;

    expect(result).toEqual({ ok: true, value: set });
    expect(result.value).toBe(set);
    expect(applySpy).toHaveBeenCalledTimes(2);
    expect(applySpy).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
    expect(applySpy).toHaveBeenNthCalledWith(2, 222, { verbose: false, coerced: false });
  });

  test('raises a single issue captured by the value shape', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]);

    const setShape = new SetShape(shape);

    expect(setShape.try(new Set(['aaa', 'bbb']))).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [0] }],
    });
  });

  test('raises multiple issues captured by the value shape in verbose mode', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]);

    const setShape = new SetShape(shape);

    expect(setShape.try(new Set(['aaa', 'bbb']), { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: 'xxx', path: [0] },
        { code: 'xxx', path: [1] },
      ],
    });
  });

  test('returns a new set if some values were transformed', () => {
    const cbMock = jest.fn();
    cbMock.mockReturnValueOnce('aaa');
    cbMock.mockReturnValueOnce('bbb');

    const shape = new Shape().transform(cbMock);

    const setShape = new SetShape(shape);

    const set = new Set([111, 222]);
    const result = setShape.try(set) as Ok<unknown>;

    expect(set).toEqual(new Set([111, 222]));
    expect(result).toEqual({ ok: true, value: new Set(['aaa', 'bbb']) });
    expect(result.value).not.toBe(set);
  });

  test('applies checks', () => {
    const setShape = new SetShape(new Shape()).check(() => [{ code: 'xxx' }]);

    expect(setShape.try(new Set([111]))).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('at', () => {
    test('returns the value shape', () => {
      const shape = new Shape();

      const setShape = new SetShape(shape);

      expect(setShape.at('0')).toBe(shape);
      expect(setShape.at(0)).toBe(shape);

      expect(setShape.at('000')).toBeNull();
      expect(setShape.at('1e+49')).toBeNull();
      expect(setShape.at(-111)).toBeNull();
      expect(setShape.at(111.222)).toBeNull();
      expect(setShape.at('aaa')).toBeNull();
    });
  });

  describe('size', () => {
    test('checks size', () => {
      const setShape = new SetShape(new Shape()).size(2);

      expect(setShape.try(new Set([111, 222]))).toEqual({ ok: true, value: new Set([111, 222]) });
      expect(setShape.try(new Set([111]))).toEqual({ ok: false, issues: expect.any(Array) });
      expect(setShape.try(new Set([111, 222, 333]))).toEqual({ ok: false, issues: expect.any(Array) });
    });
  });

  describe('min', () => {
    test('checks min size', () => {
      const setShape = new SetShape(new Shape()).min(2);

      expect(setShape.try(new Set([111, 222]))).toEqual({ ok: true, value: new Set([111, 222]) });
      expect(setShape.try(new Set([111]))).toEqual({
        ok: false,
        issues: [{ code: CODE_SET_MIN, input: new Set([111]), message: 'Must have the minimum size of 2', param: 2 }],
      });
    });
  });

  describe('max', () => {
    test('checks max size', () => {
      const setShape = new SetShape(new Shape()).max(2);

      expect(setShape.try(new Set([111, 222]))).toEqual({ ok: true, value: new Set([111, 222]) });
      expect(setShape.try(new Set([111, 222, 333]))).toEqual({
        ok: false,
        issues: [
          { code: CODE_SET_MAX, input: new Set([111, 222, 333]), message: 'Must have the maximum size of 2', param: 2 },
        ],
      });
    });
  });

  describe('coerce', () => {
    test('updates inputs when coerced', () => {
      const setShape = new SetShape(new StringShape()).coerce();

      expect(setShape.inputs).toEqual([TYPE_STRING, TYPE_SET, TYPE_OBJECT, TYPE_ARRAY]);
    });

    test('coerces a string value', () => {
      const setShape = new SetShape(new Shape()).coerce();

      expect(setShape.parse('aaa')).toEqual(new Set(['aaa']));
    });

    test('coerces a String wrapper', () => {
      const setShape = new SetShape(new Shape()).coerce();

      expect(setShape.parse(new String('aaa'))).toEqual(new Set(['aaa']));
    });

    test('coerces an array value', () => {
      const setShape = new SetShape(new Shape()).coerce();

      expect(setShape.parse(['aaa'])).toEqual(new Set(['aaa']));
    });

    test('coerces an array-like value', () => {
      const setShape = new SetShape(new Shape()).coerce();

      expect(setShape.parse({ 0: 'aaa', length: 1 })).toEqual(new Set(['aaa']));
    });
  });

  describe('deepPartial', () => {
    test('marks value as optional', () => {
      const setShape = new SetShape(new StringShape()).deepPartial();

      expect(setShape.parse(new Set(['aaa']))).toEqual(new Set(['aaa']));
      expect(setShape.parse(new Set([undefined]))).toEqual(new Set([undefined]));
    });

    test('makes value deep partial', () => {
      const setShape = new SetShape(new ObjectShape({ key1: new StringShape() }, null)).deepPartial();

      expect(setShape.parse(new Set([{}]))).toEqual(new Set([{}]));
      expect(setShape.parse(new Set([{ key1: undefined }]))).toEqual(new Set([{ key1: undefined }]));

      expect(setShape.try(new Set([{ key1: 111 }]))).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, path: [0, 'key1'] }],
      });
    });
  });

  describe('async', () => {
    test('raises an issue if an input is not a Set', async () => {
      const setShape = new SetShape(asyncShape);

      const result = await setShape.tryAsync('aaa');

      expect(result).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 'aaa', message: MESSAGE_SET_TYPE, param: TYPE_SET }],
      });
    });

    test('downgrades to sync implementation if value shape is sync', async () => {
      const setShape = new SetShape(new Shape());

      const setApplySpy = jest.spyOn<Shape, any>(setShape, '_apply');

      await expect(setShape.tryAsync(new Set())).resolves.toEqual({ ok: true, value: new Set() });
      expect(setApplySpy).toHaveBeenCalledTimes(1);
      expect(setApplySpy).toHaveBeenNthCalledWith(1, new Set(), { verbose: false, coerced: false });
    });

    test('parses values in a Set', async () => {
      const applySpy = jest.spyOn<Shape, any>(asyncShape, '_applyAsync');

      const setShape = new SetShape(asyncShape);

      const set = new Set([111, 222]);
      const result = (await setShape.tryAsync(set)) as Ok<unknown>;

      expect(result).toEqual({ ok: true, value: set });
      expect(result.value).toBe(set);
      expect(applySpy).toHaveBeenCalledTimes(2);
      expect(applySpy).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
      expect(applySpy).toHaveBeenNthCalledWith(2, 222, { verbose: false, coerced: false });
    });

    test('does not apply value shape if the previous value raised an issue', async () => {
      const checkMock = jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce([{ code: 'xxx' }]);

      const shape = asyncShape.check(checkMock);

      shape.isAsync;

      const applySpy = jest.spyOn<Shape, any>(shape, '_applyAsync');

      const setShape = new SetShape(shape);

      const set = new Set([111, 222, 333]);
      await setShape.tryAsync(set);

      expect(applySpy).toHaveBeenCalledTimes(2);
      expect(applySpy).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
      expect(applySpy).toHaveBeenNthCalledWith(2, 222, { verbose: false, coerced: false });
    });

    test('returns a new set if some values were transformed', async () => {
      const cbMock = jest.fn();
      cbMock.mockReturnValueOnce(Promise.resolve('aaa'));
      cbMock.mockReturnValueOnce(Promise.resolve('bbb'));

      const shape = new Shape().transformAsync(cbMock);

      const setShape = new SetShape(shape);

      const set = new Set([111, 222]);
      const result = (await setShape.tryAsync(set)) as Ok<unknown>;

      expect(result).toEqual({ ok: true, value: new Set(['aaa', 'bbb']) });
      expect(result.value).not.toBe(set);
    });

    test('applies checks', async () => {
      const setShape = new SetShape(asyncShape).check(() => [{ code: 'xxx' }]);

      await expect(setShape.tryAsync(new Set([111]))).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    describe('coerce', () => {
      test('coerces a non-array value', async () => {
        const setShape = new SetShape(asyncShape).coerce();

        await expect(setShape.parseAsync('aaa')).resolves.toEqual(new Set(['aaa']));
      });

      test('coerces an array value', async () => {
        const setShape = new SetShape(asyncShape).coerce();

        await expect(setShape.parseAsync(['aaa'])).resolves.toEqual(new Set(['aaa']));
      });
    });
  });
});
