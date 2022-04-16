<!-- DisabledWidget - display something useful for widgets that are disabled (e.g. in Node-RED)
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div class="text-center unknown" :style="div_style">
    disabled<br>
    <span>node {{nr_name}}<br></span>
    <span>{{nr_id}}</span>
  </div>
</template>

<style scoped>
  .unknown { color: darkred; }
</style>

<script scoped>
export default {
  name: 'DisabledWidget',
  // help displayed in the UI: the first line is used in the widgets menu and is always shown in
  // the edit card. Successive lines can be expanded in the card and are markdown-formatted.
  help: `Display something for widgets that are disabled in Node-RED.
  `,

  props: {
    id: "",
    nr_name: "",
  },

  computed: {
    nr_id() { return this.id.substring(1) },
    div_style() { return {
      fontSize: this.nr_name ? "0.8rem" : "1.0rem",
      lineHeight: this.nr_name ? "1.0" : "1.2",
    }},
  },


}
</script>
