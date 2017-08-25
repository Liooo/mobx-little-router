// @flow
import { autorun } from 'mobx'
import RouterStore from './RouterStore'
import Route from './Route'

describe('RouterStore', () => {
  let store

  beforeEach(() => {
    store = new RouterStore()
  })

  test('Initial parent', () => {
    expect(store.state.root.value.path).toEqual('')
    expect(store.cache.get(store.state.root.value.key)).toBe(store.state.root)
  })

  test('Updating children', done => {
    const a = Route({
      path: 'a',
      children: []
    })

    const b = Route({
      path: 'b',
      children: []
    })

    // Make sure we can get a reaction to children changes.
    autorun(() => {
      if (store.state.root.children.length > 0) {
        done()
      }
    })

    store.replaceChildren(store.state.root, [a, b])

    expect(store.state.root.children.length).toBe(2)

    // Stores new nodes in lookup table.
    expect(store.cache.get(a.value.key)).toBe(a)
    expect(store.cache.get(b.value.key)).toBe(b)

    expect(() => store.replaceChildren(Route({ path: '' }), [])).toThrow(
      /Node not found/
    )
  })

  test('Activating nodes', () => {
    const a = Route({
      path: 'a',
      children: []
    })

    const b = Route({
      path: 'b',
      children: []
    })

    store.replaceChildren(store.state.root, [a])
    store.updateNodes([store.state.root, a])

    expect(store.nodes.length).toBe(2)
    expect(store.nodes[0].value.path).toEqual('')
    expect(store.nodes[1].value.path).toEqual('a')
  })

  test('Node update', () => {
    store.updateNode(store.state.root, {
      data: {
        x: 'Hello'
      }
    })

    expect(store.state.root.value.data.x).toEqual('Hello')

    expect(() => {
      store.updateNode(Route({
        path: 'doesnotexist',
        children: []
      }), {})
    }).toThrow(/Node not found/)
  })
})
