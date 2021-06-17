<!-- Panel - Rectangular container to create a custom arrangement of widgets.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div class="wpanel">
    <widget-menu v-if="$root.editMode" button_class="add-widget" @select="addWidget">
    </widget-menu>
    <component v-for="(w,ix) in widgets" :key="w" :id="w" :is="editComponent[w]"
               :edit_active="ix == edit_ix" :no_border="true"
               @edit="toggleEdit(ix, $event)" @move="moveWidget(ix, $event)"
               @delete="deleteWidget(ix)" @clone="cloneWidget(ix)">
    </component>
  </div>
</template>

<style scoped>
.wpanel {
  width: 100%; flex-grow: 1; margin-top: 4px; padding: 4px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(3.375em, 1fr));
  grid-auto-rows: minmax(2em, auto);
  gap: 0.25em;
}
</style>
<style>
.wpanel > .add-widget {
  position: absolute; right: 30px; top: 0px; z-index: 1;
}
</style>

<script scoped>
import PanelEdit from '/src/components/panel-edit.vue'
import WidgetEdit from '/src/components/widget-edit.vue'
import WidgetMenu from '/src/components/widget-menu.vue'

export default {
  name: 'Panel',
  help: `Rectangular container to create a custom arrangement of widgets.
The panel widget contains a half-sized grid into which widgets can be placed.
Unlike the outer grid, the panel does not resize itself with browser window
changes and thus the positioning of the widgets remains fixed.`,


  components: { PanelEdit, WidgetEdit, WidgetMenu },

  inject: ['$store'],

  props: {
    id: null, // panel's own widget id
    widgets: { type: Array, default: ()=>([]) }, // list of widgets in this panel
  },

  data() { return {
    edit_ix: null, // widget being edited
  }},

  computed: {
    // editComponent returns the component used to edit a widget: widget-edit or panel-edit
    editComponent() {
      return Object.fromEntries(this.widgets.map(wid =>
        [ wid, this.$store.widgetByID(wid).kind.endsWith("Panel") ? "PanelEdit" : "WidgetEdit" ]
      ))
    },
  },

  methods: {
    toggleEdit(ix, on) { this.edit_ix = on ? ix : null },

    addWidget(kind) {
      const widget_ix = this.$store.addPanelWidget(this.id, kind)
      this.edit_ix = widget_ix // start editing the new widget
    },

    // handle widget delete event coming up from widget-edit
    deleteWidget(ix) {
      this.$store.deletePanelWidget(this.id, ix)
      this.edit_ix = null
    },

    // handle widget clone event coming up from widget-edit
    cloneWidget(ix) {
      // start by adding a new widget of the same kind to the end of the panel
      const old_w = this.$store.widgetByID(this.$store.widgetIDByPanelIX(this.id, ix))
      const widget_ix = this.$store.addPanelWidget(this.id, old_w.kind)
      const widget_id = this.$store.widgetIDByPanelIX(this.id, widget_ix)
      // copy the properties over
      const props = JSON.parse(JSON.stringify(old_w)) // clone and clean of observers
      delete props.id
      this.$store.updateWidget(widget_id, props)
      // move clone up to be just behind original
      if (widget_ix != ix+1) {
        let ww = [ ...this.widgets ] // clone
        ww.copyWithin(ix+2, ix+1) // shift widgets up
        ww[ix+1] = widget_id
        this.$store.updateWidgetProp(this.id, 'static', 'widgets', ww)
      }
      this.edit_ix = ix+1
    },

    // move a widget up/down (dir=-1/1)
    moveWidget(ix, dir) {
      console.log(`Moving widget #${ix} by ${dir}`)
      if (!(ix+dir >= 0 && ix+dir < this.widgets.length)) return
      let ww = [ ...this.widgets ] // clone
      let w = ww[ix]; ww[ix] = ww[ix+dir]; ww[ix+dir] = w // swap
      this.$store.updateWidgetProp(this.id, 'static', 'widgets', ww)
      this.edit_ix += dir
    },
  },
}
</script>
