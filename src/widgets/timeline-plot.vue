<!-- TimelinePlot is a thin wrapper around uPlot and the timeline plugin.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <uplot-wrapper :options="opts" :data="uplot_data" :error_message="err_msg"
                 class="timeline-plot">
  </uplot-wrapper>
</template>

<style>
.timeline-plot.u-tooltip {
  position: absolute;
  z-index: 12;
  border-radius: 6px;
  padding: 4px;
  font: 400 0.75rem Roboto;
}
.timeline-plot.u-tooltip * {
  vertical-align: baseline !important;
}
.timeline-plot.u-tooltip .u-marker {
  display: none;
}
.timeline-plot.u-tooltip { background: rgba(230, 230, 230, 0.8); }
.v-theme--flexdashLight .timeline-plot.u-tooltip { background: rgba(230, 230, 230, 0.8); }
.v-theme--flexdashDark  .timeline-plot.u-tooltip { background: rgba(64, 64, 64, 0.8); }
</style>

<script scoped>

import UplotWrapper from '/src/components/uplot-wrapper.vue'
import timeline from '/src/utils/uplot-timeline.js'
import tooltip from '/src/utils/uplot-tooltip.js'
import { colors, color_by_name } from '/src/utils/plot-colors.js'

function deepCopy(obj) {
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(deepCopy)
  return Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,deepCopy(v)]))
}

export default {
  name: "TimelinePlot",

  help: `Timeline chart.
TimelinePlot displays a time-line chart using uPlot. A timeline plot consists of a number of
time series, each of which is plotted as a horizontal bar whose color is determined by the
value along the X time axis.

The data must be provided in the form expected by uPlot, which is an array of equal-length arrays
of data values. The first of the arrays is the X axis, the rest are the series.
The \`labels\` prop is an array of strings that will be used to label the series.

\`colors\` is a map from discrete values (numbers or strings) to colors.
`,

  props: {
    options: { type: Object, default() {return {}}, tip: "raw uPlot options" },
    data: {
      type: Array,
      default() { return null },
      validator(v) { return v===null || (Array.isArray(v) && v.length) },
      tip: "array of equal-length series, the first series being the X axis"
    },
    colors: { type: Object, default() { return null }, tip: "map of colors for discrete values" },
    //gradient: { type: Object, default() { return {} } },
  },

  full_page: true, // can expand to full-page

  components: { UplotWrapper },

  methods: {
    value2color(v) {
      if (this.colors_map[v]) return this.colors_map[v]
      return this.is_dark ? '#fff' : '#000'
    },
  },

  computed: {

    is_dark() { return this.$vuetify.theme.global.current.dark },

    uplot_data() {
      if (!this.data) return null
      // set consecutive identical values to undefined
      let ud = this.data.map((d, ix) => {
        if (ix == 0 || !Array.isArray(d)) return d
        return d.map((v, ix) => {
          if (ix === 0 || v === null || v !== d[ix-1]) return v
          return undefined
        })
      })
      return ud
    },

    series() {
      if (!this.data) return []
      return this.data.map((d,ix) => {
        if (ix == 0) return { label: 'time', value: "{YYYY}-{MM}-{DD} {HH}:{mm}:{ss}" }
        return {
          label: ix < this.labels?.length ? this.labels[ix-1] : `series ${ix}`,
          value: (u,v) => v,
        }
      })
      // fix-up series
      // for (let s=1; s<opts.series.length; s++) {
      //   const serie = opts.series[s]
      //   // if we got a value formatting function we need to 'eval' it
      //   if (typeof serie.value === 'string') {
      //     serie.value = new Function('u', 'v', `"use strict";return (${serie.value})`)
      //     // handle point fill for dark mode
      //     if (this.is_dark) {
      //       if (!serie.points) serie.points = {}
      //       if (!serie.points.fill) serie.points.fill = '#1e1e1e'
      //     }
      //   }
      // }
    },

    colors_hex() {
      if (!this.colors) return null
      return Object.entries(this.colors).map(([k,v])=>[k,color_by_name(v)])
    },

    colors_map() {
      const c = Object.assign({}, this.colors_hex)
      let c_num = colors.length
      for (let s=1; s<this.data.length; s++) {
        for (let v of this.data[s]) {
          if (!c[v]) c[v] = colors[c_num++ % colors.length]
        }
      }
      return c
    },

    opts() {
      if (!this.data) return {}
      const count = this.data.length-1
      let opts = {
        plugins: [ () => timeline({count, ...opts}), () => tooltip({class: "timeline-plot"}) ],
        mode: 1, // 1:no splits, 2: splits ???
        series: this.series,
			  fill: (seriesIdx, dataIdx, value) => this.value2color(value),
			  stroke: (seriesIdx, dataIdx, value) => this.value2color(value),
        legend: { show: false, live: false, markers: { width: 0 } },
        drawOrder: ["series", "axes"],
        scales: { x: { time: true } },
        axes: [ {}, {} ],
        padding: [null, 0, null, 0], // FIXME: useless, gets overridden
      }
      // handle grid in dark mode
      // FIXME: actually need to cause a redraw when switching between light&dark
      for (let a=0; a<opts.axes.length; a++) {
        const ax = opts.axes[a]
        if (this.is_dark) {
          if (!ax.grid) ax.grid = {}
          if (!ax.grid.stroke) ax.grid.stroke = '#444'
          if (!ax.stroke) ax.stroke = '#ccc'
        }
      }
      opts = Object.assign(opts, this.options)

      console.log(`uPlot data: ${this.data.length}x${this.data[0].length} opts:`, JSON.stringify(opts))
      return opts
    },

    // consistency checks and resulting error messages
    err_msg() {
      if (!this.data) return null
      const xl = this.data[0]?.length
      for (let i=1; i<this.data.length; i++) {
        const il = this.data[i]?.length
        if (il != xl)
          return `data[0] (X axis) has length ${xl}, but data[${i}] has length ${il}`
      }
    },
  },
}
</script>
