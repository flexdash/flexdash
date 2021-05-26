<!-- Stat - Simple status widget that can display a numeric or text value. A unit string can
     optionally be appended and is rendered as a superscript.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <!-- The widget title is rendered by the wrapper, we only render the value. Perhaps confusingly
       the title is rendered as v-card-text while the value is rendered here as v-card-title,
       that's so the value is more prominent than the title... ma-auto applies auto margins all
       around, which centers the value. -->
  <v-card-title class="headline pa-0">
    <span class="ma-auto">{{valTxt}}<span class="unit">{{unitTxt}}</span></span>
  </v-card-title>
</template>

<script scoped>
export default {
  name: 'Stat',
  // help displayed in the UI: the first line is used in the widgets menu and is always shown in
  // the edit card. Successive lines can be expanded in the card and are markdown-formatted.
  help: `Display numeric or text status value.
The Stat widget displays a simple centered numerical or text value. Optionally a unit string
can be appended and is rendered as a superscript.`,

  // properties are inputs to the widget, these can be set to static values or bound to dynamic
  // data by topic in the FlexDash UI. The type is used to display the appropriate kind of input
  // field and also to convert data (ex: string to number). Dynamic is used to bind an input
  // to a data topic right when the widget is created so it animates tight off the bat.
  props: {
    unit: String,
    value: { default: null, dynamic: "$demo_random" },
  },

  computed: {
    // don't display a unit if there's no value
    unitTxt: function() { return this.value === "--" ? "" : this.unit; },
    // round values to one decimal (should make that adjustable) and show "--" if the value is
    // null or undefined
    valTxt: function() {
      if (typeof this.value == 'number') return Math.round(this.value*10.0)/10.0
      else if (this.value === null) return "--";
      else return this.value;
    },
  },

}
</script>
