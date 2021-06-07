<!-- SockioSettings - Socket.io connection to back-end server.
     This file contains a component to display the settings.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div>
    <div style="width:100%; display:flex; justify-content:space-between; align-items:baseline;">
      <h3>Socket.io</h3>
      <v-chip small :color="status_color">{{status_txt}}</v-chip>
    </div>
    <p>Socket.io uses a `flexdash` namespace and sends `msg` events with a `topic` and
    a `payload` argument.
    Messages for the dashboard configuration have topics starting with <code>$config/</code>.
    </p>
    <p>To load/save the config over socket.io load FlexDash with a query string
    of the form <code>?sio=&lt;socket-io-url&gt;</code>.</p>
    <v-text-field label="socket.io server hostname:port" persistent-hint clearable
        :value="config.hostname" @change="handleHostname" :rules="[validateHostname]"
        hint="server.example.com, localhost:1880">
    </v-text-field>
    <v-text-field label="socket.io path" persistent-hint clearable class="mt-2"
        :value="config.path" @change="handlePath" :rules="[validatePath]"
        hint="webserver path for socket.io, typ /io/flexdash">
    </v-text-field>
    <v-checkbox hide-details label="use https/wss"
                :input-value="config.tls" @change="handleTls"></v-checkbox>
    <v-checkbox hide-details label="enable" :disabled="disable" class="mt-3"
                :input-value="config.enabled" @change="config.enabled=$event"></v-checkbox>
    <div class="mt-3">
      Reload the dashboard from this server (looses current config):
      <v-btn :disabled="status_txt!='OK'" x-small @click="reload()">reload</v-btn>
    </div>
  </div>
</template>

<script scoped>
export default {
  name: "SockioSettings",

  props: {
    connection: null, // SockioConnection object
    config: { type: Object, default() { return {
      enabled: false,
      hostname: "",
      path: "",
      tls: true,
    }}}
  },

  created() {
    // connection pass "address" from window.location into config.address and we have to parse it
    if (this.config.address) {
      const m = this.config.address.match(/^(https?|wss?):\/\/([^/]+)(\/.*)/)
      if (m.length == 4) {
        this.config.hostname = m[2]
        this.config.path = m[3]
        this.config.tls = m[1] == "https" || m[1] == "wss"
        delete this.config.address
        this.$emit('change', JSON.parse(JSON.stringify(this.config)))
      }
    } else {
      if (!this.config.path) this.config.path = "/io/flexdash/"
    }
    //console.log("sio-settings created, config:", JSON.stringify(this.config),
    //  "connection:", JSON.stringify(this.connection))
    if (this.config.enabled && this.validateHostname(this.config.hostname) === true)
      this.connection.start(this.config)
  },

  computed: {
    status_txt() {
      //console.log("status_txt, this.config:", this.config)
      if (!this.config.enabled || !this.connection) return "disabled"
      return this.connection.data.status_txt || this.connection.data.status
    },

    status_color() {
      if (!this.config.enabled || !this.connection) return "grey"
      if (this.connection.data.status == 'ok') return "success"
      return this.connection.data.status == 'bad' ? 'error' : 'grey'
    },

    // disable the enable checkbox if we have not gotten a connection object
    disable() { return !this.connection },
  },

  watch: {
    'config.enabled'(en) {
      if (en) {
        console.log("SIO now enabled, hostname:", this.config.hostname);
        if (this.validateHostname(this.config.hostname) === true)
          this.connection.start(this.config)
      } else {
        console.log("SIO now disabled")
        this.connection.stop()
      }
    },
  },

  methods: {
    reconnect(why) {
      console.log("SIO:", why, "changed, reconnecting")
      this.connection.stop()
      if (this.validateHostname(this.config.hostname) === true &&
          this.validatePath(this.config.path) === true)
      {
        this.connection.start(this.config)
      }
    },

    handleHostname(hostname) {
      this.config.hostname = hostname
      this.$emit('change', this.config)
      if (this.config.enabled) this.reconnect("hostname")
    },

    handlePath(path) {
      this.config.path = path
      this.$emit('change', this.config)
      if (this.config.enabled) this.reconnect("path")
    },

    handleTls(en) {
      this.config.tls = en
      this.$emit('change', this.config)
      if (this.config.enabled) this.reconnect("TLS")
    },

    validateHostname(addr) {
      if (!addr.match(/^[^/\s:'"]+(:[0-9]+)?$/)) return "only hostname:port"
      return true
    },

    validatePath(path) {
      if (!path.match(/^\//)) return "path must start with /"
      return true
    },

    reload() {
      window.location.search = "sio=" + this.config.address
    },
  },

}
</script scoped>
