// Store - Manages the data reflected from the server, which consts of the "server data"
// that is displayed by the dashboard as well as the "config" of the dashboard itself.
// Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

import Vue from 'vue'

// import cloneDeep from 'lodash.clonedeep'
// Use JSON instead of importing 9KB for cloneDeep -- we only use it to create widgets and
// since this is infrequent going through JSON is not that awful
function cloneDeep(obj) { return JSON.parse(JSON.stringify(obj)) }

export class StoreError extends Error {
  constructor (message) {
    super(message)
    this.name = 'StoreError'
    return this
  }
}

// ===== helper functions

// walkTree takes the root of an object hierarchy and a dot-separated path, then walks
// down the tree along the path and returns the final node in the tree.
function walkTree(root, path) {
  let node = root
  for (const d of path) {
    // handle empty path element (e.g. consecutive slashes
    if (d == '') {
      // do nothing
    // handle traversing an array, need to parse index into an int
    } else if (Array.isArray(node)) {
      const ix = parseInt(d, 10)
      if (Number.isNaN(ix)) {
        throw new StoreError(`Array index '${d}' in '${path}' is not an int`)
      } else if (ix < 0 || ix >= node.length) {
        throw new StoreError(`Array index '${d}' in '${path}' > ${node.length}`)
      }
      node = node[ix]
    } else if (typeof node === 'object') {
      // need to handle undefined here because we explicitly set properties to undefined if
      // we need to attach a watcher to a property that doesn't exist FIXME: outdated?
      if (!(d in node) || typeof node[d] === 'undefined')
        Vue.set(node, d, {}) // allow new subtrees to be created
      node = node[d]
    } else {
      throw new StoreError(`Level '${d}' of '${path}'' is not traversable: ${typeof node[d]}`)
    }
  }
  return node
}

// export helper functions for testing purposes
export {walkTree}

// ===== Store class

// empty objects for addTab, addGrid, etc. The ID is missing and must be added!
const empty_tab = { icon: 'rocket-launch', title: "" }
const empty_grid = { kind: 'FixedGrid', title: "", widgets: [] }
const empty_widget = { kind: 'Stat', rows:1, cols:1, static:{title:"Stat"}, dynamic:{} }

export class Store {
  constructor () {
    // At init we need to populate $config a little so Vue2's watchers work, sigh...
    this.root = Vue.observable({
      sd:{},
      $config: {dash:{}, tabs:{}, grids:{}, widgets:{}, conn:{}}
    })
    this.sd = this.root.sd // server data, i.e. the data being visualized by the dashboard
    this.config = this.root.$config // the dashboard's configuration
    this.undo = Vue.observable({ buf:[], at:null }) // undo steps
    return this
  }

  // insert data from a server message into the store.
  // Interprets the topic string as a hierarchy of object "levels" separated by slashes and
  // mutates the data at the final path element.
  // If the path does not exist it is created using objects, i.e., arrays must be insrted
  // explicitly and cannot be created just by traversing a path.
  // If the type of the second to last path element (i.e. the last "directory" element) is
  // an array then a value can be appended by writing to one past the last index.
  // insertData returns the old value that got updated so it can be used to undo the
  // insertion (except that intermediate path elements that were created in the traversal
  // will not be deleted by this).
  insertData(topic, payload) {
    let tt = topic.split("/") // split levels of hierarchy
    tt = tt.filter(t => t.length > 0) // remove empty components, e.g. leading slash
    if (tt.length == 0) {
      throw new StoreError("Cannot replace entire hierarchy")
    }

    if (topic === "$config") {
      // beware of Vue2 reactivity limitations...
      //Vue.set(this.root, '$config', payload)
      //this.config = this.root.$config
      Object.keys(payload).forEach(k => { Vue.set(this.config, k, payload[k]) })
      console.log("Replaced $config with:", payload)
      return
    }

    if (tt[0] !== "$config") tt.unshift("sd")
    const t = tt.pop() // separate off last level
    const dir = walkTree(this.root, tt) // start at root
    // now dir[t] is the field to update

    // perform the update
    let old = undefined
    if (Array.isArray(dir)) {
      const ix = parseInt(t, 10)
      if (!Number.isNaN(ix)) {
        if (ix >= 0 && ix < dir.length) {
          if (payload === undefined) // can't produce a simple undo
            throw new StoreError(`Cannot delete array element '${ix}' in '${topic}'`)
          old = dir[ix]
          //console.log(`Updated array elt ${topic} with`, payload)
          Vue.set(dir, ix, payload)
        } else if (ix == dir.length) {
          if (payload === undefined)
            throw new StoreError(`Array index '${ix}' in '${topic}' >= ${dir.length}`)
          old = undefined
          //console.log(`Appended array elt ${topic} with`, payload)
          dir.push(payload)
        } else {
          throw new StoreError(`Array index '${ix}' in '${topic}' > ${dir.length}`)
        }
      } else {
        throw new StoreError(`Array index '${t}' is not a number`)
      }
    } else if (typeof(dir) === 'object') {
      old = dir[t]
      if (payload !== undefined) {
        //console.log(`Updated ${topic} with:`, payload)
        Vue.set(dir, t, payload) // $set 'cause we may add new props to dir
      } else {
        //console.log(`Deleted ${topic}`)
        delete dir[t]
      }
    } else {
      throw new StoreError(`${topic} is neither Array nor Object in server state`)
    }
    return old
  }

  // pushUndo pushes a mutation onto the undo buffer but coalesces consecutive mutations with the
  // same tagline if they happen within a minute of one-another in order to make undo meaningful
  // when performing repetitive actions, such as hitting the + button on a numeric input.
  pushUndo(tagline, mutation) {
    const now = Date.now()
    const u = this.undo
    if (u.at && u.buf.length > 0 && now-u.at < 60000 && tagline == u.buf[u.buf.length-1].tagline)
    {
      // coalesce FIXME: should also coalesce mutations that update the same thing...
      //console.log("undo coalesce")
      u.buf[u.buf.length-1].mutation = [ ...mutation, ...u.buf[u.buf.length-1].mutation ]
    } else {
      // std push
      u.at = now
      u.buf.push({tagline, mutation})
      while (u.buf.length > 10) u.buf.shift()
    }
  }

  // performUndo replays a recorded undo mutation off the stack.
  // TODO: consider implementing redo?
  performUndo() {
    console.log("perform undo")
    const u = this.undo
    if (u.buf.length == 0) throw new StoreError("undo buffer is empty")
    const m = u.buf.pop()
    u.at = null
    this.qMutation(null, m.mutation)
  }

  // qMutation in the central function through which all mutations to the config must be
  // funneled. It applies the mutation locally and sends it to the server.
  // It also records the mutation in the undo buffer.
  // The tagline is a string that goes into the undo buffer and is intended to help the user
  // identify what the undo will do. Msgs is an array of [path, value] tuples with the
  // leading "$config/" omitted from the path.
  // If tagline is null, no undo steps are recorded, this is primarily used to perform
  // undo steps themselves.
  qMutation(tagline, msgs) {
    console.log("queueing mutation", tagline)
    // apply the mutation locally and save the undo steps
    let undo = []
    for (const m of msgs) {
      undo.unshift([m[0], this.insertData("$config/" + m[0], m[1])]) // unshift to reverse the order
    }
    if (tagline) this.pushUndo(tagline, undo)

    // send the mutation to the server
    for (const m of msgs) {
      this.sendMutation(m[0])
    }
  }

  // sendMutation forwards the data touched by a mutation to the server for saving. To keep the
  // server end simple we always send a top-level config topic or a complete object one level
  // down (e.g. a complete tab, grid, widget).
  sendMutation(topic) {
    const tt = topic.split('/')
    let t = '$config/' + tt[0]
    let d = this.config[tt[0]]
    if (tt.length > 1) {
      t += '/' + tt[1]
      d = d[tt[1]]
    }
    this.serverSend(t, d)
  }

  // generate an id for a new item in a collection
  // example: to generate a new widget ID use genId(store.config.widgets, "w")
  genId(collection, prefix) {
    let id = null
    while (!id || id in collection) {
      id = "00000" + Math.floor(Math.random() * 10000)
      id = prefix + id.substring(id.length-5)
    }
    return id
  }

  // ===== Getters with error checks

  tabByID(id) {
    const tab = this.config.tabs[id]
    if (tab && tab.id == id) return tab
    throw new StoreError(`tab ${id} does not exist`)
  }

  gridByID(id) {
    const grid = this.config.grids[id]
    if (grid && grid.id == id) return grid
    throw new StoreError(`grid ${id} does not exist`)
  }

  widgetByID(id) {
    const widget = this.config.widgets[id]
    if (widget && widget.id == id) return widget
    throw new StoreError(`widget ${id} does not exist`)
  }

  tabIDByIX(ix) {
    const tabs = this.config.dash.tabs
    if (tabs && ix >= 0 && ix < tabs.length) return tabs[ix]
    throw new StoreError(`tab #${ix} does not exist`)
  }

  // tab may be a tab_id (string) or a tab object
  gridIDByIX(tab, ix) {
    if (typeof tab === 'string') tab = this.tabByID(tab)
    if (tab && ix >= 0 && ix < tab.grids.length) return tab.grids[ix]
    throw new StoreError(`grid #${ix} does not exist in tab ${tab.id}`)
  }

  // grid may be a grid_id (string) or a grid object
  widgetIDByIX(grid, ix) {
    if (typeof grid === 'string') grid = this.gridByID(grid)
    if (grid && ix >= 0 && ix < grid.widgets.length) return grid.widgets[ix]
    throw new StoreError(`widget #${ix} does not exist in grid ${grid&&grid.id}`)
  }

  // panel may be a panel_id (string) or a panel object
  widgetIDByPanelIX(panel, ix) {
    if (typeof panel === 'string') panel = this.widgetByID(panel)
    if (panel && ix >= 0 && ix < panel.static.widgets.length) return panel.static.widgets[ix]
    throw new StoreError(`widget #${ix} does not exist in panel ${panel&&panel.id}`)
  }

  // ===== Operations on the dash

  // initDash initializes an empty dash with a tab and a grid, all empty...
  initDash() {
    if (this.config.dash.title) {
      //console.log("OOPS, config:", JSON.stringify(this.config))
      throw new StoreError("cannot init a non-empty store")
    }

    this.insertData('$config/widgets', {})
    this.insertData('$config/grids', {
      g00001: { id: 'g00001', kind: 'FixedGrid', widgets: [] },
    })
    this.insertData('$config/tabs', {
      t00001: { id: 't00001', icon: "view-dashboard", grids: ["g00001"] }
    })
    this.insertData('$config/dash', { title: "FlexDash", tabs: ['t00001'] })
  }

  // updateDash given props to update (an object that gets merged into existing props)
  updateDash(props) {
    this.qMutation(`update dash ${Object.keys(props).join(",")}`,
      Object.entries(props).map(([k,v]) => [`dash/${k}`, v])
    )
  }


  // ===== Operations on tabs

  // addTab adds a new tab and initializes it either with an empty grid or empty URL
  // returns the index of the new tab
  addTab(kind) {
      const tab_id = this.genId(this.config.tabs, "t")
      const tab_ix = this.config.dash.tabs.length
      if (kind === 'grid') {
        const grid_id = this.genId(this.config.grids, "g")
        this.qMutation("add a grid tab", [
          [`grids/${grid_id}`, {  ...cloneDeep(empty_grid), id: grid_id }],
          [`tabs/${tab_id}`, { ...cloneDeep(empty_tab), id: tab_id, grids: [grid_id] }],
          [`dash/tabs/${tab_ix}`, tab_id ],
        ])
      } else if (kind === 'iframe') {
        this.qMutation("add an iframe tab", [
          [`tabs/${tab_id}`, { ...cloneDeep(empty_tab), id: tab_id, slot: 'a', url: "" }],
          [`dash/tabs/${tab_ix}`, tab_id ],
        ])
      } else {
        throw new StoreError(`unknown tab type ${kind}`)
      }
    return tab_ix
  }

  // deleteTab with index ix
  deleteTab(ix) {
    const tab_id = this.tabIDByIX(ix)
    // collect the IDs of the grids and widgets we need to delete
    const grids = this.tabByID(tab_id).grids
    const widgets = grids.map(g => this.config.grids[g].widgets).flat()

    // construct mutation to delete the whole shebang
    this.qMutation("delete a tab", [ // FIXME: add tab title to the message once implemented
        [ `dash/tabs`, this.config.dash.tabs.filter((t,i) => i != ix) ],
        [ `tabs/${tab_id}`, undefined ],
        ...grids.map(g => [ `grids/${g}`, undefined ]),
        ...widgets.map(w => [ `widgets/${w}`, undefined ]),
    ])
  }

  // updateTab given ID and props to update (an object that gets merged into existing props)
  updateTab(tab_id, props) {
    this.tabByID(tab_id) // just for the sanity check
    this.qMutation(`update tab ${Object.keys(props).join(",")}`,
      Object.entries(props).map(([k,v]) => [`tabs/${tab_id}/${k}`, v])
    )
  }

  // updateDash props (an object that gets merged into existing props)
  updateDash(props) {
    this.qMutation(`update dash ${Object.keys(props).join(",")}`,
      Object.entries(props).map(([k,v]) => [`dash/${k}`, v])
    )
  }

  // ===== Operations on grids

  // addGrid adds a new grid to a tab and initializes it with an empty set of widgets
  // returns the index of the new grid in tab.grids
  addGrid(tab_id) {
    const tab = this.tabByID(tab_id)
    const grid_id = this.genId(this.config.grids, "g")
    const grid_ix = tab.grids.length
    this.qMutation("add a grid", [ // FIXME: add tab name when implemented
      [`grids/${grid_id}`, { ...cloneDeep(empty_grid), id: grid_id } ],
      [`tabs/${tab_id}/grids/${grid_ix}`, grid_id ],
    ])
    return grid_ix
  }

  // deleteGrid with index ix from tab tab_id
  deleteGrid(tab_id, ix) {
    const tab = this.tabByID(tab_id)
    const grid_id = this.gridIDByIX(tab, ix)
    const grid = this.gridByID(grid_id)
    // construct mutation to delete the grid and its widgets
    this.qMutation("delete a grid", [ // FIXME: add tab title to the message once implemented
      [ `tabs/${tab_id}/grids`, tab.grids.filter((g,i) => i != ix) ],
      [ `grids/${grid_id}`, undefined ],
      ...grid.widgets.map(w => [ `widgets/${w}`, undefined ]),
    ])
  }

  // updateGrid given ID and props to update (an object that gets merged into existing props)
  updateGrid(grid_id, props) {
    this.gridByID(grid_id) // just for the sanity check
    this.qMutation(`update grid ${Object.keys(props).join(",")}`,
      Object.entries(props).map(([k,v]) => [`grids/${grid_id}/${k}`, v])
    )
  }

  // ===== Operations on widgets

  // addWidget adds a new widget of the specified kind to a grid
  // returns the index of the new widget in the grid
  addWidget(grid_id, kind) {
    const grid = this.gridByID(grid_id)
    const widget_id = this.genId(this.config.widgets, "w")
    const widget_ix = grid.widgets.length
    this.qMutation("add a widget", [ // FIXME: add tab name when implemented
      [`widgets/${widget_id}`,
        { ...cloneDeep(empty_widget), id: widget_id, kind, static:{title:kind}, dynamic:{} } ],
      [`grids/${grid_id}/widgets/${widget_ix}`, widget_id ],
    ])
    return widget_ix
  }

  // addPanelWidget adds a new widget of the specified kind to a panel (which is a widget)
  // returns the index of the new widget in the panel
  addPanelWidget(panel_id, kind) {
    const panel = this.widgetByID(panel_id)
    const widget_id = this.genId(this.config.widgets, "w")
    const widget_ix = panel.static.widgets.length
    this.qMutation("add a widget", [ // FIXME: add tab name when implemented
      [`widgets/${widget_id}`,
        { ...cloneDeep(empty_widget), id: widget_id, kind, static:{title:kind}, dynamic:{} } ],
      [`widgets/${panel_id}/static/widgets/${widget_ix}`, widget_id ],
    ])
    return widget_ix
  }

  // deleteWidget with index ix from grid grid_id
  deleteWidget(grid_id, ix) {
    const grid = this.gridByID(grid_id)
    const widget_id = this.widgetIDByIX(grid, ix)
    // construct mutation to delete the widget
    this.qMutation("delete a widget", [ // add tab title to the message once implemented
      [ `grids/${grid_id}/widgets`, grid.widgets.filter((w,i) => i != ix) ],
      [ `widgets/${widget_id}`, undefined ],
    ])
  }

  // deletePanelWidget with index ix from panel panel_id
  deletePanelWidget(panel_id, ix) {
    const panel = this.widgetByID(panel_id)
    const widget_id = this.widgetIDByPanelIX(panel, ix)
    // construct mutation to delete the widget
    this.qMutation("delete a widget", [ // add tab title to the message once implemented
      [ `widgets/${panel_id}/static/widgets`, panel.static.widgets.filter((w,i) => i != ix) ],
      [ `widgets/${widget_id}`, undefined ],
    ])
  }

  // updateWidget given ID and props to update (an object that gets merged into existing props)
  updateWidget(widget_id, props) {
    this.widgetByID(widget_id) // just for the sanity check
    this.qMutation(`update widget ${Object.keys(props).join(",")}`,
      Object.entries(props).map(([k,v]) => [`widgets/${widget_id}/${k}`, v])
    )
  }

  // updateWidgetProp, which is static|dynamic, prop is key within that
  updateWidgetProp(widget_id, which, prop, value) {
    this.widgetByID(widget_id) // just for the sanity check
    this.qMutation(`update widget prop ${which}:${prop} <- ${value}`,
      [[`widgets/${widget_id}/${which}/${prop}`, value]]
    )
  }




}

let instance = new Store()
export default instance

// for unit test purposes...
export function StoreReinit() { Object.assign(instance, new Store()) }

