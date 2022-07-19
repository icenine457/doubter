import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue } from '../utils';

export class BooleanType extends Type<boolean> {
  _parse(value: unknown, context: ParserContext): any {
    if (typeof value !== 'boolean') {
      context.raiseIssue(createIssue(context, 'type', value, 'boolean'));
    }
    return value;
  }
}
