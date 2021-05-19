import Vue from 'vue'
import { default as store, Store, StoreError, functions as f } from "@/store.js"

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

  it('handles empty path components', () => {
    expect(f.walkTree(tree, ['', 'd', '1', '0', 'x'])).toEqual(144)
    expect(f.walkTree(tree, ['d', '', '1', '0', 'x'])).toEqual(144)
    expect(f.walkTree(tree, ['d', '1', '0', 'x', ''])).toEqual(144)
  })


  it('creates missing objects', () => {
    expect(f.walkTree(tree, ['x'])).toEqual({})
    expect(tree.x).toEqual({})
  })

  it('throws on non-integer array indices', () => {
    expect(()=> f.walkTree(tree, ['d', 'x'])).toThrow(StoreError)
  })
  it('throws on negative array indices', () => {
    expect(()=> f.walkTree(tree, ['d', '-3'])).toThrow(StoreError)
  })
  it('throws on array indices beyond the length', () => {
    expect(()=> f.walkTree(tree, ['d', '3'])).toThrow(StoreError)
  })

  it('throws on traversing non objects', () => {
    expect(()=> f.walkTree(tree, ['a', '0'])).toThrow(StoreError)
  })

  it('handles an empty path', () => {
    expect(typeof f.walkTree(tree, [])).toEqual('object')
    expect(f.walkTree(tree, []).a).toBe(123)
  })
})

describe('Store constructor', () => {
  let s
  beforeEach(() => {
    s = new Store()
  })
  it('initializes properly', () => {
    expect(s.sd).toBe(s.root.sd)
    expect(s.config).toBe(s.root.$config)
    expect(s.sd).toEqual({})
    expect(s.config).toEqual({})
    expect(Object.getOwnPropertyNames(s.root).length).toBe(3) // Vue adds __ob__
  })
})

describe('Store genID', () => {
  let coll
  beforeEach(() => {
    coll = {'w00122': 1, 'w00334': undefined}
  })
  it('generates a new id', () => {
    for (let i=0; i<1000; i++) coll[store.genId(coll, 'w')] = {}
    expect(Object.getOwnPropertyNames(coll).length).toBe(1002)
  })
})

describe('Store insertData', () => {
  let s

  beforeEach(() => {
    s = new Store()
    Vue.set(s.sd, 'widgets', {
      'a': { id: 'a', kind: 'stat' },
      'b': { id: 'b', kind: 'gauge' },
      'c': { id: 'c', kind: 'spark' },
    })
    Vue.set(s.sd, 'grid1', { id: 'g1', widgets: [ 'a', 'b' ] })
    Vue.set(s.sd, 'grid2', { id: 'g2', widgets: [ ] })
  })

  it('refuses to update the entire tree', () => {
    expect(()=> s.insertData('', {})).toThrow(StoreError)
    expect(Object.getOwnPropertyNames(s.root).length).toBe(3)
    expect(Object.getOwnPropertyNames(s.sd).length).toBe(4)
  })

  it('inserts into $config', () => {
    s.insertData('$config', {a:1})
    expect(s.root.$config.a).toBe(1)
    s.insertData('$config/b', 2)
    expect(s.root.$config.a).toBe(1)
    expect(s.root.$config.b).toBe(2)
  })

  it('inserts into sd', () => {
    s.insertData('widgets/d', 123)
    expect(s.root.sd.widgets.d).toBe(123)
  })
  it('updates an object', () => {
    s.insertData('widgets/a', 123)
    expect(s.root.sd.widgets.a).toBe(123)
  })

  it('updates an array elt', () => {
    s.insertData('grid1/widgets/0', 'x')
    expect(s.root.sd.grid1.widgets[0]).toBe('x')
    expect(s.root.sd.grid1.widgets[1]).toBe('b')
  })
  it('appends to an array', () => {
    s.insertData('grid1/widgets/2', 'x')
    expect(s.root.sd.grid1.widgets[2]).toBe('x')
    expect(s.root.sd.grid1.widgets[1]).toBe('b')
  })
  it('throws on bad array indices', () => {
    expect(()=> s.insertData('grid1/widgets/x', 'x')).toThrow(StoreError)
    expect(()=> s.insertData('grid1/widgets/-2', 'x')).toThrow(StoreError)
    expect(()=> s.insertData('grid1/widgets/4', 'x')).toThrow(StoreError)
    expect(s.root.sd.grid1.widgets).toEqual(['a', 'b'])
  })
  it('throws on tree walk errors', () => {
    s.insertData( 'foo', [{a:1}])
    expect(()=>s.insertData( 'foo/2/a', [{a:2}])).toThrow(StoreError)
    expect(s.root.sd.foo).toEqual([{a:1}])
  })
  it('throws on on inserting into a non-object', () => {
    expect(()=>s.insertData( 'widgets/a/id/foo', 999)).toThrow(StoreError)
    expect(s.root.sd.widgets.a.id).toEqual('a')
  })

})

describe('Store qMutation', () => {
  let s

  beforeEach(() => {
    s = new Store()
    Vue.set(s.config, 'widgets', {
      'a': { id: 'a', kind: 'stat' },
      'b': { id: 'b', kind: 'gauge' },
    })
    s.undo.push({tagline: "old stuff", mutations: []})
  })

  it('performs a mutation and enqueues its undo', () => {
    // mutation to enqueue and save the stuff it's going to replace
    const m = [ [ `widgets/a`, 99 ], [ `widgets/b/id`, 'x' ] ]
    const old_a = s.config.widgets.a
    const old_b_id = s.config.widgets.b.id
    s.qMutation('test mutation', m)
    //console.log("s.config is", JSON.stringify(s.config))
    // check that the update was performed
    expect(s.config.widgets.a).toBe(99)
    expect(s.config.widgets.b.id).toBe('x')
    expect(s.config.widgets.b.kind).toBe('gauge')
    // check that the old stuff showed up in the undo in reverse order
    expect(s.undo).toHaveLength(2)
    expect(s.undo[1].tagline).toBe('test mutation')
    expect(s.undo[1].mutation).toEqual([[`widgets/b/id`, old_b_id], [`widgets/a`, old_a]])
  })

  it('shifts old mutations out of undo', ()=>{
    // overfill the undo queue
    for (let i=0; i<20; i++) s.undo.push({tagline: "old stuff "+i, mutations: []})
    expect(s.undo).toHaveLength(21)
    // perform a mutation and check that the overflow got cleared and the right stuff is left
    s.qMutation('test mutation', [])
    expect(s.undo).toHaveLength(10)
    expect(s.undo[0].tagline).toBe('old stuff 11')
    expect(s.undo[8].tagline).toBe('old stuff 19')
    expect(s.undo[9].tagline).toBe('test mutation')
  })

})

describe('Store initDash', () => {
  let s
  beforeEach(() => { s = new Store(); s.initDash() })

  it('throws on trying to init a non-empty store', () => {
    expect(()=> s.initDash()).toThrow(StoreError)
  })
})

describe('Store addTab', () => {
  let s

  beforeEach(() => {
    s = new Store()
    s.initDash()
  })

  it('adds a tab into an empty store', () => {
    s.addTab()
    expect(s.config.dash.tabs).toHaveLength(2)
    expect(Object.keys(s.config.tabs)).toHaveLength(2)
    expect(Object.keys(s.config.grids)).toHaveLength(2)
    expect(Object.keys(s.config.widgets)).toHaveLength(0)
  })
})

describe('Store deleteTab', () => {
  let s

  beforeEach(() => {
    s = new Store()
    s.initDash()
  })

  it('deletes an empty tab', () => {
    const old_config = JSON.stringify(s.config)
    s.addTab()
    s.deleteTab(1)
    expect(JSON.stringify(s.config)).toEqual(old_config)
  })

  it('deletes a tab with widgets', () => {
    const old_config = JSON.stringify(s.config)
    s.addTab()
    const tab_id = s.config.dash.tabs[1]
    const grid_id = s.config.tabs[tab_id].grids
    s.qMutation("add widget", [
      [`widgets/w123`, { id: "w123" }], // insert widget
      [`grids/${grid_id}/widgets`, ['w123']], // link widget into grid
    ])
    expect(Object.keys(s.config.widgets)).toHaveLength(1) // make sure a widget is inserted
    s.deleteTab(1)
    expect(JSON.stringify(s.config)).toEqual(old_config)
  })

  it('throws deleting a non-existent tab', () => {
    expect(()=> s.deleteTab(55)).toThrow(StoreError)
  })
})
