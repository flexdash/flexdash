<!-- Connections - An icon and a pop-up page to manage server connections.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div class="mx-2">
    <v-tooltip bottom>
      <template v-slot:activator="{on}">
        <v-btn small icon :color="icon_color" v-on="{click:showDialog, ...on}">
          <v-icon>mdi-network</v-icon>
        </v-btn>
      </template>
      <span>Server connections</span>
    </v-tooltip>

    <!-- connections pop-up dialog, rendered eagerly 'cause we want those components to
         do work for us from the get-go -->
    <v-dialog eager v-model="show_dialog">
      <v-card>
        <v-card-title class="d-flex">
          <span>Server Connections</span>
          <v-spacer></v-spacer>
          <v-btn elevation=0 icon @click="show_dialog=false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text v-if="config_wait">
          <v-chip small class="mr-1" color="error">error</v-chip>
          {{config_source}} connected but server is not sending configuration
        </v-card-text>

        <!-- individual types of connections -->
        <masonry class="v-card__text">
          <masonry-brick>
            <div>
              <h3 class="mb-1">Saving the dashboard config</h3>
              <p>The dashboard's configuration is generally saved to the connection from
              which it was initially loaded. If that is the demo then no saving occurs.<p>
              <div>
                <span class="font-weight-medium">Saving to:</span>
                <v-chip class="ml-3">{{config_source_name}}</v-chip>
              </div>
            </div>
          </masonry-brick>

          <masonry-brick>
            <sockio-settings :connection="connections['sockio'].conn" :config="sockio_config"
                             @change="changeConfig('sockio', $event)">
            </sockio-settings>
          </masonry-brick>

          <masonry-brick>
            <websock-settings :connection="connections['websocket'].conn" :config="websock_config"
                              @change="changeConfig('websock', $event)">
            </websock-settings>
          </masonry-brick>

          <masonry-brick>
            <demo-settings :connection="connections['demo'].conn" :config="demo_config"
                           @change="changeConfig('demo', $event)">
            </demo-settings>
          </masonry-brick>
        </masonry>
      </v-card>
    </v-dialog>
  </div>
</template>

<script scoped>
//import Uib from '@/components/uib'
import Masonry from '/src/components/masonry.vue'
import MasonryBrick from '/src/components/masonry-brick.vue'
import DemoSettings from '/src/connections/demo-settings.vue'
import DemoConnection from '/src/connections/demo.js'
import WebsockSettings from '/src/connections/websock-settings.vue'
import WebsockConnection from '/src/connections/websock.js'
import SockioSettings from '/src/connections/sockio-settings.vue'
import SockioConnection from '/src/connections/sockio.js'

export default {
  name: "Connections",

  components: { Masonry, MasonryBrick, DemoSettings, WebsockSettings, SockioSettings },

  data: ()=> ({
    show_dialog: false, // modal dialog box to configure connections
    connections: {
      demo: { connClass: DemoConnection, settClass: DemoSettings },
      websocket: { connClass: WebsockConnection, settClass: WebsockSettings },
      sockio: { connClass: SockioConnection, settClass: SockioSettings },
    },
    config_source: null,
  }),

  computed: {
    // compute the color of the connections status icon
    icon_color() {
      let num_ok = 0, num_bad = 0
      for (const c in this.connections) {
        if (!('conn' in this.connections[c])) continue
        switch (this.connections[c].conn.data.status) {
          case 'ok': num_ok++; break;
          case 'bad': num_bad++; break;
        }
      }
      // if all connections are OK: green, if some OK, some BAD: warning,
      // if all BAD: error, if all disabled: grey
      if (num_ok) return num_bad ? "warning" : "success"
      return num_bad ? "error" : "grey"
    },

    gotConfig() { return this.$config.dash.title !== undefined },
    config_wait() {
      return !this.gotConfig && this.config_source && this.connections[this.config_source].conn
             && this.connections[this.config_source].conn.data.status == "ok"
    },

    demo_config() { return this.$config.conn ? this.$config.conn.demo : undefined },
    websock_config() { return this.$config.conn ? this.$config.conn.websocket : undefined },
    sockio_config() { return this.$config.conn ? this.$config.conn.sockio : undefined },

    config_source_name() { return this.config_source || "none" },
  },

  inject: [ '$store', '$config' ],

  // created is called before child components are created, so we can parse the URL and prep
  // some config for them.
  created() {
    console.log("Connection: created")
    const conn = this.$config.conn
    this.$set(conn, 'demo', { enabled: false, config: false })
    this.$set(conn, 'websocket', { enabled: false, config: false, address: "" })
    this.$set(conn, 'sockio', { enabled: false, config: false, hostname:"", path:"", tls:false })

    // instantiate all the connection objects (they all wait for a start() call)
    for (name in this.connections) {
      const c = this.connections[name]
      c.conn = new c.connClass(this.handleMsg)
    }
    
    // check out query string of page load to see whether there's connection info
    const sp = this.$root.params
    if (sp && sp.get('sio')) {
      // got a socketio address string, enable sockio
      conn.sockio.address = sp.get('sio')
      conn.sockio.enabled = true
      conn.sockio.config = true
      this.config_source = "sockio"
      this.$emit('src', 'sockio ' + conn.sockio.address)
    } else if (sp && sp.get('ws')) {
      // got a websocket address string, enable websock
      conn.websocket.address = sp.get('ws')
      conn.websocket.enabled = true
      conn.websocket.config = true
      this.config_source = "websocket"
      this.$emit('src', 'websocket ' + conn.websocket.address)
    } else {
      conn.demo.enabled = true
      conn.demo.config = true
      this.config_source = "demo"
      this.$emit('src', 'demo')
    }
    console.log("Initial connection config:", JSON.stringify(conn))

    // set a global variable with our serverSend method so the widget-wrapper can send
    // data on behalf of widgets
    // using a lambda here to get the correct 'this'
    this.$root.serverSend = (topic, payload) => this.serverSend(topic, payload)
    this.$store.serverSend = (topic, payload) => this.serverSend(topic, payload)
  },

  mounted() {
    //console.log("Connection: mounted")
    // pop-up the connections dialog if nothing happens in 5 seconds
    window.setTimeout(()=>{ if (!this.gotConfig) this.show_dialog = true }, 5000)
  },

  beforeDestroy() {
    console.log("Connection: beforeDestroy")
    for (name in this.connections) {
      const c = this.connections[name]
      if (c.conn) c.conn.stop()
    }
  },

  methods: {
    showDialog(ev) { this.show_dialog = true; ev.stopPropagation() },

    // send full config to the server
    sendConfig() {
      for (let c in this.$config) {
        this.serverSend("$config/" + c, this.$config[c])
      }
    },

    // Handle a msg event emitted by a server connection, process the message and
    // inject it into the store.
    // FIXME: this doesn't get triggered if the config isn't sent as one single message...
    handleMsg(topic, payload) {
      // Do some special handling of dashboard config messages
      if (topic === "$config") {
        const p = payload
        console.log(`*** config received with keys:`, Object.keys(p))

        if (this.$config.dash.title) {
          console.log("Already got config, dropping message")
          return
        }

        // sanity check the config for bootstrapping purposes
        if (!payload || !payload.dash) {
          console.log("*** No or broken config, clearing! (got:", payload)
          this.$store.initDash()
          // add some welcome text
          const tab = this.$config.dash.tabs[0]
          const grid = this.$config.tabs[tab].grids[0]
          const ix = this.$store.addWidget(grid, 'Markdown')
          const widget = this.$config.grids[grid].widgets[ix]
          this.$store.updateWidget(widget, { cols: 3, rows: 3 })
          this.$store.updateWidgetProp(widget, 'static', 'title', '')
          this.$store.updateWidgetProp(widget, 'static', 'text', `# Welcome to FlexDash
This is an empty dashboard. You can add some demo/informational tabs by opening the
connections panel using the network icon in the upper right and using the
inject buttons in the demo section.`)
          this.sendConfig()
          return
        }
      }

      // Insert into store.
      this.$store.insertData(topic, payload)
    },

    // serverSend is used to send data from widgets to all servers we're connected to
    // topics starting with '$demo' are directly inserted into the store and not sent
    // to servers
    // FIXME: decide whether to block $config
    // FIXME: right now $config changes are sent to the "config_source" and others are
    // broadcast to all conncetions. Some sanity needs to be brought into the situation,
    // perhaps "secondary" connections should be mounted into the topic tree with a prefix?
    serverSend(topic, payload) {
      if (topic.startsWith('$demo')) {
        this.$store.insertData(topic, payload)
      } else if (topic.startsWith('$config') && this.config_source) {
        this.connections[this.config_source].conn.serverSend(topic, payload)
      } else {
        for (let c in this.connections) {
          const conn = this.connections[c].conn
          console.log(c, conn, this.$config.conn[c])
          if (conn && this.$config.conn[c].enabled) conn.serverSend(topic, payload)
        }
      }

    },

    changeConfig(conn, config) {
      this.$config.conn[conn] = config
    },

  },

}
</script>
