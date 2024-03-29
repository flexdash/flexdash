<!-- Connections - An icon and a pop-up page to manage server connections.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div class="mx-2">
    <v-tooltip v-if="multiple">
      <template v-slot:activator="{props}">
        <v-btn icon :color="icon_color" @click="showDialog" v-bind="props">
          <v-icon icon="mdi-network" />
        </v-btn>
      </template>
      <span>Server connections</span>
    </v-tooltip>

    <v-snackbar fixed top right class="mt-n1" :color="snackbar_color"
                v-model="snackbar" :timeout="-1">
      <div v-if="snackbar_noconn">No server connection! Reconnecting...</div>
      {{ snackbar_text }}
      <template v-slot:actions>
        <v-btn icon><v-icon icon="mdi-close" /></v-btn>
      </template>
    </v-snackbar>

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
        <masonry class="v-card-text">
          <masonry-brick>
            <div>
              <h3 class="mb-1">Saving the dashboard config</h3>
              <p>The dashboard's configuration is generally saved to the connection from
              which it was initially loaded. If that is the demo then no saving occurs.</p>
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

    <v-dialog eager :value="show_auth">
    </v-dialog>
  </div>
</template>

<script scoped>
import {defineAsyncComponent} from 'vue'
import Masonry from '/src/components/masonry.vue'
import MasonryBrick from '/src/components/masonry-brick.vue'
import DemoSettings from '/src/connections/demo-settings.vue'
import DemoConnection from '/src/connections/demo.js'
import WebsockSettings from '/src/connections/websock-settings.vue'
import WebsockConnection from '/src/connections/websock.js'
import SockioSettings from '/src/connections/sockio-settings.vue'
import SockioConnection from '/src/connections/sockio.js'

var auth_strategies = []
const auth_modules = import.meta.glob('/src/components/auth-*.vue')
for (const path in auth_modules) {
  const name = path.split('/').pop().replace('.vue', '')
  if (name !== 'unknown') auth_strategies.push(name.replace('auth-', ''))
  defineAsyncComponent(name, auth_modules[path])
}

export default {
  name: "Connections",

  components: { Masonry, MasonryBrick, DemoSettings, WebsockSettings, SockioSettings },

  emits: [ 'update:src', 'ctrlMessage' ],

  data: ()=> ({
    show_dialog: false, // modal dialog box to configure connections
    connections: {
      demo: { connClass: DemoConnection, settClass: DemoSettings },
      websocket: { connClass: WebsockConnection, settClass: WebsockSettings },
      sockio: { connClass: SockioConnection, settClass: SockioSettings },
    },
    config_source: null,
    show_auth: null, // component to show for authentication
    auth_config: null, // config for the auth component
  }),

  computed: {
    // compute the color of the connections status icon
    icon_color() {
      const num_ok = this.conn_statuses.filter(s => s.status === "ok").length
      const num_bad = this.conn_statuses.filter(s => s.status === "bad").length
      // if all connections are OK: green, if some OK, some BAD: warning,
      // if all BAD: error, if all disabled: grey
      if (num_ok) return num_bad ? "warning" : "success"
      return num_bad ? "error" : "grey"
    },

    // get the statuses and messages for active connections
    conn_statuses() {
      return Object.entries(this.connections).map(([n,c]) => {
        const s = c.conn?.data?.status
        if (s && s !== "off") return { status: s, txt: c.conn.data.status_txt, name: n }
      }).filter(s => s)
    },
    // notification snackbar for connection status/problems
    snackbar() { return !!this.conn_statuses.find(s => s.status !== "ok") },
    snackbar_text() {
      const ss = this.conn_statuses.find(s => s.status !== "ok") // FIXME: support multiple
      return ss ? `${ss.name}: ${ss.txt}` : ""
    },
    snackbar_noconn() {
      return !this.conn_statuses.find(s => s.status === "ok")
    },
    snackbar_color() {
      const ss = this.conn_statuses.find(s => s.status !== "ok") // FIXME: support multiple
      return ss && ss.status === "bad" ? "error" : "warning"
    },

    gotConfig() { return this.$config.dash.title !== undefined },
    config_wait() {
      return !this.gotConfig && this.config_source && this.connections[this.config_source].conn
             && this.connections[this.config_source].conn.data.status == "ok"
    },

    demo_config() { return this.$config.conn ? this.$config.conn.demo : undefined },
    websock_config() { return this.$config.conn ? this.$config.conn.websocket : undefined },
    sockio_config() { return this.$config.conn ? this.$config.conn.sockio : undefined },

    config_source_name() { return this.config_source || "-none-" },
  },

  inject: [ '$store', '$config', 'global', '$conn' ],

  // created is called before child components are created, so we can parse the URL and prep
  // some config for them.
  created() {
    const conn = this.$config.conn
    conn['demo'] = { enabled: false, config: false }
    conn['websocket'] = { enabled: false, config: false, address: "" }
    conn['sockio'] = { enabled: false, config: false, hostname:"", path:"", tls:false }

    // instantiate all the connection objects (they all wait for a start() call)
    for (let name in this.connections) {
      const c = this.connections[name]
      c.conn = new c.connClass(this.$store, this.handleMsg, how => this.doAuth(name, how))
    }

    const setup_sio = addr => {
      conn.sockio.address = addr
      conn.sockio.enabled = true
      conn.sockio.config = true
      this.config_source = "sockio"
      this.$emit('update:src', 'sockio ' + conn.sockio.address)
    }

    const setup_ws = addr => {
      conn.websocket.address = addr
      conn.websocket.enabled = true
      conn.websocket.config = true
      this.config_source = "websocket"
      this.$emit('update:src', 'websocket ' + conn.websocket.address)
    }
    
    // check out query string of page load to see whether there's connection info
    // if no query string then also look into the global options
    const sp = this.global.params
    let count = 0
    if (sp && sp.get('sio')) {
      setup_sio(sp.get('sio')) // got a socketio address string, enable sockio
      count++
    } else if (sp && sp.get('ws')) {
      setup_ws(sp.get('ws')) // got a websocket address string, enable websock
      count++
    } else if (window.flexdash_options.sio) {
      setup_sio(window.flexdash_options.sio) // got global option for socketio
      count++
    } else if (window.flexdash_options.ws) {
      setup_sio(window.flexdash_options.ws) // got global option for websocket
      count++
    } else if (this.global.noDemo) {
      // no real network connection, and demo mode prohibited
    } else {
      // no real network connection, set-up demo mode
      conn.demo.enabled = true
      conn.demo.config = true
      this.config_source = "demo"
      this.$emit('update:src', 'demo')
    }
    //console.log("Initial connection config:", JSON.stringify(conn))
    this.multiple = count != 1

    // set a global variable with our serverSend method so the widget-wrapper can send
    // data on behalf of widgets
    // using a lambda here to get the correct 'this'
    this.$conn.serverSend = this.serverSend.bind(this)
    this.$conn.serverQuery = this.serverQuery.bind(this) // async!
    this.$store.serverSend = this.serverSend.bind(this)
    this.$store.serverQuery = this.serverQuery.bind(this) // async!
  },

  mounted() {
    // pop-up the connections dialog if nothing happens in 5 seconds
    if (this.multiple) {
      window.setTimeout(()=>{ if (!this.gotConfig) this.show_dialog = true }, 5000)
    }
  },

  beforeDestroy() {
    for (const name in this.connections) {
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
    // The root_url is the URL prefix of the socket.io or websocket "mount point", e.g. for a
    // https://example.com/data/sio socket.io URL it would be everything before the sio part.
    handleMsg(kind, ...params) {
      if (kind === "set") {
        // handleMsg("set", topic, payload)
        if (params[0] === "$config") {
          // config setting gets some special treatment
          const payload = params[1] // payload
          console.log(`*** config received with keys:`, Object.keys(payload))

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

        if (params[0] === "sd") {
          // handle setting/initializing the entire data tree a little specially to aid Vue
          // reactivity (some watchers don't get triggered if we just assign this.store.sd)
          Object.assign(this.$store.sd, params[1])
          return
        }

        // Insert into store.
        this.$store.insertData(params[0], params[1])
        return
      }

      // handleMsg("unset", topic)
      if (kind === "unset") {
        this.$store.insertData(params[0])
        return
      }

      if (kind === "push" || kind === "shift") {
        this.$store.alterData(kind, params[0], params[1])
        return
      }

      if (kind === 'ctrl') {
        this.$emit('ctrlMessage', params[0])
        return
      }

      // handleMsg("download", url, filename, root_url)
      if (kind === "download") {
        this.download(params[0], params[1], params[2])
        return
      }

      console.log("Unknown message kind:", kind, params)
    },

    // Initiate the download of a file from the server. This happens outside of the normal connection
    // using a plain HTTP request so the browser's regular download machinery is invoked.
    // This is not all peachy 'cause it seems to disconnect all websockets...
    // Try using https://github.com/eligrey/FileSaver.js in the future
    download(url, filename, base) {
      console.log("In download:", url, filename, base)
      // tweak the URL so it points to the correct server, this is required because a simple
      // URL without hostname points to where FlexDash was loaaded from, which may be a
      // completely different server.
      if (url.startsWith("http://") || url.startsWith("https://")) {
        // leave as-is
      } else if (url.startsWith("/")) {
        let bb = base.split('/')
        url = `${bb[0]}//${bb[2]}${url}`
      } else {
        url = base + url
      }
      // start creating a link element that we can virtually click on
      const a = document.createElement('a')
      a.href = url
      a.download = filename || url.split('/').pop()
      console.log("Downloading", a.href, "as", a.download)
      // insert into DOM, click, and remove again
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },

    // serverSend is used to send data from widgets to all servers we're connected to
    // topics starting with '$demo' are directly inserted into the store and not sent
    // to servers
    // FIXME: decide whether to block $config
    // FIXME: right now $config changes are sent to the "config_source" and others are
    // broadcast to all connections. Some sanity needs to be brought into the situation,
    // perhaps "secondary" connections should be mounted into the topic tree with a prefix?
    serverSend(topic, payload, kind) {
      if (topic.startsWith('$demo')) {
        this.$store.insertData(topic, payload)
      } else if (topic.startsWith('$config') && this.config_source) {
        this.connections[this.config_source].conn.serverSend(topic, payload, kind)
      } else {
        for (let c in this.connections) {
          const conn = this.connections[c].conn
          //console.log(c, conn, this.$config.conn[c])
          if (conn && this.$config.conn[c].enabled) conn.serverSend(topic, payload, kind)
        }
      }
    },

    // serverQuery sends a request to the config_source server and asynchronously returns the response,
    // it really returns a Promise that gets resolved on response with a payload
    // or rejected on timeout
    serverQuery(topic, payload, kind) {
      if (this.config_source) {
        const conn = this.connections[this.config_source]
        return conn.conn.serverQuery(topic, payload, kind) // -> promise
      } else {
        console.log("No config_source, can't perform serverQuery")
      }
    },

    changeConfig(conn, config) {
      this.$config.conn[conn] = config
    },

    // Callback from connection telling us that the user needs to authenticate, so we need to
    // put up a diaglog box or something.
    doAuth(conn, how) {
      this.show_dialog = true
      this.auth_config = how
      this.auth_conn = conn
      this.$config.conn[conn].enabled = false // disable in case user cancels auth so it doesn't retry
      if (how.strategy && auth_strategies.includes(how.strategy)) {
        this.show_auth = "auth-" + how.strategy
      } else {
        console.log("Unknown auth strategy:", how.strategy, "known:", auth_strategies)
        this.show_auth = "auth-unknown"
      }
    },

    authDone(ev) {
      console.log("Auth done:", ev)
      this.show_auth = null
      if (ev == 'success') {
        this.$config.conn[this.auth_conn].enabled = true
        this.show_dialog = false
        if (!this.gotConfig) 
          window.setTimeout(()=>{ if (!this.gotConfig) this.show_dialog = true }, 5000)
      } else {
        this.show_dialog = !this.gotConfig
      }
      this.auth_conn = null
      this.auth_config = null
    },

  },
}

</script>
