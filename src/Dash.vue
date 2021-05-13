<!-- Dash - Main Vue component for the entire page.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-app>

    <v-navigation-drawer v-model="sidebar" app>
    </v-navigation-drawer>

    <v-app-bar dense app color="surface">
      <span class="hidden-sm-and-up">
        <v-app-bar-nav-icon @click="sidebar = !sidebar"></v-app-bar-nav-icon>
      </span>
      <v-toolbar-title style="width:10ex"><b>{{ appTitle }}</b></v-toolbar-title>
      <v-tabs v-model=tab>
        <v-tab v-for="t in tabs" :key="t.id"><v-icon large>mdi-{{t.icon}}</v-icon></v-tab>
      </v-tabs>
      <v-menu offset-x min-width="10em" v-model="settings_menu">
        <!-- Menu activator, i.e. the button -->
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on"><v-icon>mdi-cog</v-icon></v-btn>
        </template>
        <!-- Settings Menu -->
        <v-list dense>
          <v-list-item>
            <v-switch v-model="$root.editMode" inset label="Edit mode"></v-switch>
          </v-list-item>
          <v-list-item>
            <v-switch v-model="$vuetify.theme.dark" inset label="Dark theme"></v-switch>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-tabs-items v-if="gotConfig" v-model="tab">
        <div :style="{ backgroundColor: $vuetify.theme.themes[theme].background}">
          <v-tab-item v-for="(t, ix) in tabs" :key="t.id">
            <component v-bind:is="t.kind" :sd="sd" :config="t"
                       @reconfig="reconfig(ix, $event)"></component>
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
import uibuilder from '../public/uibuilderfe.js'

export default {
  name: 'Dash',

  data: () => ({
    appTitle: 'FlexDash',
    sidebar: false, // disabled for now
    sd: {}, // server data coming in through the websocket
    gotConfig: false, // set to true when we've received the initial config
    msgCount: 0,
    tab: null, // which tab we're on
    freshSocket: false, // did we create a fresh socket.io connection?

    //editMode: false, // global turn on/off editing controls
    settings_menu: null, // whether settings menu is open or not
    settings: { edit: 'Edit mode', theme: 'Toggle theme' }, // options in the settings menu
  }),

  computed: {
    // config extracted from the server data, really just this.sd['$config'] except that
    // it handles the initialization case where the config is missing
    config() {
      if (this.gotConfig) return this.sd['$config']
      else return { tabs: [] } // FIXME: return a special "loading..." tab
    },

    // tabs extracted from config, really just config.tabs but handles init case
    tabs() {
      if (this.gotConfig) {
        if (Array.isArray(this.config.tabs) && this.config.tabs.length)
          return this.config.tabs
        uibuilder.send({
            topic: "$config.tabs",
            payload: [ { id: 0, kind: 'small-fixed-grid', icon:'view-dashboard', widgets: [] } ]
        })
      }
      return []
    },

    theme() {
      return (this.$vuetify.theme.dark) ? 'dark' : 'light'
    },
  },

  provide: {
    // send a "raw" message to the server, should be used primarily to send user input, which
    // gets mapped into server-data (self.sd) and thus where the nested component knows which
    // key of self.sd is to be updated.
    sendSrv(topic, payload) {
      uibuilder.send({topic: topic, payload: payload})
    },
  },

  // called after the Vue app has been created, this is a good place to start connecting to the
  // server, unless we got hot-reloaded and already have a connection.
  created() {
    console.log("uibuilder.ioConnected=", uibuilder.get('ioConnected'))
    this.freshSocket = !uibuilder.get('ioConnected')
    if (this.freshSocket) {
      // there's no way to stop uibuilder, so for now we accept that it's active for the
      // duration of hte page, though hot-reloads in development.
      let nodered = process.env.VUE_APP_NR_SERVER + "/" + process.env.VUE_APP_UIB_NAME
      // start uibuilder loaded from installed npm package
      uibuilder.debug(true)
      uibuilder.start({
        namespace: nodered, ioPath: "/uibuilder/vendor/socket.io", vueApp: null,
      })
    }
  },

  methods: {
    // walkTree takes the root of an object hierarchy and a dot-separated path, then walks
    // down the tree along the path and returns the final node in the tree.
    walkTree(root, path) {
      let self = this
      let node = root
      path.forEach(function(d) {
        // handle traversing an array, need to parse index into an int
        if (Array.isArray(node)) {
            const ix = parseInt(d, 10)
            if (Number.isNaN(ix)) {
                console.log(`Array index '${d}' in '${path}' is not an int`)
                return undefined
            } else if (ix < 0 || ix >= node.length) {
                console.log(`Array index '${d}' in '${path}' > ${node.length}`)
                return undefined
            }
            node = node[ix]
        } else if (typeof node === 'object') {
            if (!(d in node)) self.$set(node, d, {}) // allow new subtrees to be created
            node = node[d]
        } else {
          console.log(`Level '${d}' of '${path}'' is not traversable: ${typeof node[d]}`);
          return undefined;
        }
      });
      return node
    },

    // reconfig handles a child reconfig event, this is how config changes propagate up
    // and get sent back to the server for persistence.
    // msg must have topic and payload, topic is relative to the child's root and if null/""
    // the entire child's config gets updated
    reconfig(ix, msg) {
      console.log(`tab reconfig(${ix}, ${msg})`)
      msg.topic = msg.topic ? `$config.tabs.${ix}.${msg.topic}` : `$config.tabs.${ix}`
      uibuilder.send(msg)
    },

  },

  // Called after vue components are loaded and DOM built.
  mounted: function() {
    const self = this

    // Register to process messages from node-red.
    if (this.freshSocket) {
      uibuilder.onChange('msg', function(msg) {
        // Stash away the data as long as the message has a topic and a payload.
        if (!('topic' in msg && 'payload' in msg)) {
          console.log("Message w/out topic/payload:", msg)
          return
        }
        self.msgCount++

        if (msg.topic === "$config") {
          console.log("*** config received")
          self.gotConfig = true
        }

        // Interpret the topic string as a hierarchy of object "levels" separated by dots.
        let tt = msg.topic.split("."); // split levels of hierarchy
        let t = tt.pop(); // separate off last level
        let dir = self.walkTree(self.sd, tt); // start at root
        if (!dir) return
        // now sd[t] is the field to update

        // perform the update
        if (Array.isArray(dir)) {
          const ix = parseInt(t, 10)
          if (!Number.isNaN(ix)) {
            if (ix >= 0 && ix < dir.length) {
              self.$set(dir, ix, msg.payload)
              console.log(`Updated array elt ${msg.topic} with`, msg.payload)
            } else if (ix == dir.length) {
              dir[ix].push(msg.payload)
              console.log(`Appended array elt ${msg.topic} with`, msg.payload)
            } else {
              console.log(`Array index '${ix}' in '${msg.topic}' > ${dir.length}`)
            }
          }
        } else if (typeof(dir) === 'object') {
          self.$set(dir, t, msg.payload) // $set 'cause we may add new props to dir
          console.log(`Updated ${msg.topic} with:`, msg.payload)
          //console.log(self.sd)
        } else {
          console.log(`${msg.topic} is neither Array nor Object in server state`)
          return
        }

      });
    }
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
