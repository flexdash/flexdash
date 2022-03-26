<!-- WebsockSettings - Simple websocket connection to back-end server.
     This file contains a component to display the settings.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div>
    <div style="width:100%; display:flex; justify-content:space-between; align-items:baseline;">
      <h3>Websocket</h3>
      <v-chip small :color="status_color">{{status_txt}}</v-chip>
    </div>
    <p>The websocket uses JSON messages of the form
    <code>{"topic":"...", "payload":...}</code>. Messages for the dashboard
    configuration have topics starting with <code>$config/</code>.
    </p>
    <p>To load/save the config over websocket load the dashboard with a query string
    of the form <code>?ws=&lt;websocket-url&gt;</code>.</p>
    <v-text-field label="websocket server address" persistent-hint clearable
        :value="config.address" @change="handleAddress" :rules="[validateAddress]"
        hint="wss://server.example.com/mydash, ws://localhost:1880/ws/fd">
    </v-text-field>
    <v-checkbox hide-details label="enable" :disabled="disable"
                :input-value="config.enabled" @change="config.enabled=$event"></v-checkbox>
    <div class="mt-3">
      Reload the dashboard from this server (looses current config):
      <v-btn :disabled="status_txt!='OK'" x-small @click="reload()">reload</v-btn>
    </div>
  </div>
</template>

<script scoped>
export default {
  name: "WebsockSettings",

  props: {
    connection: null, // WebsockConnection object
    config: { type: Object, default() { return { enabled: false, config: false, address: "" } } },
  },

  //created() { console.log("ws-settings created, config:", JSON.stringify(this.config),
  //    "connection:", JSON.stringify(this.connection)) },

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
    'config.enabled': {
      immediate: true,
      handler(en) {
        if (en) {
          console.log("WS now enabled, addr:", this.config.address);
          if (this.validateAddress(this.config.address) === true)
            this.connection.start(this.config.address, this.config.config)
        } else {
          console.log("WS now disabled")
          this.connection.stop()
        }
      },
    },
  },

  methods: {
    handleAddress(addr) {
      this.config.address = addr
      this.$emit('change', this.config)
      if (this.config.enabled) {
        console.log("WS: address changed, reconnecting")
        this.connection.stop()
        if (this.validateAddress(this.config.address) === true)
          this.connection.start(this.config.address, this.config.config)
      }
    },

    validateAddress(addr) {
      if (!addr.match(/^(ws|http)s?:[/][/]/)) return "address must start with ws:// or wss://"
      if (!addr.match(/^(ws|http)s?:[/][/][^/]+\//)) return "address must contain hostname and path"
      return true
    },

    reload() {
      window.location.search = "ws=" + this.config.address
    },
  },

}
</script>
