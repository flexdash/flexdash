<!-- Uib - Wrapper around uibuilder, the socket.io connection to the node-red server.
     Maintains the connection, displays an icon and error messages, emits messages received.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-icon :color="color">mdi-network</v-icon>
</template>

<script scoped>
// eslint
import uibuilder from '@/../public/uibuilderfe.js'
window.uib_started = false;

export default {
  name: 'Uib',

  data: () => ({
    connected: false,
    msgCount: 0,
  }),

  computed: {
    color() { return this.connected ? "green" : "error" },
  },

  created() { console.log("uib created") },

  deleted() {
    uibuilder.clearEventListeners()
    console.log("uib deleted")
  },

  // Called after vue components are loaded and DOM built.
  mounted() {
    const self = this

    const ioc = uibuilder.get('ioConnected')
    console.log(`uib mounted, uib_started=${window.uib_started} Connected=${ioc}`)

    // start uibuilder and its socket.io connection, start() is a no-op if it's already running
    // we do _not_ pass the vue app 'cause we don't want uibuilder to mess with stuff
    uibuilder.clearEventListeners() // ensure no old instances of ourself are listening
    let nodered = process.env.VUE_APP_NR_SERVER + "/" + process.env.VUE_APP_UIB_NAME
    //uibuilder.debug(true)
    uibuilder.start({
      namespace: nodered, ioPath: "/uibuilder/vendor/socket.io", vueApp: null,
    })
    if (window.uib_started) {
      // fake the cache replay message so we get the init data...
      uibuilder.sendCtrl({from: "client", cacheControl: "REPLAY"})
    }
    window.uib_started = true

    uibuilder.onChange('msg', function(msg) {
      self.msgCount++
      self.$emit('msg', msg)
    })

    uibuilder.onChange('ioConnected', function(v) {
      self.connected = !!v
    })
  },

  methods: {
    // called by parent using $ref
    send(msg) { uibuilder.send(msg) },
  },

}
</script>
