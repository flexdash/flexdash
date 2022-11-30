<!-- Toggle - Simple switch/toggle widget that can show the state of a toggle and/or let
     the user change a value.
     Note that this is called toggle instead of switch 'cause switch is an html element
     and causes a conflict.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div class="d-flex fd-toggle">
    <v-switch class="ma-auto" hide-details v-bind="bindings"
              :modelValue="value" @update:modelValue="change($event)" />
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

Clicking the toggle shows a "ripple" effect and outputs a message but does not toggle
the switch. The switch is only toggled in response to an input change. If no input is received,
the toggle will "stick" to its prior state and repeated clicking will send the same output.
`,

  props: {
    value: { default: null, dynamic: "toggle", tip: "set toggle value" },
    enabled: { type: Boolean, default: true },
    color: { type: String, default: "primary" },
    on_value: { default: true, tip: "value sent when switched on" },
    off_value: { default: false, tip: "value sent when switched off" },
    show_value: { type: Boolean, default: true, tip: "display current value" },
  },

  output: { default: null },

  computed: {
    // actual bindings passed into v-switch, these are a bit of a massage of the props
    // 'cause of name changes and some heuristics
    bindings() { return {
      disabled: !this.enabled,
      color: this.color,
      trueValue: this.on_value,
      falseValue: this.off_value,
      label: this.show_value ? this.val : undefined,
    }},
  },

  methods: {
    // change from v-switch is only emitted when the user toggles, not when input value changes
    change(ev) {
      this.$emit('send', ev)
    },
  },

}
</script>
