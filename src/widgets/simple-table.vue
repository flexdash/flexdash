<!-- Simple-table -- Displaty a simple table filled with data from inputs
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <v-table fixed-header class="mt-2 px-1" height="auto" style="overflow-y:scroll">
    <thead><tr>
      <th class="px-2 mx-auto" v-for="(col,ix) in col_labels" :key="col" :style="th_style[ix]">
        {{col}}
        <v-btn v-if="col_sort[ix]" flat size="small" :color="ix==sort_ix?'primary':'transparent'"
               class="ml-1 px-0" minWidth="20px" @click="sort(ix)">
          <v-icon v-if="ix==sort_ix" size="small"
                  :icon="sort_dir > 0 ? 'mdi-sort-ascending' : 'mdi-sort-descending'" />
          <v-icon v-else size="small" icon="mdi-sort" />
        </v-btn>
      </th>
    </tr></thead>
    <tbody>
      <tr v-for="k in row_keys" :key="k">
        <td class="px-2" v-for="(col,ix) in col_keys" :key="col"
            v-bind="col_attrs[ix]" @click="send_click(k, col, ix)">
          {{data_at(k, col)}}
        </td>
      </tr>
    </tbody>
  </v-table>
</template>

<style scoped>
.unit { vertical-align: 15%; margin-left: 0.1em; }
.v-table { height: 100%; width: 100% } /* need height attr and height style... */
</style>

<script scoped>
export default {
  name: 'SimpleTable',
  // help displayed in the UI: the first line is used in the widgets menu and is always shown in
  // the edit card. Successive lines can be expanded in the card and are markdown-formatted.
  help: `Display unformatted data in tabular form.
The data can consist of an array of rows, or a map of row-key to row.
In the case of an array, the rows are displayed in array order, in the case of a map,
the rows are displayed in sorted-key order, the keys themselves are not displayed.

Each row must be an array of values or a map of column-key to value.
In the case of a map, the order of the columns is determined by the columns prop and
the key is not displayed, in the case of an array, the columns prop is ignored.

The labels prop determines the labels at the top of the columns.

The click property can be used to make the table or specific columns clickable.
A click outputs \`{ row: row_key, col: column_key, data: row_data }\`.
If data is an array the \`row_key\` is the 1-based index.
If rows are arrays the \`column_key\` is the 1-based index.
\`row_data\` is the data of the clicked row, i.e., \`data[row_key]\`.

The sort property determines whether the table can be sorted by clicking in the column
headings. It can be a per-column array of booleans to enable/disable sorting per column
or it can be a single boolean for all columns.
`,

  output: true,

  props: {
    data: { default: null, tip: "array of data rows, or map of rows"},
    columns: { type: Array, default: null, tip: "per column key to index into row map"},
    labels: { type: Array, default: null, tip: "array of column labels"},
    align: { type: Array, default: null, tip: "array of column alignments (left, center, right)"},
    click: { default: null, tip: "boolean or array of columns to make table/columns clickable"},
    sort: { default: true, tip: "boolean or array of columns to allow sorting by column"},
  },

  data() { return {
      sort_ix: null, // index of column to sort by
      sort_dir: 1,  // 1=ascending, -1=descending
  }},

  computed: {
    // return the row keys (or indices) for the table to display
    row_keys() {
      if (!this.data) return []
      const keys = Array.isArray(this.data) ? this.data.map((_,i) => i) : Object.keys(this.data).sort()
      if (this.sort_ix === null) return keys // original sort order
      // sorting by explicit column
      return keys.sort((a,b) => {
        const av = this.data_at(a, this.col_keys[this.sort_ix])
        const bv = this.data_at(b, this.col_keys[this.sort_ix])
        return (av < bv ? -1 : av > bv ? 1 : 0) * this.sort_dir
      })
    },
    // return column keys (or indices) based on the columns prop or the first row
    col_keys() { 
      if (this.columns) return this.columns
      if (!this.data) return []
      let first_row = Array.isArray(this.data) ? this.data[0] : this.data[this.row_keys[0]]
      if (Array.isArray(first_row)) return first_row.map((_,i) => i)
      else return Object.keys(first_row).sort()
    },
    // return number of rows in table
    num_cols() {
      return Array.isArray(this.col_keys) ? this.col_keys.length : this.col_keys
    },
    col_labels() { 
      if (this.labels) return this.labels
      return this.col_keys
    },
    col_sort() {
      if (Array.isArray(this.sort)) return this.sort; else return Array(this.num_cols).fill(!!this.sort)
    },
    col_attrs() {
      let attrs = Array(this.num_cols).fill(0).map(() => ({}))
      // handle alignment attribute
      if (typeof this.align == 'string') {
        for (let c in attrs) attrs[c].align = this.align
      } else if (Array.isArray(this.align)) {
        for (let c in attrs) if (c < this.align.length) attrs[c].align = this.align[c]
      }
      // handle click attribute
      if (this.click === true) {
        for (let c in attrs) attrs[c].style = { cursor: 'pointer' }
      } else if (Array.isArray(this.click)) {
        for (let c in attrs) if (c < this.click.length) {
          if (this.click[c]) attrs[c].style = { cursor: 'pointer' }
        }
      }
      return attrs
    },
    th_style() {
      let style = Array(this.num_cols).fill(0).map(() => ({}))
      // handle alignment attribute
      if (typeof this.align == 'string') {
        for (let c in style) style[c].textAlign = this.align
      } else if (Array.isArray(this.align)) {
        for (let c in style) if (c < this.align.length) style[c].textAlign = this.align[c]
      }
      return style
    },
  },

  methods: {
    data_at(row, col) {
      try {
        return this.data[row][col]
      } catch (e) {
        return null
      }
    },

    send_click(row, col, col_ix) {
      if (this.click === true || (Array.isArray(this.click) && this.click[col_ix])) {
        const data = this.data[row]
        console.log('click', row, col, data)
        this.$emit('send', { row, col, data })
      }
    },

    sort(ix) {
      if (this.sort_ix == ix) this.sort_dir = -this.sort_dir // change sort direction
      else {
        this.sort_ix = ix
        this.sort_dir = 1
      }
    },
  },

}
</script>
