<!-- Simple-table -- Displaty a simple table filled with data from inputs
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <v-table fixed-header class="simple-table mt-2">
    <thead><tr>
      <th class="px-2" v-for="col in col_labels" :key="col">{{col}}</th>
    </tr></thead>
    <tbody>
      <tr v-for="k in row_keys" :key="k">
        <td class="px-2" v-for="col in col_keys" v-bind="col_attrs" :key="col">{{data_at(k, col)}}</td>
      </tr>
    </tbody>
  </v-table>
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
The data can consist of an array of rows, or a map of row-key to row.
In the case of an array, the rows are displayed in array order, in the case of a map,
the rows are displayed in sorted-key order, the keys themselves are not displayed.

Each row must be an array of values or a map of column-key to value.
In the case of a map, the order of the columns is determined by the columns prop and
the key is not displayed, in the case of an array, the columns prop is ignored.

The labels prop determines the labels at the top of the columns.
`,

  props: {
    data: { default: null, tip: "array of data rows, or map of rows"},
    columns: { type: Array, default: null, tip: "per column key to index into row map"},
    labels: { type: Array, default: null, tip: "array of column labels"},
    align: { type: Array, default: null, tip: "array of column alignments (left, center, right)"},
  },

  computed: {
    row_keys() {
      if (Array.isArray(this.data)) return this.data.length
      if (this.data) return Object.keys(this.data).sort()
      return []
    },
    col_keys() { 
      if (this.columns) return this.columns
      if (!this.data) return []
      let first_row = Array.isArray(this.data) ? this.data[0] : this.data[this.row_keys[0]]
      if (Array.isArray(first_row)) return first_row.length
      else return Object.keys(first_row).sort()
    },
    col_labels() { 
      if (this.labels) return this.labels
      return this.col_keys
    },
    col_attrs() {
      if (!this.align) return []
      if (typeof this.align == 'string') return Array(this.row_keys.length).fill({align:this.align})
      if (Array.isArray(this.align)) return this.align.map(align => ({align}))
      return []
    }
  },

  methods: {
    data_at(row, col) {
      let r = Array.isArray(this.data) ? this.data[row-1] : this.data[row]
      if (Array.isArray(r)) return r[col-1]
      else if (typeof r == 'object') return r[col]
      else return null
    },
  },

}
</script>
