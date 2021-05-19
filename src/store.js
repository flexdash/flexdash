// Store - Manages the data reflected from the server, which consts of the "server data"
// that is displayed by the dashboard as well as the "config" of the dashboard itself.
// Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

import Vue from 'vue'

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
      // we need to attach a watcher to a property that doesn't exist
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
export const functions = {walkTree}

// ===== Store class

export class Store {
  constructor () {
    this.root = Vue.observable({sd:{}, $config: {}})
    this.sd = this.root.sd // server data, i.e. the data being visualized by the dashboard
    this.config = this.root.$config // the dashboard's configuration
    this.queue = [] // queue of mutations to send to the server
    this.undo = [] // undo steps
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
  // TODO: this should throw an exception in case of error
  // FIXME: we currently assign undefined in order to delete an item, which works for objects but
  // not arrays, although technically it leaves the property in the object. Should figure out
  // whether to actually delete object properties but that may interfere with reactive watchers.
  // Undefined also serializes to null in JSON, so it's impossible to delete something from the
  // server end.
  insertData(topic, payload) {
    let tt = topic.split("/") // split levels of hierarchy
    tt = tt.filter(t => t.length > 0) // remove empty components, e.g. leading slash
    if (tt.length == 0) {
      throw new StoreError("Cannot replace entire hierarchy")
    }

    if (topic === "$config") {
      Vue.set(this.root, '$config', payload)
      this.config = this.root.$config
      //Object.keys(payload).forEach(k => { Vue.set(this.root.config, k, payload[k]) })
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
          console.log(`Updated array elt ${topic} with`, payload)
          old = dir[ix]
          Vue.set(dir, ix, payload)
        } else if (ix == dir.length) {
          console.log(`Appended array elt ${topic} with`, payload)
          old = undefined
          dir.push(payload)
        } else {
          throw new StoreError(`Array index '${ix}' in '${topic}' > ${dir.length}`)
        }
      } else {
        throw new StoreError(`Array index '${t}' is not a number`)
      }
    } else if (typeof(dir) === 'object') {
      console.log(`Updated ${topic} with:`, payload)
      old = dir[t]
      Vue.set(dir, t, payload) // $set 'cause we may add new props to dir
    } else {
      throw new StoreError(`${topic} is neither Array nor Object in server state`)
    }
     return old
  }


  // qMutation in the central function through which all mutations to the config must be
  // funneled. It applies the mutation locally and queues it for sending to the server,
  // then waits for an ack with a timeout.
  // It also records the mutation in in the undo buffer.
  // The tagline is a string that goes into the undo buffer and is indended to help the user
  // identify what the undo will do. Msgs is an array of [path, value] tuples with the
  // leading "$config/" omitted from the path.
  // If tagline is null, no undo steps are recorded, this is primarily used to perform
  // undo steps themselves.
  qMutation(tagline, msgs) {
    // apply the mutation locally and save the undo steps
    let undo = []
    for (const m of msgs) {
      undo.unshift([m[0], this.insertData("$config/" + m[0], m[1])]) // unshift to reverse the order
    }
    this.undo.push({tagline, mutation: undo})
    while (this.undo.length > 10) this.undo.shift()

    // send the mutation to the server
    // TODO!
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

  // ===== Operations on the dash

  // initDash initializes an empty dash with a tab and a grid, all empty...
  initDash() {
    if (this.config.dash) {
      //console.log("OOPS, config:", JSON.stringify(this.config))
      throw new StoreError("cannot init a non-empty store")
    }

    this.insertData('$config/widgets', {})
    this.insertData('$config/grids', {
      g00001: { id: 'g00001', kind: 'fixed-grid', widgets: [] },
    })
    this.insertData('$config/tabs', {
      t00001: { id: 't00001', icon: "view-dashboard", grids: ["g00001"] }
    })
    this.insertData('$config/dash', { title: "FlexDash", tabs: ['t00001'] })
  }

  // ===== Operations on tabs

  // addTab adds a new tab and initializes it with an empty grid
  addTab() {
      const tab_id = this.genId(this.config.tabs, "t")
      const grid_id = this.genId(this.config.grids, "g")
      this.qMutation("add a tab", [
        [`grids/${grid_id}`, { id: grid_id, kind: 'fixed-grid', widgets: [] } ],
        [`tabs/${tab_id}`, { id: tab_id, icon: 'rocket-launch', grids: [ grid_id ] } ],
        [`dash/tabs/${this.config.dash.tabs.length}`, tab_id ],
      ])
  }

  // deleteTab with index ix
  deleteTab(ix) {
    const tabs = this.config.dash.tabs
    if (ix < 0 || ix >= tabs.length) {
      throw new StoreError(`trying to delete tab ${ix} which doesn't exist`)
    }
    const tab_id = tabs[ix]
    const tab = this.config.tabs[tab_id]

    // collect the IDs of the grids and widgets we need to delete
    const grids = tab.grids
    const widgets = grids.map(g => this.config.grids[g].widgets).flat()

    // construct mutation to delete the whole shebang
    const m = ([]).concat(
        widgets.map(w => [ `widgets/${w}`, undefined ]),
        grids.map(g => [ `grids/${g}`, undefined ]),
        [[ `tabs/${tab_id}`, undefined ]],
        [[ `dash/tabs`, tabs.filter((t,i) => i != ix) ]],
    )
    console.log("deleteTab mutation:", JSON.stringify(m))
    this.qMutation("delete a tab", m)// add tab title to the message once tabs have that
  }







}

let instance = new Store()
export default instance

// for unit test purposes...
export function StoreReinit() { Object.assign(instance, new Store()) }

