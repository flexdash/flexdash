<!-- WidgetEdit - Wrapper around actual widget components providing editing functionality for
     modifying the bindings.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

     WidgetEdit provides a floating card extension with controls to edit the widget's bindings.
     The set of available properties are detected by inspecting the component, specifically,
     the definition of its props.

     Currently editing is a bit spread out over the grid, widget-wrapper and this component.
     The widget-wrapper has the edit button and the grid has the ultimate control.
-->

<template>
  <!-- without div the v-for in parent gets confused by v-menu -->
  <div :style="widgetStyle">
    <!-- v-menu is used to display a floating v-card below the component for editing
         We control the activation and deactivation of the menu ourselves, though. -->
    <v-menu :value="edit_active" offset-y content-class="popup-spacer"
            :close-on-content-click="false" :close-on-click="false">

      <!-- Widget proper -->
      <template v-slot:activator="on">
        <widget-wrap :config="config" :suppressOutput="suppressOutput"
                     @edit="$emit('edit', $event)"
                     :color="edit_active?'highlight':''" :shutup="on">
        </widget-wrap>
      </template>

      <!-- Editing panel shown floating below widget -->
      <v-card color="panel">
        <v-card-title>
          <span>Edit {{config.kind}} widget</span>
          <v-text-field label="title" dense prefix='"' suffix='"' class="ml-3"
                        :value="config.static['title']">
          </v-text-field>
          <v-spacer></v-spacer>
          <v-btn elevation=0 icon @click="$emit('edit','cancel')">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text v-if="edit_active"><!-- v-if 'cause edited_xx vars not always set -->
          <v-container fluid>
            <!-- Display component properties for editing -->
            <v-row align="center">
              <!--v-col class="d-flex" cols="12">
                Widget properties: {{editProps.join(", ")}}
              </v-col-->
              <!-- For each property of the component, show a combobox to select what gets bound -->
              <v-col class="d-flex" cols="12" sm="6" md="4" v-for="prop in edit_props" :key=prop>
                <v-text-field v-if="prop_types[prop]==0"
                    :label="prop" dense prefix='"' suffix='"'
                    :value="config.static[prop]">
                </v-text-field>
                <v-text-field v-if="prop_types[prop]==1"
                    :label="prop" type="number" dense
                    :value="config.static[prop]">
                </v-text-field>
                <v-combobox v-if="prop_types[prop]==2"
                    :label="prop" clearable dense persistent-hint
                    hint='server state variable name or dot-separated path'
                    :items="sdKeys"
                    :value="config.dynamic[prop]">
                </v-combobox>
                <v-btn-toggle mandatory class="ml-2 mt-3"
                              v-model="prop_types[prop]">
                  <v-btn x-small icon class="pa-0"><v-icon>mdi-format-color-text</v-icon></v-btn>
                  <v-btn x-small icon class="pa-0"><v-icon>mdi-numeric</v-icon></v-btn>
                  <v-btn x-small icon class="pa-0"><v-icon>mdi-link-variant</v-icon></v-btn>
                </v-btn-toggle>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>

    </v-menu>
  </div>
</template>

<script scoped>

import WidgetWrap from '/src/components/widget-wrap'

export default {
  name: 'WidgetEdit',

  components: { WidgetWrap },

  model: { prop: 'config', event: 'change' },

  props: {
    config: { type: Object, required: true },
    edit_active: { type: Boolean, default: false }, // edit panel is open
  },

  data() { return {
    watchers: [], // list of watchers used in bindings so we can remove them
    suppressOutput: true,
  }},

  computed: {
    // list of keys from this.$sd to show in editing combobox
    sdKeys() { return Object.keys(this.$sd).sort() },

    // list of child prop names for editing, excluding title
    edit_props() {
      const cp = Object.keys(this.child_props)
      return cp.filter(p => p !== 'title').sort()
    },

    // type of all the props, 0=text, 1=number, 2=dynamic
    prop_types() {
      return Object.fromEntries(this.edit_props.map(p => [p, 0]))
    },

    // child_props holds a description of the properties of the child component, this is used to
    // convert types and raise warning messages. (Note that this is not reactive in the component
    // definition.)
    child_props() {
      const p = window.widgetPalette
      if (this.config.kind in p) return p[this.config.kind].props || {}
      return {}
    },

    // style attribute for widget
    widgetStyle() {
      const row = `grid-row-start: span ${this.config.rows||1}`
      const col = `grid-column-start: span ${this.config.cols||1}`
      return `${row}; ${col};`
    },

  },

}

</script>

<style scoped>
.popup-spacer { margin-top: 3px; margin-bottom: 3px; }
.v-input__append-outer { margin-left: 0px !important; }
</style>
