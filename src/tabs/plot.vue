<template>
  <v-container fluid class="g-grid">
    <!-- uPlot test chart -->
    <v-card class="g-2w-2h">
      <v-card-title class="pb-0">Test uPlot</v-card-title>
      <upv :options="nr.uplot_opts" :data="nr.uplot_data"></upv>
    </v-card>
    <component-array :array="uplots">
      <template v-slot:default="slotProps">
        <v-card class="g-2w-2h">
          <v-card-title class="pb-0">Test uPlot {{slotProps.k}}</v-card-title>
          <upv v-bind="slotProps"></upv>
        </v-card>

      </template>
    </component-array>
    <!--UplotVue></UplotVue-->

    <!-- empty cards to fill up some space -->
    <v-card><v-card-title>Card 1</v-card-title><v-card-text>Hello there!</v-card-text></v-card>
    <v-card><v-card-title>Card 2</v-card-title><v-card-text>Hello there!<br>x<br>x<br>x<br>x<br>I
      am taller...</v-card-text></v-card>
    <v-card class="g-2w"><v-card-title>Card 3</v-card-title><v-card-text>Hello there!</v-card-text></v-card>
    <v-card><v-card-title>Card 4</v-card-title><v-card-text>Hello there!</v-card-text></v-card>
    <v-card><v-card-title>Card 5</v-card-title><v-card-text>Hello there!</v-card-text></v-card>
    <v-card><v-card-title>Card 6</v-card-title><v-card-text>Hello there!</v-card-text></v-card>

  </v-container>
</template>

<script scoped>

import Upv from '/src/components/upv'
import ComponentArray from '/src/components/component-array'

export default {
  name: 'PlotTab',

  components: {
    ComponentArray,
    Upv,
  },

  props: {
    nr: null,
  },

  data() {
    let self = this;
    return {
      uplots: Array.from(new Array(10), (a, i) => {
        return { k: i+1, options: self.nr["uplot_opts_"+i], data: self.nr["uplot_data_"+i] }
      }),
    }
  },

}

</script>

<style scoped>
</style>
