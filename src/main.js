// main -- A pile of mess that needs to go somewhere.
// Perhaps notable is the fact that we load grid and widget components globally here for now.
// Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

import Vue from 'vue'
import vuetify from '@/plugins/vuetify'
import Dash from './Dash.vue'
import LoadScript from 'vue-plugin-load-script';

// Load socket.io from the local npm package (i.e. tell webpack to include it) and stick it into
// a global var so uibuilder finds it.
window.io = require('socket.io-client')

Vue.use(LoadScript)
Vue.config.productionTip = false
Vue.loadScript('./date_helpers.js')

// loadComponentsFromDir loads all .vue files in a specific directory and returns an array of
// their PascalCased names.
function loadComponentsFromDir(requireComponent) {
  return requireComponent.keys().map(fileName => {
    const componentConfig = requireComponent(fileName)
    // Get PascalCase name of component
    const baseName = fileName.split("/").pop().replace(/\.\w+$/, '')
    // Transform to PascalCase
    let componentName = baseName.replace(/-\w/g, s=>{return s[1].toLocaleUpperCase()})
    componentName = componentName[0].toLocaleUpperCase() + componentName.substr(1)
    // Register component globally
    Vue.component(componentName, componentConfig.default || componentConfig)
    console.log(`Imported ${componentName} globally from ${fileName}`)
    return componentName
  }).sort()
}
// Globally register all widgets from /src/widgets/*.vue and all grids from /src/grids/*.vue
// 'cause they get instantiated dynamically in various places.
// From https://vuejs.org/v2/guide/components-registration.html
const requireWidgets = require.context("./widgets", true /*recursive*/, /\S+\.vue$/)
window.widgetPalette = loadComponentsFromDir(requireWidgets)
const requireGrids = require.context("./grids", true /*recursive*/, /\S+\.vue$/)
window.gridPalette = loadComponentsFromDir(requireGrids)

new Vue({
  vuetify,
  render: h => h(Dash)
}).$mount('#app')
