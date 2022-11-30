<!-- DropdownSelect -- A drop-down select widget to choose one or multiple options from a list
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div> <!-- vertically centers content -->
    <v-select :model-value="currentValue" v-bind="bindings" @update:modelValue="change($event)"
              variant="solo" hide-details density="compact" />
  </div>
</template>
<!-- label inside v-select is not vertically centered: https://github.com/vuetifyjs/vuetify/issues/15610 -->
  
<script scoped>

export default {
  name: 'DropdownSelect',
  
  help: `Dropdown select box.
  Allows the selection of a single or multiple options from a dropdown select box.
  Each option is defined by a value (which is the value returned when the option is selected
  and optionally a label string which is the string shown in the dropdown.
  If the label is not provided then the value is used as the label.

  When an option is clicked then then the configured value is sent,
  unless \`allow_multiple\` is selected, in which case an array of values is sent when the user
  checks or unchecks an option.

  Setting value to one of the item values will preset the choice in the dropdown.
  If using the multi-select option then the value should be an array.`,

  props: {
    enabled: { default: true },
    value: { default: null, tip: "value of selection to show in the box" },
    choices: { type: Array, default: [], tip: "array of choices" },
    labels: { type: Array, default: [], tip: "array of labels for choices" },
    allow_multiple: { type: Boolean, default: false },
    color: { type: String, default: "primary", tip: "background color of button" },
  },
 
  output: true,

  data() { return {
    currentValue: null,
  }},

  watch: {
    value: {
      immediate: true, // causes handler to be called when component is mounted
      handler(v) { this.currentValue = v },
    },
  },

  computed: {
    // construct the bindings passed into v-select
    bindings() {
      return {
        disabled: !this.enabled,
        multiple: !!this.allow_multiple,
        items: this.items,
        bgColor: this.color,
      }
    },

    // produce the list of items in the form of an array of objects with title and value fields
    items() {
      if (!Array.isArray(this.choices)) return []
      const labels = Array.isArray(this.labels) ? this.labels : []
      return this.choices.map((c, ix) => {
        const label = labels[ix] || c
        return {
          title: label,
          value: c,
        }
      })
    }
  },

  methods: {
    change(ev) {
      this.$emit('send', ev)
    },
  },

}
</script>
