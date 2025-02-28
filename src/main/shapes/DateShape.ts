import { CODE_TYPE, MESSAGE_DATE_TYPE } from '../constants';
import { TYPE_ARRAY, TYPE_DATE, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../Type';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { canonize, createIssueFactory, isArray, isValidDate, ok } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { NEVER, Result } from './Shape';

/**
 * The shape of the `Date` object.
 */
export class DateShape extends CoercibleShape<Date> {
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode DateShape} instance.
   *
   * @param options The type constraint options or the type issue message.
   */
  constructor(options?: ConstraintOptions | Message) {
    super();

    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_DATE_TYPE, options, TYPE_DATE);
  }

  protected _getInputs(): unknown[] {
    if (this.isCoerced) {
      return [TYPE_DATE, TYPE_OBJECT, TYPE_STRING, TYPE_NUMBER, TYPE_ARRAY];
    } else {
      return [TYPE_DATE];
    }
  }

  protected _apply(input: any, options: ApplyOptions): Result<Date> {
    const { _applyChecks } = this;

    let output = input;
    let issues = null;
    let changed = false;

    if (
      !isValidDate(input) &&
      (!(changed = options.coerced || this.isCoerced) || (output = this._coerce(input)) === NEVER)
    ) {
      return this._typeIssueFactory(input, options);
    }
    if ((_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) && changed) {
      return ok(output);
    }
    return issues;
  }

  /**
   * Coerces a value to a `Date` or returns {@linkcode NEVER} if coercion isn't possible.
   *
   * @param value The non-`Date` value to coerce.
   */
  protected _coerce(value: unknown): Date {
    if (isArray(value) && value.length === 1 && isValidDate((value = value[0]))) {
      return value;
    }

    value = canonize(value);

    if ((typeof value === 'string' || typeof value === 'number') && isValidDate((value = new Date(value)))) {
      return value;
    }
    return NEVER;
  }
}
