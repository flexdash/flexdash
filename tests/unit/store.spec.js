import { default as store, functions as f } from "@/store.js"

describe('Store walkTree', () => {
  let tree

  beforeEach(() => {
    tree = { a: 123, b: { c: 124 }, d: [ 1, [ { x: 144 } ], 3 ] }
  })

  it('traverses objects', () => {
    expect(f.walkTree(tree, ['a'])).toEqual(123)
    expect(f.walkTree(tree, ['b'])).toEqual({c:124})
    expect(f.walkTree(tree, ['b', 'c'])).toEqual(124)
  })
  it('traverses arrays', () => {
    expect(f.walkTree(tree, ['d', '0'])).toEqual(1)
    expect(f.walkTree(tree, ['d', '2'])).toEqual(3)
    expect(f.walkTree(tree, ['d', '1', '0', 'x'])).toEqual(144)
  })
  /*
  it('creates objects', () => {
    expect(f.walkTree(tree, ['x'])).toEqual({})
  })
  */
})
