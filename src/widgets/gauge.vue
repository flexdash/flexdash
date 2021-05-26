<!-- Gauge is a simple wrapper around the svg-gauge component.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div class="gauge-card d-flex">
    <svg-gauge v-bind="$props" :value="value" :style="gauge_valign"></svg-gauge>
    <div class="gauge-card--label d-flex flex-column mx-auto" :class="txt_valign">
      <v-card-text class="gauge-value d-flex pa-0 width100">
        <span class="mx-auto">{{valTxt}}<span class="unit">{{unitTxt}}</span></span>
      </v-card-text>
      <v-card-text v-if="title" class="gauge-title d-flex pa-0">
        <span class="mx-auto">{{title}}</span>
      </v-card-text>
    </div>
  </div>
</template>

<script scoped>
import SvgGauge from '/src/components/svg-gauge.vue';

export default {
  name: 'Gauge',

  help: `Simple SVG gauge.`,

  components: {
    SvgGauge,
  },

  props: {
    value: { type: Number, default: null, dynamic: "$demo_random" },
    unit: { type: String, default: "", tip: "superscript after the value" },
    title: { type: String, default: "Gauge" },
    arc: { type: Number, default: 90, tip: "degrees spanned by the arc of the gauge",
           validator: (v) => v>10 && v<=360 },
    center: { type: Boolean, default: false, tip: "center the text in the gauge, else bottom" },
    //
    min: { type: Number, default: 0, tip: "minimum value" },
    max: { type: Number, default: 100, tip: "maximum value" },
    color: { type: String, default: 'green', tip: "color of filled segment" },
    base_color: { type: String, default: 'lightgrey', tip: "color of unfilled segment" },
    needle_color: { type: String, default: 'white', tip: "color of needle" },
    radius: { type: Number, default: 70, tip: "inner radius, outer being 100" },
    stretch: { type: Boolean, default: false, tip: "false: 2:1 aspect ratio, true: stretch" },
  },

  computed: {
    txt_valign() {
      let ctr = this.center !== null ? this.center : !(this.arc < 200)
      return ctr ? "my-auto" : "mt-auto"
    },
    gauge_valign() { return this.arc < 180 ? "height:auto;" : "" },
    unitTxt() { return this.value === "--" ? "" : this.unit; },
    valTxt() {
      if (typeof this.value == 'number') return Math.round(this.value*10.0)/10.0
      else if (this.value === null) return "--"
      else return this.value
    },
  },
}
</script>

<style scoped>
  div.gauge-card { padding: 0.5ex; width:100%; height: 100%; }
  div.gauge-card svg {
    width: 100%; height: 100%;
    z-index: 1; position: absolute; padding: 0.5ex; top: 0ex; left: 0ex; box-sizing: border-box;
  }
  div.gauge-card--label div { z-index: 2; position: relative; }
  div.gauge-card--label span { margin-bottom: -0.5ex; }

/* need to incorporate this for large gauges
.gauge-large .gauge-value { line-height: 3rem; font-size: 2rem; }
.gauge-large .gauge-title { line-height: 1.5rem; font-size: 1rem; }
*/
</style>
