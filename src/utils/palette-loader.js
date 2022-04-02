// palette-loader -- load widgets and grids dynamically
// Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

import { reactive } from 'vue'

// use Vite's module glob import to load widgets and grids
export default function(app) {
  const palette = reactive({ widgets: {}, grids: {}, count: 0, loaded: false, errors: [] })

  function module_list(mm) {
    return Object.keys(mm).map(m => m.replace(/^.*\/(.*)\.vue$/, '$1')).join(' ')
  }
  
  // given a module object, add it to the 'what' map using its proper name, and register
  // with Vue as a component in the app.
  function load_into(what, module) {
    const names = []
    for (const m in module) {
      const name = module[m].default.name
      if (name) {
        app.component(name, module[m].default)
        what[name] = module[m].default
        names.push(name)
      } else {
        throw Error(`Loading ${m} resulted in 'undefined'!?`)
      }
    }
    return names
  }

  // dynamically load extra (external) widgets from outside the source tree in dev mode.
  // This relies on vite's glob-loading feature and there being an 'xtra' directory at the top of
  // the FlexDash source tree that contains symlinks.
  async function load_extra_dev() {
    const proms = import.meta.globEager('/xtra/*/widgets/*.vue')
    //console.log(`***** xtra: ${Object.keys(proms).join(' ')}`)
    for (const path in proms) {
      try {
        const m = await proms[path]
        load_into(palette.widgets, {path: m})
        console.log(`Loaded widget ${m.default.name} from ${path}`)
      } catch (e) {
        console.log("Error loading external widget:" + e.message)
      }
    }
  }

  // dynamically load extra (external) widgets from outside the source tree in prod mode.
  // This relies on the web server providing a /xtra.json list of modules to load.
  async function load_extra_prod() {
    let proms
    try {
      let index = await fetch('./xtra.json')
      if (!index.ok) throw Error(`'${index.statusText}' fetching ./xtra.json`)
      index = await index.json()
      if (!Array.isArray(index)) throw Error(`./xtra.json does not contain an array`)
      proms = Object.fromEntries(index.map(p => [p, import(/* @vite-ignore */ `./../xtra/${p}`)]))
    } catch(e) {
      console.log(`Warning: can't fetch list of extra widgets: ${e.message}`)
      return
    }
    for (const path in proms) {
      try {
        const m = await proms[path]
        const names = load_into(palette.widgets, m.default)
        console.log(`Loaded widgets ${names.join(' ')} from ${path}`)
      } catch (e) {
        console.log(`Error loading external widgets from ${path}: ${e.message}`)
      }
    }
  }
  
  // load standard widgets and grids found in the FlexDash source tree.
  // This happens synchronously, which is OK because this stuff is all bundled into one JS
  // file anyway.
  async function load_std() {
    const widgets = import.meta.globEager('/src/widgets/*.vue')
    load_into(palette.widgets, widgets)
    console.log("Loaded std Widgets:", Object.keys(palette.widgets).join(' '))
    const grids = import.meta.globEager('/src/grids/*.vue')
    load_into(palette.grids, grids)
    console.log("Loaded std Grids:", Object.keys(palette.grids).join(' '))
  }

  load_std().then(() => {
    import.meta.env.PROD ? load_extra_prod() : load_extra_dev()
  }).then(() => {
    palette.loaded = true
  }).catch(err => {
    console.log("Error loading standard palette components:", err)
  })

  return palette
}
