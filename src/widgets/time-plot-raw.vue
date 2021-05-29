<!-- TimePlotRaw is a thin wrapper around uPlot for time-series charts.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div class="px-1 width100 flex-grow-1 flex-shrink-1">
    <!-- uPlot is injected here -->
  </div>
</template>

<style>
.uplot {
  width: 100%; height: 100%;
  display: flex; flex-flow: column nowrap; justify-content: flex-end;
  font-family: Roboto !important;
}
.uplot .u-wrap { flex: 1 1 100px; min-height: 20px;}
.uplot .u-legend { flex: 0 0 auto; }
.uplot .u-legend .u-marker { width: 1.2ex; height: 1.2ex; }
.uplot .u-legend * {
  font: 0.75rem Roboto;
  vertical-align: baseline !important;
}

.u-tooltip {
  position: absolute;
  z-index: 4;
  border-radius: 6px;
  padding: 4px;
  font: 400 0.75rem Roboto;
}
.u-tooltip * {
  vertical-align: baseline !important;
}
.u-tooltip .u-marker {
  width: 1.2ex; height: 1.2ex;
  margin-right: 4px; background-clip: content-box;
  border: 2px solid #000;
  display: inline-block;
}
.u-tooltip { background: rgba(230, 230, 230, 0.8); }
.theme--light .u-tooltip { background: rgba(230, 230, 230, 0.8); }
.theme--dark  .u-tooltip { background: rgba(64, 64, 64, 0.8); }

</style>

<script scoped>

import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import tooltip from '/src/utils/uplot-tooltip.js'

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

The data must be input in the form of "data points" where a data point is an array consisting
a unix timestamp (seconds since 1970-01-01) followed by a value per series. Null values are OK
to designate missing data. Note: each an every data point must have one value per series.

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

  data() { return {
    chart: null, // uPlot object instance
    ro: null, // function to cancel resize observer
    width: 40, // width in pixels
    chart_data: null, // actual data fed to uPlot (i.e. transposed from data)
    dark_watcher: null, // watcher on $vuetify.theme.dark used to adjust chart colors
  }; },

  watch: {

    options(/*options, prevOptions*/) {
      console.log("Time-plot options changed");
      this._destroy();
      // FIXME: should massage chart_data if the number of series has changed
      this._create();
    },

    data(data, /*prevData*/) { // FIXME: do we need to check that the data is new?
      //console.log("Time-plot data changed:", data);
      if (!data) return // handle init case where data is undefined
      const replace = Array.isArray(data[0]) // replace entire dataset vs append

      // if there's no chart yet, we need to create one
      // recreate the chart if we are replacing all the data
      if (!this.chart || !this.chart_data || replace) {
        if (this.chart) this._destroy();
        this.chart_data = this._transpose(replace ? data : [data])
        this._create();

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
        //console.log(`Time-plot data appended, got ${this.chart_data[0].length} rows, max:${max}`)
        this.chart.setData(this.chart_data)
      }
    }
  },

  mounted() {
    this._create();
    const self = this
    this.dark_watcher = this.$watch(
      ()=>self.$vuetify.theme.dark,
      ()=>{ this._destroy(); this._create() })
  },

  beforeDestroy() {
    console.log("BeforeDestroy uPlot", this.ro)
    if (this.ro) this.ro()
    this.ro = null;
    this._destroy()
    this.dark_watcher()
  },

  methods: {
    _destroy() {
      if (this.chart) {
        console.log("Destroying uPlot")
        this.chart.destroy()
        this.chart = null
      }
    },

    _observeSize() {
      if (this.ro) this.ro() // .unobserve(this.ro_el)
      this.ro = null

      const uplot = this.$el.children[0]
      if (!uplot) {
        console.log("TPR: cannot observe: no uplot")
        return { width: 0, height: 0 }
        }
      const uwrap = uplot.children[0]
      if (!uwrap) {
        console.log("TPR: cannot observe: no uwrap")
        return { width: 0, height: 0 }
      }

      console.log("TPR: observing size")
      this._onResize(uwrap)
      const ro = new ResizeObserver(()=>this._onResize(uwrap)).observe(uwrap)
      this.ro = () => ro && ro.unobserve(uwrap)
    },

    _calcSize(el) {
      let width = this.options.width || el.clientWidth
      let height = this.options.height || el.clientHeight
      console.log(`Time-plot container sized to ${width}x${height}`)
      this.width = width
      return { width: width, height: height }
    },

    // receive resize event and change the size of the chart if necessary
    _onResize(uwrap) {
      if (!this.chart) return;
      this.chart.setSize(this._calcSize(uwrap));
    },

    _transpose(data) {
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

    _create() {
      const self = this
      console.log("Creating uPlot")
      if (!this.chart_data || this.chart_data.length === 0) return
      if (!this.options || !this.options.series || this.options.series.length < 2) return

      // add size stuff to options
      let opts = JSON.parse(JSON.stringify(this.options)) // deep clone and w/out reactivity
      //Object.assign(opts, this._calcSize())

      // fix-up series
      for (let s=1; s<opts.series.length; s++) {
        const serie = opts.series[s]
        // if we got a value formatting function we need to 'eval' it
        if (typeof serie.value === 'string') {
          serie.value = new Function('u', 'v', `"use strict";return (${serie.value})`)
          // handle point fill for dark mode
          if (this.$vuetify.theme.dark) {
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
        if (this.$vuetify.theme.dark) {
          if (!ax.grid) ax.grid = {}
          if (!ax.grid.stroke) ax.grid.stroke = '#444'
          if (!ax.stroke) ax.stroke = '#ccc'
        }
      }

      // eval scale range function, if provided
      Object.values(opts.scales||{}).forEach((s) => {
        if (typeof s.range === 'string')
          s.range = new Function('u', 'min', 'max', `"use strict";return (${s.range})`)
      })

      // final hacks
      opts.padding = [8, null, null, null] // reduce padding at top
      const tt = tooltip()
      console.log("Tooltip:", tt)
      opts.plugins = [ tooltip(uPlot) ]
      opts.legend = { live: false }
      console.log("uPlot options:", opts)

      this.chart = new uPlot(opts, this.chart_data, this.$el)
      this.$nextTick(() => this._observeSize())
    },

  },
}
</script>
