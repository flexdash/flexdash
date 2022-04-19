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
import widget_ops from '/src/utils/widget-grid-ops.js'

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

    ...widget_ops,

  },
}
</script>
