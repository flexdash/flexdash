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
    <widget-wrap :config="widget" :no_border="no_border"
                  @edit="toggleEdit" :color="edit_active?'highlight':''">
    </widget-wrap>

    <!-- v-overlay is used to display a floating v-card below the component for editing -->
    <!-- :activator="'#'+id" absolute positionStrategy="connected" -->
    <v-overlay :model-value="edit_active" width="90%" absolute class="widget-edit"
               allow-overflow :scrim="false" @click:outside="endEdit">
      <v-defaults-provider :defaults="{global: {density: 'compact'}}">

        <!-- Editing panel shown floating below widget -->
        <v-card color="panel" class='mt-1'>
          <!-- title and close button -->
          <title-edit :what="widget.kind + ' widget'" class="mt-1"
                      :title="widget.static['title']"
                      @close="endEdit"
                      @update:title="handleEdit('static', 'title', $event)">
          </title-edit>

          <!-- Display widget help text -->
          <help-edit :text="child_help"></help-edit>

          <!-- toolbar with delete move, resize, etc -->
          <widget-edit-toolbar :widget_id="widget_id" kind="widget"
                               @delete="$emit('delete')"  @clone="$emit('clone')"
                               @move="dir=>$emit('move', dir)"
                               @teleport="(src, dst)=>$emit('teleport', src, dst)">
          </widget-edit-toolbar>

          <!-- main part with properties -->
          <v-card-text>
            <div class="prop-columns">
              <!-- Display component properties for editing -->
              <prop-edit v-for="prop in edit_props" :key=prop
                         class="mb-2" :name="prop" :info="prop_info[prop]"
                         :is_static="prop_static[prop]"
                         @update:is_static="toggleStatic(prop, $event)"
                         :model-value="propVal(prop)"
                         @update:modelValue="(w,v)=>handleEdit(w, prop, v)"
                       >
              </prop-edit>

              <!-- row for output binding -->
              <!--v-combobox
                  label="output binding" clearable dense persistent-hint
                  :hint='output_tip'
                  :items="sd_keys"
                  :value="widget.output"
                  @input="handleEditOutput($event)">
              </v-combobox-->

            </div>
          </v-card-text>

        </v-card>
      </v-defaults-provider>
    </v-overlay>
  </div>
</template>

<style>
.widget-edit { max-width: 100%; }
.widget-edit .prop-columns {
  width: 100%; columns: 340px; column-gap: 1.5em; column-rule: 1px solid #888;
}
</style>

<script scoped>

import WidgetWrap from '/src/components/widget-wrap.vue'
import WidgetEditToolbar from '/src/edit-panels/widget-edit-toolbar.vue'
import TitleEdit from '/src/edit-panels/title-edit.vue'
import HelpEdit from '/src/edit-panels/help-edit.vue'
import PropEdit from '/src/edit-panels/prop-edit.vue'
import md from '/src/components/md.vue'

export default {
  name: 'WidgetEdit',

  components: { WidgetWrap, WidgetEditToolbar, TitleEdit, HelpEdit, PropEdit, md },
  inject: [ '$store', 'palette' ],

  props: {
    widget_id: { type: String, required: true }, // my widget ID
    edit_active: { type: Boolean, default: false }, // we're being edited
    no_border: { type: Boolean, default: false }, // true causes no "card" border, used by panel
  },

  emits: [ 'move', 'teleport', 'delete', 'clone' ],

  data() { return {
    prop_static: {}, // manual toggle between static and dynamic binding
    sd_keys: [], // list of keys from store.sd to show in editing combobox
    // child_props holds the description of the widget component's props
    child_props: {}, 
    // prop_info is child_props further massaged:
    // {name:{type, default, validator, hint, icon, dynamic},...}
    // prop types: String, Number, Boolean, Array, Object, Date //, Function, Symbol
    prop_info: {},
    output_tip: "",
  }},

  created() {
    console.log("Created widget", this.widget_id)
    // fetch the widget config from the store and perform some init
    const wj = JSON.stringify(this.$store.widgetByID(this.widget_id))
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
      this.$store.updateWidget(this.widget_id, w)
    }
    this.child_props = cp
    this.prop_info = pi
    // handle init edit_mode being active
    if (this.edit_active) this.propStatic()
  },

  computed: {
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

    widget() { return this.$store.widgetByID(this.widget_id) },
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
      if (!this.prop_static[prop]) return this.widget.dynamic[prop]
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

      this.$store.updateWidgetProp(this.widget_id, which, prop, value)
    },

    handleEditOutput(value) {
      console.log("edit: output:", value)
      this.$store.updateWidget(this.widget_id, {output: value})
    },

    // copyWidget(dir) {
    //   copyToClipboard(JSON.stringify(this.$store.widgetByID(this.widget_id)))
    //   // FIXME: need some visual feedback
    // },

  },

}

</script>
