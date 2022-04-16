<!-- Panel - Rectangular container to create a custom arrangement of widgets.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div :class="panel_classes" :style="panel_style">
    <widget-menu v-if="global.editMode && !global.noAddDelete" button_class="add-widget"
                 @select="addWidget">
    </widget-menu>
    <component v-for="(w,ix) in widgets" :key="w" :widget_id="w" :is="editComponent[w]"
               :edit_active="ix == edit_ix" :no_border="true"
               @edit="toggleEdit(ix, $event)" @move="moveWidget(ix, $event)"
               @teleport="teleportWidget" @delete="deleteWidget(ix)" @clone="cloneWidget(ix)">
    </component>
  </div>
</template>

<style scoped>
.wpanel {
  width: 100%; flex-grow: 1; flex-shrink: 1; min-height: 10px; margin-top: 4px; padding: 0px;
  display: grid;
  /* auto: largest minimal size as specified by min-height
   * 1fr: spread extra space equally among all elements */
  grid-auto-rows: minmax(auto, 1fr);
}
.wpanel.spanel { gap: 0px; }
.wpanel.tpanel { gap: 4px; }
</style>
<style>
.wpanel > .add-widget {
  position: absolute; right: 30px; top: 0px; z-index: 1;
}
</style>

<script scoped>
import PanelEdit from '/src/edit-panels/panel-edit.vue'
import WidgetEdit from '/src/edit-panels/widget-edit.vue'
import WidgetMenu from '/src/menus/widget-menu.vue'

export default {
  name: 'Panel',
  help: `Rectangular container to create a custom arrangement of widgets.
The panel widget contains a half-sized grid into which widgets can be placed.
Unlike the outer grid, the panel does not resize itself with browser window
changes and thus the positioning of the widgets remains fixed.

A solid panel has the same background as a widget, and widgets within
the panel are border-less. Transparent panels have no visual features and
act only as a fixed arrangement of widgets.`,


  components: { PanelEdit, WidgetEdit, WidgetMenu },

  inject: ['$store', 'global'],

  props: {
    id: null, // panel's own widget id
    solid: { type: Boolean, default: true }, // whether background is solid, as opposed to a grid
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
    panel_style() {
      const widget = this.$store.widgetByID(this.id)
      return {
        "grid-template-columns": `repeat(${2*widget.cols}, 1fr)`,
        //"grid-template-rows": `repeat(${2*widget.rows}, 1fr)`,
      }
    },
    panel_classes() { return this.solid ? ["wpanel", "spanel"] : ["wpanel", "tpanel"] },
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

    // teleport the widget to a different grid or panel
    teleportWidget(w_id, src_id, dest_id) {
      console.log(`Teleport widget ${w_id} from ${src_id} to ${dest_id}`)
      this.$store.moveWidget(w_id, src_id, dest_id)
      this.edit_ix = null
    },

  },
}
</script>
