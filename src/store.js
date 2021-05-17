// Store - Manages the data reflected from the server, which consts of the "server data"
// that is displayed by the dashboard as well as the "config" of the dashboard itself.
// Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

import Vue from 'vue'

// ===== helper functions

// walkTree takes the root of an object hierarchy and a dot-separated path, then walks
// down the tree along the path and returns the final node in the tree.
function walkTree(root, path) {
  let node = root
  path.forEach(function(d) {
    // handle traversing an array, need to parse index into an int
    if (Array.isArray(node)) {
      const ix = parseInt(d, 10)
      if (Number.isNaN(ix)) {
        console.log(`Array index '${d}' in '${path}' is not an int`)
        return undefined
      } else if (ix < 0 || ix >= node.length) {
        console.log(`Array index '${d}' in '${path}' > ${node.length}`)
        return undefined
      }
      node = node[ix]
    } else if (typeof node === 'object') {
      // need to handle undefined here because we explicitly set properties to undefined if
      // we need to attach a watcher to a property that doesn't exist
      if (!(d in node) || typeof node[d] === 'undefined')
        Vue.set(node, d, {}) // allow new subtrees to be created
      node = node[d]
    } else {
      console.log(`Level '${d}' of '${path}'' is not traversable: ${typeof node[d]}`)
      return undefined
    }
  })
  return node
}

// export helper functions for testing purposes
export const functions = {walkTree}

// ===== Store class

class Store {
  constructor () {
    this.root = Vue.observable({sd:{}, $config: {}})
    this.sd = this.root.sd // server data, i.e. the data being visualized by the dashboard
    this.config = this.root.$config // the dashboard's configuration
    return this
  }

  // insert data from a server message into the store.
  // Interprets the topic string as a hierarchy of object "levels" separated by slashes.
  insertData(msg) {
    const tt = msg.topic.split("/") // split levels of hierarchy
    if (!(tt.length > 0)) {
      console.log(`Cannot replace entire tree`)
      return
    }

    if (msg.topic === "$config") {
      Vue.set(this.root, '$config', msg.payload)
      this.config = this.root.$config
      //Object.keys(msg.payload).forEach(k => { Vue.set(this.root.config, k, msg.payload[k]) })
      console.log("Replaced $config with:", msg.payload)
      return
    }

    if (tt[0] !== "$config") tt.unshift("sd")
    const t = tt.pop() // separate off last level
    const dir = walkTree(this.root, tt) // start at root
    if (!dir) return
    // now dir[t] is the field to update

    // perform the update
    if (Array.isArray(dir)) {
      const ix = parseInt(t, 10)
      if (!Number.isNaN(ix)) {
        if (ix >= 0 && ix < dir.length) {
          console.log(`Updated array elt ${msg.topic} with`, msg.payload)
          Vue.set(dir, ix, msg.payload)
        } else if (ix == dir.length) {
          console.log(`Appended array elt ${msg.topic} with`, msg.payload)
          dir[ix].push(msg.payload)
        } else {
          console.log(`Array index '${ix}' in '${msg.topic}' > ${dir.length}`)
        }
      }
    } else if (typeof(dir) === 'object') {
      console.log(`Updated ${msg.topic} with:`, msg.payload)
      Vue.set(dir, t, msg.payload) // $set 'cause we may add new props to dir
    } else {
      console.log(`${msg.topic} is neither Array nor Object in server state`)
      return
    }
  }

}

const instance = new Store()
//Object.freeze(instance)

export default instance
