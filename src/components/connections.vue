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

    <v-dialog v-model="show_dialog">
      <v-card>
        <v-card-title class="d-flex">
          <span>Server Connections</span>
          <v-spacer></v-spacer>
          <v-btn elevation=0 icon @click="show_dialog=false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <!--v-container-->
            <v-row justify="space-between">
             <websock-settings :connection="websock_connection" :config="websock_config">
             </websock-settings>
             <demo-settings :connection="demo_connection" :config="demo_config">
             </demo-settings>
              <v-col cols="12" md="5">
                <h3>UIbuilder</h3>
                Connect to Node-Red using UIbuilder's socket.io
                <v-checkbox disabled label="enabled (not yet implemented)" hide-details>
                </v-checkbox>
                <v-text-field label="Node-Red server address" persistent-hint
                    hint="http://localhost:1880/ws/fd">
                </v-text-field>
                <v-text-field label="UIbuilder namespace" persistent-hint
                    hint="URL field in the uibuilder node's properties in node-red">
                </v-text-field>
              </v-col>
            </v-row>
          <!--/v-container-->
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
  
</template>

<script scoped>
//import Uib from '@/components/uib'
import DemoSettings from '/src/connections/demo-settings.vue'
import DemoConnection from '/src/connections/demo.js'
import WebsockSettings from '/src/connections/websock-settings.vue'
import WebsockConnection from '/src/connections/websock.js'

export default {
  name: "Connections",

  components: { DemoSettings, WebsockSettings },

  data: ()=> ({
    show_dialog: false, // modal dialog box to configure connections
    demo_connection: null,
    websock_connection: null,
  }),

  computed: {
    // compute the color of the connections status icon
    icon_color() {
      let num_ok = 0, num_bad = 0
      for (const c of [this.demo_connection, this.websock_connection]) {
        if (!c) continue
        switch (c.data.status) {
          case 'ok': num_ok++; break;
          case 'bad': num_bad++; break;
        }
      }
      // if all connections are OK: green, if some OK, some BAD: warning,
      // if all BAD: error, if all disabled: grey
      if (num_ok) return num_bad ? "warning" : "success"
      return num_bad ? "error" : "grey"
    },

    demo_config() { return this.$config.conn ? this.$config.conn.demo : undefined },
    websock_config() { return this.$config.conn ? this.$config.conn.websock : undefined },
  },

  inject: [ '$store', '$config' ],

  created() {
    console.log("Connection: created")
    const conn = this.$config.conn
    this.$set(conn, 'demo', { enabled: true })
    this.$set(conn, 'websock', { enabled: false, address: "" })
    // check out query string of page load to see whether there's connection info
    const sp = this.$root.params
    if (sp && sp.get('ws')) {
      // got a websocket address string, turn off demo and enable websock
      conn.demo.enabled = false
      conn.websock.address = sp.get('ws')
      conn.websock.enabled = true
    }
    console.log("Initial connection config:", JSON.stringify(conn))
  },

  mounted() {
    console.log("Connection: mounted, websock_config:", this.websock_config)
    this.demo_connection = new DemoConnection(undefined, this.handleMsg)
    if (this.demo_config && this.demo_config.enabled) this.demo_connection.start()
    this.websock_connection = new WebsockConnection(undefined, this.handleMsg)
    if (this.websock_config && this.websock_config.enabled && this.websock_config.address)
      this.websock_connection.start(this.websock_config.address)

    // set a global variable with our serverSend method so the widget-wrapper can send
    // data on behalf of widgets
    // using a lambda here to get the correct 'this'
    this.$root.serverSend = (topic, payload) => this.serverSend(topic, payload)
  },

  beforeDestroy() {
    console.log("Connection: beforeDestroy")
    if (this.demo_connection) this.demo_connection.stop()
    if (this.websock_connection) this.websock_connection.stop()
  },

  methods: {
    showDialog(ev) { this.show_dialog = true; ev.stopPropagation() },

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
        const p = msg.payload
        console.log(`*** config for '${p.dash.title}' received:`,
            `${Object.keys(p.tabs).length} tabs, ${Object.keys(p.grids).length} grids,`,
            `${Object.keys(p.widgets).length} widgets`)

        if (this.$config.dash.title) {
          console.log("Already got config, dropping message")
          return
        }

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

    // serverSend is used to send data from widgets to all servers we're connected to
    // topics starting with '$demo' are directly inserted into the store and not sent to servers
    // FIXME: decide whether to block $config
    serverSend(topic, payload) {
      if (topic.startsWith('$demo')) {
        this.$store.insertData(topic, payload)
      } else {
        if (this.websock_connection) {
          this.websock_connection.serverSend(topic, payload)
        }
        // add other connections here...
      }

    },

  },

}
</script>
