<!-- Top title + tab navigation bar
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
    <v-app-bar app>

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
              :modelValue="tab_ix" @update:modelValue="$emit('update:tab_ix', $event)">
        <v-tab v-for="(tid, ix) in dash_tabs" :key="tid" :value="ix" :id="'tab-'+tid">
          <!-- Text and icon for the tab -->
          <v-icon :size="tabs[tid].title?'default':'x-large'" class="mb-0">mdi-{{tabs[tid].icon}}</v-icon>
          {{tabs[tid].title}}
          <!-- Button and menu to edit tab properties -->
          <tab-edit :tab_ix="tab_ix" :tab_id="tab_id" v-if="global.editMode && ix==tab_ix"
                    :activator="'#tab-'+tid">
          </tab-edit>
        </v-tab>
        <!-- Button to add a tab -->
        <v-btn v-if="global.editMode" class="my-auto" id="tab-add"
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
          <v-icon large class="mx-1">mdi-{{tabs[t].icon}}</v-icon>
          <span class="mr-1">{{tabs[t].title}}</span>
        </v-tab>
      </v-tabs>
    </v-navigation-drawer>

    <!-- Menu for tab addition-->
    <v-menu v-model="tab_add" anchor="bottom center" origin="top center" allow-overflow
            class="mt-1" activator="#tab-add">
      <v-list>
        <v-list-item @click="addTab('grid')">Grid with Widgets</v-list-item>
        <v-list-item @click="addTab('iframe')">IFrame</v-list-item>
      </v-list>
    </v-menu>


</template>
  
<style>
/* Remove some excessive padding at left&right, especially for small devices */
.v-app-bar > .v-toolbar__content { padding: 0px 0px !important; }

/* fix height of tabs, https://github.com/vuetifyjs/vuetify/issues/14863 */
.xv-app-bar button.v-tab { height: 48px }
.xv-app-bar .v-tabs--stacked { height: 48px !important }

/* Make tabs fit between title on the left and buttons on the right, why is this so hard? */
.xxxv-app-bar .v-tabs { overflow: auto }

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

  // Quick recap of config structure:
  // this.dash_tabs := $config.dash.tabs: array of tab IDs, e.g. t00001, t10105, ...
  // this.tab_ix := index into this.dash_tabs for the currently selected tab
  // this.tabs := $config.tabs: array of tab objects
  // this.tab := $config.tabs[tab_id]: config for the specific tab

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

    version: import.meta.env.PACKAGE_VERSION,
  }},

  computed: {
    dash() { return this.$config.dash },
    dash_tabs() { return this.dash?.tabs || [] }, // IDs of tabs to show, handling init
    tab_id() { return this.tab_ix >= 0 ? this.dash_tabs[this.tab_ix] : "" }, // current tab ID
    tabs() { return this.$config.tabs },
    tab() { return this.tab_id ? this.tabs[this.tab_id] : {} },
    canUndo() { return this.$store.undo.buf.length > 0 },
  },

  watch: {
    // ensure the current tab exists
    tabs(tt) { if (this.tab_ix >= tt.length) this.tab_ix = tt.length-1 },
  },

  methods: {
    // handle buttons for tab editing
    addTab(kind) {
      const tab_ix = this.$store.addTab(kind)
      this.$nextTick(() => {
        this.tab_ix = tab_ix
        this.tab_edit = true // switch to editing the new tab
      })
    },
  },

}
</script>