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
        <v-card-title>Server connections</v-card-title>
        <v-card-text>
          <demo></demo>
          <!--uib ref="uib" @msg="handleMsg"></uib-->
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
  
</template>

<script scoped>
//import Uib from '@/components/uib'
import { default as Demo, connection as demo_connection } from '/src/connections/demo.vue'

export default {
  name: "Connections",

  components: { Demo },

  data: ()=> ({
    show_dialog: false, // modal dialog box to configure connections
    icon_color: 'grey', // color of icon
  }),

  inject: [ '$store' ],

  mounted() {
    demo_connection.start(this.handleMsg)
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

  },

}
</script>
