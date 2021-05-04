<template>
  <v-card>
    <div class="gauge-card d-flex">
      <gauge v-bind="gauge" :value="value" :style="gauge_valign"></gauge>
      <div class="gauge-card--label d-flex flex-column mx-auto" :class="txt_valign">
        <v-card-text class="gauge-value d-flex pa-0 width100">
          <span class="mx-auto">{{valTxt}}<span class="unit">{{unitTxt}}</span></span>
        </v-card-text>
        <v-card-text class="gauge-title d-flex pa-0">
          <span class="mx-auto">{{title}}</span>
        </v-card-text>
      </div>
    </div>
  </v-card>
</template>

<script scoped>
  module.exports = {
    components: {
      'gauge': httpVueLoader('gauge.vue'),
    },

    props: {
      value: { type: Number, default: 30 }, // current value to show
      unit: { type: String, default: "" },
      title: { type: String, default: "" },
      center: { type: Boolean, default: null }, // center the text in the gauge, else bottom
      gauge: { type: Object, default: function() {return {} }}, // inner gauge style
    },

    computed: {
      txt_valign: function() {
        let ctr = this.center !== null ? this.center : !(this.gauge.arc < 200);
        return ctr ? "my-auto" : "mt-auto";
      },
      gauge_valign: function() { return this.gauge.arc < 180 ? "height:auto;" : "" },
      unitTxt: function() { return this.value === "DEAD" ? "" : this.unit; },
      valTxt: function() {
        if (typeof this.value == 'number') return Math.round(this.value*10.0)/10.0
        else if (this.value === null) return "DEAD";
        else return this.value;
      },
    },
  }
</script>

<style scoped>
div.gauge-card { padding: 0.5ex; height: 100%; width: 100%; }
div.gauge-card svg {
  z-index: 1; position: absolute; padding: 0.5ex; top: 0ex; left: 0ex; box-sizing: border-box;
}
div.gauge-card--label div { z-index: 2; position: relative; }
div.gauge-card--label span { margin-bottom: -0.5ex; }
</style scoped>
