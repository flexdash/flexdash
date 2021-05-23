<!-- Toggle - Simple switch/toggle widget that can show the state of a toggle and/or let
     the user change a value.
     Note that this is called toggle instead of switch 'cause switch is an html element
     and causes a conflict.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div class="d-flex">
    <v-switch class="ma-auto" v-bind="bindings" @change="change($event)"></v-switch>
  </div>
</template>

<script scoped>
export default {
  name: 'Toggle',

  props: {
    value: { default: 0 },
    enabled: { default: true },
    color: { default: "primary" },
    on_value: { default: true },
    off_value: { default: false },
    show_value: { default: true },
  },

  data() { return {
    val: 0,  // current value being displayed, separate from this.value to avoid mutating prop
  }},

  computed: {
    // actual bindings passed into v-switch, these are a bit of a massage of the props
    // 'cause of name changes and some heuristics
    bindings() { return {
      value: this.val,
      disabled: !this.enabled,
      color: this.color,
      trueValue: this.on_value,
      falseValue: this.off_value,
      label: this.show_value ? this.label : undefined,
    }},

    // use the v-switch label to display the current value
    label() {
      const v = this.val == this.on_value ? this.on_value : this.off_value
      return `${v}`
    },
  },

  watch: {
    value(v) { this.val = v; },
  },

  methods: {
    // change from v-switch is only emitted when the user toggles, not when input value changes
    change(ev) {
      console.log("toggle event:", ev)
      this.$emit('send', ev)
    },
  },

}
</script>
