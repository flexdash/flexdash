<!-- Dash - Main Vue component for the entire page.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-app>

    <!-- Navigation drawer opening from the left on small devices to show tabs -->
    <v-navigation-drawer v-model="sidebar" app mini-variant clipped v-if="gotConfig">
      <div v-if="false">
      <v-tabs vertical v-model=tab_ix>
        <v-tab v-for="t in dash_tabs" :key="t" class="px-0" style="min-width: auto">
          <v-icon large>mdi-{{tabs[t].icon}}</v-icon>
        </v-tab>
      </v-tabs>
      </div>
    </v-navigation-drawer>

    <!-- Top title/navigation bar -->
    <v-app-bar dense app clipped-left color="surface">
      <!-- Hamburger menu shown on smallest devices only -->
      <span class="hidden-sm-and-up">
        <v-app-bar-nav-icon @click="sidebar = !sidebar"></v-app-bar-nav-icon>
      </span>

      <!-- Title -->
      <v-toolbar-title class="text-h4 font-weight-bold text--secondary flex-shrink-0 mr-3"
                       style="font-variant: small-caps;">
        {{ gotConfig ? dash.title : "FlexDash" }}
      </v-toolbar-title>
      <div class="version d-flex">alpha v{{version}}</div>

      <!-- Tabs -->
      <v-tabs v-model=tab_ix icons-and-text center-active class="hidden-xs-only" v-if="gotConfig">
        <v-tab v-for="(tid, ix) in dash_tabs" :key="tid+ix" :id="'tab-'+tid"
               :class="{'is-active': ix == tab_ix}">
               <!-- set class above as work-around for vuetify issue #11405-->
          <!-- Text and icon for the tab -->
          {{tabs[tid].title}}
          <v-icon :large="!tabs[tid].title" class="mb-0">mdi-{{tabs[tid].icon}}</v-icon>
          <!-- Button to edit the tab -->
          <div style="position:absolute; z-index:5; right:0; top:0.5ex;">
            <v-btn small icon v-if="$root.editMode && ix==tab_ix"
                   @click.stop="tab_edit=!tab_edit">
              <v-icon small>mdi-pencil</v-icon>
            </v-btn>
          </div>
        </v-tab>
        <!-- Button to add a tab -->
        <v-btn v-if="$root.editMode" x-small fab class="my-auto ml-6" id="tab-add"
               @click.stop="tab_add=!tab_add">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-tabs>

      <v-spacer></v-spacer>

      <!-- Undo button -->
      <v-tooltip v-if="$root.editMode" bottom :disabled="!canUndo">
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on"
                 :disabled="!canUndo" @click="$store.performUndo()">
            <v-icon>mdi-undo</v-icon>
          </v-btn>
        </template>
        <span>undo {{ canUndo && $store.undo.buf[$store.undo.buf.length-1].tagline }}</span>
      </v-tooltip>

      <!-- Connection icon -->
      <connections @src="config_src=$event" ></connections>

      <!-- Settings menu at far right -->
      <v-menu offset-y min-width="10em" v-model="settings_menu">
        <!-- Menu activator, i.e. the button -->
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on"><v-icon>mdi-cog</v-icon></v-btn>
        </template>
        <!-- Settings Menu -->
        <v-list dense>
          <v-list-item>
            <v-switch v-model="$root.editMode" inset label="Edit"></v-switch>
          </v-list-item>
          <v-list-item>
            <v-switch v-model="$vuetify.theme.dark" inset label="Dark"></v-switch>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Menu used to show tab addition-->
    <v-menu v-model="tab_add" offset-y allow-overflow activator="#tab-add">
        <v-list dense>
          <v-list-item @click="addTab('grid')">Grid with Widgets</v-list-item>
          <v-list-item @click="addTab('iframe')">IFrame</v-list-item>
        </v-list>
    </v-menu>

    <!-- Menu used to show editing panel floating below tab -->
    <v-menu v-model="tab_edit" offset-y allow-overflow :activator="'#tab-'+tab_id"
            max-width="40ex" content-class="popup-spacer" :close-on-content-click="false">
      <tab-edit v-model="tab_edit" :tab_ix="tab_ix" :tab_id="tab_id" @reload="reload"></tab-edit>
    </v-menu>

    <!-- main area of the page with content -->
    <v-main :style="{ backgroundColor: $vuetify.theme.themes[theme].background}">
      <!-- "normal" tabs with grids and widgets -->
      <v-tabs-items v-if="gotConfig" :value="tab_ix" :class="tabs_items_class">
        <v-tab-item v-for="(id) in dash_tabs" :key="id" :ref="id"
                    :style="{ backgroundColor: $vuetify.theme.themes[theme].background}"
                    :class="{'is-active': id == tab_id}">
                    <!-- set class above as work-around for vuetify issue #11405-->
          <!-- key={{id}} grids:{{tabs[id].grids}}
          <div v-for="(g, ix) in tabs[id].grids" :key="g">
            Grid {{g}} kind {{grids[g].kind}} palette {{palette.grids}</div -->
          <!-- "normal" tab with grids with widgets -->
          <component v-if="tabs[id].grids"
                     v-for="(g, ix) in tabs[id].grids" :key="g" :id="g"
                     v-bind:is="grids[g].kind in palette.grids ? grids[g].kind : 'div'"
                     @delete="deleteGrid(id, ix)">
          </component>
        </v-tab-item>
      </v-tabs-items>
      <!-- iframe tabs, we have two "slots" where content can persist -->
      <div v-if="gotConfig" :class="iframe_a_class">
        <iframe v-if="iframe_a_src" :src="iframe_a_src"
                frameborder="0" marginheight="0" marginwidth="0"></iframe>
      </div>
      <div v-if="gotConfig" :class="iframe_b_class">
        <iframe v-if="iframe_b_src" :src="iframe_b_src"
                frameborder="0" marginheight="0" marginwidth="0"></iframe>
      </div>
      <!-- loading... -->
      <div v-if="!gotConfig">
        <v-container style="height: 400px;">
          <v-row class="fill-height" align-content="center" justify="center">
            <v-col class="text-subtitle-1 text-center" cols="12">
              Loading configuration from<br>{{config_src}}
            </v-col>
            <v-col cols="6">
              <v-progress-linear color="primary" indeterminate rounded height="6">
              </v-progress-linear>
            </v-col>
          </v-row>
        </v-container>
      </div>
    </v-main>

  </v-app>
</template>

<script scoped>
import Connections from '/src/components/connections.vue'
import TabEdit from '/src/components/tab-edit.vue'
import randomStepper from '/src/utils/random-stepper.js'
//const J = JSON.stringify

export default {
  name: 'Dash',

  components: { Connections, TabEdit },
  inject: [ '$config', '$store', 'palette' ],

  data: () => ({
    appTitle: 'FlexDash',
    sidebar: false, // disabled for now
    tab_ix: null, // which tab we're on
    tab_edit: false, // turns tab editing drawer on/off
    tab_add: false, // turns add-a-tab menu on/off

    iframe_a_src: null, // src URL for iframe
    iframe_b_src: null, // src URL for iframe

    settings_menu: null, // whether settings menu is open or not
    settings: { edit: 'Edit mode', theme: 'Toggle theme' }, // options in the settings menu

    config_src: "",
    version: import.meta.env.PACKAGE_VERSION,
  }),

  computed: {
    // gotConfig returns true once store.$config contains a full configuration,
    // don't start to render tabs before everything is there
    gotConfig() {
      return this.$config.dash.title && this.$config.dash.tabs.length > 0
        && Object.keys(this.$config.tabs).length > 0
        && Object.keys(this.$config.grids).length > 0
        && Object.keys(this.$config.widgets).length > 0
        && Object.keys(this.$config.conn).length > 0
    },
    // note: some of the following get evaluated before the config is loaded, the gotConfig
    // guard ensures that they do get re-evaluated when it is loaded despite Vue2 issues...
    dash() { return this.gotConfig ? this.$config.dash : {} },
    dash_tabs() { return this.dash.tabs || [] }, // tabs to show, handling init
    tab() { return this.tab_id ? this.tabs[this.tab_id] : {} },
    tab_id() { return this.tab_ix != null ? this.dash_tabs[this.tab_ix] : "" }, // current tab ID
    tabs() { return this.gotConfig ? this.$config.tabs : {} }, // make accessible in template
    grids() { return this.gotConfig ? this.$config.grids : {} }, // make accessible in template
    theme() { return (this.$vuetify.theme.dark) ? 'dark' : 'light' },
    canUndo() { return this.$store.undo.buf.length > 0 },

    iframe_a_show() { return this.tab.url && this.tab.slot == 'a' },
    iframe_a_class() { return ["iframe-tab-wrap", {"iframe-a--active": this.iframe_a_show}] },
    iframe_b_show() { return this.tab.url && this.tab.slot == 'b' },
    iframe_b_class() { return ["iframe-tab-wrap", {"iframe-b--active": this.iframe_b_show}] },
    tab_show() { return !!this.tab.grids },
    tabs_items_class() { return {"tabs--active": this.tab_show} },
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
    console.log(`FlexDash! route=${this.$root.route} params=${this.$root.params}`)
    // select tab by index
    if (this.$root.route.match(/^#[0-9]+$/)) {
      const ix = Number.parseInt(this.$root.route.substr(1), 10)
      if (ix >= 0 && ix < this.dash_tabs.length) this.tab_ix = ix
    // select tab by name or icon name
    } else if (this.$root.route.startsWith("#")) {
      const r = this.$root.route.substr(1)
      this.dash_tabs.forEach((t,ix)=> {
        console.log(`Route match: ix=${ix} title=${this.tabs[t].title} icon=${this.tabs[t].icon}`)
        if (r == this.tabs[t].title || r == this.tabs[t].icon) this.tab_ix = ix
      })
    }

    // provide a random changing value for demo purposes. It is wired into newly created
    // widgets so they spring to life even before the user customizes them.
    const rs = randomStepper(0, 100)
    this.intvl = window.setInterval(()=> this.$store.insertData("$demo_random", rs()), 3000)
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
  },

}
</script>

<style>
[v-cloak] > * { display:none }
[v-cloak]::before { content: "loading…" }
 
/* Remove some excessive padding at left&right, especially for small devices */
.v-app-bar > .v-toolbar__content { padding: 0px 8px; display: flex; }

/* Make tabs fit between title on the left and buttons on the right, why is this so hard? */
.v-app-bar .v-tabs { overflow: auto }
.v-app-bar .v-slide-group__prev { display: none !important; }
.v-app-bar .v-slide-group__next { display: none !important; }

/* make tab content 100% height so we can size iframe for iframe-grid to full page */
.v-item-group { height: 100%; }
.v-window-item { height: 100%; }

/* hide tabs when showing an iframe */
.v-tabs-items { display: none; }
.v-tabs-items.tabs--active { display: block; }

/* iframe for external tab content */
.iframe-tab-wrap { position: relative; width: 100%; height: 100%; display: none; }
.iframe-tab-wrap > iframe {
  border: none; width:100%; height:100%;
  display: block; object-position: center top;
}
.iframe-tab-wrap.iframe-a--active { display: block; }
.iframe-tab-wrap.iframe-b--active { display: block; }

/* Give menu a tiny bit of room between tab and top of menu */
.popup-spacer { margin-top: 2px; margin-bottom: 3px; }

/* this is probably the wrong place for these little utility classes... */
.width100 { width: 100%; }
.height80 { height: 80%; }
.height100 { height: 100%; }
.unit { font-size: 70%; vertical-align: 20%; margin-left: 0.1em; }

.v-input__slot { margin-bottom: 4px !important; }

</style>

<style scoped>
.version {
  position: absolute; top: 0px; right: 14px; z-index: 2;
  font-size: 9pt; font-weight: 700; color: #e5504d;
  line-height: 10pt;
}
</style>
