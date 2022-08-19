// main -- A pile of mess that needs to go somewhere.
// Perhaps notable is the fact that we load grid and widget components globally here for now.
// Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

import { createApp, reactive } from 'vue'
import vuetify, { components } from './plugins/vuetify'
import Dash from './dash.vue'
import Store from './store'
import loadPalette from './utils/palette-loader'

// insert a title tag into the HTML head
if (!window.flexdash_options) window.flexdash_options = {}
const fo = window.flexdash_options
console.log("FlexDash options:", JSON.stringify(fo))
if (!fo.title) fo.title = "FlexDash"
document.getElementsByTagName('title')[0].innerText = fo.title

const app = createApp(Dash)
app.use(vuetify)

// register all Vuetify components so dynamically loaded components can
// reference them and "they're just there"
const list = []
Object.keys(components).forEach(k => {
  if (k.startsWith('V')) {
    app.component(k, components[k])
    list.push(k)
  }
})
console.log("Registered Vuetify components:", list.join(', '))


// load widgets and grids and provide them to all components (although just a couple need them)
const palette = loadPalette(app)
app.provide('palette', palette)

// Initialize data and configuration store
const store = new Store(app)
window.fd_store = store // for debugging in prod mode...
// Provide the store to all components through the hierarchy
app.provide('$config', store.config)
app.provide('$store', store)

// editMode encodes whether the edit toggle is on/off
app.provide('global', reactive({
  editMode: !!fo.edit, // variable used "everywhere", initialized from fd options
  noAddDelete: !!fo.no_add_delete, // suppresses add/delete buttons
  noDemo: !!fo.no_demo, // suppresses demo mode
  route: window.location.hash, // #xxx in URL, determines initial tab shown
  params: (new URL(document.location)).searchParams, // options passed in on page load
}))
// server connection, fields set by the connections component
app.provide('$conn', {})

app.mount('#app')

window.addEventListener('popstate', () => {
  const sp = (new URL(document.location)).searchParams
  console.log(`POP! hash=${window.location.hash} qstring=${sp}`)
  app.route = window.location.hash
  app.params = sp
})

// ===== define some globals which are used by dynamically loaded widgets

import * as vue_all from 'vue'
import * as vuetify_all from 'vuetify'
import * as uplot_all from 'uplot'
window.Vue = vue_all
window.Vuetify = vuetify_all
window.uplot = uplot_all
window.App = app
