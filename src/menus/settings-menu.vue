<!-- Settings icon and associated menu (top-right corner)
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-menu anchor="bottom end" origin="top end" v-model="settings_menu">
    <!-- Menu activator, i.e. the button -->
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props"><v-icon>mdi-cog</v-icon></v-btn>
    </template>
    <!-- Settings Menu -->
    <v-list density="compact" elevation="4" class="mt-1">
      <v-list-item>
        <v-switch v-model="global.editMode" hide-details inset color="primary" label="Edit">
        </v-switch>
      </v-list-item>
      <v-list-item>
        <v-switch hide-details inset color="primary" label="Dark"
                  true-value="flexdashDark" false-value="flexdashLight"
                  :modelValue="theme" @update:modelValue="$emit('update:theme', $event)">
        </v-switch>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
  
<script scoped>
export default {
  name: 'SettingsMenu',

  inject: [ 'global' ],

  props: {
    theme: null,
  },

  emits: [ 'update:theme' ],

  data() { return {
    settings_menu: false, // whether settings menu is open or not
  }},
}
</script>
