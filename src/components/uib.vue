<!-- Uib - Wrapper around uibuilder, the socket.io connection to the node-red server.
     Maintains the connection, displays an icon and error messages, emits messages received.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div class="mx-2">
    <v-tooltip bottom>
      <template v-slot:activator="{on}">
        <v-btn small icon :color="color" v-on="{click:handleClick, ...on}">
          <v-icon>mdi-network</v-icon>
        </v-btn>
      </template>
      <span>Enable socket.io connection</span>
    </v-tooltip>
  </div>
</template>

<script scoped>
// eslint
import uibuilder from '@/../public/uibuilderfe.js'
window.uib_started = false;

export default {
  name: 'Uib',

  data: () => ({
    enabled: false,
    connected: false,
    msgCount: 0,
  }),

  computed: {
    color() { return this.enabled? (this.connected ? "green" : "error") : null },
  },

  created() { console.log("uib created") },

  deleted() {
    uibuilder.clearEventListeners()
    console.log("uib deleted")
  },

  // Called after vue components are loaded and DOM built.
  mounted() { if (this.enabled) this.start() },

  methods: {
    start() {
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
        if (this.enabled) self.$emit('msg', msg)
      })

      uibuilder.onChange('ioConnected', function(v) {
        self.connected = !!v
      })
    },

    // called by parent using $ref
    send(msg) { uibuilder.send(msg) },

    // button click handler
    handleClick() {
      this.enabled = !this.enabled
      if (!window.uib_started) this.start()
    },
  },

}
</script>
