<!-- ValueSequence - Input a value by clicking +/- through a sequence.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div class="d-flex" :class="classes">
    <div>{{label}}</div>
    <div class="d-flex justify-center align-center mx-1">
      <v-btn x-small icon text @click="dec"><v-icon>mdi-minus</v-icon></v-btn></v-col>
      <v-chip small class="mx-1">{{val}}<span class="unit">{{unit}}</span></v-chip></v-col>
      <v-btn x-small icon text @click="inc"><v-icon>mdi-plus</v-icon></v-btn></v-col>
    </div>
  </div>
</template>

<style scoped>
.unit { vertical-align: 15%; margin-left: 0.1em; font-size: 80%; }
</style>

<script>
export default {
  name: 'ValueSequence',
  help: `Input a value by clicking +/- through a sequence.
The range input provides an array of values from which the user can select one by
clicking on the +/- buttons. The values are typically numeric but may be strings as well, or
a combination of both.

To facilitate the input of numeric ranges a value of "..." between two numbers is replaced by
the range between those numbers. A step may be specified after the dots, e.g. "...10". For example,
the input array \`["off", 20, "...10", 40]\` results in the range: off, 20, 30, 40.`,

  props: {
    range: { type: Array, default: ()=>(["off", 10, "...10", 100]),
             tip: "values to select from, use '...<step>' for a range" },
    value: { type: Number, tip: "current value selected" },
    unit: { type: String, default: "", tip: "unit to show after numeric values" },
    label: { type: String, default: "", tip: "label for control" },
    label_above: { type:Boolean, default:false, tip:"place label above control, else to the left"},
  },

  output: { default: null, tip: "outputs value selected" },

  data() { return {
    val: this.value,
    ix: 0, // can't calculate due to values() not having run yet: this.val2ix(this.value),
  }},

  computed: {
    // values to select from, basically this.range with ranges expanded
    values() {
      const v = []
      const r = this.range
      r.forEach((s, ix) => {
        if (typeof s === 'string' &&
            ix > 0 && typeof r[ix-1] === 'number' &&
            ix < r.length-1 && typeof r[ix+1] === 'number')
        {
          const m = s.match(/^\.\.\.(\d*)$/)
          if (m) {
            const step = m[1].length > 0 ? Number.parseInt(m[1], 10) : 1
            for (let i=r[ix-1]+step; i<r[ix+1]; i+=step) v.push(i)
            return
          }
        }
        v.push(s)
      })
      return v
    },

    // CSS classes to switch between label above vs label left
    classes() {
      if (this.label_above) return [ "flex-column", "align-center" ]
      else return [ "flex-row", "align-center" ]
    },
  },

  watch: {
    value(v) {
      this.val = v
      this.ix = this.val2ix(v)
    },
    values() { this.ix = this.val2ix(this.val) },
  },

  methods: {
    // find the value in the range sequence to get the index into the sequence
    // FIXME: for numeric values that are not found could return closest ix
    val2ix(v) {
      let ix = this.values.findIndex(x => x == v)
      return ix == -1 ? 0 : ix
    },
    inc() {
      if (this.ix < this.values.length-1) { this.ix += 1; this.val = this.values[this.ix] }
      this.emit()
    },
    dec() {
      if (this.ix > 0) { this.ix -= 1; this.val = this.values[this.ix] }
      this.emit()
    },
    emit() { this.$emit('send', this.range[this.ix]) },
  },
}
</script>
