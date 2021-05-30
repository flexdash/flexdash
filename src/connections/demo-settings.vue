<!-- Demo - Inject demo tabs.
     This file contains a component to display the settings.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-col cols="12" md="5">
    <h3 class="mb-6">Demo</h3>
    <p>Random-data demo tab <v-btn x-small @click="injectTab('t0000')">Inject</v-btn></p>
    <p>Websocket demo tab <v-btn x-small @click="injectTab('t0001')">Inject</v-btn></p>
  </v-col>
</template>

<script scoped>
export default {
  name: 'DemoSettings',

  // The `enabled` is not really used here, it's just there for consistency with "real"
  // connection config components.
  props: {
    connection: null, // DemoConnection object
    config: { type: Object, default() { return { enabled: false } } },
  },

  methods: {
    injectTab(tab) { this.connection.inject(tab) },
  },

}
</script>
