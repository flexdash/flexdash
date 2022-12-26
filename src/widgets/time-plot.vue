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

import { colors, color_by_name } from '/src/utils/plot-colors.js'
import { toISO } from '/src/utils/formatter.js'

function deepEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2) // yeah...
}


export default {
  name: "TimePlot",

  help: `Time-series chart with simple options.
TimePlot is a wrapper around the TimePlotRaw widget to make the configuration of typical
time-series plots easier than using the raw uPlot options, which TimePlotRaw expects.

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
Note that this "row-wise" structure gets transposed to the columnar structure expected by uPlot.

TimePlot outputs the uPlot options it constructs to the browser console.
This can be handy as a starting point if you need to switch to TimePlotRaw to get
the full uPlot flexibility.
`,

  props: {
    data: { // data in row-wise format
      type: Array,
      default() { return null },
      validator(v) { return v === null || Array.isArray(v) },
      tip: "array of row-wise data or a single row",
    },

    labels: { type: Array, default: ()=>[], tip: "array of labels for series" },
    colors: { type: Array, default: ()=>[], tip: "array of colors for series, names or #rrggbb" },
    axes: { type: Array, default: ()=>[], tip: "array to assign series to 'left' or 'right' axis" },
    widths: { type: Array, default: ()=>[], tip: "array of stroke widths for series, default is 2" },
    points: { type: Array, default: ()=>[], tip: "array of bool to show points on lines" },
    span_gaps: { type: Array, default: ()=>[], tip: "array of bool to span over nulls, default is false" },
    // Note: the following props are all individual props instead of having a left_axis:{} and
    // right_axis:{} prop because it allows individual props to be changed while that's not readily
    // possible with an object prop. Also, the individual props are a bit easier to discover.
    left_unit: { type: String, default: "", tip: "unit to label left axis" },
    left_min: { type: Number, default: null, tip: "minimum for left axis" },
    left_max: { type: Number, default: null, tip: "maximum for left axis" },
    left_decimals: { type: Number, default: 1, tip: "decimals on left axis" },
    left_isoprefix: { type: Boolean, default: false, tip: "use SI prefix on left axis" },
    left_log: { type: Boolean, default: false, tip: "use log scale on left axis" },
    right_unit: { type: String, default: "", tip: "unit to label right axis" },
    right_min: { type: Number, default: null, tip: "minimum for right axis" },
    right_max: { type: Number, default: null, tip: "maximum for right axis" },
    right_decimals: { type: Number, default: 1, tip: "decimals on right axis" },
    right_isoprefix: { type: Boolean, default: false, tip: "use SI prefix on right axis" },
    right_log: { type: Boolean, default: false, tip: "use log scale on right axis" },
    reverse_legend: { type: Boolean, default: false, tip: "reverse legend order" },
  },

  full_page: true, // can expand to full-page

  data() { return { options: null }},
  watch: {
    _options: {
      immediate: true,
      handler() {
        if (!deepEqual(this.options, this._options)) {
          this.options = this._options
          console.log(`Options for time-plot-raw: ${(this.labels||[]).join('|')}`, this._options)
        }
      }
    }
  },

  computed: {
    classes() {
      return {
        "reverse-legend": !!this.reverse_legend,
      }
    },

    // generate options for uPlot based on the props
    // this also emits an event as a side-effect (not supposed to do that, oh well...)
    _options() {
      const arrays = [ "labels", "colors", "axes", "widths", "span_gaps", "points" ]
      // make sure these props are arrays so we don't have to guard umpteen times below
      // e.g. instead of this.labels use pp.labels henceforth
      const pp = Object.fromEntries(
        arrays.map(p => [p, Array.isArray(this[p]) ? this[p] : []])
      )
      // check that the lengths make sense, warn if not
      const ns = Math.max(1, ...arrays.map(a => pp[a].length))
      arrays.forEach(a => {
        if (pp[a].length > 0 && pp[a].length != ns) {
          console.log(`TimePlot: ${a} has ${pp[a].length} elements, expected ${ns}`)
        }
      })
      //if (ns == 1 && this.labels?.length != 1) this.labels.push(null)

      // declare the series
      let got_r = false
      const series = [ { label: "time" } ]
      for (let s=0; s<ns; s++) {
        const r = pp.axes[s] && pp.axes[s].match(/^[rR]/)
        got_r = got_r || r
        const d = r ? this.right_decimals : this.left_decimals
        const u = r ? this.right_unit : this.left_unit
        const iso = r ? this.right_isoprefix : this.left_isoprefix
        const serie = {
          label: pp.labels[s] || `series ${s+1}`, // see special case below
          stroke: pp.colors[s] ? color_by_name(pp.colors[s]) : colors[s%colors.length],
          width: pp.widths[s] || 2,
          spanGaps: pp.span_gaps[s],
          scale: r ? "R" : "L",
          value: iso ? ((_,v) => this.iso_fmt(v, d, u)) : `v && (v.toFixed(${d}) + "${u}")`,
          points: { show: pp.points[s] },
        }
        series.push(serie)
      }

      // axes
      const axes = [ {}, {
        scale: "L",
        values: this.left_isoprefix
                ? (_, spl) => this.iso_axis(spl, this.left_decimals, this.left_unit)
                : `vv.map(v => v && (v + "${this.left_unit}"))`,
      }]
      if (got_r) {
        axes.push({
          scale: "R",
          values: this.right_isoprefix
                  ? (_, spl) => this.iso_axis(spl, this.right_decimals, this.right_unit)
                  : `vv.map(v => v && (v + "${this.right_unit}"))`,
          side: 1,
          grid: {show: false},
        })
      }

      // generate the scale definition given the props
      // for log scale, we have to use hard min/max else uPlot barfs
      // for linear scale, we use 0.1 pad where no limit is specified, and a soft limit
      // otherwise, which means that [...]
      function setScale(log, min, max) {
        if (log) {
          const scale = {
            distr: 3, // 1=linear,2=ordinal,3=log,4=arcsinh
            range: [null, null], // can't use pad for log scale
          }
          if (Number.isFinite(min)) scale.range[0] = min
          if (Number.isFinite(max)) scale.range[1] = max
          return scale
        } else {
          const scale = { range: { min: {pad:0.1}, max: {pad:0.1} } }
          if (Number.isFinite(min)) scale.range.min = { soft: min, mode: 1 }
          if (Number.isFinite(max)) scale.range.max = { soft: max, mode: 1 }
          return scale
        }
      }

      // scales, see also https://github.com/leeoniya/uPlot/issues/526
      const scales = {}
      scales.L = setScale(this.left_log, this.left_min, this.left_max)
      if (got_r) scales.R = setScale(this.right_log, this.right_min, this.right_max)
      if (this.left_log) {
        axes[1].grid = { width: 1 }
        axes[1].ticks = { width: 1 }
      }
      if (got_r && this.right_log) {
        axes[2].ticks = { width: 1 }
      }

      // put uplot options together
      const opts = { series, axes, scales }
      if (ns == 1 && !pp.labels[0]) {
        opts.legend = { show: false }
        opts.series[1].label = " "
      }
      return opts
    },

  },

  methods: {
    iso_fmt(value, decimals, unit) {
      if (!value) return ""
      const [v, pref] = toISO(value)
      return v.toFixed(decimals) + pref + unit
    },
    iso_axis(splits, decimals, units) {
      return splits.map(s => s && this.iso_fmt(s, decimals, units))
    },
  },
}
</script>
