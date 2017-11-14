/* @flow
 * This is the public facade over all of the routing interface.
 * The `Router` is a coordinator of other objects in the system.
 */
import type { IObservableArray } from 'mobx'
import { autorun, computed, extendObservable, when } from 'mobx'
import querystring from 'querystring'
import delay from './util/delay'
import type { Action, History } from 'history'
import createRouteStateTreeNode from './model/createRouteStateTreeNode'
import RouterStore from './model/RouterStore'
import type { Config, Href, Location, Route, RouteStateTreeNode } from './model/types'
import Scheduler from './scheduling/Scheduler'
import type { Event } from './events'
import { EventTypes } from './events'
import { NavigationTypes } from './model/Navigation'
import type { IMiddleware } from './middleware/Middleware'

class Router {
  // Public members
  location: Location
  activeRoutes: IObservableArray<Route<*, *>>
  activeRouteKeys: string[]
  isNavigating: boolean

  // Private members
  _store: RouterStore
  _scheduler: Scheduler
  _initialChildren: Config<*>[]
  _history: History
  _disposers: Function[]
  _nextNavigation: * // This is computed from Scheduler event observable.

  constructor(
    history: History,
    config: Config<*>[],
    getContext?: void | (() => any),
    middleware: IMiddleware
  ) {
    this._disposers = []

    this._history = history
    const root = createRouteStateTreeNode({ key: '@@ROOT', path: '', match: 'partial' }, getContext) // Initial root.
    this._initialChildren = config
    this._store = new RouterStore(root)
    this._scheduler = new Scheduler(this._store, middleware)

    extendObservable(this, {
      location: computed(() => this._store.location),
      activeRoutes: computed((): IObservableArray<Route<*, *>> => this._store.routes),
      activeRouteKeys: computed((): string[] =>
        this.activeRoutes.map(r => r.node.value.key)
      ),

      // Private usage to figure out if an event has a next navigation object.
      _nextNavigation: computed(() => {
        const { event } = this._scheduler
        return event !== null
          ? event.nextNavigation !== null ? event.nextNavigation : null
          : null
      }),
      isNavigating: computed(() => {
        const { event: { type } } = this._scheduler
        return type !== EventTypes.NAVIGATION_ERROR && type !== EventTypes.NAVIGATION_END
      })
    })
  }

  // We may want the start to take in a callback with the router instance as the parameter.
  // This means we can do `.start(router => {/* do stuff with router */})`, as opposed
  // to `.start().then(() => {/* do stuff with router in original scope */})`
  start(callback: ?Function) {
    return new Promise((res, rej) => {
      try {
        this._scheduler.start()

        // Loads initial set of children (running through all middleware).
        this._scheduler.dispatch({
          type: EventTypes.CHILDREN_LOADING,
          leaf: { node: this._store.state.root },
          children: this._initialChildren
        })

        // Look for any next navigation from events and call corresponding method on history.
        this._disposers.push(autorun(this.handleNextNavigation))

        // Initial location.
        this._disposers.push(this._history.listen(this.handleLocationChange))

        res()
      } catch (err) {
        rej(err)
      }
    }).then(() => delay(0)).then(() => {
        // Schedule initial nextNavigation.
        this._scheduler.schedule(asNavigation(this._history.location))

        // Wait until nextNavigation is processed.
        return this.done().then(() => {
          if (this._scheduler.event.type === EventTypes.NAVIGATION_ERROR) {
            throw this._scheduler.event.error
          } else {
            callback && callback(this)
          }
        })
      })
      .catch(error => {
        this.stop()
        throw error
      })
  }

  stop() {
    this._scheduler.stop()
    this._disposers.forEach(f => f())
  }

  subscribeEvent(f: (x: Event) => void): () => void {
    return autorun(() => {
      const { event } = this._scheduler
      if (event !== null) {
        f(event)
      }
    })
  }

  createHref(href: Href) {
    if (typeof href === 'string') {
      return this._history.createHref({ pathname: href })
    } else {
      return this._history.createHref(href)
    }
  }

  push(href: Href) {
    this._history.push(withSearch(href))
    return this.done()
  }

  replace(href: Href) {
    this._history.replace(withSearch(href))
    return this.done()
  }

  updateQuery(
    query: Object,
    options: { action?: Action, merge?: boolean } = { action: 'REPLACE', merge: false}
  ) {
    const search = this._store.location.search
    const existingQuery = search ? querystring.parse(search.substr(1)) : {}
    let updatedQuery = options.merge === true ? { ...existingQuery, ...query } : query
    updatedQuery = Object.keys(updatedQuery).reduce((acc, k) => {
      if (typeof updatedQuery[k] !== 'undefined') {
        acc[k] = updatedQuery[k]
      }
      return acc
    }, {})
    const queryString = Object.keys(updatedQuery).length > 0 ? `?${querystring.stringify(updatedQuery)}` : ''
    const pathname = `${this.location.pathname}${queryString}`

    switch(options.action) {
      case 'PUSH':
        return this.push(pathname)
      
      default:
      case 'REPLACE':
        return this.replace(pathname)
    }
  }

  goBack() {
    this._history.goBack()
    return this.done()
  }

  resolvePath(path: string, cwd: string = this.location.pathname) {
    const endsWithSlash = path.endsWith('/')
    const segments = path[0] === '/'
      ? path.split('/')
      : cwd.split('/').concat(path.split('/'))

    const result = segments.reduce((acc, p) => {
      if (p && p !== '.') {
        if (p === '..') {
          if (acc.length && acc[acc.length - 1] !== '..') {
            acc.pop()
          }
        } else {
          acc.push(p)
        }
      }

      return acc
    }, [])

    return `/${result.join('/')}${endsWithSlash ? '/' : ''}`
  }

  // Note: This will not return any dynamic nodes unless they have already loaded.
  getNode(key: string): null | RouteStateTreeNode<*, *> {
    return this._store.getNode(key)
  }

  /* Private helpers */

  // Waits for next navigation event to be processed and resolves.
  done(): Promise<void> {
    return new Promise(res => {
      when(() => !this.isNavigating, res)
    })
  }

  handleNextNavigation = () => {
    const { _nextNavigation } = this

    if (!_nextNavigation) {
      return
    }

    // Do this on next tick so we don't clobber current event.
    // TODO: Move this redirect logic to a middleware.
    setTimeout(() => {
      switch (_nextNavigation.type) {
        case NavigationTypes.PUSH:
          return this.push(_nextNavigation.to)
        case NavigationTypes.REPLACE:
          return this.replace(_nextNavigation.to)
        case NavigationTypes.GO_BACK:
          return this.goBack()
        default:
          throw new TypeError(`Invalid navigation returned (${_nextNavigation.type})`)
      }
    })
  }

  handleLocationChange = (location: Object, action: ?Action) => {
    this._scheduler.schedule(asNavigation(location, action))
  }
}

function asNavigation(location: Object, action: ?Action) {
  return {
    type: action || 'POP',
    to: {
      ...location,
      pathname: location.pathname
    }
  }
}

function withSearch(href: Href) {
  if (typeof href === 'string') {
    return href
  } else {
    const qs = href.query ? querystring.stringify(href.query) : ''
    return {
      ...href,
      search: qs ? `?${qs}` : qs
    }
  }
}

export default Router
