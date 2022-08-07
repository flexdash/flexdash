<!-- Gauge is a simple wrapper around the svg-gauge component.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div class="gauge d-flex flex-column justify-top align-center">
    <svg-gauge v-bind="$props" :color="gaugeColor" :class="svg_class"></svg-gauge>
    <div class="label d-flex flex-column mx-auto" :class="txt_class" :style="txt_style">
      <v-card-text class="value d-flex pa-0 width100">
        <span class="mx-auto">{{valTxt}}<span class="unit">{{unitTxt}}</span></span>
      </v-card-text>
      <v-card-text v-if="title" class="g-title d-flex pa-0 mt-n1">
        <span class="mx-auto">{{title}}</span>
      </v-card-text>
    </div>
  </div>
</template>

<style scoped>
.gauge { padding: 0.5ex; width:100%; min-height: 20px; position: relative; }
.gauge svg { width: 100%; }
.gauge svg.above { margin-bottom: -10%; /* to pull value up */}
.gauge .label.absolute { z-index: 1; position: absolute; }
.gauge .label.below {
  /*margin-top: -2ex; fails for tiny gauges in panels, replace by -10% on svg */
  margin-bottom: -4px; }
.unit { vertical-align: 15%; margin-left: 0.1em; font-size: 80%; }

/* need to incorporate this for large gauges
.gauge-large .value { line-height: 3rem; font-size: 2rem; }
.gauge-large .title { line-height: 1.5rem; font-size: 1rem; }
*/
</style>

<script scoped>
import SvgGauge from '/src/components/svg-gauge.vue'

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
    // center: { type: Boolean, default: false, tip: "center the text in the gauge, else bottom" },
    //
    min: { type: Number, default: 0, tip: "minimum value" },
    max: { type: Number, default: 100, tip: "maximum value" },
    color: { type: String, default: 'green', tip: "color of filled segment" },
    low_color: { type: String, default: "blue", tip: "color below low threshold" },
    high_color: { type: String, default: "pink", tip: "color above high threshold" },
    low_threshold: { type: Number, default: null, tip: "threshold for low_color, null to disable" },
    high_threshold:{ type: Number, default: null, tip: "threshold for high_color, null to disable" },
    base_color: { type: String, default: 'lightgrey', tip: "color of unfilled segment" },
    needle_color: { type: String, default: 'white', tip: "color of needle" },
    radius: { type: Number, default: 70, tip: "inner radius, outer being 100" },
    stretch: { type: Boolean, default: false, tip: "false: 2:1 aspect ratio, true: stretch" },
  },

  computed: {
    gaugeColor() {
      if (typeof this.value !== 'number') return this.color
      if (this.low_threshold !== null && this.value <= this.low_threshold) return this.low_color
      if (this.high_threshold !== null && this.value >= this.high_threshold) return this.high_color
      return this.color
    },
    svg_class() { return this.arc < 130 ? "above" : "" },
    txt_class() { return this.arc < 130 ? "below" : "absolute" },
    txt_style() {
      if (this.arc < 130) return { }
      if (this.arc < 220) return { bottom: "0px" }
      return { top: "40%" }
    },
    unitTxt() { return this.value === "--" ? "" : this.unit; },
    valTxt() {
      if (typeof this.value == 'number') return Math.round(this.value*10.0)/10.0
      else if (this.value === null) return "--"
      else return this.value
    },
  },
}
</script>
