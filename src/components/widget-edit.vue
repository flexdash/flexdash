<!-- WidgetEdit - Wrapper around actual widget components providing editing functionality for
     modifying the bindings.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

     WidgetEdit provides a floating card extension with controls to edit the widget's bindings.
     The set of available properties are detected by inspecting the component, specifically,
     the definition of its props.

     Currently editing is a bit spread out over the grid, widget-wrapper and this component.
     The widget-wrapper has the edit button and the grid has the ultimate control.

     FIXME: This component should be refactored. Each type of input should become its own
     component that gets plopped down into the grid and fed its specific config as a model.
     This way the long validation and type switcharoo gets broken up. Maybe in the end the two
     widget-xxx components can be merged again... All this would also allow the editing components
     to be reused in other parts of the dashboard.
-->

<template>
  <!-- without div the v-for in parent gets confused by v-menu -->
  <div :style="widgetStyle">
    <!-- v-menu is used to display a floating v-card below the component for editing
         We control the activation and deactivation of the menu ourselves, though. -->
    <v-menu :value="edit_active && reposition" offset-y content-class="popup-spacer"
            :close-on-content-click="false" :close-on-click="false">

      <!-- Widget proper -->
      <template v-slot:activator="on">
        <widget-wrap :config="widget" :suppressOutput="suppressOutput" @edit="toggleEdit"
                     :color="edit_active?'highlight':''" :not-used="on">
        </widget-wrap>
      </template>

      <!-- Editing panel shown floating below widget -->
      <v-card color="panel">
        <v-card-title class="d-flex align-baseline">
          <span>Edit {{widget.kind}} widget</span>
          <v-text-field dense prefix='"' suffix='"' class="ml-3 mt-0 text-h6 flex-grow-0"
                        :value="widget.static['title']" :hide-details="true"
                        @input="handleEdit('static', 'title', $event)">
          </v-text-field>
          <v-spacer></v-spacer>
          <v-btn elevation=0 icon @click="endEdit">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text v-if="edit_active"><!-- v-if 'cause edited_xx vars not always set -->
          <v-container fluid>
            <!-- Display row with delete button, move buttons, and resize controls -->
            <v-row align="center">
              <v-col class="d-flex" cols="4">
                <!-- delete widget -->
                <v-btn small @click="$emit('delete')">Delete widget</v-btn>
              </v-col>
              <v-col class="d-flex" cols="4">
                <!-- move widget up/down -->
                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-btn small icon @click="moveWidget(-1)" class="ml-2" v-on="on">
                      <v-icon>mdi-arrow-up-bold</v-icon></v-btn>
                  </template>
                  <span>Move widget towards the top-left of the grid</span>
                </v-tooltip>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-btn small icon @click="moveWidget(1)" v-on="on">
                      <v-icon>mdi-arrow-down-bold</v-icon></v-btn>
                  </template>
                  <span>Move widget towards the bottom-right of the grid</span>
                </v-tooltip>
              </v-col>
              <v-col class="d-flex" cols="4">
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

            <!-- Display component properties for editing -->
            <v-row align="center">
              <!-- For each property of the component, show a combobox to select what gets bound -->
              <v-col class="d-flex" cols="12" sm="6" md="4" v-for="prop in edit_props" :key=prop>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn-toggle mandatory dense v-model="prop_static[prop]" class="mt-2 mr-1"
                                  background-color="rgba(0,0,0,0)" color="primary">
                      <v-btn x-small icon v-bind="attrs" v-on="on">
                        <v-icon>mdi-link-variant</v-icon></v-btn>
                      <v-btn x-small icon v-bind="attrs" v-on="on">
                        <v-icon>{{prop_info[prop].icon}}</v-icon></v-btn>
                    </v-btn-toggle>
                  </template>
                  <span>Toggle dynamic link vs. literal value</span>
                </v-tooltip>
                <!-- dynamic link -->
                <v-combobox v-if="!prop_static[prop]"
                    :label="prop" clearable dense persistent-hint
                    hint='variable pathname (/-sep)'
                    :items="sdKeys"
                    :value="widget.dynamic[prop]"
                    @input="handleEdit('dynamic', prop, $event)">
                </v-combobox>
                <!-- number -->
                <v-text-field v-else-if="prop_info[prop].type === Number"
                    :label="prop" type="number" dense
                    :hint="prop_info[prop].hint"
                    :value="propVal(prop)"
                    @input="handleEdit('static', prop, $event)">
                </v-text-field>
                <!-- boolean -->
                <v-switch v-else-if="prop_info[prop].type === Boolean"
                    :label="prop" class="mt-0 ml-2"
                    :hint="prop_info[prop].hint"
                    :input-value="propVal(prop)"
                    @change="handleEdit('static', prop, $event)">
                </v-switch>
                <!-- array -->
                <v-text-field v-else-if="prop_info[prop].type === Array"
                    :label="prop" dense
                    :value="widget.static[prop]||prop_info[prop].default"
                    @input="handleEdit('static', prop, $event)">
                </v-text-field>
                <!-- object -->
                <v-text-field v-else-if="prop_info[prop].type === Object"
                    :label="prop" dense
                    :hint="prop_info[prop].hint"
                    :value="widget.static[prop]||prop_info[prop].default"
                    @input="handleEdit('static', prop, $event)">
                </v-text-field>
                <!-- string -->
                <v-text-field v-else
                    :label="prop" dense
                    :hint="prop_info[prop].hint"
                    :value="widget.static[prop]||prop_info[prop].default"
                    @input="handleEdit('static', prop, $event)">
                </v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>

    </v-menu>
  </div>
</template>

<script scoped>

import WidgetWrap from '@/components/widget-wrap'

export default {
  name: 'WidgetEdit',

  components: { WidgetWrap },
  inject: [ '$store' ],

  props: {
    id: { type: String, required: true }, // my widget ID
    grid_id: { type: String, require: true }, // the grid this widget is in
    edit_active: { type: Boolean, default: false }, // we're being edited
  },

  data() { return {
    suppressOutput: true,
    prop_static: {}, // manual toggle between static and dynamic binding
    saved_widget: null, // widget props for revert function
    // hack to reposition the edit window when changing widget shape/position, this will go
    // away once we have dragging...
    reposition: true,
  }},

  computed: {
    // this widget's configuration
    widget() { return this.$store.widgetByID(this.id) },

    // list of keys from store.sd to show in editing combobox
    sdKeys() { return Object.keys(this.$store.sd).sort() },

    // list of child prop names for editing, excluding title
    edit_props() {
      const cp = Object.keys(this.child_props)
      return cp.filter(p => p !== 'title').sort()
    },

    // collect info for all the properties via introspection and massage
    // returns {name:{type, default, validator, hint, icon},...}
    // prop types: String, Number, Boolean, Array, Object, Date //, Function, Symbol
    prop_info() {
      const icons = { String: 'mdi-format-quote-close', Number: 'mdi-numeric',
          Boolean: 'mdi-yin-yang', Array: "mdi-code-brackets", Object: "mdi-code-braces" }
      let pi = {}
      const cp = this.child_props
      for (let name in cp) {
        let type = cp[name].type || String
        if (![String, Number, Boolean, Array, Object].includes(type)) type = String
        let hint = type.name
        if (cp[name].default !== undefined) hint += `, default: ${cp[name].default}`
        let icon = icons[type.name]
        pi[name] = {type, default: cp[name].default, validator: cp[name].validator,
                    hint, icon}
      }
      return pi
    },

    // child_props holds a description of the properties of the child component, this is used to
    // convert types and raise warning messages. (Note that this is not reactive in the component
    // definition.)
    child_props() {
      const p = window.widgetPalette
      if (this.widget.kind in p) return p[this.widget.kind].props || {}
      return {}
    },

    // style attribute for widget to determine size
    widgetStyle() {
      const row = `grid-row-start: span ${this.widget.rows||1}`
      const col = `grid-column-start: span ${this.widget.cols||1}`
      return `${row}; ${col};`
    },

  },

  watch: {
    edit_active(val) {
      if (val) {
        this.saved_widget = this.widget
        // set the dynamic/static toggles according to what's in the config.
        // Afterwards they're controlled by the user.
        let self = this
        this.prop_static = Object.fromEntries(
          // if prop in config.dynamic then 0 (not static) else 1 (static)
          Object.keys(self.child_props).map(p => [p, 1 - (p in self.widget.dynamic)])
        )
      } else {
        this.saved_widget = null
      }
    }
  },

  methods: {
    // value of a property: either config if set, else default
    propVal(prop) {
      if (this.widget.static[prop] !== undefined) return this.widget.static[prop]
      else return this.prop_info[prop].default
    },

    // toggle edit handles the edit event from the child component
    toggleEdit() { this.$emit('edit', !this.edit_active) },
    // cancel button in edit panel
    endEdit() { this.$emit('edit', false) },

    handleEdit(which, prop, value) {
      //console.log("edit:", which, prop, value)
      if (!(which in this.widget)) return
      if (!(prop in this.child_props) && prop != 'title') return

      // handle Number coming in as String
      if (this.child_props[prop].type === Number && typeof value === 'string') {
        value = Number.parseFloat(value)
      }

      this.$store.updateWidgetProp(this.id, which, prop, value)
    },

    // adjust number of rows spanned by widget (dir=-1/+1)
    adjustRows(dir) {
      const w = this.widget
      w.rows = (w.rows||1) + dir
      if (w.rows < 1) w.rows = 1
      if (w.rows > 16) w.rows = 16
      // reposition the edit window
      this.reposition = false; this.$nextTick(() => {this.reposition = true})
    },

    // adjust number of cols spanned by widget (dir=-1/+1)
    adjustCols(dir) {
      const w = this.widget
      w.cols = (w.cols||1) + dir
      if (w.cols < 1) w.cols = 1
      if (w.cols > 16) w.cols = 16
      this.reposition = false; this.$nextTick(() => {this.reposition = true})
    },

    moveWidget(dir) {
      this.$emit('move', dir)
      this.reposition = false; this.$nextTick(() => {this.reposition = true})
    },

  },

}

</script>

<style scoped>
.popup-spacer { margin-top: 3px; margin-bottom: 3px; }
.v-input__append-outer { margin-left: 0px !important; }
</style>
