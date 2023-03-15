<!-- Simple-table -- Displaty a simple table filled with data from inputs
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <v-simple-table dense fixed-header class="simple-table mt-2" style="overflow-y:scroll">
    <template v-slot:default>
      <thead><tr>
        <th class="px-2" v-for="col in col_labels" :key="col">{{col}}</th>
      </tr></thead>
      <tbody>
        <tr v-for="k in row_keys" :key="k">
          <td class="px-2" v-for="col in col_keys" :key="col">{{data_at(k, col)}}</td>
        </tr>
      </tbody>
    </template>
  </v-simple-table>
</template>

<style scoped>
.unit { vertical-align: 15%; margin-left: 0.1em; }
</style>

<style>
  .simple-table.v-data-table { width: 100%; }
</style>

<script scoped>
export default {
  name: 'SimpleTable',
  // help displayed in the UI: the first line is used in the widgets menu and is always shown in
  // the edit card. Successive lines can be expanded in the card and are markdown-formatted.
  help: `Display data in simple tabular form.
Yadda yadda.`,

  props: {
    data: { default: null, tip: "array of data rows, or map of rows"},
    columns: { type: Array, default: null, tip: "per column key to index data"},
    labels: { type: Array, default: null, tip: "array of column labels"},
  },

  computed: {
    row_keys() {
      if (Array.isArray(this.data)) return this.data.map((_,i) => i)
      if (this.data) return Object.keys(this.data).sort()
      return []
    },
    col_keys() { 
      if (Array.isArray(this.columns) && this.columns.length) return this.columns
      if (!this.data) return []
      if (Array.isArray(this.data)) return Object.keys(this.data[0])
      return Object.keys(this.data[this.row_keys[0]]).sort()
    },
    col_labels() { 
      if (this.labels) return this.labels
      return this.col_keys
    },
  },

  methods: {
    data_at(row, col) {
      if (Array.isArray(this.data)) return this.data[row][col]
      return this.data[row] ? this.data[row][col] : null },
  },

}
</script>

