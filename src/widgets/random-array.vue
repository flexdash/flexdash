<!-- RandomArray - Widget that produces arrays with random values, primarily for demo purposes.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <v-card-text class="pa-0 width100 d-flex justify-end align-center height100">
    {{val}}
  </v-card-text>
</template>

<script scoped>
import randomStepper from '/src/utils/random-stepper.js'
export default {
  name: 'RandomArray',

  // help displayed in the UI: the first line is used in the widgets menu and is always shown in the
  // edit card. Successive lines can be expanded in the card and are markdown-formatted.
  help: `Produce a random array for demo purposes.
The RandomArray widget sends an array of pseudo-random values into a store topic primarily
for demo purposes.
The random values follow a trend so the values don't jump around like crazy.
The first element of the array can be set to be a timestamp, which makes the array usable as
input to TimePlot.`,

  // properties are inputs to the widget, these can be set to static values or bound to dynamic
  // data by topic in the FlexDash UI. The type is used to display the appropriate kind of input
  // field and also to convert data (ex: string to number). Dynamic is used to bind an input
  // to a data topic right when the widget is created so it animates tight off the bat.
  props: {
    min: { type: Number, default: 0, tip: "Minimum value produced by random walk" },
    max: { type: Number, default: 100, tip: "Maximum value produced by random walk" },
    seconds: { type: Number, default: 5, tip: "Interval at which values are produced in seconds" },
    round: { type: Number, default: 0.1, tip: "Rounding of values produced, 0.1 -> one decimal" },
    length: { type: Number, default: 4, tip: "Length of array to produce" },
    time: { type: Boolean, default: true, tip: "Place unix timestamp into first array element" },
  },

  // output is a FlexDash custom property whose presence signals that the widget emits data
  // back to the server. It can contain a default binding and a tooltip
  output: { default: "$demo/plot", tip: "Random array output" },

  data: ()=>({
    clr_timer: null, // token to clear the interval timer
    val : "?",
  }),

  // produce computed data values, the functions that produce them get called whenever one of the
  // values they use changes
  computed: {
    // stepper is a variable that contains a function to produce the next random value
    // by being a computed variable, a fresh function is generated every time an input is changed
    steppers() {
      return Array.from({length: this.length}, (v, ix) => {
        if (ix == 0 && this.time) return ()=>Date.now()/1000
        else return randomStepper(this.min, this.max, this.round)
      })
    },
  },

  // mounted is called when the widget and the corresponding DOM nodes are fully instantiated
  mounted() {
    // use a timer, not an interval so changes in the 'seconds' input have effect
    const doit = () => {
      const a = this.steppers.map(s => s())
      this.val = `${a}`
      this.$emit('send', a); // send to server
      this.clr_timer = window.setTimeout(doit, this.seconds*1000)
    }
    doit() //generate initial value and get things going
  },

  beforeDestroy() {
    if (this.clr_timer) {
      window.clearTimeout(this.clr_timer)
      this.clr_timer = null
    }
  },

}
</script>
