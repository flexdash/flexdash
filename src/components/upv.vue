<template>
  <div class="px-1">
    <div style="xx-background-color:#eef;"></div>
  </div>
</template>

<script scoped>

// 20 distinct colors from https://sashamaps.net/docs/resources/20-colors/
var colors = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0',
'#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3',
'#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000'];

import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'

export default {

  props: {
    options: {type: Object, default: function() { return {};}},
    data: {type: Array, default: function() { return []; }},
  },

  data() { return {
    chart: null, // uPlot object instance
    ro: null, // resize observer
    opts: null, // actual options passed to uPlot
  }; },

  watch: {
    options(/*options, prevOptions*/) {
      console.log("UPV options changed");
      this._destroy();
      this._create();
    },
    data(data, /*prevData*/) {
      console.log("UPV data changed:");
      if (!this.chart) {
        this._create();
      } else if (data && data.length > 0 &&
          data[0].length != this.opts.series.length) {
        this._destroy();
        this._create();
      } else { // if (!dataMatch(prevData, data)) {
        this.chart.setData(this._transpose(data));
      }
    }
  },

  mounted() {
    this._create();
    this.ro = new ResizeObserver(this._onResize).observe(this.$el);
  },

  beforeDestroy() {
    console.log("BeforeDestroy uPlot")
    if (this.ro) this.ro.unobserve(this.$el);
    this.ro = null;
    this._destroy();
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
      let width = this.options.width || this.$el.children[0].clientWidth;
      let height = this.options.height || (width / (this.options.aspect || 2));
      console.log("UPV container sized to", width, "x", height);
      return { width: width, height: height };
    },

    // receive resize event and change the size of the chart if necessary
    _onResize() {
      if (!this.chart) return;
      this.chart.setSize(this._calcSize());
    },

    _transpose() {
      if (!this.data || this.data.length == 0) return [];
      let tr = this.data[0].map(()=>{return Array(this.data.length)});
      this.data.forEach((d, i) => {
        d.forEach((v, j) => {
          tr[j][i] = v;
        });
      });
      return tr;
    },

    _create() {
      console.log("Creating uPlot");
      // provide some reasonable defaults for the options
      let opts = Object.assign({}, this.options);
      Object.assign(opts, this._calcSize());
      // in particular, we do need to declare the series for them to show
      let tr = this._transpose(this.data);
      if (tr.length === 0) return;
      if (!opts.series) opts.series = [];
      while (opts.series.length < tr.length) opts.series.push({});
      opts.series.forEach(function(v, i) {
        if (!v.label) v.label = i ? ("series "+i) : "time";
        if (i) {
          if (!v.stroke) v.stroke = colors[(i-1)%20];
          if (!v.width) v.width = 2;
          if (v.value && typeof v.value === 'string')
            v.value = new Function('u', 'v',
                `"use strict";return (${v.value})`);
        }
      });
      // fix-up some strings needing eval
      console.log("uPlot options:", opts);
      (opts.axes||[]).forEach((ax) => {
        if (ax.values && typeof ax.values === 'string')
          ax.values = new Function('u', 'vv', 's',
              `"use strict";return (${ax.values})`);
      });
      Object.values(opts.scales||{}).forEach((s) => {
        if (s.range && typeof s.range === 'string')
          s.range = new Function('u', 'min', 'max',
              `"use strict";return (${s.range})`);
      });
      console.log("uPlot options:", opts);
      this.opts = opts;
      this.chart = new uPlot(opts, tr, this.$el.children[0]);
    },

  },
}
</script>
