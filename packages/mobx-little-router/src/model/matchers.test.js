// @flow
import * as m from './matchers'

describe('URL matchers', () => {
  test('partial', () => {
    expect(m.partial('shows/:id')('/shows/1/edit')).toEqual({
      matched: true,
      params: { id: '1' },
      parentUrl: '',
      segment: '/shows/1',
      remaining: '/edit'
    })

    expect(m.partial('/shows/:id')('/shows/2/edit')).toEqual({
      matched: true,
      params: { id: '2' },
      parentUrl: '',
      segment: '/shows/2',
      remaining: '/edit'
    })

    expect(m.partial('')('/shows/2')).toEqual({
      matched: true,
      params: {},
      parentUrl: '',
      segment: '',
      remaining: '/shows/2'
    })

    expect(m.partial('/')('/shows/2')).toEqual({
      matched: true,
      params: {},
      parentUrl: '',
      segment: '',
      remaining: '/shows/2'
    })

    expect(m.partial('/shows/:id')('/nope')).toEqual({
      matched: false,
      params: null,
      parentUrl: '',
      segment: '',
      remaining: '/nope'
    })
  })

  test('full', () => {
    expect(m.full('shows/:id')('/shows/1')).toEqual({
      matched: true,
      params: { id: '1' },
      parentUrl: '',
      segment: '/shows/1',
      remaining: undefined
    })

    expect(m.full('/shows/:id')('/shows/2')).toEqual({
      matched: true,
      params: { id: '2' },
      parentUrl: '',
      segment: '/shows/2',
      remaining: undefined
    })

    expect(m.full('/')('/')).toEqual({
      matched: true,
      params: {},
      parentUrl: '',
      segment: '',
      remaining: undefined
    })

    expect(m.full('')('/')).toEqual({
      matched: true,
      params: {},
      parentUrl: '',
      segment: '',
      remaining: undefined
    })

    expect(m.full('')('/shows/1')).toEqual({
      matched: false,
      params: null,
      parentUrl: '',
      segment: '',
      remaining: '/shows/1'
    })
  })

  test('any', () => {
    expect(m.any('')('/whatever')).toEqual({
      matched: true,
      params: null,
      parentUrl: '',
      segment: '/whatever',
      remaining: ''
    })})
})
