<template>
  <div class="d-flex justify-center align-center">
    <v-btn x-small icon elevation=2 @click="dec"><v-icon>mdi-minus</v-icon></v-btn></v-col>
    <v-chip small class="mx-1">{{fmt()}}</v-chip></v-col>
    <v-btn x-small icon elevation=2 @click="inc"><v-icon>mdi-plus</v-icon></v-btn></v-col>
  </div>
</template>

<script>
export default {
  name: 'EditPlusMinus',

  props: {
    range: Array,
    value: Number,
    unit: String,
  },

  data() {
    //console.log("edit-plus-minus.value:", this.value)
    let ix = this.range.findIndex(x => x == this.value)
    if (ix == -1) ix = 0
    return {
      ix: ix,
    };
  },

  methods: {
    inc() { if (this.ix < this.range.length-1) this.ix += 1; this.emit() },
    dec() { if (this.ix > 0) this.ix -= 1; this.emit() },
    fmt() {
      let v = this.range[this.ix]
      if (typeof v == 'number') return "" + v + " " + this.unit
      else return v
    },
    emit() { this.$emit('update:value', this.range[this.ix]) },
  },
}
</script>
