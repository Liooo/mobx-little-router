// @flow
import { EventTypes } from '../events'
import transformEventType from './transformEventType'

/*
 * Takes a config mapper and create a middleware that will map over loaded configuration objects.
 */
export default (f: (x: any, store: any) => any) =>
  transformEventType(EventTypes.CHILDREN_CONFIG_LOADED)((evt, store) => {
    const { module } = evt
    if (module) {
      return {
        ...evt,
        module: f(module, store)
      }
    } else {
      return evt
    }
  })
