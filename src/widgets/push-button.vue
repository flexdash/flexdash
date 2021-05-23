<!-- PushButton - Simple button that sends a message when clicked
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div class="pushbutton d-flex">
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

  props: {
    enabled: { default: true },
    color: { default: "primary" },
    output_value: { default: 25 },
    icon: { default: null },
    title: { default: 'Button' },
    tooltip: { default: null },
  },

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
