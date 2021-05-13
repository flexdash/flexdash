<!-- Sparkline showing recent data points. If sent a value it shifts it into its data array and
     rotates out an old one. If sent an array, it replaces its data by that array and uses the
     length 
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
<div style="width:100%; ">
  <v-sparkline v-bind="bindings">
  </v-sparkline>
</div>
</template>

<script scoped>
module.exports = {
  name: 'Sparkchart',

  props: {
    value: { default: 0 },
    color: { type: String, default: "blue" },
    fill: { default: 0 }, // FIXME: should be boolean, but can't input that yet
    line_width: { type: Number, default: 4 },
    bars: { default: false }, // FIXME: boolean
  },

  data() { return {
    //data: Array(20), // data actually displayed in sparkline
    data: [ 30, 32, 30, 40, 35, 45, 40, 0, 50, 55, 60, 55, 70, 80, 70, 45, 90, 85, 60, 70 ],
  }},

  computed: {
    bindings() {
      return {
        color: this.color,
        fill: !!this.fill,
        //lineWidth: this.line_width,
        padding: this.line_width,
        value: this.data,
        type: this.bars ? 'bar' : 'trend',
        autoLineWidth: !!this.bars,
      }
    },
  },

  watch: {
    // watch the values coming in, if we get a number, append to array, if we get an array,
    // use that as data
    value(v) {
      if (typeof v === 'number' || v === null) {
        this.data.copyWithin(0, 1)
        this.$set(this.data, this.data.length-1, v)
      } else if (Array.isArray(v)) {
        this.data = v
      }
    },

  },

}
</script>
