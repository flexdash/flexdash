<!-- DateTime - Widget to display date & time or "ago" time.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <!-- The widget title is rendered by the wrapper, we only render the value. Perhaps confusingly
       the title is rendered as v-card-text while the value is rendered here as v-card-title,
       that's so the value is more prominent than the title... ma-auto applies auto margins all
       around, which centers the value. -->
  <v-card-title v-if="!chip" class="headline pa-0 flex-grow-1 d-flex" @click="click">
    <span class="ma-auto" :style="dateStyle">
      <span class="font-weight-medium" :style="zoomStyle">{{valTxt}}</span>
    </span>
  </v-card-title>
  <div v-else class="flex-grow-1 d-flex justify-center align-center">
    <v-chip :color="finalColor" @click="click">{{valTxt}}</v-chip>
  </div>
</template>

<style scoped>
.unit { vertical-align: 15%; margin-left: 0.1em; }
</style>

<script scoped>
export default {
  name: 'DateTime',
  // help displayed in the UI: the first line is used in the widgets menu and is always shown in
  // the edit card. Successive lines can be expanded in the card and are markdown-formatted.
  help: `Display colored date-time.
`,

  // properties are inputs to the widget, these can be set to static values or bound to dynamic
  // data by topic in the FlexDash UI. The type is used to display the appropriate kind of input
  // field and also to convert data (ex: string to number). Dynamic is used to bind an input
  // to a data topic right when the widget is created so it animates tight off the bat.
  props: {
    value: { default: null, dynamic: "$demo_random" },
    color: { type: String, default: null, tip: "value color, null->text color" },
    start_mode: { type: Number, default: 0, tip: "0=local TZ, 1=UTC, 2=ago" },
    zoom: { type: Number, default: 100, tip: "zoom factor in % (N/A to chip)" },
    low_threshold: { type: Number, default: null, tip: "threshold in seconds-ago for low_color, null to disable" },
    low_color: { type: String, default: "blue", tip: "color below low threshold" },
    high_threshold:{ type: Number, default: null, tip: "threshold for in seconds-ago high_color, null to disable" },
    high_color: { type: String, default: "pink", tip: "color above high threshold" },
    chip: { type: Boolean, default: false, tip: "display value in a chip/pill" },
    units: { type: Array, default: () => (["now", "sec", "min", "hr", "days", "weeks", "months"]),
      tip: "unit text" },
  },

  data() { return {
    mode: this.start_mode % 3, // 0=local, 1=UTC, 2=ago
    timer: null, // timer for "ago" mode
    now: Date.now(), // for "ago" mode, updated by timer, triggers re-rendering
  }},

  computed: {
    // support UNIX timestamps, this assumes that values < 1999 are unix
    valMs() { return this.value < 915177600000 ? this.value*1000 : this.value},
    // generate "ago" time string
    valAgo() {
      const dt = this.now - this.valMs
      const dta = dt < 0 ? 0 : dt
      const info = dta < 1000 ? [0, 0 ] :
        dta < 120000 ? [ dta/1000, 1 ] :
        dta < 5400000 ? [ dta/60000, 2 ] :
        dta < 129600000 ? [ dta/3600000, 3 ] :
        dta < 864000000 ? [ dta/86400000, 4 ] :
        dta < 4838400000 ? [ dta/604800000, 5 ] :
        [ dta/2635200000, 6 ]
      return info[1] == 0 ? this.units[0] :
      info[0] == 0 ? "now" :
        dta < 0 ? "in " + info[0].toFixed(1) + " " + this.units[info[1]] :
        info[0].toFixed(1) + " " + this.units[info[1]] + " ago"
    },
    valTxt() {
      if (this.valMs < 31564800000) return "--"
      switch (this.mode) {
        default: return (new Date(this.valMs)).toLocaleString()
        case 1: return (new Date(this.valMs)).toISOString().replace(/\.000/, "")
        case 2: return this.valAgo
      }
    },
    // compute the color for number values
    finalColor() {
      const dt = (this.now - this.valMs)/1000
      if (this.low_threshold !== null && dt <= this.low_threshold) return this.low_color
      if (this.high_threshold !== null && dt >= this.high_threshold) return this.high_color
      return this.color
    },
    dateStyle() { return { color: this.finalColor } },
    zoomStyle() { return { fontSize: this.zoom + "%", 'line-height': this.zoom + "%" } },
  },

  watch: {
    mode: { immediate: true, handler() { this.kick_timer() } },
    valMs() { this.kick_timer() },
  },

  methods: {
    click() {
      this.mode = (this.mode + 1) % 3
    },
    kick_timer() {
      if (this.timer) clearTimeout(this.timer)
      this.timer = null
      if (this.mode != 2) return
      this.now = Date.now()
      const delay = this.now-this.valMs < 5*60*1000 ? 3000 : 60000
      this.timer = setTimeout(() => { this.kick_timer() }, delay)
    },
  },

}
</script>
