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

  help: `Simple on/off toggle switch.
Sends a pre-determined value when toggled on or off. The current state can be set via the
value input: the toggle will be "on" if the value is equal to the "on_value" input.`,

  props: {
    value: { default: null, dynamic: "toggle", tip: "set toggle value" },
    enabled: { type: Boolean, default: true },
    color: { type: String, default: "primary" },
    on_value: { default: true, tip: "value sent when switched on" },
    off_value: { default: false, tip: "value sent when switched off" },
    show_value: { type: Boolean, default: true, tip: "show current value" },
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
      inputValue: this.val,
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
    value: { immediate: true, handler(v) { this.val = v } },
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
