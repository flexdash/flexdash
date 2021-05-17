<!-- Dash - Main Vue component for the entire page.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-app>

    <v-navigation-drawer v-model="sidebar" app>
    </v-navigation-drawer>

    <v-app-bar dense app :flat="$root.editMode" color="surface">
      <span class="hidden-sm-and-up">
        <v-app-bar-nav-icon @click="sidebar = !sidebar"></v-app-bar-nav-icon>
      </span>
      <v-toolbar-title style="width:10ex"><b>{{ appTitle }}</b></v-toolbar-title>
      <v-tabs v-model=tab>
        <v-tab v-for="t in tabs" :key="t.id"><v-icon large>mdi-{{t.icon}}</v-icon></v-tab>
      </v-tabs>
      <demo @msg="handleMsg"></demo>
      <uib ref="uib" @msg="handleMsg"></uib>
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

    <v-main>
      <v-tabs-items v-if="gotConfig" v-model="tab">
        <div :style="{ backgroundColor: $vuetify.theme.themes[theme].background}">
          <v-tab-item v-for="t in tabs" :key="t.id">
            <component v-for="g in t.grids" :key="g.id"
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
import store from '@/store.js'

export default {
  name: 'Dash',

  components: {
    Uib, Demo,
  },

  data: () => ({
    appTitle: 'FlexDash',
    sidebar: false, // disabled for now
    gotConfig: false, // set to true when we've received the initial config
    tab: 0, // which tab we're on

    //editMode: false, // global turn on/off editing controls
    settings_menu: null, // whether settings menu is open or not
    settings: { edit: 'Edit mode', theme: 'Toggle theme' }, // options in the settings menu
  }),

  computed: {
    // tabs extracted from config, really just config.tabs but handles init case
    // Each tab has: id, icon, grids[]
    tabs() {
      if (this.gotConfig && Array.isArray(store.config.tabs) && store.config.tabs.length) {
        return store.config.tabs
      }
      console.log("No tabs yet")
      return []
    },

    grids() { return store.config.grids }, // make accessible in template

    theme() {
      return (this.$vuetify.theme.dark) ? 'dark' : 'light'
    },

    // for debugging purposes, these show up in the vue devtools
    _sd() { return store.sd },
    _config() { return store.config },
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
    // reconfig handles a child reconfig event, this is how config changes propagate up
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
    },

    // Called after vue components are loaded and DOM built.
    handleMsg(msg) {
      // Stash away the data as long as the message has a topic and a payload.
      if (!('topic' in msg && 'payload' in msg)) {
        console.log("Message w/out topic/payload:", msg)
        return
      }

      if (msg.topic === "$config") {
        console.log("*** config received")
        this.gotConfig = true

        // sanity check the config for bootstrapping purposes
        if (!msg.payload || !msg.payload.tabs) {
          console.log("*** No or broken config, clearing! (got:", msg.payload)
          this.$refs.uib.send({
            topic: "$config.tabs",
            payload: { "tab0": { id: "tab0", icon:'view-dashboard', grids: [ "grid0" ] } },
          })
          this.$refs.uib.send({
            topic: "$config.grids",
            payload: { "grid0": { id: "grid0", kind: 'fixed-grid', widgets: [] } }
          })
        }
      }

      store.insertData(msg)
    },

  },

}
</script>

<style>
[v-cloak] > * { display:none }
[v-cloak]::before { content: "loading…" }
 
.v-main { background-color: #888888; }

/* this is probably the wrong place for these little utility classes... */
.width100 { width: 100%; }
.unit { font-size: 70%; vertical-align: 20%; margin-left: 0.1em; }

</style>
