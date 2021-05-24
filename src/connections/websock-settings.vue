<!-- WebsockSettings - Simple websocket connection to back-end server.
     This file contains a component to display the settings.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-col cols="12" md="5">
    <div style="width:100%; display:flex; justify-content:space-between; align-items:baseline;">
      <h3>Websocket</h3>
      <v-chip small :color="status_color">{{status_txt}}</v-chip>
    </div>
    <v-checkbox label="enabled" :disabled="disable"
                :input-value="config.enabled" @change="handleEnabled" hide-details></v-checkbox>
    <!--v-checkbox label="save config" persistent-hint
        hint="save dashboard config via this connection"></v-checkbox-->
    <v-text-field label="websocket server address" persistent-hint clearable
        :value="config.address" @change="handleAddress" :rules="[validateAddress]"
        hint="wss://server.example.com/mydash, ws://localhost:1880/ws/fd">
    </v-text-field>
    <v-text-field disabled persistent-hint hint="last message received"
                  :value="last_msg">
    </v-text-field>
  </v-col>
</template>

<script scoped>
export default {
  name: "WebsockSettings",

  props: {
    connection: null, // WebsockConnection object
    config: { type: Object, default() { return { enabled: false, address: "" } } },
  },

  created() { console.log("ws-settings created, config:", JSON.stringify(this.config),
      "connection:", JSON.stringify(this.connection)) },

  computed: {
    // last message received to show activity
    last_msg() {
      if (!this.config.enabled) return "- disabled -"
      if (!this.connection || !this.connection.data.last_msg.topic) return "- none -"
      const payload = JSON.stringify(this.connection.data.last_msg.payload)
      return `"${this.connection.data.last_msg.topic}" <- ${payload}`
    },

    status_txt() {
      console.log("status_txt, this.config:", this.config)
      if (!this.config.enabled || !this.connection) return "disabled"
      return this.connection.data.status_txt
    },

    status_color() {
      if (!this.config.enabled || !this.connection) return "grey"
      if (this.connection.data.status == 'ok') return "success"
      return this.connection.data.status == 'bad' ? 'error' : 'grey'
    },

    // disable the enable checkbox if we have not gotten a connection object
    disable() { return !this.connection },
  },

  methods: {
    handleEnabled(ev) {
      this.config.enabled = ev
      if (ev) {
        console.log("WS now enabled, addr:", this.config);
        this.connection.start(this.config.address)
      } else {
        console.log("WS now disabled")
        this.connection.stop()
      }
    },

    handleAddress(addr) {
      this.config.address = addr
      if (this.config.enabled) {
        console.log("WS: address changed, reconnecting")
        this.connection.stop()
        this.connection.start(this.config.address)
      }
    },

    validateAddress(addr) {
      if (!addr.match(/^(ws|http)s?:[/][/]/)) return "address must start with ws:// or wss://"
      if (!addr.match(/^(ws|http)s?:[/][/][^/]+\//)) return "address must contain hostname and path"
      return true
    },
  },

}
</script scoped>
