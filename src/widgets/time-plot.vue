<!-- TimePlot shows a time-series plot based on uPlot.

     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <time-plot-raw :data="data" :options="options"></time-plot-raw>
</template>

<script scoped>

// 20 distinct colors from https://sashamaps.net/docs/resources/20-colors/ plus black&white
var colors = [
'#4363d8', '#3cb44b', '#ffe119', '#e6194b', '#42d4f4', '#911eb4', '#f58231',
'#469990', '#fabed4', '#bfef45', '#f032e6', '#dcbeff', '#9a6324', '#fffac8',
'#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9'];

var color_names = [
'blue', 'green', 'yellow', 'red', 'cyan', 'purple', 'orange',
'teal', 'pink', 'lime', 'magenta', 'lavender', 'brown', 'beige',
'maroon', 'mint', 'olive', 'apricot', 'navy', 'grey', 'from'];

function color_by_name(name) {
  if (name.startsWith("#")) return name
  if (name in color_names) return colors[color_names[name]]
  return '#cccccc'
}


export default {
  name: "TimePlot",

  help: `Time-series chart with simple options.
TimePlot uses the TimePlotRaw widget to render a time-series plot and generates
the uPlot options based on a set of relatively simple inputs. If you the full uPlot flexibility 
you can use the output to see the options constructed as a starting point.

By default a single series is plotted without label (there's the title...). If any of the
array inputs are specified the longest array determines the number of series.

The default color sequence is blue, green, yellow, red, cyan, purple, orange, teal, pink, lime,
magenta, lavender, brown, beige, maroon, mint, olive, apricot, navy, and grey from
https://sashamaps.net/docs/resources/20-colors/

The data must be input in the form of "data points" where a data point is an array consisting
a unix timestamp (seconds since 1970-01-01) followed by a value per series. Null values are OK
to designate missing data. Note: each an every data point must have one value per series.

Each data message may be either an array of data points or a single data point. If an array is
provided then it replaces the entire dataset being shown. If a single point is provided
it is appended to the current dataset and an old data point may be rotated out.
Note that this "row-wise" structure gets transposed to the columnar structure expected by uPlot.
`,

  props: {
    data: { // data in row-wise format
      type: Array,
      default: undefined,
      validator(v) { return Array.isArray(v) && v.length },
      tip: "array with unix timestamp followed by a value per series",
    },

    labels: { type: Array, default: ()=>[], tip: "array of labels for series" },
    colors: { type: Array, default: ()=>[], tip: "array of colors for series, names or #rrggbb" },
    axis: { type: Array, default: ()=>[], tip: "array to assign series to 'left' or 'right' axis" },
    width: { type: Array, default: ()=>[], tip: "array of stroke widths for series, default is 2" },
    left_unit: { type: String, default: "", tip: "unit to label left axis" },
    right_unit: { type: String, default: "", tip: "unit to label right axis" },
    left_min: { type: Number, default: null, tip: "minimum for left axis" },
    left_max: { type: Number, default: null, tip: "maximum for left axis" },
    left_decimals: { type: Number, default: 1, tip: "decimals on left axis" },
    right_min: { type: Number, default: null, tip: "minimum for right axis" },
    right_max: { type: Number, default: null, tip: "maximum for right axis" },
    right_decimals: { type: Number, default: 1, tip: "decimals on right axis" },
  },

  output: { default: null, tip: "options passed into uPlot" },

  full_page: true, // can expand to full-page

  computed: {
    // generate options for uPlot based on the props
    // this also outputs as a side-effect (not supposed to do that, oh well...)
    options() {
      const ns = Math.max(this.labels.length, this.colors.length, this.axis.length)

      // declare the series for them to show
      let got_r = false
      const series = [ { label: "time" } ]
      for (let s=0; s<ns; s++) {
        const r = this.axis[s] && this.axis[s].match(/^[rR]/)
        got_r ||= r
        const d = r ? this.right_decimals : this.left_decimals
        const u = r ? this.right_unit : this.left_unit
        const serie = {
          label: this.labels[s] || `series ${s+1}`,
          stroke: this.colors[s] ? color_by_name(this.colors[s]) : colors[s%colors.length],
          width: this.width[s] || 2,
          scale: r ? "R" : "L",
          value: `v.toFixed(${d}) + "${u}"`
        }
        series.push(serie)
      }

      // axes
      const axes = [ {}, {
        scale: "L",
        values: `vv.map(v => v + "${this.left_unit}")`,
      }]
      if (got_r) {
        axes.push({
          scale: "R",
          values: `vv.map(v => v + "${this.right_unit}")`,
          side: 1,
          grid: {show: false},
        })
      }

      // scales
      const scales = { L: {} }
      if (this.left_min !== null || this.left_max !== null) {
        if (this.left_min !== null && this.left_max !== null) scales.L.auto = false
        scales.L.range = {}
        if (this.left_min !== null) scales.L.range.min = { hard: this.left_min }
        if (this.left_max !== null) scales.L.range.max = { hard: this.left_max }
      }
      if (this.right_min !== null || this.right_max !== null) {
        scales.R = { range: {} }
        if (this.right_min !== null && this.right_max !== null) scales.R.auto = false
        if (this.right_min !== null) axes[1].range.min = { hard: this.right_min }
        if (this.right_max !== null) axes[1].range.max = { hard: this.right_max }
      }

      const opts = { series, axes, scales }
      console.log("Options for time-plot-raw:", opts);
      // output in the next tick in order not to affect the dependency stuff
      this.$nextTick(() => { this.$emit('send', opts) })
      return opts
    },

  },
}
</script>
