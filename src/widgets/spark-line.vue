<!-- SparkLine showing recent data points. If sent a value it shifts it into its data array and
     rotates out an old one. If sent an array, it replaces its data by that array and uses the
     length 
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
<div class="sparkline px-1 pb-1 width100 d-flex flex-grow-1 flex-shrink-1">
  <v-card-title class="value-over headline pr-2 pb-1">
    <span class="value ma-auto" :style="valStyle">
      <span class="font-weight-medium" style="font-size: 125%; line-height: 125%;">{{valTxt}}</span>
      <span class="unit">{{unitTxt}}</span>
    </span>
  </v-card-title>
  <!-- uPlot is injected here -->
</div>
</template>

<style scoped>
.sparkline { min-height: 0px; position: relative; }
.sparkline .value-over {
  position: absolute; z-index: 2;
  width: 100%; height: 100%; margin: 0px; padding: 0px;
}
.theme--light .sparkline .value { background: #FFFFFF80; border-radius: 8px; }
.theme--dark .sparkline .value { background: #00000080; border-radius: 8px; }
</style>

<script scoped>
import uPlot from 'uplot'

export default {
  name: 'SparkLine',

  help: `Sparkline chart.
A SparkLine displays a simple graph with auto-adjusting min/max. An optional value can be
added similiar to the Stat widget.

To insert data send a a simple numeric value, it is appended to the chart and the oldest value
is dropped. It is also possible to send an array, which replaces the entire chart (and can
thereby alter the number of values shown).
`,

  props: {
    value: { default: 0, dynamic: "$demo_random", tip: "number to append, array to replace" },
    color: { type: String, default: "blue", tip: "line color" },
    fill_color: { type: String, default: null, tip: "solid fill from the line down" },
    text_color: { type: String, default: null, },
    show_value: { type: Boolean, default: false, tip: "display last value" },
    unit: String,
  },

  data() { return {
    data: [], // Array(20), // data actually displayed in sparkline
    ro: null, // resize observer
    height: 10, // height, adjusted using resize observer
    width: 20, // width, adjusted using resize observer
  }},

  computed: {
    // uPlot options
    opts() {
      return {
        width: this.width,
        height: this.height,
        class: "spark",
        pxAlign: false,
        cursor: { show: false },
        select: { show: false, },
        legend: { show: false, },
        scales: { x: { time: false, }, },
        axes: [ { show: false, }, { show: false, } ],
        series: [ {}, {
          stroke: this.color,
          fill: this.fill_color,
          width: 2,
        }],
      }
    },

    valTxt() {
      if (this.data.length == 0) return "--"
      const v = this.data[this.data.length-1]
      if (!(typeof v === 'number')) return "--"
      return v.toPrecision(3)
    },
    // don't display a unit if there's no value
    unitTxt() { return this.valTxt === "--" ? "" : this.unit; },

    valStyle() { return this.text_color ? { color: this.text_color } : {} },
  },

  mounted() {
    this.$nextTick(() => {
      // sometimes the offsetParent is null, dunno whether that's a persistent problem or not...
      // it seems to happen when switching away from the tab with the sparkchart
      if (!this.$el.offsetParent) return
      this.ro = new ResizeObserver(this.onResize).observe(this.$el.offsetParent)
    })
  },
  beforeUnmount() {
    this.destroy()
    if (this.ro) this.ro.unobserve(this.$el.offsetParent)
  },

  watch: {
    // watch the values coming in, if we get a number, append to array, if we get an array,
    // use that as data
    value(v) {
      //console.log(`SparkLine value: ${v.length || 1}`)
      if (typeof v === 'number' || v === null) {
        this.data.push(v)
        while (this.data.length > 20) this.data.shift()
      } else if (Array.isArray(v)) {
        this.data = v
      }
      if (this.chart) {
        if (this.data.length == 0) return;
        const x = Array.from({length: this.data.length}, (v,ix)=>ix)
        this.chart.setData([x, this.data])
      } else {
        this.create()
      }
    },

    opts() { this.destroy(); this.create() },
  },

  methods: {
    // receive resize event and change the height of the chart if necessary
    onResize() {
      // sometimes the offsetParent is null, dunno whether that's a persistent problem or not...
      if (!this.$el.offsetParent) return
      this.height = this.$el.offsetParent.clientHeight - this.$el.offsetTop
      this.width = this.$el.offsetParent.clientWidth
      //console.log(`SparkLine resize ${this.width}x${this.height}`)
    },

    destroy() {
      if (this.chart) {
        this.chart.destroy()
        this.chart = null
      }
    },

    create() {
      if (this.data.length == 0) return;
      const x = Array.from({length: this.data.length}, (v,ix)=>ix)
      this.chart = new uPlot(this.opts, [x, this.data], this.$el)
      //this.$nextTick(() => this.observeSize())
    }

  },

}
</script>
