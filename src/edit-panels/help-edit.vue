<!-- HelpEdit - Display help text in an edit panel
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-card-text v-if="text" class="pb-3">
    <h3 v-if="help_title">{{help_title}}
      <v-btn size="small" text class="ml-1" v-if="help_text"
             @click="edit_help=!edit_help">
        {{ edit_help ? "less..." : "more..." }}</v-btn>
    </h3>
    <md v-if="edit_help">{{help_text}}</md>
  </v-card-text>
</template>

<script scoped>

import md from '/src/components/md.vue'

export default {
  name: 'HelpEdit',

  components: { md },

  props: {
    text: { type: String, default: '' },
  },

  emits: [ ],

  data() { return {
    edit_help: false, // more... help text expansion toggle
  }},

  computed: {
    help_title() {
      return this.text ? this.text.replace(/[.\n].*/s, "") : null
    },
    help_text() {
      return this.text ? this.text.replace(/^.*?[.\n]\s/s, "") : null
    },

  },

}
</script>
