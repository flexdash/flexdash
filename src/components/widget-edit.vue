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
  <div class="widget-edit" :style="widgetStyle">
    <!-- Widget proper -->
    <widget-wrap :config="widget" :no_border="no_border" :id='id'
                  @edit="toggleEdit" :color="edit_active?'highlight':''">
    </widget-wrap>

    <!-- v-menu is used to display a floating v-card below the component for editing
         We control the activation and deactivation of the menu ourselves, though. -->
    <v-menu :model-value="edit_active && reposition" class='mt-1'
            :activator="'#'+id" anchor="bottom" origin="top" min-width="80%"
            :close-on-content-click="false" :close-on-click="false">

      <!-- Editing panel shown floating below widget -->
      <v-card color="panel">
        <v-card-title class="d-flex pb-6">
          <span>Edit {{widget.kind}} widget</span>
          <v-text-field hide-details class="ml-3 mt-0 text-h6 flex-grow-1"
                        :model-value="widget.static['title']" density="compact"
                        @input="handleEdit('static', 'title', $event)">
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
              <v-col class="d-flex" cols="6" sm="4">
                <!-- delete widget -->
                <v-btn small @click="$emit('delete')">Delete widget</v-btn>
              </v-col>
              <v-col class="d-flex" cols="6" sm="2">
                <!-- copy widget -->
                <!--v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-btn small icon @click="copyWidget" v-on="on">
                      <v-icon>mdi-content-copy</v-icon></v-btn>
                  </template>
                  <span>Copy widget to clipboard</span>
                </v-tooltip-->
                <!-- move widget -->
                <!--v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-btn small icon @click="moveWidget" v-on="on">
                      <v-icon>mdi-folder-move</v-icon></v-btn>
                  </template>
                  <span>Move widget to a different tab or a panel</span>
                </v-tooltip-->
                <widget-move :id="id" @move="teleport"></widget-move>
                <!-- clone widget -->
                <v-tooltip bottom>
                  <template v-slot:activator="{ props }">
                    <v-btn small icon @click="$emit('clone')" v-bind="props">
                      <v-icon>mdi-folder-multiple</v-icon></v-btn>
                  </template>
                  <span>Duplicate/clone widget</span>
                </v-tooltip>
                <!-- move widget up/down -->
                <v-tooltip bottom>
                  <template v-slot:activator="{ props }">
                    <v-btn small icon @click="moveWidget(-1)" class="ml-2" v-bind="props">
                      <v-icon>mdi-arrow-up-bold</v-icon></v-btn>
                  </template>
                  <span>Move widget towards the top-left of the grid</span>
                </v-tooltip>
                <v-tooltip bottom>
                  <template v-slot:activator="{ props }">
                    <v-btn small icon @click="moveWidget(1)" v-bind="props">
                      <v-icon>mdi-arrow-down-bold</v-icon></v-btn>
                  </template>
                  <span>Move widget towards the bottom-right of the grid</span>
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

            <!-- Display component properties for editing -->
            <v-row align="center">
              <!-- For each property of the component, show some type of edit field-->
              <v-col class="d-flex" cols="12" sm="6" md="4" v-for="prop in edit_props" :key=prop>
                <!-- toggle buttons to select static vs. dynamic -->
                <v-tooltip bottom>
                  <template v-slot:activator="{ props }">
                    <v-btn-toggle mandatory dense class="mt-2 mr-1"
                                  :value="prop_static[prop]" @change="toggleStatic(prop, $event)"
                                  background-color="rgba(0,0,0,0)" color="primary">
                      <v-btn x-small icon v-bind="props">
                        <v-icon>mdi-link-variant</v-icon></v-btn>
                      <v-btn x-small icon v-bind="props">
                        <v-icon>{{prop_info[prop].icon}}</v-icon></v-btn>
                    </v-btn-toggle>
                  </template>
                  <span>Toggle dynamic link vs. literal value</span>
                </v-tooltip>
                <!-- dynamic link -->
                <topic-tree v-if="!prop_static[prop]"
                    :label="prop" hint='topic (/-separated path)' :value="widget.dynamic[prop]"
                    @input="handleEdit('dynamic', prop, $event)">
                </topic-tree>
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
                    :value="JSON.stringify(widget.static[prop]||prop_info[prop].default)"
                    :rules="[validateArray]"
                    @input="handleEdit('static', prop, $event)">
                </v-text-field>
                <!-- object -->
                <v-text-field v-else-if="prop_info[prop].type === Object"
                    :label="prop" dense
                    :hint="prop_info[prop].hint"
                    :value="JSON.stringify(widget.static[prop]||prop_info[prop].default)"
                    :rules="[validateObject]"
                    @input="handleEdit('static', prop, $event)">
                </v-text-field>
                <!-- color -->
                <color-picker v-else-if="prop === 'color' || prop.endsWith('_color')"
                    :label="prop" :hint="prop_info[prop].hint"
                    :value="widget.static[prop]||prop_info[prop].default"
                    @input="handleColorEdit(prop, $event)">
                </color-picker>
                <!-- string -->
                <v-text-field v-else class="w-edit"
                    :label="prop" dense
                    :hint="prop_info[prop].hint"
                    :value="widget.static[prop]||prop_info[prop].default"
                    @input="handleEdit('static', prop, $event)">
                  <template v-slot:append-outer>
                    <v-btn icon x-small @click=popupTextField(prop)>
                      <v-icon>mdi-arrow-expand-all</v-icon>
                    </v-btn>
                  </template>
                </v-text-field>
              </v-col>
            </v-row>

            <!-- row for output binding -->
            <v-row v-if="'output' in widget" align="center">
              <v-col class="d-flex" cols="12" sm="6" md="4">
                <!--h4 class="mt-2 mr-3">Output binding:</h4-->
                <v-combobox
                    label="output binding" clearable dense persistent-hint
                    :hint='output_tip'
                    :items="sd_keys"
                    :value="widget.output"
                    @input="handleEditOutput($event)">
                </v-combobox>
              </v-col>
            </v-row>

          </v-container>
        </v-card-text>

        <!-- dialog box to edit a string input value full-page -->
        <v-dialog v-model="dialog" content-class="height80 widget-edit-dialog"
                  width="80%" max-width="100ex">
          <v-card v-if="dialog" class="d-flex flex-column height100">
            <v-card-title class="d-flex align-baseline">
              <span>Edit <span style="font-weight: 700">{{dialog_prop}}</span></span>
              <v-spacer></v-spacer>
              <v-btn elevation=0 icon @click="dialog=false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text class="flex-grow-1">
              <v-textarea dense hide-details filled class="height100"
                  :value="widget.static[dialog_prop]||prop_info[dialog_prop].default"
                  @change="handleEdit('static', dialog_prop, $event)">
              </v-textarea>
            </v-card-text>
          </v-card>
        </v-dialog>

      </v-card>
    </v-menu>
  </div>
</template>

<style>
.widget-edit .popup-spacer { margin-top: 3px; margin-bottom: 3px; }
.widget-edit .w-edit > .v-input__append-outer { margin-left: 4px !important; }
.widget-edit-dialog .v-input.height100 div { height: 100% !important; } 
div.widget-edit { max-width: 100%; }
</style>

<script scoped>

import WidgetWrap from '/src/components/widget-wrap.vue'
import WidgetMove from '/src/components/widget-move.vue'
import md from '/src/components/md.vue'
import ColorPicker from '/src/components/color-picker.vue'
import TopicTree from '/src/components/topic-tree.vue'
import copyToClipboard from '/src/utils/clipboard.js'

export default {
  name: 'WidgetEdit',

  components: { WidgetWrap, WidgetMove, md, ColorPicker, TopicTree },
  inject: [ '$store', 'palette' ],

  props: {
    id: { type: String, required: true }, // my widget ID
    edit_active: { type: Boolean, default: false }, // we're being edited
    no_border: { type: Boolean, default: false }, // true causes no "card" border, used by panel
  },

  data() { return {
    prop_static: {}, // manual toggle between static and dynamic binding
    sd_keys: [], // list of keys from store.sd to show in editing combobox
    // hack to reposition the edit window when changing widget shape/position, this will go
    // away once we have dragging...
    reposition: true,
    edit_help: false, // more... help text expansion toggle
    // child_props holds the description of the widget component's props
    child_props: {}, 
    // prop_info is child_props further massaged:
    // {name:{type, default, validator, hint, icon, dynamic},...}
    // prop types: String, Number, Boolean, Array, Object, Date //, Function, Symbol
    prop_info: {},
    output_tip: "",

    // pop-up dialog to edit string property full-page
    dialog: false,
    dialog_prop: null,
  }},

  created() {
    console.log("Created widget", this.id)
    // fetch the widget config from the store and perform some init
    const wj = JSON.stringify(this.$store.widgetByID(this.id))
    const w = JSON.parse(wj)
    if (w.static === undefined) w.static = {}
    if (w.dynamic === undefined) w.dynamic = {}
    // inspect the component and extract child props
    let cp = {}
    const p = this.palette.widgets
    if (w.kind in p) cp = p[w.kind].props || {}
    // massage child_props into prop_info
    const icons = { String: 'mdi-format-quote-close', Number: 'mdi-numeric',
        Boolean: 'mdi-yin-yang', Array: "mdi-code-brackets", Object: "mdi-code-braces" }
    let pi = {}
    if (!('popup_info' in cp)) {
      cp.popup_info = { type: String, default: "", validator: null, icon: icons['String'],
          dynamic: false, tip: "pop-up information to show for this widget" }
    }
    for (let name in cp) {
      let type = cp[name].type || String
      if (![String, Number, Boolean, Array, Object].includes(type)) type = String
      let hint = cp[name].tip || type.name
      let def = cp[name].default
      if (typeof def === 'function') def = def() // array/obj prop defaults...
      if (def !== undefined) hint += `, default: ${def}`
      let icon = icons[type.name]
      pi[name] = {type, default: def, validator: cp[name].validator,
                  hint, icon, dynamic: cp[name].dynamic}
    }
    // FlexDash doesn't have any good place to tweak a freshly instantiated widget. It
    // just gets added "all undefined" in the store. Right now the code here "does some
    // stuff"...
    // The defaults for the widget inputs (props) are currently handled by
    // Vue's prop defaults, so the store just setting static={} works, except for dynamic
    // default. We hack them here.
    //
    // FIXME! this needs to be fixed because is causes a race condition when there are multiple
    // dashboards connected 'cause they all go through this logic and then all send 'corrections'
    // to each other while the original creator may make further edits (for example when cloning
    // a widget)
    for (const p in pi) {
      // if the prop definition says it's dynamic and it's completely unset, then set it
      if (pi[p].dynamic && !(p in w.dynamic) && !(p in w.static)) {
        w.dynamic[p] = pi[p].dynamic
        console.log("Need update: dynamic")
      }
    }
    // process any widget output binding
    if (w.kind in p && p[w.kind].output) {
      // apply defaults from widget "class"
      const o = p[w.kind].output
      if (typeof o === 'string') {
        if (!('output' in w)) w.output = o
      } else {
        if (!('output' in w)) w.output = p[w.kind].output.default || null
        if (p[w.kind].output.tip) this.output_tip += ", " + p[w.kind].output.tip
      }
    }
    if (w.output_hint) w.output_hint = null // patch a bug
    // update instance variables
    if (wj != JSON.stringify(w)) {
      console.log(`UPDATE ${wj} -> ${JSON.stringify(w)}`)
      this.$store.updateWidget(this.id, w)
    }
    this.child_props = cp
    this.prop_info = pi
    // handle init edit_mode being active
    if (this.edit_active) this.propStatic()
  },

  computed: {
    // list of keys from store.sd to show in editing combobox
    //sd_keys() { return Object.keys(this.$store.sd).sort() }, // reactivity failure...

    // list of child prop names for editing, excluding title and output_binding
    edit_props() {
      const cp = Object.keys(this.child_props)
      return cp.filter(p => p !== 'title' && p !== 'output_binding').sort()
    },

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
      return {
        'grid-row-start': `span ${this.widget.rows||1}`,
        'grid-column-start': `span ${this.widget.cols||1}`,
        'min-height': '1em', // works with grid-auto-rows to create small minimum height
      }
    },

    widget() { return this.$store.widgetByID(this.id) },
  },

  watch: {
    edit_active(val) {
      if (val) {
        this.propStatic()
        this.sd_keys = Object.keys(this.$store.sd).sort()
      }
    },
  },

  methods: {
    // set the dynamic/static toggles according to what's in the config.
    // Afterwards they're controlled by the user.
    propStatic() {
      this.prop_static = Object.fromEntries(
        // if prop in config.dynamic then 0 (not static) else 1 (static)
        Object.keys(this.child_props).map(p => [p, (p in this.widget.dynamic)?0:1])
      )
    },

    // value of a property: either config if set, else default
    propVal(prop) {
      const val = this.widget.static[prop] !== undefined ? this.widget.static[prop]
                                                         : this.prop_info[prop].default
      return val
    },

    // toggle static vs. dynamic for a specific prop
    toggleStatic(prop, val) {
      this.prop_static[prop] = val
      // if a prop is toggled to static we need to delete the dynamic value 'cause it takes
      // priority, i.e. defeats the switch
      if (val) this.widget.dynamic[prop] = undefined
    },

    // toggle edit handles the edit event from the child component which turns editing on/off,
    // this just gets propagated up to the grid where it round-trips into the edit_active property
    toggleEdit() { this.$emit('edit', !this.edit_active) },
    // cancel button in edit panel
    endEdit() { this.$emit('edit', false) },

    handleEdit(which, prop, value) {
      console.log("edit:", which, prop, value)
      if (!(which in this.widget)) return

      if (prop != 'title' && prop != 'output_binding') {
        if (!(prop in this.child_props)) return

        // for static values we get a string from the text_field and may need to convert
        if (which == 'static') {
          const type = this.child_props[prop].type
          // handle Number coming in as String
          if (type === Number && typeof value === 'string') {
            value = Number.parseFloat(value)
          // handle Array and Object values
          } else if (type === Array || type === Object) {
            try { value = JSON.parse(value)
            } catch(e) { return }
          }
        }
      }

      this.$store.updateWidgetProp(this.id, which, prop, value)
    },

    handleColorEdit(prop, value) {
      if (value == "") value = null
      this.handleEdit('static', prop, value)
    },

    handleEditOutput(value) {
      console.log("edit: output:", value)
      this.$store.updateWidget(this.id, {output: value})
    },

    validateArray(v) {
      let a
      try {
        a = JSON.parse(v)
      } catch(e) {
        return e.toString().replace(/^.*?parse:/, "")
      }
      if (!Array.isArray(a)) return "array required"
      return true
    },

    validateObject(v) {
      let a
      try {
        a = JSON.parse(v)
      } catch(e) {
        return e.toString().replace(/^.*?parse:/, "")
      }
      if (typeof a !== 'object') return "object required"
      return true
    },

    // pop up a dialog box to edit a text field
    popupTextField(prop) {
      if (this.dialog) {
        this.dialog = false
      } else {
        this.dialog_prop = prop
        this.dialog = true
      }
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

    teleport(src, dst) {
      this.$emit('teleport', this.id, src, dst)
    }

    // copyWidget(dir) {
    //   copyToClipboard(JSON.stringify(this.$store.widgetByID(this.id)))
    //   // FIXME: need some visual feedback
    // },

  },

}

</script>
