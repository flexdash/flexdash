<!-- TimePlot shows a time-series plot based on uPlot.

     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <time-plot-raw :data="data" :options="options" :class="classes"></time-plot-raw>
</template>

<style>
  .reverse-legend .u-legend {
    display: flex !important;
    align-items: center;
    justify-content: center;
    flex-direction: row-reverse;
  }
</style>

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
  const ix = color_names.indexOf(name)
  return ix >= 0 ? colors[ix] : '#cccccc'
}


export default {
  name: "TimePlot",

  help: `Time-series chart with simple options.
TimePlot uses the TimePlotRaw widget to render a time-series plot and generates
the uPlot options based on a set of relatively simple inputs. If you need to switch to
TimePlotRaw for the full uPlot flexibility you can use the widget output to see the options
it constructs as a starting point.

By default, with all array inputs (labels, colors, axes, ...) empty ([]) a single series
is plotted without label. If any of the
array inputs are specified the longest array determines the number of series.

The default color sequence is blue, green, yellow, red, cyan, purple, orange, teal, pink, lime,
magenta, lavender, brown, beige, maroon, mint, olive, apricot, navy, and grey from
https://sashamaps.net/docs/resources/20-colors/.
These color names can be used in the \`colors\` prop.

The data must be input in the form of "data points" where a data point is an array consisting of
a unix timestamp (seconds since 1970-01-01) followed by a value per series. Null values are OK
to designate missing data.
**Important**: each and every data point must have _exactly_ one value per series, otherwise
nothing will be plotted.

Each data message may be either an array of data points or a single data point. If an array is
provided then it replaces the entire dataset being shown. If a single point is provided
it is appended to the current dataset and an old data point may be rotated out.
(Currently w/2 datapoints are kept where w is the width of the widget in pixels,
this will be revisited.)
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
    axes: { type: Array, default: ()=>[], tip: "array to assign series to 'left' or 'right' axis" },
    widths: { type: Array, default: ()=>[], tip: "array of stroke widths for series, default is 2" },
    span_gaps: { type: Array, default: ()=>[],
        tip: "array of bool to span over nulls, default is false" },
    left_unit: { type: String, default: "", tip: "unit to label left axis" },
    right_unit: { type: String, default: "", tip: "unit to label right axis" },
    left_min: { type: Number, default: null, tip: "minimum for left axis" },
    left_max: { type: Number, default: null, tip: "maximum for left axis" },
    left_decimals: { type: Number, default: 1, tip: "decimals on left axis" },
    right_min: { type: Number, default: null, tip: "minimum for right axis" },
    right_max: { type: Number, default: null, tip: "maximum for right axis" },
    right_decimals: { type: Number, default: 1, tip: "decimals on right axis" },
    reverse_legend: { type: Boolean, default: false, tip: "reverse legend order" },
  },

  output: { default: null, tip: "options passed into uPlot" },

  full_page: true, // can expand to full-page

  computed: {
    // generate options for uPlot based on the props
    // this also emits an event as a side-effect (not supposed to do that, oh well...)
    options() {
      const ns = Math.max(this.labels.length, this.colors.length, this.axes.length,
          this.widths.length, this.span_gaps.length)

      // declare the series
      let got_r = false
      const series = [ { label: "time" } ]
      for (let s=0; s<ns; s++) {
        const r = this.axes[s] && this.axes[s].match(/^[rR]/)
        got_r = got_r || r
        const d = r ? this.right_decimals : this.left_decimals
        const u = r ? this.right_unit : this.left_unit
        const serie = {
          label: this.labels[s] || `series ${s+1}`,
          stroke: this.colors[s] ? color_by_name(this.colors[s]) : colors[s%colors.length],
          width: this.widths[s] || 2,
          spanGaps: this.span_gaps[s],
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

      // scales, see also https://github.com/leeoniya/uPlot/issues/526
      const scales = { L: { range: { min: {pad:0.1}, max: {pad:0.1} } } }
      if (got_r) scales.R = { range: { min: {pad:0.1}, max: {pad:0.1} } }
      if (Number.isFinite(this.left_min) || Number.isFinite(this.left_max)) {
        if (Number.isFinite(this.left_min))
          Object.assign(scales.L.range.min, { soft: this.left_min, mode: 1 })
        if (Number.isFinite(this.left_max))
          Object.assign(scales.L.range.max, { soft: this.left_max, mode: 1 })
      }
      if (Number.isFinite(this.right_min) || Number.isFinite(this.right_max)) {
        if (Number.isFinite(this.right_min))
          Object.assign(scales.R.range.min, { soft: this.right_min, mode: 1 })
        if (Number.isFinite(this.right_max)) 
          Object.assign(scales.R.range.max, { soft: this.right_max, mode: 1 })
      }

      // put uplot options together
      const opts = { series, axes, scales }
      console.log(`Options for time-plot-raw:`, opts);
      // emit in the next tick in order not to affect the dependency stuff
      this.$nextTick(() => { this.$emit('send', opts) })
      return opts
    },

    classes() {
      return {
        "reverse-legend": !!this.reverse_legend,
      }
    },

  },
}
</script>
