// @flow
import { extendObservable } from 'mobx'
import { findNode } from '../util/tree'
import type { RouteNode } from './types'
import findPathFromRoot from '../matching/findPathFromRoot'
import type { MatchResult } from '../matching/findPathFromRoot'
import type { OnExhaustedFn } from '../matching/findPathFromRoot'

export default class RouterStateTree {
  root: RouteNode

  constructor(root: RouteNode) {
    extendObservable(this, {
      root: root
    })
  }

  find(predicate: (x: RouteNode) => boolean) {
    return findNode(predicate, this.root)
  }

  async pathFromRoot(path: string[], onExhausted: OnExhaustedFn): Promise<MatchResult[]> {
    return findPathFromRoot(this.root, path, onExhausted)
  }
}
