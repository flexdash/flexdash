<!-- Dash - Main Vue component for the entire page.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-app :theme="theme">

    <!-- Top title/navigation bar -->
    <app-bar v-model:tab_ix="tab_ix" v-model:theme="theme" :title="title" :ready="ready"
             @update:config_src="changeConfigSrc($event)">
    </app-bar>

    <!-- Main notification snackbar -->
    <notification count="3"></notification>

    <!-- main area of the page with content -->
    <v-main>

      <!-- "normal" tabs with grids and widgets -->
      <v-window v-if="ready" v-model="tab_ix"> <!-- :class="tabs_items_class"-->
<v-defaults-provider :defaults="global.v_defaults">
        <v-window-item v-for="(id, ix) in dash_tabs" :key="id+ix" :ref="id" :value="ix">
          <!-- key={{id}} grids:{{tabs[id].grids}}
          <div v-for="(g, ix) in tabs[id].grids" :key="g">
            Grid {{g}} kind {{grids[g].kind}} palette {{palette.grids}</div -->
          <!-- "normal" tab with grids with widgets -->
          <div v-if="tabs[id].grids">

            <component v-for="(g, ix) in tabs[id].grids" :key="g" :id="g"
                      v-bind:is="grids[g].kind in palette.grids ? grids[g].kind : 'div'"
                      @delete="deleteGrid(id, ix)">
            </component>
          </div>
        </v-window-item>
</v-defaults-provider>
      </v-window>

      <!-- iframe tabs, we have two "slots" where content can persist -->
      <div v-if="ready" :class="iframe_a_class">
        <iframe v-if="iframe_a_src" :src="iframe_a_src"
                frameborder="0" marginheight="0" marginwidth="0"></iframe>
      </div>
      <div v-if="ready" :class="iframe_b_class">
        <iframe v-if="iframe_b_src" :src="iframe_b_src"
                frameborder="0" marginheight="0" marginwidth="0"></iframe>
      </div>

      <!-- loading... -->
      <div v-if="!ready">
        <v-container style="min-height: 400px;" class="d-flex flex-column justify-start align-center">
          <div class="text-subtitle-1 text-center my-4" v-if="!gotConfig">
              Awaiting configuration from<br>{{config_src}}...
          </div>
          <div class="text-subtitle-1 text-center"
               v-if="!palette.loaded || palette.errors.length > 0">
              Loading widgets and grids...
          </div>
          <div class="text-subtitle-1 text-center"
               v-for="(err, ix) in paletteErrorsHtml" :key="ix">
            {{err}}
          </div>
          <v-btn @click="palette.errors=[]" color="primary" v-if="palette.errors.length > 0">
              Continue
          </v-btn>
          <v-progress-linear color="primary" class="my-6" indeterminate rounded height="6"
                             style="max-width: 30em;">
          </v-progress-linear>
        </v-container>
      </div>

    </v-main>

  </v-app>
</template>
  
<style>
/* make tab content 100% height so we can size iframe for iframe-grid to full page */
.xv-item-group { height: 100%; }
.xv-window-item { height: 100%; }

/* hide tabs when showing an iframe */
.xv-tabs-items { display: none; }
.xv-tabs-items.tabs--active { display: block; }

.xxxv-main { background: rgb(var(--v-theme-background)) }

/* iframe for external tab content */
.iframe-tab-wrap { position: relative; width: 100%; height: 100%; display: none; }
.iframe-tab-wrap > iframe {
  border: none; width:100%; height:100%;
  display: block; object-position: center top;
}
.iframe-tab-wrap.iframe-a--active { display: block; }
.iframe-tab-wrap.iframe-b--active { display: block; }
</style>

<style>
/* Styles that are global, not used in this component in particular */

[xv-cloak] > * { display:none }
[xv-cloak]::before { content: "loading…" }
 
.width100 { width: 100%; }
.height80 { height: 80%; }
.height100 { height: 100%; }

.compact-input .v-field__field { padding-top:0px !important; }
.large-font .v-field__field { font-size: 125% !important;}

</style>

<script scoped>
import { useDisplay } from 'vuetify'
import AppBar from '/src/components/app-bar.vue'
import TabEdit from '/src/edit-panels/tab-edit.vue'
import randomStepper from '/src/utils/random-stepper.js'
import Notification from '/src/components/notification.vue'
import { notify } from '/src/components/notification.vue'

export default {
  name: 'Dash',

  components: { AppBar, TabEdit, Notification },
  inject: [ '$config', '$store', 'palette', 'global' ],

  setup() {
    const { mobile } = useDisplay()
    return { mobile }
  },

  data: () => ({
    sidebar: false, // disabled for now
    tab_ix: null, // which tab we're on
    tab_edit: false, // turns tab editing drawer on/off
    tab_add: false, // turns add-a-tab menu on/off

    iframe_a_src: null, // src URL for iframe
    iframe_b_src: null, // src URL for iframe

    settings_menu: null, // whether settings menu is open or not
    settings: { edit: 'Edit mode', theme: 'Toggle theme' }, // options in the settings menu

    theme: window.flexdash_options?.theme == "dark" ? "flexdashDark" : "flexdashLight",

    config_src: "",
  }),

  computed: {
    // gotConfig returns true once store.$config contains a full configuration,
    // don't start to render tabs before everything is there
    gotConfig() {
      return this.$config.dash.title && (this.$config.ready ||
        this.$config.dash.tabs.length > 0
        && Object.keys(this.$config.tabs).length > 0
        && Object.keys(this.$config.grids).length > 0
        && Object.keys(this.$config.widgets).length > 0
        && Object.keys(this.$config.conn).length > 0)
    },
    gotPalette() { return this.palette.loaded && this.palette.errors.length == 0 },
    ready() { return this.gotConfig && this.gotPalette },
    // note: some of the following get evaluated before the config is loaded, the gotEverything
    // guard ensures that they do get re-evaluated when it is loaded despite Vue2 issues...
    dash() { return this.ready ? this.$config.dash : {} },
    dash_tabs() { return this.dash.tabs || [] }, // tabs to show, handling init
    tab() { return this.tab_id ? this.tabs[this.tab_id] : {} },
    tab_id() { return this.tab_ix != null ? this.dash_tabs[this.tab_ix] : "" }, // current tab ID
    tabs() { // make easily accessible in template
      console.log(`Tabs: ${JSON.stringify(this.$config.tabs)}`)
      return this.ready ? this.$config.tabs : {}
    },
    grids() { // make easily accessible in template
      console.log(`Grids: ${JSON.stringify(this.$config.grids)}`)
      return this.ready ? this.$config.grids : {}
    },
    canUndo() { return this.$store.undo.buf.length > 0 },
    title() { return window.flexdash_options.title },

    iframe_a_show() { return this.tab.url && this.tab.slot == 'a' },
    iframe_a_class() { return ["iframe-tab-wrap", {"iframe-a--active": this.iframe_a_show}] },
    iframe_b_show() { return this.tab.url && this.tab.slot == 'b' },
    iframe_b_class() { return ["iframe-tab-wrap", {"iframe-b--active": this.iframe_b_show}] },
    tab_show() { return !!this.tab.grids },
    tabs_items_class() { return {"tabs--active": this.tab_show} },

    // palette.errorsHtml deals with the fact that each error is multi-line
    paletteErrorsHtml() { return this.palette.errors.join('\n').split('\n') },
  },

  watch: {
    // ensure the current tab exists
    tabs(tt) { if (this.tab_ix >= tt.length) this.tab_ix = tt.length-1 },
    // adjust the iframe url when we display an iframe tab
    tab: { deep: true, immediate: true, handler(t) {
      if (t.url) {
        if (t.slot == 'a') this.iframe_a_src = t.url
        if (t.slot == 'b') this.iframe_b_src = t.url
        console.log("iframe_a_src:", this.iframe_a_src)
      }
    }},
  },

  mounted() {
    console.log(`FlexDash! route=${this.global.route} params=${this.global.params}`)
    // select tab by index
    if (this.global.route.match(/^#[0-9]+$/)) {
      const ix = Number.parseInt(this.global.route.substr(1), 10)
      if (ix >= 0 && ix < this.dash_tabs.length) this.tab_ix = ix
    // select tab by name or icon name
    } else if (this.global.route.startsWith("#")) {
      const r = this.global.route.substr(1)
      this.dash_tabs.forEach((t,ix)=> {
        console.log(`Route match: ix=${ix} title=${this.tabs[t].title} icon=${this.tabs[t].icon}`)
        if (r == this.tabs[t].title || r == this.tabs[t].icon) this.tab_ix = ix
      })
    }

    // provide a random changing value for demo purposes. It is wired into newly created
    // widgets so they spring to life even before the user customizes them.
    const rs = randomStepper(0, 100)
    //this.intvl = window.setInterval(()=> this.$store.insertData("$demo_random", rs()), 3000)

    setTimeout(()=>notify("Welcome to FlexDash", "secondary"), 500)
  },

  beforeDestroy() { window.clearInterval(this.intvl) },

  provide() {
    const self = this
    return {
      // send a "raw" message to the server, should be used primarily to send user input, which
      // gets mapped into server-data (self.sd) and thus where the nested component knows which
      // key of self.sd is to be updated.
      sendSrv(topic, payload) {
        self.$refs.uib.send({topic: topic, payload: payload})
      },
    }
  },

  methods: {
    // handle buttons for tab editing
    addTab(kind) {
      const tab_ix = this.$store.addTab(kind)
      this.$nextTick(() => {
        this.tab_ix = tab_ix
        this.tab_edit = true // switch to editing the new tab
      })
    },

    // delete event coming up from the grid component
    deleteGrid(tab_id, grid_ix) {
      this.$store.deleteGrid(tab_id, grid_ix)
    },

    // force a full re-eval of the rendered stuff - invoked by TabEdit
    // there's a bug in Vuetify's tab-items that causes the tabs and the content to be mixed-up
    reload(tab_ix) {
      this.tab_ix = tab_ix
      this.$forceUpdate()
      /*
      console.log("Trying to force an update")
      const title = this.$config.dash.title
      delete this.$config.dash.title
      this.$nextTick( ()=> { this.$config.dash.title = title; this.tab_ix = tab_ix })*/
    },

    changeConfigSrc(ev) {
      console.log("Change config source: ", ev)
      this.config_src = ev
    },
  },

}
</script>
