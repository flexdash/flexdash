<!-- Dash - Main Vue component for the entire page.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-app>

    <!-- Top title/navigation bar -->
    <app-bar v-model:theme="theme" :title="title" :ready="ready"
             :tab_ix="tab_ix" @update:tab_ix="changeTab($event)"
             @update:config_src="changeConfigSrc($event)"
             @ctrlMessage="handleCtrl">
    </app-bar>

    <!-- Main notification snackbar -->
    <notification count="3"></notification>

    <!-- main area of the page with content -->
    <v-main>

      <!-- "normal" tabs with grids and widgets
           The tab itself doesn't render anything, it's simply a vertical stacking of the
           grids it contains -->
      <v-window v-if="ready" v-model="tab_ix"> <!-- :class="tabs_items_class"-->
        <v-window-item v-for="(id, ix) in dash_tabs" :key="id" :value="ix">
          <component v-for="(g, ix) in tabs_grids[id]" :key="g" :id="g"
                     v-bind:is="grids[g].kind in palette.grids ? grids[g].kind : 'div'"
                     @delete="deleteGrid(id, ix)">
          </component>
        </v-window-item>
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
.v-window-item { height: 100%; }

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
.v-card-title button { min-width: auto; }

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
  inject: [ '$config', '$store', '$conn', '$bus', 'palette', 'global' ],

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
    theme: null, // initialized in beforeMount handler below

    config_src: "", // which connection we're getting the dash configuration from
    cause: 'manual', // tab change cause for events: manual/message
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
    dash_tabs() { // tabs to show, handling init and handle deleted tabs
      return (this.dash.tabs||[]).filter(id =>
        id.startsWith('t') && id in this.$config.tabs && this.$config.tabs[id].id == id
      )},
    tab() { return this.tab_id ? this.tabs[this.tab_id] : {} },
    tab_id() { return this.tab_ix != null ? this.dash_tabs[this.tab_ix] : "" }, // current tab ID
    tabs() { // make easily accessible in template
      //console.log(`Tabs: ${JSON.stringify(this.$config.tabs)}`)
      return this.ready ? this.$config.tabs : {}
    },
    grids() { // make easily accessible in template
      //console.log(`Grids: ${JSON.stringify(this.$config.grids)}`)
      return this.ready ? this.$config.grids : {}
    },
    // filter grids in each tab to deal with transient states where grids are deleted
    tabs_grids() {
      return Object.fromEntries(this.dash_tabs.map(t => [t,
        (this.tabs[t].grids||[])
          .filter(id => id in this.grids && this.grids[id].id == id)
        ]))
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
    dash_tabs(dt) {
      if (this.tab_ix == null) this.cause = 'expose' // initial load
      this.implementURL()
      if (this.tab_ix >= dt.length) { this.changeTab(dt.length-1); console.log("Forcing tab_ix to", this.tab_ix) }
      if (this.tab_ix == null) { this.changeTab(0); console.log("Init tab_ix to 0") }
    },
    // adjust the iframe url when we display an iframe tab
    tab: { deep: true, immediate: true, handler(t) {
      if (t.url) {
        if (t.slot == 'a') this.iframe_a_src = t.url
        if (t.slot == 'b') this.iframe_b_src = t.url
      }
    }},
    tab_ix(ix) {
      this.tabEvent({ type: "change tab", cause: this.cause, ...this.tabEventInfo() })
      this.cause = 'manual'
    },
    theme() { this.$vuetify.theme.global.name = this.theme },
  },

  beforeMount() {
    console.log(`FlexDash! route=${this.global.route} params:${this.global.params}`)

    // select theme
    let theme = 'light'
    if (window.flexdash_options.theme) theme = window.flexdash_options.theme
    if (this.global.params.has('theme')) theme = this.global.params.get('theme')
    this.theme = theme == "dark" ? "flexdashDark" : "flexdashLight"

    // // select tab by index
    // if (this.global.route.match(/^#[0-9]+$/)) {
    //   const ix = Number.parseInt(this.global.route.substr(1), 10)
    //   if (ix >= 0 && ix < this.dash_tabs.length) this.tab_ix = ix
    // // select tab by name or icon name
    // } else if (this.global.route.startsWith("#")) {
    //   const r = this.global.route.substr(1)
    //   this.dash_tabs.forEach((t,ix)=> {
    //     console.log(`Route match: ix=${ix} title=${this.tabs[t].title} icon=${this.tabs[t].icon}`)
    //     if (r == this.tabs[t].title || r == this.tabs[t].icon) this.tab_ix = ix
    //   })
    // }

    // provide a random changing value for demo purposes. It is wired into newly created
    // widgets so they spring to life even before the user customizes them.
    const rs = randomStepper(0, 100)

    //setTimeout(()=>notify("Welcome to FlexDash", "secondary"), 500)
  },

  unmounted() {
    this.stopVisListener.abort()
    window.removeEventListener('hashchange', this.implementURL)
  },

  mounted() {
    this.stopVisListener = new AbortController()
    document.addEventListener('visibilitychange', ()=> {
      console.log(`Visibility change: ${document.visibilityState} ${document.hidden}`)
      if (document.visibilityState == 'hidden') {
        this.tabEvent({ type: "change tab", cause: "hide" })
      } else {
        this.tabEvent({ type: "change tab", cause: "expose", ...this.tabEventInfo() })
      }
    }, { passive: true, signal: this.stopVisListener.signal })
    console.log("Added viz listener")
    //this.tabEvent({ type: "change tab", cause: "expose", ...this.tabEventInfo() }) -- too early!

    window.addEventListener('hashchange', this.implementURL)
    this.implementURL()
  },

  methods: {

    // delete event coming up from the grid component
    deleteGrid(tab_id, grid_ix) {
      this.$store.deleteGrid(tab_id, grid_ix)
    },

    changeConfigSrc(ev) {
      console.log("Change config source: ", ev)
      this.config_src = ev
    },

    // put together the info about the tab to send a change tab event
    tabEventInfo() {
      // fetch tab info explicitly 'cause we get called from tab_ix watcher and this.tab may
      // not yet have updated
      const tab_id = this.tab_ix != null && this.dash_tabs[this.tab_ix]
      const tab = tab_id && this.tabs[tab_id]
      if (!tab) return {}
      return { id: tab.id, icon: tab.icon }
    },

    tabEvent(payload) {
      if (this.$conn?.serverSend) this.$conn.serverSend("dashboard", payload, "event")
      else console.log("No connection to send tab event", payload)
    },

    // ===== Routing (this should be factored out but right now it lives here...)

    // FIXME: the grid navigation is not fully implemented yet. Setting the URL and causing
    // grids to flip works, but the URL is not updated when the user opens/closes a grid.

    // look at window.location.hash and set tabs and grids accordingly
    // interprets hash as #tab/grid, where the IDs can be tab IDs, IXs, titles, icons
    implementURL() {
      if (this.dash_tabs == null || this.dash_tabs.length == 0) return
      const hash_route = window.location.hash
      const [ rTab, rGrid ] = hash_route.split('/')
      console.log(`Implementing URL: '${hash_route}' tab=${rTab} grid=${rGrid} #tabs=${this.dash_tabs.length}`)
      // figure out which tab we're supposed to be on
      if (rTab && rTab.startsWith('#')) {
        const ix = this.matchcontainer(rTab.substring(1), this.dash_tabs.map(id=>this.tabs[id]))
        if (ix == null) return
        if (this.tab != ix) this.tab_ix = ix
        // figure out any grids we should open/close
        if (rGrid) {
          const tab_id = this.dash_tabs[ix]
          const grids = this.tabs_grids[tab_id].map(id=>this.grids[id]) // grid objects
          console.log(`tab_ix=${this.tab_ix} tab_id=${tab_id} grids=${grids.map(g=>g.id).join(',')}`)
          for (let grid_str of rGrid.split(',')) {
            // leading '-' signifies to close the grid
            const open = !grid_str.startsWith('-')
            if (!open) grid_str = grid_str.substring(1)
            // find the grid and act on it
            const ix = this.matchcontainer(grid_str, grids)
            if (ix == null) continue
            console.log(`Grid ${grids[ix].id} ${open ? "open" : "close"}`)
            this.$bus.emit(grids[ix].id, { action: open ? "open" : "close" })
          }
        }
      }
    },

    // changeTab changes the URL hash to cause navigation to a different tab
    changeTab(new_ix) {
      console.log("changeTab(" + new_ix + ")")
      window.location.hash = `#${new_ix+1}` // 1-based!
    },

    // matchcontainer tries to match a string to a container (tab or grid) by ID, index, title, or icon
    matchcontainer(str, containers) { // returns index of match
      // match ID
      let ix = containers.findIndex(c => c?.id?.substring(1) == str)
      if (ix >= 0) return ix
      // match index (1-based!)
      ix = Number.parseInt(str, 10)
      if (ix > 0 && ix <= containers.length) return ix-1 // Fixme: check for trailing letters
      // match title
      str = str.toLowerCase()
      ix = containers.findIndex(c => c?.title?.toLowerCase() == str)
      if (ix >= 0) return ix
      // match icon
      ix = containers.findIndex(c => c?.icon?.toLowerCase() == "mdi-"+str)
      if (ix >= 0) return ix
      return null
    },

    // handle control message coming in from the server
    handleCtrl(payload) {
      console.log("Control message", payload)
      if (payload.action == "open" && payload.id) {
        if (payload.type == 'tab') {
          this.dash_tabs.forEach((t,ix)=> {
            if (ix != this.tab_ix && payload.id == this.tabs[t].id) {
              console.log(`Changing tab to ${ix} due to control message`)
              this.cause = 'message'
              this.tab_ix = ix
            }
          })
        } else if (payload.type == 'grid') {
          this.$bus.emit(payload.id, payload)
        }
      } else if (payload.action == "close" && payload.id) {
        if (payload.type == 'grid') {
          this.$bus.emit(payload.id, payload)
        }
      }
    },

    // handle buttons for tab editing
    // addTab(kind) {
    //   const tab_ix = this.$store.addTab(kind)
    //   this.$nextTick(() => {
    //     this.tab_ix = tab_ix
    //     this.tab_edit = true // switch to editing the new tab
    //   })
    // },

  },

}
</script>
