<!-- Demo - Inject demo tabs.
     This file contains a component to display the settings.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div>
    <h3 class="mb-1">Demo</h3>
    <p class="mb-2">The demo connection allows various demo tabs to be injected into the
    dashboard config.
    If FlexDash starts-up without config they are all injected as a "Welcome to FlexDash".</p>
    <p class="mb-2">The individual tabs can also be injected at any later time.</p>
    <p class="font-weight-medium mb-2">Available demo tabs:</p>
    <p v-for="d in this.connection.demos" :key="d" class="mb-1">
      {{d}}
      <v-btn x-small @click="injectTab(d)">Inject</v-btn>
    </p>
  </div>
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

  watch: {
    'config.enabled': {
      immediate: true,
      handler(en) { if (en) this.connection.start(); else this.connection.stop() },
    },
  },

  methods: {
    injectTab(tab) { this.connection.inject(tab) },
  },

}
</script>
