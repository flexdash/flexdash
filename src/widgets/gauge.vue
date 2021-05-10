<template>
  <div class="gauge-card d-flex">
    <svg-gauge v-bind="$attrs" :value="value" :style="gauge_valign"></svg-gauge>
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
import SvgGauge from '../components/svg-gauge';

export default {
  name: 'Gauge',

  components: {
    SvgGauge,
  },

  props: {
    value: { type: Number, default: null }, // current value to show
    unit: { type: String, default: "" },
    title: { type: String, default: "Gauge" },
    arc: { type: Number, default: 90 },
    center: { type: Boolean, default: false }, // center the text in the gauge, else bottom
    //
    min: { type: Number, default: 0 }, // minimum value
    max: { type: Number, default: 100 }, // maximum value
    color: { type: String, default: '#00b500' },  // color of filled segment
    base_color: { type: String, default: 'lightgrey' },  // color of unfilled segment
    needle_color: { type: String, default: 'white' },  // color of needle
    radius: { type: Number, default: 70 },  // inner radius, outer being 100
    stretch: { type: Boolean, default: false },  // false: 2:1 aspect ratio, true: stretch
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
</style>
