// main -- A pile of mess that needs to go somewhere.
// Perhaps notable is the fact that we load grid and widget components globally here for now.
// Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

import { createApp, reactive } from 'vue'
import vuetify, { components } from './plugins/vuetify'
import Dash from './dash.vue'
import Store from './store'
import loadPalette from './utils/palette-loader'
import mitt from 'mitt'
import mapImport from './utils/map-import.js'

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
  editDisabled: !!fo.edit_disabled, // disables the edit toggle
  noAddDelete: !!fo.no_add_delete, // suppresses add/delete buttons
  noDemo: !!fo.no_demo, // suppresses demo mode
  route: window.location.hash, // #xxx in URL, determines initial tab shown
  params: (new URL(document.location)).searchParams, // options passed in on page load
}))
// server connection, fields set by the connections component
app.provide('$conn', {})
// event bus to deliver events coming from the server to specific components
app.provide('$bus', mitt())

app.mount('#app')

// handy globals
window.App = app
window.Palette = palette

// window.addEventListener('popstate', () => {
//   const sp = (new URL(document.location)).searchParams
//   console.log(`POP! hash=${window.location.hash} qstring=${sp}`)
//   app.route = window.location.hash
//   app.params = sp
// })

// ===== load fonts

import "@fontsource/roboto/100.css"
import "@fontsource/roboto/300.css"
import "@fontsource/roboto/400.css"
import "@fontsource/roboto/500.css"
import "@fontsource/roboto/700.css"
import "@fontsource/roboto/900.css"

// ===== the following deals with dynamically loaded widgets, specifically, their imports
// the old method was to define some globals that custom widgets could use, but the new
// way is to use import maps courtesy of es-module-shims.
// The globals should be removed at some point, although we still need to make sure all
// of Vue and Vuetify is pulled in (no treeshaking optimization for those).

// define some globals which are used by dynamically loaded widgets
import * as vue_all from 'vue'
window.Vue = vue_all
import * as vuetify_all from 'vuetify'
window.Vuetify = vuetify_all
import * as uplot_all from 'uplot'
window.uPlot = uplot_all
import * as placement_all from 'placement.js'
window.Placement = placement_all
mapImport({
  'vue': 'Vue',
  'vuetify': 'Vuetify',
  'uplot': 'uPlot',
  'placement.js': 'Placement',
})

// utility modules to pull from the utils directory
const utils = [
  'clipboard', 'colors', 'formatter', 'gradient', 'plot-colors', 'quadtree', 'upload',
  'uplot-distr', 'uplot-series-bars', 'uplot-timeline', 'uplot-tooltip',
]

// loading the utils happens async, custom widget loading needs to wait for this...
window.Utils = {}
async function loadUtils() {
  const modules = import.meta.glob('./utils/*.js')
  for (const path in modules) {
    const u = path.split('/').pop().split('.').shift()
    if (utils.includes(u)) window.Utils[u] = await modules[path]()
  }
}
// Additional Utils
// Log utils to console
window.UtilsPromise = loadUtils()
window.UtilsPromise.then(() => console.log("Loaded utils:", Object.keys(window.Utils).join(', ')))
