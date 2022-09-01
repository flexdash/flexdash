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
import { gradient } from '/src/utils/gradient.js'

export default {
  name: "TimelinePlot",

  help: `Timeline chart.
TimelinePlot displays a time-line chart using uPlot. A timeline plot consists of a number of
time series, each of which is plotted as a horizontal bar whose color is determined by the
value along the X time axis.

The \`data\` must be provided in the form expected by uPlot, which is an array of equal-length arrays
of data values. The first of the arrays is the X axis, the rest are the series.
The \`labels\` prop is an array of strings that will be used to label the series.

\`colors\` is a map from discrete values (numbers or strings) to colors.

\`gradient\` may be used to define a color gradient for numerical values between \`low\` and
\`high\` (inclusive).
The only \'kind\' supported for now is \`linear\`.
The \`low_color\` and \`high_color\` must use hex colors, e.g., \`#ff0000\` for red.

Colors are assigned as follows:

1. if a value is a number and a gradient is defined and the number falls within the range of the
  gradient then the color is determined by the gradient.
2. if \`colors[value]\` is defined then that color is used.
3. the next color from the plot color palette is used and assigned to that value.

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
    labels: { type: Array, default() { return null }, tip: "array of labels for series" },
    gradient: { type: Object, default() { return null },
      tip: "color gradient for values: kind, low, high, low_color, high_color" },
    show_values: { default: true, tip: "show values on bars, may be per-series array" },
  },

  full_page: true, // can expand to full-page

  components: { UplotWrapper },

  methods: {
    in_gradient(v) {
      return this.gradient && typeof v === 'number'
        && this.gradient.low_color?.startsWith('#')
        && this.gradient.high_color?.startsWith('#')
        && v >= this.gradient.low && v <= this.gradient.high
    },
    value2color(v) {
      if (this.colors_map[v]) return this.colors_map[v]
      if (this.in_gradient(v)) {
        const pct = (v - this.gradient.low) / (this.gradient.high - this.gradient.low)
        let c = gradient(this.gradient.kind, this.gradient.low_color, this.gradient.high_color, pct)
        if (c) return c
      }
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
          label: ix <= this.labels?.length ? this.labels[ix-1] : `series ${ix}`,
          value: (u,v) => v,
        }
      })
    },

    colors_hex() {
      if (!this.colors) return null
      return Object.fromEntries(Object.entries(this.colors).map(([k,v])=>[k,color_by_name(v)]))
    },

    colors_map() {
      const c = Object.assign({}, this.colors_hex)
      let c_num = colors.length
      for (let s=1; s<this.data.length; s++) {
        for (let v of this.data[s]) {
          if (!c[v] && !this.in_gradient(v)) c[v] = colors[c_num++ % colors.length]
        }
      }
      return c
    },

    opts() {
      if (!this.data) return {}
      const count = this.data.length-1
      let opts = {
        plugins: [ () => timeline({count, ...opts}), () => tooltip({class: "timeline-plot"}) ],
        mode: 1, // 1:no splits, 2:splits ???
        series: this.series,
			  fill: (seriesIdx, dataIdx, value) => this.value2color(value),
			  stroke: (seriesIdx, dataIdx, value) => this.value2color(value),
        legend: { show: false, live: false, markers: { width: 0 } },
        drawOrder: ["series", "axes"],
        scales: { x: { time: true } },
        axes: [ {}, {} ],
        padding: [null, 4, null, null],
      }
      // handle not showing values in the bars
      if (!this.show_values) {
        opts.series.forEach((s,ix) => { if (ix) s.points = { show: false} })
      } else if (Array.isArray(this.show_values)) {
        opts.series.forEach((s,ix) => { if (ix) s.points = { show: this.show_values[ix-1]} })
      }
      // handle grid in dark mode
      // FIXME: actually need to cause a redraw when switching between light&dark
      if (this.is_dark) {
        for (let a=0; a<opts.axes.length; a++) {
          const ax = opts.axes[a]
          if (!ax.grid) ax.grid = {}
          if (!ax.grid.stroke) ax.grid.stroke = '#444'
          if (!ax.stroke) ax.stroke = '#ccc'
        }
      }
      // auto-size space for Y axes
      {
        const ax = opts.axes[1]
        ax.ticks = { size: 0 }
        // size function gets called by uPlot, has to return size in CSS pixels
        // for max(values) + gap + tickSize
        ax.size = (u, values, axisIdx, cycleNum) => {
          console.log("Timeline axis size called", values, axisIdx, cycleNum)
          const ax = u.axes[axisIdx]
          if (cycleNum > 1) return u.axes[axisIdx]._size; // bail out, force convergence
          const dfltSize = 40;
          if (values == null) {
            return null
          } else {
            // measure the text size of each axis value and take the max
            u.ctx.font = u.axes[axisIdx].font[0]
            const sz = Math.max(dfltSize, ...values.map(v=>u.ctx.measureText(v).width))
            console.log(`Size=${sz} for ${values}, gap=${ax.gap}, tickSize=${ax.ticks.size}`)
            //console.log(`Font: ${u.ctx.font}`)
            console.log(`Returning: ${sz/window.devicePixelRatio + ax.gap}`)
            return sz/window.devicePixelRatio + ax.gap + ax.ticks.size // uPlot wants CSS pixels
          }
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
