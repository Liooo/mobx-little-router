// @flow
import { EventTypes } from '../events'
import transformEventType from './transformEventType'

/*
 * Takes a config mapper and create a middleware that will map over loaded configuration objects.
 */
export default (f: (x: any) => any) =>
  transformEventType(EventTypes.CHILDREN_CONFIG_LOAD)(evt => {
    const { module } = evt
    if (module && module.length) {
      return {
        ...evt,
        module: module.map(f)
      }
    } else {
      return evt
    }
  })
