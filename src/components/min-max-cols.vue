<!-- MinMaxCols -- Simple controls to adjust min/max ciolumns for grid
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-tooltip>
    <template v-slot:activator="{ props }">
      <div class="d-flex flex-row mr-4" v-bind="props">
        <edit-plus-minus label="min-cols:" class="mr-0"
                         :range="colRange" :value="minCols" @update:value="setMinCols">
        </edit-plus-minus>
      </div>
    </template>
    <span>Minimum number of columns to shrink grid to</span>
  </v-tooltip>

  <v-tooltip>
    <template v-slot:activator="{ props }">
      <div class="d-flex flex-row mr-4" v-bind="props">
        <edit-plus-minus label="max-cols:" class="mr-0"  
                         :range="colRange" :value="maxCols" @update:value="setMaxCols">
        </edit-plus-minus>
      </div>
    </template>
    <span>Maximum number of columns to grow grid to</span>
  </v-tooltip>
</template>

<script scoped>

import EditPlusMinus from '/src/components/edit-plus-minus.vue'

export default {
  name: 'MinMaxCols',

  components: { EditPlusMinus },
  inject: [ '$store' ],

  props: {
    grid: { type: Object, required: true },
    maxWidget: { type: Number, default: 1 },
  },

  computed: {
    minCols() { return this.grid.min_cols || 1 },
    maxCols() { return this.grid.max_cols || 20 },
    colRange() { // range for min/maxCols: [ maxWidget .. 20 ], i.e., no smaller than widest widget
      // need to provide array with values: construct [ maxWidget, maxWidget+1, ..., 20 ]
      return [...Array(21-this.maxWidget)].map((_, ix) => (this.maxWidget+ix))
    },
  },

  methods: {
    setMinCols(ev) {
      this.$store.updateGrid(this.grid.id, { min_cols: ev })
      if (ev > this.maxCols) this.setMaxCols(ev)
    },
    setMaxCols(ev) {
      this.$store.updateGrid(this.grid.id, { max_cols: ev })
      if (ev < this.minCols) this.setMinCols(ev)
    },
  },

}
</script>
