<!-- TitleEdit - Title bar with editable title text field and close button
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-card-title class="d-flex">
    <span>Edit {{what}}</span>
    <v-text-field hide-details single-line
                  class="ml-3 mt-0 flex-grow-1 compact-input large-font"
                  :model-value="title" placeholder="-no-title-" persistent-placeholder
                  @update:modelValue="$emit('update:title', $event)">
    </v-text-field>
    <v-spacer></v-spacer>
    <v-btn elevation=0 icon @click="$emit('close')"><v-icon icon="mdi-close" /></v-btn>
  </v-card-title>
</template>

<script scoped>

export default {
  name: 'TitleEdit',

  props: {
    title: { type: String, default: '' },
    what: { type: String, default: 'widget' },
  },

  emits: [ 'update:title', 'close' ],
}

</script>
