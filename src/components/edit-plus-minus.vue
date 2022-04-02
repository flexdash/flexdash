<template>
  <div class="d-flex justify-center align-center">
    <span v-if="label" class="mr-2">{{label}}</span>
    <v-btn size="small" icon @click="dec"><v-icon size="small">mdi-minus</v-icon></v-btn>
    <v-chip class="mx-0">{{fmt}}</v-chip>
    <v-btn size="small" icon @click="inc"><v-icon size="small">mdi-plus</v-icon></v-btn>
  </div>
</template>

<script>
export default {
  name: 'EditPlusMinus',

  props: {
    range: Array,
    value: Number,
    unit: { type: String, default: "" },
    label: String,
  },

  data() { return {
    ix: this.findIx(this.value),
  }},

  computed: {
    fmt() {
      let v = this.range[this.ix]
      if (typeof v == 'number') return "" + v + " " + this.unit
      else return v
    },
  },

  watch: {
    value(val) { this.ix = this.findIx(val) },
  },

  methods: {
    inc() { if (this.ix < this.range.length-1) this.ix += 1; this.emit() },
    dec() { if (this.ix > 0) this.ix -= 1; this.emit() },
    emit() { this.$emit('update:value', this.range[this.ix]) },
    // findIx finds the index at which the passed value is found
    findIx(v) {
      //console.log("edit-plus-minus.value:", v)
      let ix = this.range.findIndex(x => x == v)
      return ix >= 0 ? ix : 0
    },
  },
}
</script>
