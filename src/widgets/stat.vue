<!-- Stat - Status widget that can display a numeric or text value in a color.
     A unit string can optionally be appended and is rendered as a superscript.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <!-- The widget title is rendered by the wrapper, we only render the value. Perhaps confusingly
       the title is rendered as v-card-text while the value is rendered here as v-card-title,
       that's so the value is more prominent than the title... ma-auto applies auto margins all
       around, which centers the value. -->
  <v-card-title v-if="!chip" class="headline pa-0 flex-grow-1 d-flex">
    <span class="ma-auto" :style="statStyle">
      <span class="font-weight-medium" style="font-size: 125%; line-height: 125%;">{{valTxt}}</span>
      <span class="unit">{{unitTxt}}</span>
    </span>
  </v-card-title>
  <div v-else class="flex-grow-1 d-flex justify-center align-center">
    <v-chip variant="tonal" density="comfortable" :color="finalColor">{{valTxt}}<span class="unit">{{unitTxt}}</span></v-chip>
  </div>
</template>

<style scoped>
.unit { vertical-align: 15%; margin-left: 0.1em; }
</style>

<script scoped>
export default {
  name: 'Stat',
  // help displayed in the UI: the first line is used in the widgets menu and is always shown in
  // the edit card. Successive lines can be expanded in the card and are markdown-formatted.
  help: `Display colored numeric or text status value.
The Stat widget displays a colored centered numerical or text value. Optionally a unit string
can be appended and is rendered as a superscript.

Three colors can be defined: low, normal, high.
The low-color is displayed if the value is below the low-threshold, the high-color if it's above
the high-threshold. For string values low and high colors are selected using regexps.

The \`iso_prefix\` option can be used to display the value in ISO format with a prefix, e.g.
if the value is 1200 and the unit 'W' it will display 1.2kW, or if the value is 0.012 and the
unit 's' the display will be 12ms.

Floating point values are rounded using JavaScript's toPrecision() function, passing it
the \`precision\` option. Integer values are shown as-is.
`,

  // properties are inputs to the widget, these can be set to static values or bound to dynamic
  // data by topic in the FlexDash UI. The type is used to display the appropriate kind of input
  // field and also to convert data (ex: string to number). Dynamic is used to bind an input
  // to a data topic right when the widget is created so it animates tight off the bat.
  props: {
    unit: { type: String, default: "", tip: "superscript after the value" },
    value: { default: null, dynamic: "$demo_random" },
    color: { type: String, default: null, tip: "value color, null->text color" },
    low_color: { type: String, default: "blue", tip: "color below low threshold" },
    high_color: { type: String, default: "pink", tip: "color above high threshold" },
    low_threshold: { type: Number, default: null, tip: "threshold for low_color, null to disable" },
    high_threshold:{ type: Number, default: null, tip: "threshold for high_color, null to disable" },
    low_regexp: { type: String, default: null, tip: "match produces low_color for non-number value" },
    high_regexp: { type: String, default: null, tip: "match produces high_color for non-number value" },
    chip: { type: Boolean, default: false, tip: "display value in a chip/pill" },
    iso_prefix: { type: Boolean, default: true, tip: "display unit with ISO prefix (K, M, G, m, ...)" },
    precision: { type: Number, default: 3, tip: "number of significant digits to show" },
    zoom: { type: Number, default: 1, tip: "zoom factor for value text" },
  },

  computed: {
    // don't display a unit if there's no value
    unitTxt() { return this.valueUnitISO[1] },
    // round values to one decimal (should make that adjustable) and show "--" if the value is
    // null or undefined
    valTxt() { return this.valueUnitISO[0] },
    valueUnitISO() {
      let v = this.value
      if (typeof v == 'number') {
        if (v >= 1 || v == 0) {
          let prefix = ["", "K", "M", "G", "T", "P", "E", "Z", "Y"]
          let i = 0
          while (v >= 1000 && i < prefix.length) {
            v /= 1000
            i++
          }
          if (prefix[i] == "" && Number.isInteger(v))  return [v.toFixed(0), this.unit]
          return [ v.toPrecision(this.precision), prefix[i] + this.unit]
        } else if (v > 0) {
          let prefix = ["m", "µ", "n", "p", "f", "a", "z", "y"]
          let i = 0
          while (v < 1 && i < prefix.length) {
            v *= 1000
            i++
          }
          return [ v.toPrecision(this.precision), prefix[i] + this.unit]
        }
        return [ v.toPrecision(this.precision), this.unit ]
      } else if (v === null) return [ "--", "" ]
      else return [ v, "" ]
    },
    // compute the color for number values
    numColor() {
      if (typeof this.value !== 'number') return this.color
      if (this.low_threshold !== null && this.value <= this.low_threshold) return this.low_color
      if (this.high_threshold !== null && this.value >= this.high_threshold) return this.high_color
      return this.color
    },
    // compute the color for text values
    lowRegexp() { return this.low_regexp && new RegExp(this.low_regexp) },
    highRegexp() { return this.high_regexp && new RegExp(this.high_regexp) },
    textColor() {
      if (typeof this.value !== 'string') return this.color
      if (this.lowRegexp && this.lowRegexp.test(this.value)) return this.low_color
      if (this.highRegexp && this.highRegexp.test(this.value)) return this.high_color
      return this.color
    },
    finalColor() { return (typeof this.value === 'number') ? this.numColor : this.textColor },
    // compute the CSS style for the value
    statStyle() {
      const style = { fontSize: `${this.zoom * 100}%`, lineHeight: `${this.zoom * 100}%` }
      if (this.finalColor) style.color = this.finalColor
      return style
    },
  },

}
</script>
