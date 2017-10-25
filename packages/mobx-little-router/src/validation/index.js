// @flow
import _createValidator from './createValidator'

export { and, or } from './combinators'
export { optional } from './util'
export { array, empty, string, func, number } from './matchers'

const createValidator = process.env.NODE_ENV === 'production'
  ? (x: any) => (x: Object) => {}
  : _createValidator

export { createValidator }
