// main -- A pile of mess that needs to go somewhere.
// Perhaps notable is the fact that we load grid and widget components globally here for now.
// Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

import Vue from 'vue'
import vuetify from '@/plugins/vuetify'
import Dash from './Dash.vue'
import LoadScript from 'vue-plugin-load-script'
//import store from './store'

// Load socket.io from the local npm package (i.e. tell webpack to include it) and stick it into
// a global var so uibuilder finds it.
window.io = require('socket.io-client')

Vue.config.productionTip = false

Vue.use(LoadScript)
Vue.loadScript('./date_helpers.js')

// loadComponentsFromDir loads all .vue files in a specific directory and returns a map of
// their PascalCased names to their component definition (the default object being exported).
function loadComponentsFromDir(requireComponent) {
  return Object.fromEntries(
    requireComponent.keys().map(fileName => {
      // Load the component module
      const componentConfig = requireComponent(fileName)
      // Get PascalCase name of component
      const baseName = fileName.split("/").pop().replace(/\.\w+$/, '')
      // Transform to PascalCase
      let componentName = baseName.replace(/-\w/g, s=>{return s[1].toLocaleUpperCase()})
      componentName = componentName[0].toLocaleUpperCase() + componentName.substr(1)
      // Register component globally
      Vue.component(componentName, componentConfig.default || componentConfig)
      console.log(`Imported ${componentName} globally from ${fileName}`)
      return [ componentName, componentConfig.default ]
    })
  )
}
// Globally register all widgets from /src/widgets/*.vue and all grids from /src/grids/*.vue
// 'cause they get instantiated dynamically in various places.
// It's debatable whether this might be better done locally in the grid and widget components...
// From https://vuejs.org/v2/guide/components-registration.html
const requireWidgets = require.context("./widgets", true /*recursive*/, /\S+\.vue$/)
window.widgetPalette = loadComponentsFromDir(requireWidgets)
const requireGrids = require.context("./grids", true /*recursive*/, /\S+\.vue$/)
window.gridPalette = loadComponentsFromDir(requireGrids)

new Vue({
  vuetify,

  // Hack some global variable(s) into Vue so all components can refer to them
  data: { // https://stackoverflow.com/questions/51275301/how-to-react-to-a-global-variable-with-vue
    editMode: true,
  },

  render: h => h(Dash)
}).$mount('#app')
