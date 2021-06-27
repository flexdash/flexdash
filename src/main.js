// main -- A pile of mess that needs to go somewhere.
// Perhaps notable is the fact that we load grid and widget components globally here for now.
// Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

import Vue from 'vue'
import vuetify from './plugins/vuetify.js'
import Dash from './dash.vue'
import store from './store'

Vue.config.productionTip = false

if (!window.flexdash_options) window.flexdash_options = {}
console.log("FlexDash options:", window.flexdash_options)

// hack to explicitly import a widget when the error message is too obscure
//const g = import.meta.glob('/src/widgets/thermostat.vue')['/src/widgets/thermostat.vue']()

// use Vite's module glob import to load widgets and grids
const palette = Vue.observable({ widgets: {}, grids: {}, count: 0 })
function globImport(tgt, metaglob) {
  for (const path in metaglob) {
    metaglob[path]().then(mod => {
      const name = mod.default.name
      if (name) {
        console.log(`Loaded ${name} from ${path}`)
        Vue.component(name, mod.default)
        Vue.set(tgt, name, mod.default)
      } else {
        throw Error(`Loading ${path} resulted in 'undefined'!?`)
      }
    }).catch(err => {
      console.log(`Error glob-loading ${path}:`, err)
    })
  }
}
globImport(palette.widgets, import.meta.glob('/src/widgets/*.vue'))
globImport(palette.grids, import.meta.glob('/src/grids/*.vue'))

/*
// custom module loading
import { loadModule } from 'vue3-sfc-loader/dist/vue2-sfc-loader.js'
const options = {
  moduleCache: { vue: Vue, },

  async getFile(url) {
    const res = await fetch(url)
    if (!res.ok)
      throw Object.assign(new Error(res.statusText + ' ' + url), { res })
    return {
      getContentData: asBinary => asBinary ? res.arrayBuffer() : res.text(),
    }
  },

  addStyle(textContent) {
    const style = Object.assign(document.createElement('style'), { textContent })
    const ref = document.head.getElementsByTagName('style')[0] || null
    document.head.insertBefore(style, ref)
  },
}

loadModule('/custom.vue', options)
  .then(component => {
    Vue.component(component.name, component)
    Vue.set(palette.widgets, component.name, component)
    console.log("Loaded /custom.vue")
  }).catch(e => {
    console.log("Error loading /custom.vue:", e)
  })
*/

const app = new Vue({
  vuetify,

  data: { // https://stackoverflow.com/questions/51275301/how-to-react-to-a-global-variable-with-vue
    // editMode encodes whether the edit toggle is on/off, access anywhere as this.$root.editMode
    editMode: false,
    // current route, gets initialized with the initial location that loads FlexDash
    route: window.location.hash,
    params: (new URL(document.location)).searchParams,
    // sending of messages, this global variable is "provided" by the connections component
    // and primarily used by the widget-wrapper
    serverSend: null,
    // dashboard title from options
    dash_title: flexdash_options.title || "FlexDash",
  },

  provide: {
    // Provide the store to all components through the hierarchy
    $config: store.config,
    $store: store,
    // provide the widget and grid palettes to all components (although just a couple need them)
    palette,
  },


  render: h => h(Dash)
}).$mount('#app')

window.addEventListener('popstate', () => {
  const sp = (new URL(document.location)).searchParams
  console.log(`POP! hash=${window.location.hash} qstring=${sp}`)
  app.route = window.location.hash
  app.params = sp
})
