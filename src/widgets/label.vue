<!-- Label - Display a label, similar to stat but focused on alignment.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div :style="label_style">
    <span :style="text_style">{{label}}</span>
  </div>
</template>

<script scoped>
export default {
  name: 'Label',
  help: `Display a label, useful in panels.
The Label widget displays a text string with various size and alignment options. It is very
similar to the Stat widget but focuses on text positioning and size more than
thresholds, units and such.`,

  props: {
    label: { default: null, dynamic: "$demo_random" },
    color: { type: String, default: null }, // null -> text color
    align: { type: String, default: "center", tip: "top/center/bottom" },
    justify: { type: String, default: "center", tip: "left/center/right" },
    weight: { type: String, default: "400", tip: "100,200..900" },
    size: { type: String, default: "100%", tip: "any font-size CSS value" },
    padding: { type: String, default: "4px", tip: "CSS padding around label" },
  },

  computed: {
    label_style() { return {
      "display": "flex",
      "align-items": {"top":"flex-start","bottom":"flex-end"}[this.align] || this.align,
      "justify-content": {"top":"flex-start","bottom":"flex-end"}[this.justify] || this.justify,
      "flex-grow": 1,
      "width": "100%",
      "min-height": "0px",
      "padding": this.padding,
    }},
    text_style() { return {
      "color": this.color,
      "font-weight": this.weight,
      "font-size": this.size,
    }},
  },

}
</script>
