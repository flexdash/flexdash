// Styles

//  It would be good to move to the SVG version and drop the -outline icons, then see how
//  to load on-demand even afer bundling. We only need "all icons" so the user can pick arbitrary
//  icons for tabs and widgets...
import '@mdi/font/css/materialdesignicons.css'

// Vuetify
import { createVuetify } from 'vuetify'
import '/src/flexdash.scss'
import 'vuetify/styles'  // ESM build
//import 'vuetify/dist/vuetify.css'  // CJS (UMD?) build

const flexdashLight = {
  dark: false,
  colors: {
    background: '#f7f5f5', // page background
    surface: '#fffdfd', // widget surfaces
    panel: '#f4f2f2', // editing panel
    primary: '#ad1625', // node-red red
    primary_light: '#e5504d',
    primary_dark: '#760000',
    error: '#ec7422',
    highlight: '#fff5ce', // selected widget
    notification: '#666666', // background of notification snackbar at top
  }
}

const flexdashDark = {
  dark: true,
  colors: {
    background: '#0b0808',
    surface: '#201d1d',
    panel: '#262424',
    primary: '#ad1625', // node-red red
    primary_light: '#e5504d',
    primary_dark: '#760000',
    error: '#ec7422',
    highlight: '#716741',
    notification: '#cccccc',
  }
}

window.v_defaults = {
  global: {
    density: 'compact',
    'hide-details': true,
  },
  'VTooltip': {
    anchor: 'bottom',
  },
}

export default createVuetify({
  display: {
    mobileBreakpoint: 'sm'
  },
  defaults: window.v_defaults,
  theme: {
    defaultTheme: 'flexdashDark',
    themes: { flexdashLight, flexdashDark },
  }
})
