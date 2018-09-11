// @flow
import findPathFromRoot from './findPathFromRoot'
import createRouteStateTreeNode from '../creating/createRouteStateTreeNode'

describe('findPathFromRoot', () => {
  test('Find with partial matching', async () => {
    const root = createRouteStateTreeNode({
      path: 'a',
      children: [
        { path: 'b', children: [] },
        {
          path: 'c',
          children: [{ path: 'd', children: [] }]
        }
      ]
    })

    const r1 = await findPathFromRoot(root, '/a/b')
    expect(r1.map(x => x.node.value.path)).toEqual(['a', 'b'])

    const r2 = await findPathFromRoot(root, '/a/c/d')
    expect(r2.map(x => x.node.value.path)).toEqual(['a', 'c', 'd'])
  })

  test('Find with mix of partial and full matching', async () => {
    const root = createRouteStateTreeNode(
      config('', 'partial', [
        // This match consumes the entire URL.
        // Useful for index routes.
        config('', 'full', []),

        config('a', 'partial', [
          config('b', 'partial', [
            config('c', 'partial', [config('', 'full', [config('', 'full', [])])])
          ])
        ])
      ])
    )

    const r1 = await findPathFromRoot(root, '/a/b/c')
    expect(r1.map(x => x.node.value.path)).toEqual(['', 'a', 'b', 'c', ''])

    const r2 = await findPathFromRoot(root, '/')
    expect(r2.map(x => x.node.value.path)).toEqual(['', ''])
  })

  test('params chaining', async () => {
    const root = createRouteStateTreeNode(
      config('', 'partial', [
        config(':a', 'partial', [
          config(':b', 'partial', [
            config(':c', 'full', [])
          ])
        ])
      ])
    )

    const r1 = await findPathFromRoot(root, '/1/2/3')
    expect(r1[3].params).toEqual({
      a: '1',
      b: '2',
      c: '3',
    })
  })
})

function config(path, match, children) {
  return { path, match, children }
}
