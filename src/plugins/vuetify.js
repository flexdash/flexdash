// Styles

//  It would be good to move to the SVG version and drop the -outline icons, then see how
//  to load on-demand even afer bundling. We only need "all icons" so the user can pick arbitrary
//  icons for tabs and widgets...
import '@mdi/font/css/materialdesignicons.css'

// Vuetify
import { createVuetify } from 'vuetify'
import '/src/flexdash.scss'
import 'vuetify/styles'

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
  }
}

export default createVuetify({
  display: {
    //mobileBreakpoint: 'sm'
  },
  defaults: {
    global: {
      density: 'compact',
      'hide-details': true,
    },
  },
  theme: {
    defaultTheme: 'flexdashDark',
    themes: { flexdashLight, flexdashDark },
  }
})




// See https://fontsource.org/docs/getting-started
// The browser does seem to load only the fonts actually used, gotta see what the bundling
// ends up doing... This seems better or worked-out internally in Vuetify3
// import '@fontsource/roboto/100.css'
// import '@fontsource/roboto/300.css'
// import '@fontsource/roboto/400.css'
// import '@fontsource/roboto/500.css'
// import '@fontsource/roboto/700.css'
// import '@fontsource/roboto/900.css'
// import '@fontsource/roboto/100-italic.css'
// import '@fontsource/roboto/300-italic.css'
// import '@fontsource/roboto/400-italic.css'
// import '@fontsource/roboto/500-italic.css'
// import '@fontsource/roboto/700-italic.css'
// import '@fontsource/roboto/900-italic.css'
