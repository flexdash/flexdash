<!-- Dash - Main Vue component for the entire page.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-app>

    <!-- Top title/navigation bar -->
    <v-app-bar dense app clipped-left :flat="$root.editMode" color="surface"
               :extension-height="tab_edit?56:0">
      <!-- Hamburger menu shown on smallest devices only -->
      <span class="hidden-sm-and-up">
        <v-app-bar-nav-icon @click="sidebar = !sidebar"></v-app-bar-nav-icon>
      </span>

      <!-- Title and tabs -->
      <v-toolbar-title class="text-h4 font-weight-bold text--secondary flex-shrink-0 mr-3"
                       style="font-variant: small-caps">
        {{ this.gotConfig ? dash.title : "FlexDash" }}
      </v-toolbar-title>
      <v-tabs v-model=tab_ix class="hidden-xs-only" v-if="gotConfig">
        <v-tab v-for="(tid, ix) in dash_tabs" :key="tid">
          <!-- Icon for the tab -->
          <v-icon large>mdi-{{tabs[tid].icon}}</v-icon>
          <!-- Button to edit the tab -->
          <div style="position:absolute; z-index:5; right:0; top:0.5ex;">
            <v-btn small icon v-if="$root.editMode && ix==tab_ix" @click="tab_edit=!tab_edit">
              <v-icon small>mdi-pencil</v-icon>
            </v-btn>
          </div>
        </v-tab>
        <!-- Button to add a tab -->
        <v-btn v-if="$root.editMode" x-small fab @click="handleAddTab" class="my-auto">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-tabs>

      <!-- Connection icons -->
      <demo @msg="handleMsg"></demo>
      <uib ref="uib" @msg="handleMsg"></uib>
      
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

      <!-- App bar extension shown to edit the tab -->
      <template v-slot:extension v-if="tab_edit">
        <!--v-input dense class="flex-grow-0"><span>Tab editing</span></v-input-->
        <span class="ml-auto"></span>
        <v-icon large class="ml-3 align-self-center">mdi-{{tab_icon}}</v-icon>
        <v-text-field label="icon" dense class="ml-0 flex-grow-0"
                      v-model="tab_icon" hint="yes" persistent-hint>
          <template v-slot:message>
            See
            <a target="_blank" href='https://materialdesignicons.com'>
              materialdesignicons.com <v-icon color="primary" x-small>mdi-open-in-new</v-icon>
            </a>
          </template>
        </v-text-field>

        <!--v-text-field label="grids" dense type="number" class="ml-4 flex-grow-0"
                      style="width: 6ex;" v-model="tab_grids" persistent-hint>
        </v-text-field-->
        <v-btn small class="ml-3 align-self-center" color="primary" @click="handleSave">save</v-btn>
        <v-btn small class="ml-1 align-self-center" @click="handleCancel">cancel</v-btn>
        <v-btn small class="ml-auto align-self-center" @click="handleDeleteTab">delete tab</v-btn>
      </template>
    </v-app-bar>

    <!-- Navigation drawer opening from the left on small devices to show tabs -->
    <v-navigation-drawer v-model="sidebar" app clipped mini-variant v-if="gotConfig">
      <v-tabs vertical v-model=tab_ix>
        <v-tab v-for="t in dash_tabs" :key="t" class="px-0" style="min-width: auto">
          <v-icon large>mdi-{{tabs[t].icon}}</v-icon>
        </v-tab>
      </v-tabs>
    </v-navigation-drawer>

    <v-main>
      <v-tabs-items v-if="gotConfig" v-model="tab_ix">
        <div :style="{ backgroundColor: $vuetify.theme.themes[theme].background}">
          <v-tab-item v-for="(tab, id) in tabs" :key="id">
            <component v-for="g in tab.grids" :key="g"
                       v-bind:is="grids[g].kind" :id="g"
                       @reconfig="reconfig($event)">
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
import Uib from '@/components/uib'
import Demo from '@/components/demo'
//const J = JSON.stringify

export default {
  name: 'Dash',

  components: { Uib, Demo, },
  inject: [ '$config', '$store' ],

  data: () => ({
    appTitle: 'FlexDash',
    sidebar: false, // disabled for now
    gotConfig: false, // set to true when we've received the initial config
    tab_ix: null, // which tab we're on

    // tab editing stuff
    tab_edit: false, // turns tab editing drawer on/off
    tab_icon: "", // icon for the tab
    tab_grids: 1, // number of grids in the tab

    //editMode: false, // global turn on/off editing controls
    settings_menu: null, // whether settings menu is open or not
    settings: { edit: 'Edit mode', theme: 'Toggle theme' }, // options in the settings menu
  }),

  computed: {
    // note: some of the following get evaluated before the config is loaded, the gotConfig
    // guard ensures that they do get re-evaluated when it is loaded despite Vue2 issues...
    dash() { return this.gotConfig ? this.$config.dash : {} },
    dash_tabs() { return this.dash.tabs || [] }, // tabs to show, handling init
    tab_id() { return this.tab_ix != null ? this.dash_tabs[this.tab_ix] : null }, // current tab ID
    tabs() { return this.gotConfig ? this.$config.tabs : {} }, // make accessible in template
    grids() { return this.gotConfig ? this.$config.grids : {} }, // make accessible in template
    theme() { return (this.$vuetify.theme.dark) ? 'dark' : 'light' },

    // for debugging purposes, these show up in the vue devtools
    _sd() { return this.$store.sd },
    _config() { return this.$config },
  },

  watch: {
    // set some defaults for editing tab
    tab_id(id) {
      if (id != null) {
        this.tab_icon = this.tabs[id].icon
        this.tab_grids = this.tabs[id].grids.length
      }
    },
    // ensure the current tab exists
    tabs(tt) {
      if (this.tab_ix >= tt.length) this.tab_ix = tt.length-1
    },
  },

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
    /* reconfig handles a child reconfig event, this is how config changes propagate up
    // and get sent back to the server for persistence.
    // msg must have topic and payload, topic is relative to $config
    reconfig(msg) {
      console.log("config save: ", msg)
      if (msg.topic) {
        msg.topic = "$config/" + msg.topic
        if (this.$refs.uib.$data.enabled) {
          this.$refs.uib.send(msg)
        } else {
          // for demo we enter the config in the in-memory store after a couple of seconds
          console.log("In-memory insert")
          const m = JSON.parse(JSON.stringify(msg)) // get rid of watchers
          window.setTimeout(() => store.insertData(m), 1000)
        }
      }
    },*/

    // Handle a msg event emitted by a server connection, process the message and
    // inject it into the store.
    handleMsg(msg) {
      // Ignore if there's not topic and payload
      if (!('topic' in msg && 'payload' in msg)) {
        console.log("Message w/out topic/payload:", msg)
        return
      }

      // Do some special handling of dashboard config messages
      if (msg.topic === "$config") {
        console.log("*** config received")
        this.gotConfig = true

        // sanity check the config for bootstrapping purposes
        if (!msg.payload || !msg.payload.dash) {
          console.log("*** No or broken config, clearing! (got:", msg.payload)
          this.$store.initDash()
          return
        }
      }

      // Insert into store.
      this.$store.insertData(msg.topic, msg.payload)
    },

    // handle buttons for tab editing
    handleSave() {
      this.$store.updateTab(this.tab_id, {icon: this.tab_icon})
      this.tab_edit = false
    },
    handleCancel() {
      this.tab_edit = false
      this.tab_icon = this.tabs[this.tab_id].icon
    },
    handleAddTab() {
      this.$store.addTab()
      this.tab_ix = this.tabs.length-1 // the new tab should be at the end of the list
      this.tab_edit = true // switch to editing the new tab
    },
    handleDeleteTab() {
      this.$store.deleteTab(this.tab)
    },

  },

}
</script>

<style>
[v-cloak] > * { display:none }
[v-cloak]::before { content: "loading…" }
 
/* Remove some excessive padding at left&right, especially for small devices */
.v-app-bar > .v-toolbar__content { padding: 0px 8px; }
/* Improve vertical alignment of items in toolbar extension (justify-content superceded by mx-auto)*/
.v-app-bar > .v-toolbar__extension { align-items: end; justify-content: center; }
.v-app-bar > .v-toolbar__extension input { padding-top: 0px !important; }
/* Add a hairline between the normal app bar and the extension */
.v-app-bar.theme--light .v-toolbar__extension { border-top: 1px solid #e0e0e0; }
.v-app-bar.theme--dark .v-toolbar__extension { border-top: 1px solid #111; }

/* this is probably the wrong place for these little utility classes... */
.width100 { width: 100%; }
.unit { font-size: 70%; vertical-align: 20%; margin-left: 0.1em; }

</style>
