import { AnyShape, RecordShape, Shape } from '../shapes';
import { ConstraintOptions, Message } from '../types';

/**
 * Creates the shape that describes an object with string keys and values that conform the given shape.
 *
 * @param valueShape The shape of the record values.
 * @param options The constraint options or an issue message.
 * @template V The value shape.
 */
export function record<V extends AnyShape>(valueShape: V, options?: ConstraintOptions | Message): RecordShape<null, V>;

/**
 * Creates the shape that describes an object with string keys and values that conform the given shape.
 *
 * @param keyShape The shape of record keys.
 * @param valueShape The shape of the record values.
 * @param options The constraint options or an issue message.
 * @template K The key shape.
 * @template V The value shape.
 */
export function record<K extends Shape<string, PropertyKey>, V extends AnyShape>(
  keyShape: K,
  valueShape: V,
  options?: ConstraintOptions | Message
): RecordShape<K, V>;

export function record(
  keyShape: AnyShape,
  valueShape?: AnyShape | ConstraintOptions | Message,
  options?: ConstraintOptions | Message
) {
  if (valueShape instanceof Shape) {
    return new RecordShape(keyShape, valueShape, options);
  } else {
    return new RecordShape(null, keyShape, options);
  }
}
