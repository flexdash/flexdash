<template>
  <div class="text-body-1 text--primary font-weight-regular">
    <v-row align='center'>
      <v-col cols=3><slot></slot></v-col>
      <v-spacer class="col col-1"></v-spacer>
      <v-col cols=2 class="d-flex justify-center">
        <v-btn icon elevation=2 @click="dec"><v-icon>mdi-minus</v-icon></v-btn></v-col>
      <v-col cols=4 class="d-flex">
        <v-chip class="justify-center text-body-1 font-weight-bold width100">
          {{fmt()}}</v-chip></v-col>
      <v-col cols=2 class="d-flex justify-center">
        <v-btn icon elevation=2 @click="inc"><v-icon>mdi-plus</v-icon></v-btn></v-col>
    </v-row>
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
