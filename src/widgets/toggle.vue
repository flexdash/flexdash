<!-- Toggle - Simple switch/toggle widget that can show the state of a toggle and/or let
     the user change a value.
     Note that this is called toggle instead of switch 'cause switch is an html element
     and causes a conflict.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div class="d-flex fd-toggle">
    <v-switch class="ma-auto" hide-details
              v-bind="bindings" @update:modelValue="change($event)"></v-switch>
  </div>
</template>

<style>
  .fd-toggle .v-switch__thumb {
    border: 2px solid #888888; /* FIXME: goal is to offset the thumb when OFF in dark theme */
  }
</style>

<script scoped>
export default {
  name: 'Toggle',

  help: `Simple on/off toggle switch.
Sends a pre-determined value when toggled on or off. The current state can be set via the
value input: the toggle will be "on" IF the value is equal to the "on_value" input.

By default clicking the toggle shows a "ripple" effect and outputs a message but does not toggle
the switch. The switch is only toggled in response to an input change. If no input is received,
the toggle will "fall back" to its prior state and repeated clicking will send the same output.

By setting \`loopback\` to true, the toggle will internally feed the output value to its input
causing the toggle to immediately change to the new state. Repeated clicking will then alternate
between the on & off values.
`,

  props: {
    value: { default: null, dynamic: "toggle", tip: "set toggle value" },
    enabled: { type: Boolean, default: true },
    color: { type: String, default: "primary" },
    on_value: { default: true, tip: "value sent when switched on" },
    off_value: { default: false, tip: "value sent when switched off" },
    show_value: { type: Boolean, default: true, tip: "display current value" },
    loopback: { type: Boolean, default: false, tip: "internally loop-back output to input" },
  },

  output: { default: null },

  data() { return {
    val: 0,  // current value being displayed, separate from this.value to avoid mutating prop
  }},

  computed: {
    // actual bindings passed into v-switch, these are a bit of a massage of the props
    // 'cause of name changes and some heuristics
    bindings() { return {
      //value: this.val,
      modelValue: this.val,
      disabled: !this.enabled,
      color: this.color,
      trueValue: this.on_value,
      falseValue: this.off_value,
      label: this.show_value ? this.val : undefined,
    }},

    // use the v-switch label to display the current value
    // label() {
    //   const v = this.val == this.on_value ? this.on_value : this.off_value
    //   return `${v}`
    // },
  },

  watch: {
    value: { immediate: true, handler(v) { this.val = v; console.log("toggle watch:", v) } },
  },

  methods: {
    // change from v-switch is only emitted when the user toggles, not when input value changes
    change(ev) {
      this.$emit('send', ev)
      const curVal = this.val
      console.log("toggle emits", ev, "was", curVal)
      if (this.loopback) this.val = ev
      // if (!this.loopback) setTimeout(() => {this.val = curVal; console.log("set toggle to", curVal)}, 50)
      // this.val = ev
    },
  },

}
</script>
