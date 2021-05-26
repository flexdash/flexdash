<!-- TimePlot shows a time-series plot based on uPlot. It is a thin wrapper around uPlot that
     provides a web component, that deals with resizing, and that transposes the data coming in.

     The options input has to be shaped the way uPlot expects it.
     See https://github.com/leeoniya/uPlot/tree/master/docs

     The data must be either an array of data points or a single data point. If an array is
     provided then it replaces the entire dataset being shown. If a single point is provided
     it is appended to the current dataset and an old data point may be rotated out.
     A data point is an array consisting of a timestamp in unix epoch format, followed by a
     value for each series. Note that this "row-wise" structure gets transposed to the 
     columnar structure expected by uPlot.

     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div class="px-1 width100 height100">
    <!-- uPlot is injected here -->
  </div>
</template>

<style>
.u-legend .u-label, .u-legend th::after, .u-legend .u-value {
  font: 0.75rem Roboto;
  vertical-align: bottom !important;
}
.u-legend { display: flex; flex-direction: row; }
.u-plot { height: 100%; flex-grow: 1; }
/* hacks for when the legend runs over */
.v-card.theme--light table.u-legend { background-color: #fff; }
.v-card.theme--dark table.u-legend { background-color: #1e1e1e; }
</style>

<script scoped>

// 20 distinct colors from https://sashamaps.net/docs/resources/20-colors/ plus black&white
var colors = [
'#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0',
'#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8',
'#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000'];

import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'

export default {
  name: "TimePlot",

  help: `Time-series chart.
Displays a time-series chart using [uPlot](https://github.com/leeoniya/uPlot). The options
input corresponds to the uPlot options (which are sadly not well documented). The data input
feeds data into uPlot.

The data must be an Array consisting of the unix epoch timestamp for the value, followed by
a value per time-series. A value must be used for each time-series but null can be used
if no value is available. A null value may or may not show as gap depending on the options.
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
    ro: null, // resize observer
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
    this.ro = new ResizeObserver(this._onResize).observe(this.$el)
    const self = this
    this.dark_watcher = this.$watch(
      ()=>self.$vuetify.theme.dark,
      ()=>{ this._destroy(); this._create() })
  },

  beforeDestroy() {
    console.log("BeforeDestroy uPlot")
    if (this.ro) this.ro.unobserve(this.$el)
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

    _calcSize() {
      let width = this.options.width || this.$el.clientWidth
      let height = this.options.height || (width / (this.options.aspect || 2))
      console.log(`Time-plot container sized to ${width}x${height}`)
      this.width = width
      return { width: width, height: height }
    },

    // receive resize event and change the size of the chart if necessary
    _onResize() {
      if (!this.chart) return;
      this.chart.setSize(this._calcSize());
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
      console.log("Creating uPlot");
      if (!this.chart_data || this.chart_data.length === 0) return;

      // provide some reasonable defaults for the options
      let opts = JSON.parse(JSON.stringify(this.options)); // deep clone and w/out reactivity
      Object.assign(opts, this._calcSize());

      // we need to declare the series for them to show
      if (!opts.series) opts.series = [];
      while (opts.series.length < this.chart_data.length) opts.series.push({});
      opts.series.forEach(function(s, i) {
        if (!s.label) s.label = i ? ("series "+i) : "time";
        if (i) {
          if (!s.stroke) s.stroke = colors[(i-1)%20];
          if (!s.width) s.width = 2;
          if (typeof s.value === 'string')
            s.value = new Function('u', 'v', `"use strict";return (${s.value})`);
        }
        if (self.$vuetify.theme.dark) {
          if (!s.points) s.points = {}
          if (!s.points.fill) s.points.fill = '#1e1e1e'
        }
      });
      
      // fix-up axes
      if (!opts.axes || opts.axes.length < 2) opts.axes = [{}, {}] // x axis and y axis minimum
      opts.axes.forEach((ax) => {
        // values can be a function to format the values
        if (ax.values && typeof ax.values === 'string')
          ax.values = new Function('u', 'vv', 's', `"use strict";return (${ax.values})`);
        //if (!ax.labelFont) ax.labelFont = "12px Roboto"
        //if (!ax.font) ax.font = "20px Roboto"
        if (self.$vuetify.theme.dark) {
          // make dark mode work
          if (!ax.grid) ax.grid = {}
          if (!ax.grid.stroke) ax.grid.stroke = '#444'
          if (!ax.stroke) ax.stroke = '#ccc'
        }
      });

      // eval scale range function, if provided
      Object.values(opts.scales||{}).forEach((s) => {
        if (s.range && typeof s.range === 'string')
          s.range = new Function('u', 'min', 'max', `"use strict";return (${s.range})`);
      });

      console.log("uPlot options:", opts);
      this.chart = new uPlot(opts, this.chart_data, this.$el);
    },

  },
}
</script>
