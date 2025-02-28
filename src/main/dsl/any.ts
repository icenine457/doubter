import { AnyShape, Shape } from '../shapes';
import { ApplyOptions, Message, RefineOptions } from '../types';

/**
 * Creates the unconstrained shape.
 *
 * You can specify compile-time type to enhance type inference.
 *
 * @template T The input and the output value.
 */
export function any<T = any>(): Shape<T>;

/**
 * Creates a shape that is constrained with a
 * [narrowing predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
 *
 * @param cb The type predicate that returns `true` if value conforms the required type, or `false` otherwise.
 * @param options The constraint options or an issue message.
 * @returns The shape that has the narrowed output.
 * @template T The output value.
 */
export function any<T>(
  /**
   * @param value The input value.
   * @param options Parsing options.
   * @returns `true` if value conforms the predicate, or `false` otherwise.
   */
  cb: (value: any, options: Readonly<ApplyOptions>) => value is T,
  options?: RefineOptions | Message
): Shape<T>;

/**
 * Creates a shape that is constrained with a predicate.
 *
 * @param cb The predicate that returns truthy result if value is valid, or returns falsy result otherwise.
 * @param options The constraint options or an issue message.
 * @template T The output value.
 */
export function any<T = any>(
  /**
   * @param value The input value.
   * @param options Parsing options.
   * @returns `true` if value conforms the predicate, or `false` otherwise.
   */
  cb: (value: any, options: Readonly<ApplyOptions>) => boolean,
  options?: RefineOptions | Message
): Shape<T>;

export function any(
  cb?: (value: any, options: Readonly<ApplyOptions>) => boolean,
  options?: RefineOptions | Message
): AnyShape {
  const shape = new Shape();

  return cb === null || cb === undefined ? shape : shape.refine(cb, options);
}
