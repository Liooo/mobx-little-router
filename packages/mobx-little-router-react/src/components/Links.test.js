// @flow
import React from 'react'
import { createRouter, mountInProvider } from '../testUtil'
import Link from './Link'

describe('Link', () => {
  let router

  beforeEach(() => {
    router = createRouter( [{ path: '', match: 'full'}, { path: 'foo' }])
    return router.start()
  })

  afterEach(() => {
    router.stop()
  })

  test('handles clicks', async () => {
    const wrapper = mountInProvider(router)(
      <div>
        <Link className="index" to="/">Index</Link>
        <Link className="foo" to="/foo">Foo</Link>
      </div>
    )

    wrapper.find('.foo').simulate('click')
    await delay(0)

    expect(router.store.location.pathname).toEqual('/foo/')

    wrapper.find('.index').simulate('click')
    await delay(0)
    
    expect(router.store.location.pathname).toEqual('/')
  })

  test('supports reload prop to skip router', async () => {
    const wrapper = mountInProvider(router)(
      <div>
        <Link reload className="foo" to="/foo">Foo</Link>
      </div>
    )

    wrapper.find('.foo').simulate('click')
    await delay(0)

    expect(router.store.location.pathname).toEqual('/')
  })

  test('supports onClick prop', async () => {
    const spy = jest.fn()
    const wrapper = mountInProvider(router)(
      <div>
        <Link onClick={spy} className="foo" to="/foo">Foo</Link>
      </div>
    )

    wrapper.find('.foo').simulate('click')
    await delay(0)

    expect(spy).toHaveBeenCalled()
  })

  test('supports Location objects', async () => {
    const location = {
      pathname: '/foo',
      hash: '#hey',
      query: {
        a: 1,
        b: 2
      }
    }
    const spy = jest.fn()
    const wrapper = mountInProvider(router)(
      <div>
        <Link onClick={spy} className="foo" to={location}>Foo</Link>
      </div>
    )

    wrapper.find('.foo').simulate('click')
    await delay(0)

    expect(spy).toHaveBeenCalled()
    expect(router.store.location.pathname).toEqual('/foo/')
    expect(router.store.location.hash).toEqual('#hey')
    expect(router.store.location.query).toEqual({ a: '1', b: '2' })
    expect(router.store.location.search).toEqual('?a=1&b=2')
  })

  test('supports Location objects with state', async () => {
    const afterSpy = jest.fn()

    const location = {
      pathname: '/foo',
      state: {
        scrollTo: {
          x: 0,
          y: 50
        },
        after: function() {
          afterSpy()
          return this.scrollTo.y
        }
      }
    }
    const spy = jest.fn()
    const wrapper = mountInProvider(router)(
      <div>
        <Link onClick={spy} className="foo" to={location}>Foo</Link>
      </div>
    )

    wrapper.find('.foo').simulate('click')
    await delay(0)

    expect(spy).toHaveBeenCalled()
    expect(router.store.location.pathname).toEqual('/foo/')

    const state = router.store.location.state || {}

    expect(state.scrollTo).toEqual({ x: 0, y: 50 })
    expect(state.after()).toEqual(50)
    expect(afterSpy).toHaveBeenCalled()
  })
})

function delay(ms: number) {
  return new Promise(res => {
    setTimeout(res, ms)
  })
}
