<!-- PanelEdit - Wrapper around panel components providing editing functionality.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <!-- without div the v-for in parent gets confused by v-menu -->
  <div class="panel-edit" :style="widgetStyle">
    <!-- v-menu is used to display a floating v-card above the component for editing
         We control the activation and deactivation of the menu ourselves, though. -->
    <v-menu :value="edit_active && reposition" offset-y allow-overflow min-width="80%"
            content-class="popup-spacer"
            :close-on-content-click="false" :close-on-click="false">

      <!-- Panel proper inside a widget-wrap -->
      <template v-slot:activator="on">
        <widget-wrap :config="widget"
                     @edit="toggleEdit" :color="color" :not-used="on">
        </widget-wrap>
      </template>

      <!-- Editing panel shown floating below widget -->
      <v-card color="panel">
        <v-card-title class="d-flex align-baseline pb-6">
          <span>Edit {{widget.kind}} Panel</span>
          <v-text-field dense class="ml-3 mt-0 text-h6 flex-grow-0"
                        :value="widget.static['title']" :hide-details="true"
                        @input="handleTitleEdit($event)">
          </v-text-field>
          <v-spacer></v-spacer>
          <v-btn elevation=0 icon @click="endEdit">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <!-- Display widget help text -->
        <v-card-text v-if="child_help" class="pb-0">
          <h3 v-if="child_help_title">{{child_help_title}}
            <v-btn x-small text class="ml-1" v-if="child_help_text"
                   :value="edit_help" @click="edit_help=!edit_help">
              {{ edit_help ? "less..." : "more..." }}</v-btn>
          </h3>
          <md v-if="edit_help">{{child_help_text}}</md>
        </v-card-text>

        <v-card-text v-if="edit_active"><!-- v-if 'cause edited_xx vars not always set -->
          <v-container fluid class="pa-0">
            <!-- Display row with delete button, move buttons, and resize controls -->
            <v-row align="center">
              <v-col class="d-flex" cols="4" sm="4">
                <!-- delete panel -->
                <v-btn small @click="$emit('delete')">Delete panel</v-btn>
              </v-col>
              <v-col class="d-flex" cols="8" sm="2" md="4">
                <!-- switch between solid vs grid -->
                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-switch dense flat hide-details label="solid" class="mt-0 mr-3" v-on="on"
                        :input-value="widget.static.solid" @change="changeSolid">
                    </v-switch>
                  </template>
                  <span>Solid panel background vs transparent panel</span>
                </v-tooltip>
                <!-- clone panel -->
                <v-btn small @click="$emit('clone')">Clone</v-btn>
                <!-- move panel up/down -->
                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-btn small icon @click="moveWidget(-1)" class="ml-2" v-on="on">
                      <v-icon>mdi-arrow-up-bold</v-icon></v-btn>
                  </template>
                  <span>Move panel towards the top-left of the grid</span>
                </v-tooltip>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-btn small icon @click="moveWidget(1)" v-on="on">
                      <v-icon>mdi-arrow-down-bold</v-icon></v-btn>
                  </template>
                  <span>Move panel towards the bottom-right of the grid</span>
                </v-tooltip>
              </v-col>
              <v-col class="d-flex" cols="12" sm="6" md="4">
                <!-- adjust widget rows -->
                <v-btn small icon @click="adjustRows(-1)" class="ml-2">
                  <v-icon>mdi-minus</v-icon></v-btn>
                <v-chip small>{{widget.rows}} row{{widget.rows > 1?'s':''}}</v-chip>
                <v-btn small icon @click="adjustRows(1)">
                  <v-icon>mdi-plus</v-icon></v-btn>
                <!-- adjust widget columns -->
                <v-btn small icon @click="adjustCols(-1)" class="ml-2">
                  <v-icon>mdi-minus</v-icon></v-btn>
                <v-chip small>{{widget.cols}} col{{widget.cols > 1 ? 's' : ''}}</v-chip>
                <v-btn small icon @click="adjustCols(1)">
                  <v-icon>mdi-plus</v-icon></v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-menu>
  </div>
</template>

<style>
.panel-edit .popup-spacer { margin-top: 3px; margin-bottom: 3px; }
.panel-edit .w-edit > .v-input__append-outer { margin-left: 4px !important; }
.panel-edit-dialog .v-input.height100 div { height: 100% !important; } 
</style>

<script scoped>

import WidgetWrap from '/src/components/widget-wrap.vue'
import md from '/src/components/md.vue'

export default {
  name: 'PanelEdit',

  components: { WidgetWrap, md },
  inject: [ '$store', 'palette' ],

  props: {
    id: { type: String, required: true }, // my widget ID
    edit_active: { type: Boolean, default: false }, // we're being edited
  },

  data() { return {
    // hack to reposition the edit window when changing widget shape/position, this will go
    // away once we have dragging...
    reposition: true,
    edit_help: false, // more... help text expansion toggle
  }},

  created() {
    console.log("Created panel", this.id)
    // ensure the panel widget has a widgets array property
    const p = this.$store.widgetByID(this.id)
    if (!('widgets' in p.static)) {
      this.$store.updateWidgetProp(this.id, 'static', 'widgets', [])
    }
  },

  computed: {
    // handle a non-vue-standard "help" option in a widget
    child_help() {
      const p = this.palette.widgets
      if (this.widget.kind in p) return p[this.widget.kind].help
      return undefined
    },
    child_help_title() {
      return this.child_help ? this.child_help.replace(/[.\n].*/s, "") : null
    },
    child_help_text() {
      return this.child_help ? this.child_help.replace(/^.*?[.\n]\s/s, "") : null
    },

    // style attribute for widget to determine size
    widgetStyle() {
      // note: if rows/cols don't exist when the widget is created the widgetStyle will not
      // recompute in Vue2
      const row = `grid-row-start: span ${this.widget.rows||1}`
      const col = `grid-column-start: span ${this.widget.cols||1}`
      return `${row}; ${col};`
    },

    // panel background color
    color() { return this.edit_active ? 'highlight' : this.solid ? '' : '#0000' },

    widget() { return this.$store.widgetByID(this.id) },
  },

  methods: {
    // toggle edit handles the edit event from the child component
    toggleEdit() { this.$emit('edit', !this.edit_active) },
    // cancel button in edit panel
    endEdit() { this.$emit('edit', false) },

    handleTitleEdit(value) {
      this.$store.updateWidgetProp(this.id, 'static', 'title', value)
    },

    // adjust number of rows spanned by widget (dir=-1/+1)
    adjustRows(dir) {
      const w = this.widget
      let r = (w.rows||1) + dir
      if (r < 1) r = 1
      if (r > 16) r = 16
      this.$store.updateWidget(this.id, {rows: r})
      // reposition the edit window
      this.reposition = false; this.$nextTick(() => {this.reposition = true})
    },

    // adjust number of cols spanned by widget (dir=-1/+1)
    adjustCols(dir) {
      const w = this.widget
      let c = (w.cols||1) + dir
      if (c < 1) c = 1
      if (c > 16) c = 16
      this.$store.updateWidget(this.id, {cols: c})
      this.reposition = false; this.$nextTick(() => {this.reposition = true})
    },

    moveWidget(dir) {
      this.$emit('move', dir)
      this.reposition = false; this.$nextTick(() => {this.reposition = true})
    },

    changeSolid(value) {
      this.$store.updateWidgetProp(this.id, 'static', 'solid', value)
    },

  },
}

</script>
