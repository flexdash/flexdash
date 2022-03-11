// main -- A pile of mess that needs to go somewhere.
// Perhaps notable is the fact that we load grid and widget components globally here for now.
// Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

import Vue from 'vue'
import vuetify from './plugins/vuetify.js'
import Dash from './dash.vue'
import store from './store'

Vue.config.productionTip = false

if (!window.flexdash_options) window.flexdash_options = {}
const fo = window.flexdash_options
console.log("FlexDash options:", fo)
if (!fo.title) fo.title = "FlexDash"
document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend',
  `<title>${fo.title}</title>`
)

// hack to explicitly import a widget when the error message is too obscure
//const g = import.meta.glob('/src/widgets/thermostat.vue')['/src/widgets/thermostat.vue']()

// use Vite's module glob import to load widgets and grids
const palette = Vue.observable({ widgets: {}, grids: {}, count: 0 })
const palettePromises = []
// globImport triggers every promise produced by import.meta.glob and for all that fulfill, it loads
// the component into Vue. It also appends a promise to palettePromises that resolves to the name of
// the component.
function globImport(tgt, metaglob) {
  for (const path in metaglob) {
    palettePromises.push( // push a new promise
      metaglob[path]().then(mod => {
        // the module loaded successfully, register with Vue and resolve the pushed promise with the name
        const name = mod.default.name
        if (name) {
          console.log(`Loaded ${name} from ${path}`)
          Vue.component(name, mod.default)
          Vue.set(tgt, name, mod.default)
        } else {
          throw Error(`Loading ${path} resulted in 'undefined'!?`)
        }
        return name
      }).catch(err => {
        // the module failed to load, reject the pushed promise with the error after logging
        const txt = `Error glob-loading ${path}:\n${err.stack}`
        console.log(txt)
        throw new Error(txt)
      })
    )
  }
}
globImport(palette.widgets, import.meta.glob('/src/widgets/*.vue'))
globImport(palette.widgets, import.meta.glob('/xtra/*/widgets/*.vue'))
globImport(palette.grids, import.meta.glob('/src/grids/*.vue'))

const app = new Vue({
  vuetify,

  data: { // https://stackoverflow.com/questions/51275301/how-to-react-to-a-global-variable-with-vue
    // editMode encodes whether the edit toggle is on/off, access anywhere as this.$root.editMode
    editMode: fo.edit,
    // current route, gets initialized with the initial location that loads FlexDash
    route: window.location.hash,
    params: (new URL(document.location)).searchParams,
    // sending of messages, this global variable is "provided" by the connections component
    // and primarily used by the widget-wrapper
    serverSend: null,
    palettePromises: palettePromises,
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
