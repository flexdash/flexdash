<!-- Demo - Fake back-end server that sends a little bit of pseudo-random demo data so we
     can try things out without having to connect anywhere.
     This file contains a component to display the settings.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-col cols="12" md="5">
    <h3>Demo</h3>
    Generate random demo data.
    <v-checkbox label="enabled" hide-details :input-value="config.enabled" @change="handleEnable">
    </v-checkbox>
    <v-text-field disabled persistent-hint hint="last message generated"
                  :value="last_msg">
    </v-text-field>
  </v-col>
</template>

<script scoped>
export default {
  name: 'DemoSettings',

  props: {
    connection: null, // DemoConnection object
    config: { type: Object, default() { return { enabled: false } } },
  },

  computed: {
    last_msg() {
      if (!this.config.enabled) return "- disabled -"
      if (!this.connection || !this.connection.data.last_msg.topic) return "- none -"
      const payload = JSON.stringify(this.connection.data.last_msg.payload)
      return `"${this.connection.data.last_msg.topic}" <- ${payload}`
    },
  },

  methods: {
    handleEnable(nv) {
      this.config.enabled = nv
      if (this.connection) {
        if (nv) this.connection.start()
        else this.connection.stop()
      }
    },
  },

}
</script>
