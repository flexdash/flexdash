<!-- PushButton - Simple button that sends a message when clicked
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div class="popupbutton d-flex align-center justify-center">
    <v-btn large dense class="ma-auto" max-width="95%" v-bind="bindings" @click="clickEv">
      <v-icon :large="!title"  v-if="icon">mdi-{{icon}}</v-icon> <span>{{ title }}</span>
    </v-btn>

    <!-- dialog box to view the widget's pop-up text full-page -->
    <v-dialog v-model="show_popup" width="80%" max-width="100ex">
      <v-card class="d-flex flex-column height100">
        <v-card-title class="d-flex align-baseline width100">
          <span>{{title || "Information"}}</span>
          <v-spacer></v-spacer>
          <v-btn elevation=0 icon @click="show_popup=false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="flex-grow-1">
          <md class="pt-1" style="width:100%">{{text}}</md>
        </v-card-text>
      </v-card>
    </v-dialog>

  </div>
</template>

<script scoped>
import md from '/src/components/md.vue'

export default {
  name: 'PopupButton',

  components: { md },

  help: `Button to pop-up a mardown text panel.
Pressing the button pops-up a mardown panel, useful for help or other information.
The button may contain an icon and/or a title string and is centered in the widget.`,

  props: {
    enabled: { default: true },
    color: { default: "primary" },
    text: { default: "", tip: "markdown text to show in pop-up" },
    icon: { default: null, tip: "material-design-icon name" },
    title: { default: 'Info' },
  },

  data() { return {
    show_popup: false,
  }},

  computed: {
    // actual bindings passed into v-btn
    bindings() { return {
      disabled: !this.enabled,
      color: this.color,
    }},
  },

  methods: {
    clickEv(ev) { this.show_popup = !this.show_popup }
  },

}
</script>

<style scoped>
.popupbutton { height: 100%; }
</style>
