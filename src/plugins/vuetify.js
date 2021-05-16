import Vue from 'vue';
import Vuetify from 'vuetify';
import 'vuetify/dist/vuetify.min.css'
//import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    options: {
      variations: false, // generate darken-N and lighten-N variations
      customProperties: true, // generates --v-primary-base, etc, CSS colors
    },
    themes: {
      light: {
        background: '#f7f5f5', // page background
        surface: '#fffdfd', // widget surfaces
        panel: '#f4f2f2', // editing panel
        primary: '#ad1625', // node-red red
        primary_light: '#e5504d',
        primary_dark: '#760000',
        error: '#ec7422',
        highlight: '#fff5ce', // selected widget
      },
      dark: {
        background: '#0b0808',
        surface: '#201d1d',
        panel: '#262424',
        primary: '#ad1625', // node-red red
        primary_light: '#e5504d',
        primary_dark: '#760000',
        error: '#ec7422',
        highlight: '#716741',
      },
    },
  },
});
