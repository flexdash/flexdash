<!-- Stat - Simple status widget that can display a numeric or text value. An unit string can
     optionally be appended and is rendered as a superscript.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <v-card-title class="headline pa-0">
    <span class="ma-auto">{{valTxt}}<span class="unit">{{unitTxt}}</span></span>
  </v-card-title>
</template>

<script scoped>
  module.exports = {
    name: 'Stat',

    props: {
      unit: String,
      value: { default: null },
    },

    computed: {
      unitTxt: function() { return this.value === "--" ? "" : this.unit; },
      valTxt: function() {
        if (typeof this.value == 'number') return Math.round(this.value*10.0)/10.0
        else if (this.value === null) return "--";
        else return this.value;
      },
    },

  }
</script>
