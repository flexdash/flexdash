<!-- Sparkline showing recent data points. If sent a value it shifts it into its data array and
     rotates out an old one. If sent an array, it replaces its data by that array and uses the
     length 
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
<div style="width:100%; ">
  <v-sparkline v-bind="bindings" ref="sparkl">
  </v-sparkline>
</div>
</template>

<script scoped>
export default {
  name: 'Sparkchart',

  help: `Sparkline chart.
A SparkChart displays a simple graph with up to 20 past values. The values can be displayed
using a line or bars. When using a line the min/max auto-adjust, when using bars the min
is fixed at 0.

To insert data send a a simple numeric value, it is appended to the chart and the oldest value
is dropped. It is also possible to send an array, which replaces the entire chart (and can
thereby alter the number of values shown). Note that it is not possible to show gaps using
null values.`,

  props: {
    value: { default: 0, dynamic: "$demo_random", tip: "number to append, array to replace" },
    color: { type: String, default: "blue" },
    fill: { type: Boolean, default: false, tip: "solid fill from the line down" },
    line_width: { type: Number, default: 4, tip: "width of the sparkline or width between bars" },
    bars: { type: Boolean, default: false, tip: "draw bars instead of line" },
  },

  data() { return {
    data: [], // Array(20), // data actually displayed in sparkline
    //data: [ 30, 32, 30, 40, 35, 45, 40, 0, 50, 55, 60, 55, 70, 80, 70, 45, 90, 85, 60, 70 ],
    ro: null, // resize observer
    height: 10, // height, adjusted using resize observer
    width: 20, // width, adjusted using resize observer
  }},

  computed: {
    bindings() {
      return {
        color: this.color,
        fill: this.fill,
        lineWidth: this.line_width,
        padding: this.line_width,
        value: this.data,
        type: this.bars ? 'bar' : 'trend',
        autoLineWidth: !!this.bars,
        height: this.height,
        width: this.width,
      }
    },
  },

  mounted() {
    this.$nextTick(() => {
      // sometimes the offsetParent is null, dunno whether that's a persistent problem or not...
      // it seems to happen when switching away from the tab with the sparkchart
      if (!this.$el.offsetParent) { console.log("sparkshart oops1"); return }
      this.ro = new ResizeObserver(this._onResize).observe(this.$el.offsetParent)
    })
  },
  beforeUnmount() {
    if (this.ro) this.ro.unobserve(this.$el.offsetParent)
  },

  watch: {
    // watch the values coming in, if we get a number, append to array, if we get an array,
    // use that as data
    value(v) {
      if (typeof v === 'number' || v === null) {
        this.data.push(v)
        while (this.data.length > 20) this.data.shift()
      } else if (Array.isArray(v)) {
        this.data = v
      }
    },

  },

  methods: {
    // receive resize event and change the height of the chart if necessary
    _onResize() {
      // sometimes the offsetParent is null, dunno whether that's a persistent problem or not...
      if (!this.$el.offsetParent) { console.log("sparkchart oops2"); return }
      this.height = this.$el.offsetParent.clientHeight - this.$el.offsetTop
      this.width = this.$el.offsetParent.clientWidth
      console.log("_onResize", this.color, "Height:", this.height)
    },

  },

}
</script>
