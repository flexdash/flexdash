<!-- PopupGrid - Container to manage a grid of widgets dynamically placed on the page.
     Handles the layout of the widgets as well as the editing mode.
     The popup grid is similar to a regular grid but shows in a pop-up dialog instead of in the
     regular tab page flow.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <!-- dialog should have 'contained' but then if the page is short it doesn't extend it -->
  <v-dialog :model-value="show" @click:outside="closeme">
    <v-card class="px-1 pb-0 d-flex" color="background">
      <v-btn elevation=0 icon class="close-btn mt-2 mr-2" @click="closeme"><v-icon icon="mdi-close" /></v-btn>
      <std-grid :id="id" noEvents />
    </v-card>
  </v-dialog>
</template>

<style scoped>
  .v-card .close-btn {
  position: absolute; right: 0px; top: 0px; padding: 0px; min-width: 0px; z-index: 1;
}

</style>

<script scoped>

import StdGrid from '/src/grids/std-grid.vue'

export default {
  name: 'PopupGrid',

  components: { StdGrid },
  inject: [ '$config', '$conn', '$bus' ],

  props: {
    id: { type: String }, // this grid's ID
  },

  data() { return {
    show: false,
    cause: 'manual',
  }},

  mounted() {
    this.$bus.on(this.id, this.ctrlEvent)
  },
  unmounted() {
    if (this.busCB) this.$bus.off(this.id, this.ctrlEvent)
  },

  watch: {
    // observe the show variable to send an event message to the server when it is toggled
    show(v, ov) {
      const payload = { type: v ? "open grid" : "close grid", cause: this.cause, id: this.id }
      this.cause = 'manual'
      if (this.$conn?.serverSend) {
        this.$conn.serverSend("dashboard", payload, "event")
      }
    },
  },

  methods: {
    closeme() {
      if (!this.show) return
      this.cause = 'manual'
      this.show = false
    },

    // event called via $bus in response to a ctrl message from the server
    // allows to open/close the pop-up grid
    ctrlEvent(ev) {
      if (ev.action == 'open') { this.cause = 'message'; this.show = true }
      if (ev.action == 'close') { this.cause = 'message'; this.show = false }
    },

  },
}

</script>
