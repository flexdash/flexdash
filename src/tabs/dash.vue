<template>
  <v-container fluid class="g-grid-small">
    <component-array v-bind="nr.temp_array">
      <template v-slot:default="slotProps">
        <stat v-bind="slotProps"></stat>
      </template>
    </component-array>
    <component-array v-bind="nr.gauge_array">
      <template v-slot:default="slotProps">
        <gauge-card v-bind="slotProps"
            :gauge="{min:30, max:120, arc:180}"></gauge-card>
      </template>
    </component-array>
    <stat title="messages" :value="nr.msgCount"></stat>
    <stat title="bedroom" unit="°F" :value="nr.bedroom"></stat>
    <gauge-card title="bedroom" unit="°F" :value="nr.bedroom"
        :gauge="{min:30, max:120, arc:90}"></gauge-card>
    <gauge-card title="gh-air" unit="°F" :value="nr.gh_air"
        :gauge="{min:30, max:120}"></gauge-card>
    <gauge-card title="gh-air" unit="°F" :value="nr.gh_air"
        style="grid-row:span 2" :gauge="{min:30, max:120, stretch:true}"></gauge-card>
    <gauge-card title="gh-air" unit="°F" :value="nr.gh_air"
        style="grid-row:span 2; grid-column:span 2" class="gauge-large"
        :gauge="{min:30, max:120, stretch:true}"></gauge-card>
    <v-card style="grid-row:span 2">
      <v-card-text class="d-flex py-1"><span class="mx-auto">Three gauges</span></v-card-text>
      <div class="d-flex">
        <gauge v-bind="{min:30, max:120, arc:180}" :value="nr.bedroom"
            style="width:80%;" class="mx-auto mt-2"></gauge>
      </div>
      <div class="d-flex flex-row mt-5">
        <gauge v-bind="{min:30, max:120, arc:90, color:'#0091ea'}" :value="nr.study"
            class="mx-1"></gauge>
        <gauge v-bind="{min:30, max:120, arc:90, color:'#ffd600'}" :value="nr.gh_air"
            class="mr-1"></gauge>
      </div>
    </v-card>
  </v-container>
</template>

<script scoped>

import Stat from '/src/components/stat'
import Gauge from '/src/components/gauge'
import GaugeCard from '/src/components/gauge-card'
import ComponentArray from '/src/components/component-array'

export default {
  name: 'DashTab',

  components: {
    Stat,
    Gauge,
    GaugeCard,
    ComponentArray,
  },

  props: {
    nr: null,
  },

}

</script>

<style scoped>
.gauge-large .gauge-value { line-height: 3rem; font-size: 2rem; }
.gauge-large .gauge-title { line-height: 1.5rem; font-size: 1rem; }
</style>
