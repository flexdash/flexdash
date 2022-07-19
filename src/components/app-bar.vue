<!-- Top title + tab navigation bar
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-app-bar>

    <!-- Hamburger menu shown on smallest devices only -->
    <template v-slot:prepend v-if="ready && mobile">
      <v-app-bar-nav-icon @click="sidebar = !sidebar"></v-app-bar-nav-icon>
    </template>

    <!-- Title -->
    <v-app-bar-title class="text-h4 font-weight-bold text-high-emphasis mr-3"
                      style="font-variant: small-caps; flex: 0 0; min-width: auto;">
      {{ title }}
    </v-app-bar-title>

    <div class="version d-flex">alpha v{{version}}</div>

    <!-- Tabs -->
    <v-tabs stacked color="primary" v-if="ready && !mobile"
            style="min-width: 300px;" height="48"
            :modelValue="tab_ix" @update:modelValue="$emit('update:tab_ix', $event)">
      <v-tab v-for="(tid, ix) in dash_tabs" :key="tid" :value="ix" :id="'tab-'+tid">
        <!-- Text and icon for the tab -->
        <v-icon :size="tabs[tid].title?'default':'x-large'" class="mb-0" :icon="tabs[tid].icon" />
        {{tabs[tid].title}}
        <!-- Button and menu to edit tab properties -->
        <tab-edit v-if="global.editMode && ix==tab_ix"
                  :tab_ix="tab_ix" :tab_id="tab_id" :activator="'#tab-'+tid"
                  @update:tab_ix="$emit('update:tab_ix', $event)">
        </tab-edit>
      </v-tab>
      <!-- Button to add a tab -->
      <v-btn v-if="global.editMode && !global.noAddDelete" class="my-auto" id="tab-add"
              @click.stop="tab_add=!tab_add">
        <v-icon icon="mdi-plus" />
      </v-btn>
    </v-tabs>

    <v-spacer></v-spacer>

    <!-- Undo button -->
    <v-tooltip v-if="global.editMode" :disabled="!canUndo">
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props" :disabled="!canUndo" @click="$store.performUndo()">
          <v-icon>mdi-undo</v-icon>
        </v-btn>
      </template>
      <span>undo {{ canUndo && $store.undo.buf[$store.undo.buf.length-1].tagline }}</span>
    </v-tooltip>

    <!-- Connections icon and menu -->
    <connections @update:src="$emit('update:config_src', $event)" ></connections>

    <!-- Settings icon and menu at far right -->
    <settings-menu :theme="theme" @update:theme="$emit('update:theme', $event)" v-if="ready">
    </settings-menu>
  </v-app-bar>

  <!-- Navigation drawer opening from the left on small devices to show tabs -->
  <v-navigation-drawer v-model="sidebar" app floating v-if="ready && mobile">
    <v-tabs direction="vertical" color="primary" slider-size="6" v-model="tab_ix">
      <v-tab v-for="t in dash_tabs" :key="t" class="ml-0 mr-auto px-0" style="min-width: auto">
        <v-icon large class="mx-1" :icon="tabs[t].icon" />
        <span class="mr-1">{{tabs[t].title}}</span>
      </v-tab>
    </v-tabs>
  </v-navigation-drawer>

  <!-- Menu for tab addition-->
  <v-menu v-model="tab_add" anchor="bottom center" origin="top center" allow-overflow
          class="mt-1" activator="#tab-add">
    <v-list>
      <v-list-item @click="addTab('grid')">Grids & Widgets</v-list-item>
      <v-list-item @click="addTab('iframe')">IFrame</v-list-item>
    </v-list>
  </v-menu>
</template>
  
<style>
/* Remove some excessive padding at left&right, especially for small devices */
.v-app-bar > .v-toolbar__content { padding: 0px 0px !important; }
/* Fix height of tabs to match app bar */
.v-app-bar button.v-tab { height: 48px !important; }
</style>

<style scoped>
.version {
  position: absolute; top: 0px; right: 14px; z-index: 2;
  font-size: 9pt; font-weight: 700; color: #e5504d;
  line-height: 10pt;
}
</style>

<script scoped>
import { useDisplay } from 'vuetify'
import Connections from '/src/components/connections.vue'
import SettingsMenu from '/src/menus/settings-menu.vue'
import TabEdit from '/src/edit-panels/tab-edit.vue'

export default {
  name: 'AppBar',

  components: { Connections, SettingsMenu, TabEdit },
  inject: [ '$config', '$store', 'global' ],

  setup(props) {
    const { mobile } = useDisplay() // mobile depends on breakpoint set in vuetify.js
    return { mobile }
  },

  props: {
    ready: false, // set to true when the app is ready to be displayed
    title: { type: String, default: "FlexDash" },
    tab_ix: null, // which tab we're on
    theme: { type: String, default: "" },
  },

  emits: [ 'update:tab_ix', 'update:theme', 'update:config_src' ],

  data() { return {
    sidebar: false, // initially disabled
    tab_add: false, // turns add-a-tab menu on/off

    version: import.meta.env.PACKAGE_VERSION || "DEV",
  }},

  computed: {
    dash() { return this.$config.dash },
    dash_tabs() { return this.dash?.tabs.filter(id=>id.startsWith('t')) || [] }, // IDs of tabs to show, handling init
    tab_id() { return this.tab_ix >= 0 ? this.dash_tabs[this.tab_ix] : "" }, // current tab ID
    tabs() { return this.$config.tabs },
    tab() { return this.tab_id ? this.tabs[this.tab_id] : {} },
    canUndo() { return this.$store.undo.buf.length > 0 },
  },

  methods: {
    // handle buttons for tab editing
    addTab(kind) {
      this.tab_add = false // close-on-content-click in v-menu not implemented yet (!@#$%^)
      this.$emit('update:tab_ix', this.$store.addTab(kind))
    },
  },

}
</script>
