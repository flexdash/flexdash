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
    expect(s.config).toHaveProperty('tabs')
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
  it('throws on deleting array elements', () => {
    expect(()=> s.insertData('grid1/widgets/0', undefined)).toThrow(StoreError)
    expect(()=> s.insertData('grid1/widgets/2', undefined)).toThrow(StoreError)
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
    s.pushUndo("old stuff", [])
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
    expect(s.undo.buf).toHaveLength(2)
    expect(s.undo.buf[1].tagline).toBe('test mutation')
    expect(s.undo.buf[1].mutation).toEqual([[`widgets/b/id`, old_b_id], [`widgets/a`, old_a]])
  })

  it('shifts old mutations out of undo', ()=>{
    // overfill the undo queue
    for (let i=0; i<20; i++) s.undo.buf.push({tagline: "old stuff "+i, mutation: []})
    expect(s.undo.buf).toHaveLength(21)
    // perform a mutation and check that the overflow got cleared and the right stuff is left
    s.qMutation('test mutation', [])
    expect(s.undo.buf).toHaveLength(10)
    expect(s.undo.buf[0].tagline).toBe('old stuff 11')
    expect(s.undo.buf[8].tagline).toBe('old stuff 19')
    expect(s.undo.buf[9].tagline).toBe('test mutation')
  })

})

describe('Store undo', () => {
  const grid_id = 'g00001'
  let s

  beforeEach(() => {
    s = new Store()
    s.initDash()
  })

  it('coalesces consecutive mutations to identical properties', () => {
    s.updateGrid(grid_id, { kind:'newgrid', foo:'bar' })
    expect(s.undo.buf).toHaveLength(1)
    expect(s.undo.buf[0].tagline).toBe('update grid kind,foo')
    expect(s.undo.buf[0].mutation).toContainEqual([`grids/${grid_id}/kind`, 'fixed-grid'])
    expect(s.undo.buf[0].mutation).toContainEqual([`grids/${grid_id}/foo`, undefined])
    s.updateGrid(grid_id, { kind:'newgrid', foo:'bar2' })
    expect(s.undo.buf).toHaveLength(1)
    expect(s.undo.buf[0].tagline).toBe('update grid kind,foo')
    expect(s.undo.buf[0].mutation).toContainEqual([`grids/${grid_id}/kind`, 'fixed-grid'])
    expect(s.undo.buf[0].mutation).toContainEqual([`grids/${grid_id}/foo`, undefined])
  })

  it('does not coalesce consecutive mutations to different props', () => {
    s.updateGrid(grid_id, { kind:'newgrid', foo:'bar' })
    expect(s.undo.buf).toHaveLength(1)
    s.updateGrid(grid_id, { kind:'newgrid', foo2:'bar2' })
    expect(s.undo.buf).toHaveLength(2)
  })

  it('performs an undo', () => {
    const old_config = JSON.stringify(s.config)
    s.updateGrid(grid_id, { kind:'newgrid', foo:'bar' })
    expect(s.undo.buf).toHaveLength(1)
    s.performUndo()
    expect(s.undo.buf).toHaveLength(0)
    expect(JSON.stringify(s.config)).toEqual(old_config)
  })

  it('throws on undo if the buffer is empty', () => {
    expect(()=> s.performUndo()).toThrow(StoreError)
  })
})

describe('Store initDash', () => {
  let s
  beforeEach(() => { s = new Store(); s.initDash() })

  it('throws on trying to init a non-empty store', () => {
    expect(()=> s.initDash()).toThrow(StoreError)
  })
})

// ===== tab mutations

describe('tab mutations', () => {
  let s
  beforeEach(() => {
    s = new Store()
    s.initDash()
  })

  describe('addTab', () => {
    it('adds a tab into an empty store', () => {
      const tab_ix = s.addTab()
      expect(tab_ix).toBe(1)
      expect(s.config.dash.tabs).toHaveLength(2)
      expect(Object.keys(s.config.tabs)).toHaveLength(2)
      expect(Object.keys(s.config.grids)).toHaveLength(2)
      expect(Object.keys(s.config.widgets)).toHaveLength(0)
    })
  })

  describe('deleteTab', () => {
    it('deletes an empty tab', () => {
      const old_config = JSON.stringify(s.config)
      const tab_ix = s.addTab()
      s.deleteTab(tab_ix)
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

  describe('updateTab', () => {
    beforeEach(() => {
      Vue.set(s.config.tabs, 't001', { icon: 'myicon', id: 't001', grids:['g1'] })
    })

    it('updates a tab with multiple props', () => {
      s.updateTab('t001', { icon:'newicon', foo:'bar' })
      expect(s.config.tabs.t001.icon).toBe('newicon')
      expect(s.config.tabs.t001.foo).toBe('bar')
      expect(s.config.tabs.t001.id).toBe('t001')
      expect(s.config.tabs.t001.grids.length).toBe(1)
      // check undo
      expect(s.undo.buf).toHaveLength(1)
      expect(s.undo.buf[0].tagline).toBe('update tab icon,foo')
      expect(s.undo.buf[0].mutation).toContainEqual([`tabs/t001/icon`, 'myicon'])
      expect(s.undo.buf[0].mutation).toContainEqual([`tabs/t001/foo`, undefined])
    })

    it('throws updating a non-existent tab', () => {
      expect(()=> s.updateTab('txxx', {})).toThrow(StoreError)
    })
  })
})

// ===== grid mutations

describe('grid mutations', () => {
  const tab_id = 't00001'
  let s
  beforeEach(() => {
    s = new Store()
    s.initDash()
  })

  describe('addGrid', () => {
    it('adds a grid into an empty store', () => {
      const grid_ix = s.addGrid(tab_id)
      expect(grid_ix).toBe(1)
      expect(s.config.tabs[tab_id].grids).toHaveLength(2)
      expect(Object.keys(s.config.grids)).toHaveLength(2)
      expect(Object.keys(s.config.widgets)).toHaveLength(0)
    })
  })

  describe('deleteGrid', () => {
    it('deletes an empty grid', () => {
      const old_config = JSON.stringify(s.config)
      s.addGrid(tab_id)
      s.deleteGrid(tab_id, 1)
      expect(JSON.stringify(s.config)).toEqual(old_config)
    })

    it('deletes a grid with widgets', () => {
      const old_config = JSON.stringify(s.config)
      const grid_ix = s.addGrid(tab_id)
      s.addWidget(s.gridIDByIX(tab_id, grid_ix), 'Stat')
      expect(Object.keys(s.config.widgets)).toHaveLength(1) // make sure a widget is inserted
      s.deleteGrid(tab_id, grid_ix)
      expect(JSON.stringify(s.config)).toEqual(old_config)
    })

    it('throws deleting a non-existent grid', () => {
      expect(()=> s.deleteGrid(tab_id, 55)).toThrow(StoreError)
    })
  })

  describe('updateGrid', () => {
    let grid_ix, grid_id
    beforeEach(() => {
      grid_ix = s.addGrid(tab_id)
      grid_id = s.gridIDByIX(tab_id, grid_ix)
    })

    it('updates a grid with multiple props', () => {
      s.updateGrid(grid_id, { kind:'newgrid', foo:'bar' })
      expect(s.config.grids[grid_id].kind).toBe('newgrid')
      expect(s.config.grids[grid_id].foo).toBe('bar')
      expect(s.config.grids[grid_id].id).toBe(grid_id)
      expect(s.config.grids[grid_id].widgets.length).toBe(0)
      // check undo
      expect(s.undo.buf).toHaveLength(2) // the addGrid and the updateGrid
      expect(s.undo.buf[1].tagline).toBe('update grid kind,foo')
      expect(s.undo.buf[1].mutation).toContainEqual([`grids/${grid_id}/kind`, 'fixed-grid'])
      expect(s.undo.buf[1].mutation).toContainEqual([`grids/${grid_id}/foo`, undefined])
    })

    it('throws updating a non-existent grid', () => {
      expect(()=> s.updateGrid('gxxx', {})).toThrow(StoreError)
    })
  })
})

// ===== widget mutations

describe('widget mutations', () => {
  const grid_id = 'g00001'
  let s
  beforeEach(() => {
    s = new Store()
    s.initDash()
  })

  describe('addWidget', () => {
    it('adds a widget into an empty grid', () => {
      const widget_ix = s.addWidget(grid_id, 'stat')
      expect(widget_ix).toBe(0)
      expect(s.config.grids[grid_id].widgets).toHaveLength(1)
      expect(Object.keys(s.config.widgets)).toHaveLength(1)
    })
  })

  describe('deleteWidget', () => {
    it('deletes a widget', () => {
      const old_config = JSON.stringify(s.config)
      const widget_id = s.addWidget(grid_id)
      expect(Object.keys(s.config.widgets)).toHaveLength(1)
      s.deleteWidget(grid_id, widget_id)
      expect(JSON.stringify(s.config)).toEqual(old_config)
    })

    it('throws deleting a non-existent widget', () => {
      expect(()=> s.deleteWidget(grid_id, 55)).toThrow(StoreError)
    })
  })

  describe('updateWidget', () => {
    let widget_ix, widget_id
    beforeEach(() => {
      widget_ix = s.addWidget(grid_id, 'stat')
      widget_id = s.widgetIDByIX(grid_id, widget_ix)
    })

    it('updates a widget with multiple props', () => {
      s.updateWidget(widget_id, { kind:'newwidget', foo:'bar' })
      expect(s.config.widgets[widget_id].kind).toBe('newwidget')
      expect(s.config.widgets[widget_id].foo).toBe('bar')
      expect(s.config.widgets[widget_id].id).toBe(widget_id)
      // check undo
      expect(s.undo.buf).toHaveLength(2) // the addWidget and the updateWidget
      expect(s.undo.buf[1].tagline).toBe('update widget kind,foo')
      expect(s.undo.buf[1].mutation).toContainEqual([`widgets/${widget_id}/kind`, 'stat'])
      expect(s.undo.buf[1].mutation).toContainEqual([`widgets/${widget_id}/foo`, undefined])
    })

    it('updates a widget prop', () => {
      s.updateWidgetProp(widget_id, 'static', 'title', 'bar')
      expect(s.config.widgets[widget_id].static.title).toBe('bar')
      expect(s.config.widgets[widget_id].id).toBe(widget_id)
      // check undo
      expect(s.undo.buf).toHaveLength(2) // the addWidget and the updateWidget
      expect(s.undo.buf[1].tagline).toBe('update widget prop static:title')
      expect(s.undo.buf[1].mutation).toContainEqual([`widgets/${widget_id}/static/title`, 'stat'])
    })

    it('adds a widget prop', () => {
      s.updateWidgetProp(widget_id, 'dynamic', 'title', 'bar')
      expect(s.config.widgets[widget_id].dynamic.title).toBe('bar')
      expect(s.config.widgets[widget_id].id).toBe(widget_id)
      // check undo
      expect(s.undo.buf).toHaveLength(2) // the addWidget and the updateWidget
      expect(s.undo.buf[1].tagline).toBe('update widget prop dynamic:title')
      expect(s.undo.buf[1].mutation).toContainEqual([`widgets/${widget_id}/dynamic/title`, undefined])
    })

    it('throws updating a non-existent widget', () => {
      expect(()=> s.updateWidget('wxxx', {})).toThrow(StoreError)
    })
  })

})
