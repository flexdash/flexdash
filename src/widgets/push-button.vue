<!-- PushButton - Simple button that sends a message when clicked
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div class="pushbutton d-flex align-center justify-center">
    <v-tooltip top :open-on-hover="!!tooltip">
      <template v-slot:activator="{ on, attrs }">
        <v-btn large dense class="ma-auto" max-width="95%"
               v-bind="Object.assign(bindings, attrs)" v-on="on" @click="clickEv($event)">
          <v-icon :large="!title"  v-if="icon">mdi-{{icon}}</v-icon> <span>{{ title }}</span>
        </v-btn>
      </template>
      <span v-if="tooltip">{{ tooltip }}</span>
    </v-tooltip>
  </div>
</template>

<script scoped>
export default {
  name: 'PushButton',

  help: `Button to send an event.
Pressing the button sends a message with a specified payload to a topic.
The button may contain an icon and/or a title string and is centered in the widget.`,

  props: {
    enabled: { default: true },
    color: { default: "primary" },
    output_value: { default: 25, tip: "value sent on click" },
    icon: { default: null, tip: "material-design-icon name" },
    title: { default: 'Button' },
    tooltip: { default: null, tip: "tooltip to show on hover" },
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
      console.log("PushButton event:", ev)
      this.$emit('send', this.output_value)
    },
  },

}
</script>

<style scoped>
.pushbutton { height: 100%; }
</style>
