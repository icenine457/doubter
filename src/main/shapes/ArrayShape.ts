import {
  CODE_ARRAY_MAX,
  CODE_ARRAY_MIN,
  CODE_TUPLE,
  CODE_TYPE,
  MESSAGE_ARRAY_MAX,
  MESSAGE_ARRAY_MIN,
  MESSAGE_ARRAY_TYPE,
  MESSAGE_TUPLE,
} from '../constants';
import { TYPE_ARRAY, TYPE_OBJECT, TYPE_UNKNOWN } from '../Type';
import { ApplyOptions, ConstraintOptions, Issue, Message } from '../types';
import {
  addCheck,
  applyShape,
  canonize,
  concatIssues,
  copyUnsafeChecks,
  createIssueFactory,
  isArray,
  isAsyncShape,
  isIterable,
  ok,
  toArrayIndex,
  toDeepPartialShape,
  unshiftIssuesPath,
} from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { AnyShape, DeepPartialProtocol, INPUT, NEVER, OptionalDeepPartialShape, OUTPUT, Result } from './Shape';

// prettier-ignore
export type InferTuple<U extends readonly AnyShape[], C extends INPUT | OUTPUT> =
  U extends readonly AnyShape[]
    ? { [K in keyof U]: U[K] extends AnyShape ? U[K][C] : never }
    : never;

// prettier-ignore
export type InferArray<U extends readonly AnyShape[] | null, R extends AnyShape | null, C extends INPUT | OUTPUT> =
  U extends readonly AnyShape[]
    ? R extends AnyShape ? [...InferTuple<U, C>, ...R[C][]] : InferTuple<U, C>
    : R extends AnyShape ? R[C][] : any[];

export type DeepPartialArrayShape<U extends readonly AnyShape[] | null, R extends AnyShape | null> = ArrayShape<
  U extends readonly AnyShape[]
    ? { [K in keyof U]: U[K] extends AnyShape ? OptionalDeepPartialShape<U[K]> : never }
    : null,
  R extends AnyShape ? OptionalDeepPartialShape<R> : null
>;

/**
 * The shape of an array or a tuple.
 *
 * @template U The array of positioned element shapes, or `null` if there are no positioned elements.
 * @template R The shape of rest elements, or `null` if there are no rest elements.
 */
export class ArrayShape<U extends readonly AnyShape[] | null, R extends AnyShape | null>
  extends CoercibleShape<InferArray<U, R, INPUT>, InferArray<U, R, OUTPUT>>
  implements DeepPartialProtocol<DeepPartialArrayShape<U, R>>
{
  protected _options;
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode ArrayShape} instance.
   *
   * @param shapes The array of positioned element shapes or `null` if there are no positioned elements.
   * @param restShape The shape of rest elements or `null` if there are no rest elements.
   * @param options The type constraint options or the type issue message.
   * @template U The array of positioned element shapes, or `null` if there are no positioned elements.
   * @template R The shape of rest elements, or `null` if there are no rest elements.
   */
  constructor(
    /**
     * The array of positioned element shapes or `null` if there are no positioned elements.
     */
    readonly shapes: U,
    /**
     * The shape of rest elements or `null` if there are no rest elements.
     */
    readonly restShape: R,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._options = options;

    if (shapes !== null && (shapes.length !== 0 || restShape === null)) {
      this._typeIssueFactory = createIssueFactory(CODE_TUPLE, MESSAGE_TUPLE, options, shapes.length);
    } else {
      this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_ARRAY_TYPE, options, TYPE_ARRAY);
    }
  }

  at(key: unknown): AnyShape | null {
    const { shapes } = this;

    const index = toArrayIndex(key);

    if (index === -1) {
      return null;
    }
    if (shapes !== null && index < shapes.length) {
      return shapes[index];
    }
    return this.restShape;
  }

  /**
   * Returns an array shape that has rest elements constrained by the given shape.
   *
   * @param restShape The shape of rest elements, or `null` if there are no rest elements.
   * @returns The new array shape.
   * @template T The shape of rest elements.
   */
  rest<T extends AnyShape | null>(restShape: T): ArrayShape<U, T> {
    return copyUnsafeChecks(this, new ArrayShape(this.shapes, restShape, this._options));
  }

  /**
   * Constrains the array length.
   *
   * @param length The minimum array length.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  length(length: number, options?: ConstraintOptions | Message): this {
    return this.min(length, options).max(length, options);
  }

  /**
   * Constrains the minimum array length.
   *
   * @param length The minimum array length.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  min(length: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_ARRAY_MIN, MESSAGE_ARRAY_MIN, options, length);

    return addCheck(this, CODE_ARRAY_MIN, length, (input, param, options) => {
      if (input.length < param) {
        return issueFactory(input, options);
      }
    });
  }

  /**
   * Constrains the maximum array length.
   *
   * @param length The maximum array length.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  max(length: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_ARRAY_MAX, MESSAGE_ARRAY_MAX, options, length);

    return addCheck(this, CODE_ARRAY_MAX, length, (input, param, options) => {
      if (input.length > param) {
        return issueFactory(input, options);
      }
    });
  }

  deepPartial(): DeepPartialArrayShape<U, R> {
    const shapes = this.shapes !== null ? this.shapes.map(shape => toDeepPartialShape(shape).optional()) : null;

    const restShape = this.restShape !== null ? toDeepPartialShape(this.restShape).optional() : null;

    return copyUnsafeChecks(this, new ArrayShape<any, any>(shapes, restShape, this._options));
  }

  protected _isAsync(): boolean {
    return this.shapes?.some(isAsyncShape) || this.restShape?.isAsync || false;
  }

  protected _getInputs(): unknown[] {
    const { shapes, restShape } = this;

    if (!this.isCoerced) {
      return [TYPE_ARRAY];
    }

    if (shapes !== null) {
      if (shapes.length > 1) {
        return [TYPE_OBJECT, TYPE_ARRAY];
      }
      if (shapes.length === 1) {
        return shapes[0].inputs.concat(TYPE_OBJECT, TYPE_ARRAY);
      }
    }

    if (restShape !== null) {
      return restShape.inputs.concat(TYPE_OBJECT, TYPE_ARRAY);
    }

    return [TYPE_UNKNOWN];
  }

  protected _apply(input: any, options: ApplyOptions): Result<InferArray<U, R, OUTPUT>> {
    const { shapes, restShape, _applyChecks, _isUnsafe } = this;

    let output = input;
    let outputLength;
    let shapesLength = 0;
    let issues = null;

    // noinspection CommaExpressionJS
    if (
      // Not an array or not coercible
      (!isArray(output) && (!(options.coerced || this.isCoerced) || (output = this._coerce(input)) === NEVER)) ||
      // Invalid tuple length
      ((outputLength = output.length),
      shapes !== null &&
        (outputLength < (shapesLength = shapes.length) || (restShape === null && outputLength !== shapesLength)))
    ) {
      return this._typeIssueFactory(input, options);
    }

    if (shapes !== null || restShape !== null) {
      for (let i = 0; i < outputLength; ++i) {
        const value = output[i];
        const valueShape = i < shapesLength ? shapes![i] : restShape!;
        const result = valueShape['_apply'](value, options);

        if (result === null) {
          continue;
        }
        if (isArray(result)) {
          unshiftIssuesPath(result, i);

          if (!options.verbose) {
            return result;
          }
          issues = concatIssues(issues, result);
          continue;
        }
        if (_isUnsafe || issues === null) {
          if (input === output) {
            output = input.slice(0);
          }
          output[i] = result.value;
        }
      }
    }

    if (_applyChecks !== null && (_isUnsafe || issues === null)) {
      issues = _applyChecks(output, issues, options);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }

  protected _applyAsync(input: any, options: ApplyOptions): Promise<Result<InferArray<U, R, OUTPUT>>> {
    return new Promise(resolve => {
      const { shapes, restShape, _applyChecks, _isUnsafe } = this;

      let output = input;
      let outputLength: number;
      let shapesLength = 0;

      // noinspection CommaExpressionJS
      if (
        // Not an array or not coercible
        (!isArray(output) && (!(options.coerced || this.isCoerced) || (output = this._coerce(input)) === NEVER)) ||
        // Invalid tuple length
        ((outputLength = output.length),
        shapes !== null &&
          (outputLength < (shapesLength = shapes.length) || (restShape === null && outputLength !== shapesLength)))
      ) {
        resolve(this._typeIssueFactory(input, options));
        return;
      }

      let issues: Issue[] | null = null;
      let index = -1;

      const handleResult = (result: Result) => {
        if (result !== null) {
          if (isArray(result)) {
            unshiftIssuesPath(result, index);

            if (!options.verbose) {
              return result;
            }
            issues = concatIssues(issues, result);
          } else if (_isUnsafe || issues === null) {
            if (input === output) {
              output = input.slice(0);
            }
            output[index] = result.value;
          }
        }
        return next();
      };

      const next = (): Result | Promise<Result> => {
        index++;

        if (index !== outputLength && (shapes !== null || restShape !== null)) {
          return applyShape(index < shapesLength ? shapes![index] : restShape!, output[index], options, handleResult);
        }

        if (_applyChecks !== null && (_isUnsafe || issues === null)) {
          issues = _applyChecks(output, issues, options);
        }
        if (issues === null && input !== output) {
          return ok(output);
        }
        return issues;
      };

      resolve(next());
    });
  }

  /**
   * Coerces a value to an array or returns {@linkcode NEVER} if coercion isn't possible.
   *
   * @param value The non-array value to coerce.
   */
  protected _coerce(value: unknown): unknown[] {
    value = canonize(value);

    if (isIterable(value)) {
      return Array.from(value);
    }
    return [value];
  }
}
