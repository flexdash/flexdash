// main -- A pile of mess that needs to go somewhere.
// Perhaps notable is the fact that we load grid and widget components globally here for now.
// Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

import { createApp, reactive } from 'vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import Dash from './dash.vue'
import Store from './store'

loadFonts()

// insert a title tag into the HTML head
if (!window.flexdash_options) window.flexdash_options = {}
const fo = window.flexdash_options
console.log("FlexDash options:", fo)
if (!fo.title) fo.title = "FlexDash"
document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend',
  `<title>${fo.title}</title>`
)

const app = createApp(Dash)
app.use(vuetify)

// // use Vite's module glob import to load widgets and grids
const palette = reactive({ widgets: {}, grids: {}, count: 0, loaded: false, errors: [] })
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
          app.component(name, mod.default)
          tgt[name] = mod.default
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
//globImport(palette.widgets, import.meta.glob('/xtra/*/widgets/*.vue'))
globImport(palette.grids, import.meta.glob('/src/grids/*.vue'))

// handle palettePromises: append errors to palette.errors and set palette.loaded when all are done
Promise.allSettled(palettePromises.map(p =>
  p.catch(e => palette.errors.push(e.message))
)).then(() => palette.loaded = true)


  // data: { // https://stackoverflow.com/questions/51275301/how-to-react-to-a-global-variable-with-vue
  //   // current route, gets initialized with the initial location that loads FlexDash
  //   route: window.location.hash,
  //   params: (new URL(document.location)).searchParams,
  // },

const store = new Store(app)
  
// editMode encodes whether the edit toggle is on/off
app.provide('global', reactive({ editMode: !!fo.edit }))
// Provide the store to all components through the hierarchy
app.provide('$config', store.config)
app.provide('$store', store)
// provide the widget and grid palettes to all components (although just a couple need them)
app.provide('palette', palette)
// server connection, fields set by the connections component
app.provide('conn', {})

app.mount('#app')

window.addEventListener('popstate', () => {
  const sp = (new URL(document.location)).searchParams
  console.log(`POP! hash=${window.location.hash} qstring=${sp}`)
  app.route = window.location.hash
  app.params = sp
})
