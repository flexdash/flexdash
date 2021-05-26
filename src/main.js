// main -- A pile of mess that needs to go somewhere.
// Perhaps notable is the fact that we load grid and widget components globally here for now.
// Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

import Vue from 'vue'
import vuetify from './plugins/vuetify.js'
import Dash from './dash.vue'
import store from './store'

// Load socket.io from the local npm package (i.e. tell webpack to include it) and stick it into
// a global var so uibuilder finds it.
//window.io = require('socket.io-client')

Vue.config.productionTip = false

// use Vite's module glob import to load widgets and grids
const palette = Vue.observable({ widgets: {}, grids: {}, count: 0 })
function globImport(tgt, metaglob) {
  for (const path in metaglob) {
    metaglob[path]().then(mod => {
      const name = mod.default.name
      console.log(`Loaded ${name} from ${path}`)
      Vue.component(name, mod.default)
      Vue.set(tgt, name, mod.default)
    }).catch(err => {
      console.log(`Error glob-loading ${path}:`, err)
    })
  }
}
globImport(palette.widgets, import.meta.glob('/src/widgets/*.vue'))
globImport(palette.grids, import.meta.glob('./grids/*.vue'))

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

app.$mount('#app')
