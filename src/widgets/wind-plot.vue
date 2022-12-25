<!-- WindPlot shows a wind/gust/direction time-series plot based on uPlot.

     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <time-plot-raw :data="data" :options="options"></time-plot-raw>
</template>

<script scoped>

// FIXME: the color stuff needs to go into a separate js file so it can be properly shared with
// time-plot.vue

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

function dist(x1, y1, x2, y2) { return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1)) }

// drawDirection draws the wind direction at a point in the plot
// u:uplot, s:series ix, i0..i1: data points ix
// i.e. draw points for u.data[s][i0..i1]
function drawDirection(u, s, i0, i1) {
  let { ctx } = u; // CanvasRenderingContext2D
  let { scale } = u.series[s];
  let { _stroke } = u.series[1]; // series 1 is direction
  ctx.strokeStyle = _stroke;
  ctx.lineWidth = 3
  const len = 30 // length of wind direction flag

  let lx = -len, ly = -len // coord of last flag drawn
  for (let i=i1; i>=i0; i--) { // rev order so last data point always gets a flag
    let val = u.data[s][i];
    if (val < 1) continue // no wind...
    // get x-y canvas coords of point
    let cx = Math.round(u.valToPos(u.data[0][i], 'x', true));
    let cy = Math.round(u.valToPos(val, scale, true));
    //if (dist(lx, ly, cx, cy) < 2*len) continue // don't draw, too close to last one
    if (dist(lx, 0, cx, 0) < len) continue // don't draw, too close to last one
    lx = cx
    ly = cy
    // get direction
    let dir = u.data[1][i]
    let dx =  Math.sin(Math.PI * dir / 180) * len
    let dy = -Math.cos(Math.PI * dir / 180) * len
    // get flag tail deltas
    let tx =  Math.sin(Math.PI * (dir+290) / 180) * len/3
    let ty = -Math.cos(Math.PI * (dir+290) / 180) * len/3
    // draw wind direction
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx+dx, cy+dy)
    ctx.lineTo(cx+dx+tx, cy+dy+ty)
    if (val > 10) { // FIXME: need to take unit into account!!!
      ctx.moveTo(cx+dx*3/4, cy+dy*3/4)
      ctx.lineTo(cx+dx*3/4+tx, cy+dy*3/4+ty)
    }
    ctx.stroke();
  }
}


export default {
  name: "WindPlot",

  help: `Wind speed, gust and direction time-series plot
WindPlot uses the TimePlotRaw widget to render a cmbined wind speed and direction
time-series plot.

The data must be input in the form of "data points" where a data point is an array consisting
a unix timestamp (seconds since 1970-01-01) followed by wind direction in degrees, followed by
wind speed and wind gust speed (using any unit of choice). Null values are OK
to designate missing data.
**Important**: each and every data point must have _exactly_ four values, otherwise
nothing will be plotted.

Each data message may be either an array of data points or a single data point. If an array is
provided then it replaces the entire dataset being shown. If a single point is provided
it is appended to the current dataset and an old data point may be rotated out.
Note that this "row-wise" structure gets transposed to the columnar structure expected by uPlot.
`,

  props: {
    data: { // data in row-wise format
      type: Array,
      default: undefined,
      validator(v) { return v == null || Array.isArray(v) },
      tip: "array with unix timestamp, wind direction, speed and gust",
    },

    colors: { type: Array, default: ()=>[], tip: "array of colors for series, names or #rrggbb" },
    widths: { type: Array, default: ()=>[], tip: "array of stroke widths for series, default is 2" },
    unit: { type: String, default: "", tip: "unit to label wind speed" },
  },

  output: { default: null, tip: "options passed into uPlot" },

  full_page: true, // can expand to full-page

  computed: {
    // generate options for uPlot based on the props
    // this also emits an event as a side-effect (not supposed to do that, oh well...)
    options() {
      // declare the series
      const series = [ {
          label: "time",
        }, {
          label: "direction",
          show: true,
          width: 0,
          points: { show: false },
          stroke: this.colors[0] ? color_by_name(this.colors[0]) : colors[3],
          value: `v.toFixed(0) + "°"`,
          scale: "R",
        }, {
          label: "speed",
          stroke: this.colors[1] ? color_by_name(this.colors[1]) : colors[0],
          width: 2,
          value: `v.toFixed(0) + "${this.unit}"`,
          points: { show: drawDirection },
          scale: "L",
        }, {
          label: "gust",
          stroke: this.colors[2] ? color_by_name(this.colors[2]) : colors[4],
          width: 0.5,
          value: `v.toFixed(0) + "${this.unit}"`,
          scale: "L",
        }]

      // axes
      const axes = [ {}, { scale: "L", values: `vv.map(v => v + "${this.unit}")`, }]

      // scales, see also https://github.com/leeoniya/uPlot/issues/526
      const scales = { L: { range: { min: {hard: 0, pad:0.1}, max: {pad:0.1} } } }

      const cursor = { points: { size: (u,s) => s>1?6:0 } }

      const opts = { series, axes, scales, cursor }
      //console.log("WindPlot options for time-plot-raw:", opts);
      // emit in the next tick in order not to affect the dependency stuff
      this.$nextTick(() => { this.$emit('send', opts) })
      return opts
    },

  },
}
</script>
