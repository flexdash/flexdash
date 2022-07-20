<!-- PushButton - Simple button that sends a message when clicked
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div class="pushbutton d-flex align-center justify-center">
    <v-btn variant="elevated" class="ma-auto" max-width="95%"
           density="default"
           v-bind="bindings" @click="clickEv($event)">
      <v-icon :large="!title" v-if="icon" :icon=icon />
      <span>{{ title }}</span>
    </v-btn>
  </div>
</template>

<script scoped>
export default {
  name: 'PushButton',

  help: `Button to send an event.
Pressing the button sends a message with a specified payload to a topic.
The button may contain an icon and/or a title string and is centered in the widget.
Icon names can be found at https://materialdesignicons.com.`,

  props: {
    enabled: { default: true },
    color: { default: "primary" },
    output_value: { default: 25, tip: "value sent on click" },
    icon: { default: null, tip: "material-design-icon name w/mdi- prefix" },
    title: { default: 'Button' },
  },

  output: { default: null },

  computed: {
    // actual bindings passed into v-btn
    bindings() { return {
      disabled: !this.enabled,
      color: this.color,
    }},

  },

  methods: {
    clickEv(ev) {
      this.$emit('send', this.output_value)
    },
  },

}
</script>

<style scoped>
.pushbutton { height: 100%; }
</style>
