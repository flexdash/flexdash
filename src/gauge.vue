<template>
  <v-card>
    <v-card-text class="d-flex pa-0 pt-1">
      <span class="mx-auto">{{title}}</span>
    </v-card-text>
    <vue-svg-gauge class="pa-0" style="height:65%;" v-bind="config" v-bind:value="value">
    </vue-svg-gauge>
    <v-card-title class="headline pa-0 width100" style="margin-top: -1.2em">
      <span class="mx-auto">{{valTxt}}<span class="unit">{{unitTxt}}</span></span>
    </v-card-title>
  </v-card>
</template>

<script scoped>
  module.exports = {

    props: {
      config: { default: () => { return {
        min: 30, max: 120, separatorStep: 10, separatorThickness: 2, scaleInterval: 10, innerRadius: 75,
        gaugeColor: [{offset:30,color:'#609edc'}, {offset:90,color:'yellow'}, {offset:120,color:'red'}], };}},
      value: { type: Number, default: null },
      unit: { type: String, default: "" },
      title: { type: String, default: "" },
    },

    computed: {
      unitTxt: function() { return this.value === "DEAD" ? "" : this.unit; },
      valTxt: function() {
        if (typeof this.value == 'number') return Math.round(this.value*10.0)/10.0
        else if (this.value === null) return "DEAD";
        else return this.value;
      },
    },

  }
</script>
