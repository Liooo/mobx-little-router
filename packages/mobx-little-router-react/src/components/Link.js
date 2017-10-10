// @flow
import React, { Component } from 'react'
import type { Element } from 'react'
import { observer } from 'mobx-react'
import type { Location } from 'mobx-little-router'
import { RouterType } from '../propTypes'
import cx from 'classnames'
import QueryString from 'qs'

type Props =  {
  to: string | Location,
  className?: string,
  activeClassName?: string,
  style?: Object,
  children?: Element<*>,
  exact?: boolean,
  reload?: boolean,
  onClick: Function
}

class Link extends Component<Props> {
  static contextTypes = {
    router: RouterType
  }

  onClick = (evt: Event) => {
    const { to, reload, onClick } = this.props

    if (reload === true) {
      return
    }

    evt.preventDefault()
    this.context.router.push(to)

    onClick && onClick(evt)
  }

  render() {
    const { to, className, activeClassName, style, children, exact } = this.props
    const href = typeof to === 'object'
      ? locationToHref(to)
      : to

    const matchPrefix = '^'
    const matchSuffix = '/?' + (exact === true ? '$' : '')
    const matcher = new RegExp(`${matchPrefix}${typeof href === 'string' ? href : ''}${matchSuffix}`)
    const isActive = matcher.test(this.context.router.store.location.pathname)

    return <a href={href} className={cx(className, typeof activeClassName ==='string' && { [activeClassName]: isActive })} style={style} onClick={this.onClick}>{children}</a>
  }
}

const locationToHref = (location: Location) => {
  const queryString = QueryString.stringify(location.query)
  const hash = location.hash || ''
  const search = (queryString ? `?${queryString}` : location.search) || ''
  
  return `${location.pathname}${hash}${search}`
}

export default observer(Link)
