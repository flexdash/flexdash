<!-- TimePlotRaw is a thin wrapper around uPlot for time-series charts.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <uplot-wrapper :options="opts" :data="chart_data" :error_message="err_msg"
                 class="time-plot-raw">
  </uplot-wrapper>
</template>

<style>
.time-plot-raw.u-tooltip {
  position: absolute;
  z-index: 12;
  border-radius: 6px;
  padding: 4px;
  font: 400 0.75rem Roboto;
}
.time-plot-raw.u-tooltip * {
  vertical-align: baseline !important;
}
.time-plot-raw.u-tooltip .u-marker {
  width: 1.2ex; height: 1.2ex;
  margin-right: 4px; background-clip: content-box;
  border: 2px solid #000;
  display: inline-block;
}
.time-plot-raw.u-tooltip { background: rgba(230, 230, 230, 0.8); }
.v-theme--flexdashLight .time-plot-raw.u-tooltip { background: rgba(230, 230, 230, 0.8); }
.v-theme--flexdashDark  .time-plot-raw.u-tooltip { background: rgba(64, 64, 64, 0.8); }
</style>

<script scoped>

import UplotWrapper from '/src/components/uplot-wrapper.vue'
import tooltip from '/src/utils/uplot-tooltip.js'

function deepCopy(obj) {
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(deepCopy)
  return Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,deepCopy(v)]))
}

export default {
  name: "TimePlotRaw",

  help: `Time-series chart.
TimePlotRaw displays a time-series chart using [uPlot](https://github.com/leeoniya/uPlot).
It deals with resizing, and transposes the data coming in.
The uPlot options must be provided via the \`options\` input otherwise
nothing will show. For an easier way to use uPlot see the TimePlot widget.

The documentation on the uPlot options "leaves something to be desired"...
See https://github.com/leeoniya/uPlot/tree/master/docs for an overview.
More info can be gleaned from the demos at https://leeoniya.github.io/uPlot/demos/index.html
and the ultimate reference is https://github.com/leeoniya/uPlot/blob/master/dist/uPlot.d.ts

The data must be input in the form of "data points" where a data point is an array consisting of
a unix timestamp (seconds since 1970-01-01) followed by a value per series. Null values are OK
to designate missing data. Note: each and every data point must have one value per series.

Each data message may be either an array of data points or a single data point. If an array is
provided then it replaces the entire dataset being shown. If a single point is provided
it is appended to the current dataset and an old data point may be rotated out.
Note that this "row-wise" structure gets transposed to the columnar structure expected by uPlot.
`,

  props: {
    options: { type: Object, default() {return null} }, // options as uPlot expects
    data: { // data in row-wise format
      type: Array,
      default() { return undefined },
      validator(v) { return Array.isArray(v) && v.length },
    },
  },

  full_page: true, // can expand to full-page

  data() { return {
    chart_data: null, // actual data fed to uPlot (i.e. transposed from data)
    dark_watcher: null, // watcher on $vuetify.theme.dark used to adjust chart colors
    is_dark: false, // true if dark theme is active
    error_message: null, // error message acros top of widget
  }; },

  components: { UplotWrapper },

  watch: {

    data: {
      immediate: true,
      handler(data, /*prevData*/) { // FIXME: do we need to check that the data is new?
        //console.log("Time-plot data changed:", data);
        if (!data) return // handle init case where data is undefined
        const replace = Array.isArray(data[0]) // replace entire dataset vs append

        // replace data set
        if (!this.chart_data || replace) {
          this.chart_data = this.transpose(replace ? data : [data])

        // we're getting one data point, so append to chart (need to transpose)
        } else {
          const num_series = this.chart_data.length
          for (let i=0; i<num_series; i++)
            this.chart_data[i].push(data[i])
          // prune the data when it reaches 1/2 the number of pixels we got in width
          const max = Math.max(this.width/2, 20)
          while (this.chart_data[0].length > max) {
            for (let i=0; i<num_series; i++)
              this.chart_data[i].shift()
          }
        }
      }
    }
  },

  created() {
    // theme switching, there must be an easier way to detect the current theme...
    this.dark_watcher = this.$watch(
      ()  => this.$vuetify.theme.global.current.dark,
      (v) => { this.is_dark = v  },
      { deep: false })
    this.is_dark = this.$vuetify.theme.global.current.dark
  },

  unmounted() {
    this.dark_watcher()
  },

  methods: {
    // transpose from row format coming in to column format required by uPlot
    transpose(data) {
      if (!data || data.length == 0) return []
      if (!data[0].map) debugger; //eslint-disable-line
      let tr = data[0].map(() => Array(data.length))
      data.forEach((d, i) => {
        d.forEach((v, j) => {
          tr[j][i] = v
        })
      })
      return tr
    },
  },

  computed: {

    opts() {
      if (!this.options || !this.options.series || this.options.series.length < 2) return null
      let opts = deepCopy(this.options)

      // fix-up series
      for (let s=1; s<opts.series.length; s++) {
        const serie = opts.series[s]
        // if we got a value formatting function we need to 'eval' it
        if (typeof serie.value === 'string') {
          serie.value = new Function('u', 'v', `"use strict";return (${serie.value})`)
          // handle point fill for dark mode
          if (this.is_dark) {
            if (!serie.points) serie.points = {}
            if (!serie.points.fill) serie.points.fill = '#1e1e1e'
          }
        }
      }
      const s0 = opts.series[0]
      if (!s0.value) s0.value = "{YYYY}-{MM}-{DD} {HH}:{mm}:{ss}"

      // fix-up axes
      for (let a=0; a<opts.axes.length; a++) {
        const ax = opts.axes[a]
        if (a > 0) {
          // values can be a function to format the values
          if (typeof ax.values === 'string')
            ax.values = new Function('u', 'vv', 's', `"use strict";return (${ax.values})`)
        }
        // handle grid in dark mode
        // FIXME: actually need to cause a redraw when switching between light&dark
        if (this.is_dark) {
          if (!ax.grid) ax.grid = {}
          if (!ax.grid.stroke) ax.grid.stroke = '#444'
          if (!ax.stroke) ax.stroke = '#ccc'
        }
        // auto-size space for Y axes
        if (!('size' in ax)) {
          if (ax.side & 1 || !('side' in ax) && a > 0) {
            ax.gap = 2 // reduce gap a tad from std 5
            const tickSize = 10 // uPlot default, we're not setting it
            // size function gets called by uPlot, has to return size in CSS pixels
            // for max(values) + gap + tickSize
            ax.size = (u, values, axisIdx, cycleNum) => {
              if (cycleNum > 2) return u.axes[axisIdx]._size; // bail out, force convergence
              const dfltSize = 40;
              if (values == null) {
                return null
              } else {
                // measure the text size of each axis value and take the max
                u.ctx.font = u.axes[axisIdx].font[0]
                const max_width = Math.max(...values.map(v=>u.ctx.measureText(v).width))
                const sz = Math.max(dfltSize, max_width)
                //console.log(`Size[${a}]=${sz} for ${values} (ml=${max_width} cyc=${cycleNum})`)
                //console.log(`Font: ${u.ctx.font}`)
                return sz/window.devicePixelRatio + ax.gap + tickSize // uPlot wants CSS pixels
              }
            }
          }
        }
      }

      // eval scale range function, if provided
      Object.values(opts.scales||{}).forEach((s) => {
        if (typeof s.range === 'string')
          s.range = new Function('u', 'min', 'max', `"use strict";return (${s.range})`)
      })

      // add tooltip plugin
      opts.plugins = [ ()=>tooltip({class: "time-plot-raw"}) ]
      opts.legend = { live: false }
      //console.log(`uPlot data: ${this.chart_data.length}x${this.chart_data[0].length} options:`,
      //    JSON.stringify(opts))

      return opts
    },

    // check that the data has the right number of series
    err_msg() {
      // FIXME: uPlot is OK with too much data, it just doesn't show it, prob should briefly show
      // a warning?
      if (this.opts.series.length > this.chart_data.length) {
        const error_message =
          `uPlot error: options have ${this.opts.series.length} series (` +
          this.opts.series.map(s=>s.label).join(", ") +
          `), data has only ${this.chart_data.length}`
        console.log(this.error_message)
        console.log(`series labels are: ${this.opts.series.map(s=>s.label).join(", ")}`)
        console.log(`first data values are: ${this.chart_data.map(d=>d[0]).join(", ")}`)
        this.chart_data = null // don't like doing this, but otherwise it won't recover
        return error_message
      } else {
        return null
      }
    },

  },
}
</script>
