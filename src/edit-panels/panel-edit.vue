<!-- PanelEdit - Wrapper around panel components providing editing functionality.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <!-- without div the v-for in parent gets confused by v-menu -->
  <div class="panel-edit" :style="widgetStyle">
    <!-- Panel proper inside a widget-wrap -->
    <widget-wrap :config="widget" @edit="toggleEdit" :color="color">
    </widget-wrap>
    
    <!-- v-overlay is used to display a floating v-card below the component for editing
         We control the activation and deactivation of the menu ourselves, though. -->
    <v-overlay :model-value="edit_active" width="90%" absolute class="panel-edit"
               allow-overflow :scrim="false" @click:outside="endEdit">
      <v-defaults-provider :defaults="{global: {density: 'compact'}}">

        <!-- Editing panel shown floating below panel -->
        <v-card color="panel" class='mt-1'>
          <!-- title and close button -->
          <title-edit what="panel" class="mt-1" :title="widget.static['title']"
                      @close="endEdit"
                      @update:title="handleTitleEdit($event)">
          </title-edit>

          <!-- Display panel help text -->
          <help-edit :text="child_help"></help-edit>

          <!-- toolbar with delete move, resize, etc -->
          <widget-edit-toolbar :widget_id="widget_id" kind="panel"
                               @delete="$emit('delete')"  @clone="$emit('clone')"
                               @move="dir=>$emit('move', dir)" @changeSolid="changeSolid"
                               @teleport="(src, dst)=>$emit('teleport', src, dst)">
          </widget-edit-toolbar>

        </v-card>
      </v-defaults-provider>
    </v-overlay>
  </div>
</template>

<style>
.xxpanel-edit .w-edit > .v-input__append-outer { margin-left: 4px !important; }
.xxpanel-edit-dialog .v-input.height100 div { height: 100% !important; }
div.panel-edit { max-width: 100%; }
</style>

<script scoped>

import WidgetWrap from '/src/components/widget-wrap.vue'
import WidgetEditToolbar from '/src/edit-panels/widget-edit-toolbar.vue'
import TitleEdit from '/src/edit-panels/title-edit.vue'
import HelpEdit from '/src/edit-panels/help-edit.vue'
import PropEdit from '/src/edit-panels/prop-edit.vue'
import md from '/src/components/md.vue'

export default {
  name: 'PanelEdit',

  components: { WidgetWrap, WidgetEditToolbar, TitleEdit, HelpEdit, PropEdit, md },
  inject: [ '$store', 'palette' ],

  props: {
    widget_id: { type: String, required: true }, // my widget ID
    edit_active: { type: Boolean, default: false }, // we're being edited
    no_border: { type: Boolean, default: false }, // not used here...
  },

  emits: [ 'move', 'teleport', 'delete', 'clone' ],

  data() { return {
    edit_help: false, // more... help text expansion toggle
  }},

  created() {
    console.log("Created panel", this.widget_id)
    // ensure the panel widget has a widgets array property
    const p = this.$store.widgetByID(this.widget_id)
    if (!('widgets' in p.static)) {
      this.$store.updateWidgetProp(this.widget_id, 'static', 'widgets', [])
    }
  },

  computed: {
    // handle a non-vue-standard "help" option in a widget
    child_help() {
      const p = this.palette.widgets
      if (this.widget.kind in p) return p[this.widget.kind].help
      return undefined
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

    widget() { return this.$store.widgetByID(this.widget_id) },
  },

  methods: {
    // toggle edit handles the edit event from the child component
    toggleEdit() { this.$emit('edit', !this.edit_active) },
    // cancel button in edit panel
    endEdit() { this.$emit('edit', false) },

    handleTitleEdit(value) {
      this.$store.updateWidgetProp(this.widget_id, 'static', 'title', value)
    },

    changeSolid(value) {
      this.$store.updateWidgetProp(this.widget_id, 'static', 'solid', value)
    },

  },
}

</script>