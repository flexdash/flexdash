<!-- TextView - Widget to display plain monospaced text that can be (auto-)scrolled.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div style="width:100%; height:100%;overflow-y:scroll;">
    <v-card-text class="pt-1">
      <pre>{{text}}</pre>
    </v-card-text>
  </div>
</template>

<style scoped>
pre { font-size: 85%; line-height: 125%; }
</style>

<script scoped>
export default {
  name: 'TextView',

  full_page: true, // tells the widget-wrapper to provide a full-page button

  help: `Show plain monospaced text.
`,

  props: {
    text: { type: String, default: "Hi there!" },
    autoscroll: { type: Boolean, default: false, tip: "Auto-scroll to bottom" },
  },

}
</script>
