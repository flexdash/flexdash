<!-- RandomValue - Widget that sends a pseudo-random value into a store topic primarily for
     demo purposes. The random values follow a bit of a trend so the value don't jump around like
     crazy. Originally from https://stackoverflow.com/a/22080644
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <v-card-text class="pa-0 width100 d-flex justify-end align-center height100"
               style="overflow: hidden;">
    <div class="ticker">{{ticker}}</div>
  </v-card-text>
</template>

<script scoped>
import randomStepper from '/src/utils/random-stepper.js'
export default {
  name: 'RandomValue',

  // help displayed in the UI: the first line is used in the widgets menu and is always shown in the
  // edit card. Successive lines can be expanded in the card and are markdown-formatted.
  help: `Produce and display a random value for demo purposes.
The RandomValue widget sends a pseudo-random value into a store topic primarily for demo purposes.
The random values follow a trend so the values don't jump around like crazy.
Originally from https://stackoverflow.com/a/22080644.`,

  // properties are inputs to the widget, these can be set to static values or bound to dynamic
  // data by topic in the FlexDash UI. The type is used to display the appropriate kind of input
  // field and also to convert data (ex: string to number). Dynamic is used to bind an input
  // to a data topic right when the widget is created so it animates tight off the bat.
  props: {
    min: { type: Number, default: 0, tip: "Minimum value produced by random walk" },
    max: { type: Number, default: 100, tip: "Maximum value produced by random walk" },
    seconds: { type: Number, default: 5, tip: "Interval at which values are produced in seconds" },
    round: { type: Number, default: 0.1, tip: "Rounding of values produced, 0.1 -> one decimal" },
  },

  // output is a FlexDash custom property whose presence signals that the widget emits data
  // back to the server. It can contain a default binding and a tooltip
  output: { default: "$demo_1", tip: "Random value output" },

  data: ()=>({
    clr_timer: null, // token to clear the interval timer
    val : "",
    ticker : "",
  }),

  // produce computed data values, the functions that produce them get called whenever one of the
  // values they use changes
  computed: {
    // stepper is a variable that contains a function to produce the next random value
    // by being a computed variable, a fresh function is generated every time an input is changed
    stepper() {
      return randomStepper(this.min, this.max, this.round)
    },
  },

  watch: {
    val() {
      if (this.val.length == 0) return
      const v0 = this.val.charAt(0)
      const v = this.val.substr(1)
      this.ticker += v0
      window.setTimeout(()=>{ this.val = v }, this.seconds*100)
    },
  },

  // mounted is called when the widget and the corresponding DOM nodes are fully instantiated
  mounted() {
    // use a timer, not an interval so changes in the 'seconds' input have effect
    const doit = () => {
      const v = this.stepper()
      this.val = ` ${v}`
      this.$emit('send', v); // send to server
      this.clr_timer = window.setTimeout(doit, this.seconds*1000)
    }
    //doit() //generate initial value and get things going
  },

  beforeDestroy() {
    if (this.clr_timer) {
      window.clearTimeout(this.clr_timer)
      this.clr_timer = null
    }
  },

}
</script>

<style scoped>
div.ticker { border-style: dashed; border-width: 1px 0px; white-space: nowrap; padding-right: 4px;}
</style>
