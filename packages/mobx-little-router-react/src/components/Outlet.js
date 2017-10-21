// @flow
import React, { Component } from 'react'
import withRouter from '../hoc/withRouter'
import { observer } from 'mobx-react'
import type { Router } from 'mobx-little-router'
import { areRoutesEqual } from 'mobx-little-router'
import { OutletType } from '../propTypes'

import TransitionGroup from './TransitionGroup'

/*
 * Outlet component is responsible for rendering the matched components
 * from RouterStore into it. Each Outlet element renders it's current node index
 * in the path, and then provides the next index to subsequent Outlet components.
 */

type OutletProps = {
  // The name will allow us to potentially render to different outlets
  // throughout the app. e.g. sidebar vs main
  name?: string,
  router: Router
}

class Outlet extends Component<OutletProps> {
  static contextTypes = {
    // We may have another outlet above us in the context.
    outlet: OutletType
  }

  static childContextTypes = {
    outlet: OutletType
  }

  getChildContext() {
    return {
      outlet: {
        currentIndex: this.getCurrentIndex() + 1
      }
    }
  }

  getCurrentIndex() {
    return typeof this.context.outlet !== 'undefined'
      ? this.context.outlet.currentIndex
      : 0
  }

  render() {
    const { router, name, ...rest } = this.props
    const idx = this.getCurrentIndex()

    const currRoutes = filterRoutes(router.store.routes)
    const prevRoutes = filterRoutes(router.store.prevRoutes)

    const to = findRoute(currRoutes, idx, name)
    const from = findRoute(prevRoutes, idx, name)

    const isTransitioning =
      prevRoutes.length > 0 &&
      !areRoutesEqual(to, from) &&
      (canTransition(to) || canTransition(from))

    const dataProps = {
      'data-depth': idx,
      'data-name': name
    }

    return (
      <div className={`outlet`} {...dataProps}>
        <TransitionGroup
          to={to}
          from={isTransitioning ? from : undefined}
          isTransitioning={isTransitioning}
          additionalProps={rest}
        />
      </div>
    )
  }
}

const filterRoutes = routes => routes.filter(route => route.data.component)
const findRoute = (routes, outletIdx, outletName) => {
  if (typeof outletName === 'string') {
    return routes.slice().reverse().find(route => route.data.outlet === outletName)
  } else {
    return routes.filter(route => !route.data.outlet)[outletIdx]
  }
}
const canTransition = node => (node ? typeof node.onTransition === 'function' : false)

export default withRouter(observer(Outlet))
