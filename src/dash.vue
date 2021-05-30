<!-- Dash - Main Vue component for the entire page.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-app>

    <!-- Navigation drawer opening from the left on small devices to show tabs -->
    <v-navigation-drawer v-model="sidebar" app mini-variant clipped v-if="gotConfig">
      <div>
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
                       style="font-variant: small-caps">
        {{ gotConfig ? dash.title : "FlexDash" }}
      </v-toolbar-title>

      <!-- Tabs -->
      <v-tabs v-model=tab_ix icons-and-text center-active class="hidden-xs-only" v-if="gotConfig">
        <v-tab v-for="(tid, ix) in dash_tabs" :key="tid+ix" :id="'tab-'+tid" :xhref="'#tab'+ix"
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
        <v-btn v-if="$root.editMode" x-small fab @click="addTab($event)" class="my-auto ml-6">
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

      <!-- Connection icons -->
      <connections></connections>

      <!-- Settings menu at far right -->
      <v-menu offset-x min-width="10em" v-model="settings_menu">
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

    <!-- Menu used to show editing panel-->
    <v-menu v-model="tab_edit" offset-y allow-overflow :activator="'#tab-'+tab_id"
            max-width="30ex" content-class="popup-spacer" :close-on-content-click="false">

      <!-- Editing panel shown floating below tab -->
      <v-card color="surface">
        <v-card-text class="d-flex px-2">
          <!-- move tab left/right -->
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn small icon @click="moveTab(-1)" class="" v-on="on">
                <v-icon>mdi-arrow-left-bold</v-icon></v-btn>
            </template>
            <span>Move tab left</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on }">
              <v-btn small icon @click="moveTab(1)" v-on="on">
                <v-icon>mdi-arrow-right-bold</v-icon></v-btn>
            </template>
            <span>Move tab right</span>
          </v-tooltip>
          <v-spacer></v-spacer>

          <!-- delete tab -->
          <v-btn small @click="deleteTab" class="mx-auto">Delete tab</v-btn>
          <v-spacer></v-spacer>

          <!-- close dialog button -->
          <v-btn small elevation=0 icon @click="tab_edit=false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-text>

        <v-card-text class="d-flex flex-column">
          <!-- icon selector -->
          <v-text-field dense label="icon" persistent-hint hint="yes" class="flex-grow-0"
                        :value="tab.icon" @input="handleEdit('icon', $event)">
            <template v-slot:message>
              <span>See
                <a target="_blank" href='https://materialdesignicons.com'>
                   materialdesignicons.com
                   <v-icon color="primary" x-small>mdi-open-in-new</v-icon>
                </a>
              </span>
            </template>
          </v-text-field>

          <!-- tab title -->
          <v-text-field dense label="tab title" class="flex-grow-0 mt-6"
                        :value="tab.title" @input="handleEdit('title', $event)">
          </v-text-field>

          <v-btn small @click="addGrid" class="mx-auto">Add grid</v-btn>
        </v-card-text>

      </v-card>
    </v-menu>

    <v-main>
      <v-tabs-items v-if="gotConfig" v-model="tab_ix">
        <div :style="{ backgroundColor: $vuetify.theme.themes[theme].background}">
          <v-tab-item v-for="(id) in dash_tabs" :key="id"
                      :class="{'is-active': id == tab_id}">
                      <!-- set class above as work-around for vuetify issue #11405-->
            <component v-for="(g, ix) in tabs[id].grids" :key="g" :id="g"
                       v-bind:is="grids[g].kind in palette.grids ? grids[g].kind : 'div'"
                       @delete="deleteGrid(id, ix)">
            </component>
          </v-tab-item>
        </div>
      </v-tabs-items>
      <div v-else>
        LOADING...
      </div>
    </v-main>

  </v-app>
</template>

<script scoped>
import Connections from '/src/components/connections.vue'
import randomStepper from '/src/utils/random-stepper.js'
//const J = JSON.stringify

export default {
  name: 'Dash',

  components: { Connections },
  inject: [ '$config', '$store', 'palette' ],

  data: () => ({
    appTitle: 'FlexDash',
    sidebar: false, // disabled for now
    tab_ix: null, // which tab we're on
    tab_edit: false, // turns tab editing drawer on/off

    settings_menu: null, // whether settings menu is open or not
    settings: { edit: 'Edit mode', theme: 'Toggle theme' }, // options in the settings menu
  }),

  computed: {
    gotConfig() { return this.$config.dash.title !== undefined },
    // note: some of the following get evaluated before the config is loaded, the gotConfig
    // guard ensures that they do get re-evaluated when it is loaded despite Vue2 issues...
    dash() { return this.gotConfig ? this.$config.dash : {} },
    dash_tabs() { return this.dash.tabs || [] }, // tabs to show, handling init
    tab() { return this.tab_id ? this.tabs[this.tab_id] : {} },
    tab_id() { return this.tab_ix != null ? this.dash_tabs[this.tab_ix] : null }, // current tab ID
    tabs() { return this.gotConfig ? this.$config.tabs : {} }, // make accessible in template
    grids() { return this.gotConfig ? this.$config.grids : {} }, // make accessible in template
    theme() { return (this.$vuetify.theme.dark) ? 'dark' : 'light' },
    canUndo() { return this.$store.undo.buf.length > 0 },
  },

  watch: {
    // ensure the current tab exists
    tabs(tt) {
      if (this.tab_ix >= tt.length) this.tab_ix = tt.length-1
    },
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
    addTab(ev) {
      const tab_ix = this.$store.addTab()
      ev.stopPropagation()
      this.$nextTick(() => {
        this.tab_ix = tab_ix
        this.tab_edit = true // switch to editing the new tab
      })
    },
    deleteTab() {
      this.$store.deleteTab(this.tab_ix)
      if (this.tab_ix >= this.$config.dash.tabs.length-1) // this.dash_tabs has not updated yet
        this.tab_ix = this.$config.dash.tabs.length-1
      this.tab_edit = false
    },

    // edit tab props, such as title
    handleEdit(what, ev) {
      console.log('handleEdit', what, ev)
      const prop = {}; prop[what] = ev
      this.$store.updateTab(this.tab_id, prop)
    },

    moveTab(dir) {
      const ix = this.tab_ix
      if (!(ix+dir >= 0 && ix+dir < this.dash.tabs.length)) return
      let tt = [ ...this.dash.tabs ] // clone
      let t = tt[ix]; tt[ix] = tt[ix+dir]; tt[ix+dir] = t // swap
      this.$store.updateDash({ tabs: tt })
      this.tab_ix += dir
      // we need to force a full re-eval of the rendered stuff else the association between
      // the tabs and the content is screwed-up
      this.gotConfig = false
      this.$nextTick( ()=> this.gotConfig = true )
    },

    addGrid() {
      this.$store.addGrid(this.tab_id)
    },

    // delete event coming up from the grid component
    deleteGrid(tab_id, grid_ix) {
      this.$store.deleteGrid(tab_id, grid_ix)
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

/* Give menu a tiny bit of room between tab and top of menu */
.popup-spacer { margin-top: 2px; margin-bottom: 3px; }

/* this is probably the wrong place for these little utility classes... */
.width100 { width: 100%; }
.height80 { height: 80%; }
.height100 { height: 100%; }
.unit { font-size: 70%; vertical-align: 20%; margin-left: 0.1em; }

</style>
