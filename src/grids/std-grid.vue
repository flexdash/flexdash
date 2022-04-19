<!-- StdGrid - Container to manage a grid of widgets dynamically placed on the page.
     Handles the layout of the widgets as well as the editing mode.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div class="u-tooltip-attach">
    <grid-bar kind="StdGrid" :title="grid.title" :has_widgets="grid.widgets.length>0"
              v-model:rolledup="rolledup" @changeTitle="changeTitle"
              @delete="$emit('delete')">
      <!-- Menu to add widget -->
      <widget-menu v-if="!global.noAddDelete" @select="addWidget" class="mr-4"></widget-menu>

      <!-- Paste button/text field -->
      <!--
        <v-tooltip bottom>
          <template v-slot:activator="{ props }">
            <v-btn icon @click="pasting=!pasting" v-bind="props">
              <v-icon>mdi-content-paste</v-icon>
            </v-btn>
          </template>
          <span>Paste a widget, adding it to the grid</span>
        </v-tooltip>
        <div ref="pasteDiv" class="d-flex">
          <input type="text" v-if="pasting" size="15"
                placeholder="paste widget here" class="pasteinput">
        </div>
      -->

      <!-- Selectors for minimum and maximum number of columns -->
      <min-max-cols :grid="grid"></min-max-cols>
    </grid-bar>

    <!-- Grid of widgets -->
    <div v-if="!rolledup" class="container foo g-grid-small pt-0 px-2 pb-2" v-bind:style="gridStyle">
      <component v-for="(w,ix) in grid.widgets" :key="w" :widget_id="w" :is="editComponent[w]"
                 :edit_active="ix == edit_ix" @edit="toggleEdit(ix, $event)"
                 @move="moveWidget(ix, $event)" @delete="deleteWidget(ix)"
                 @clone="cloneWidget(ix)" @teleport="(src,dst)=>teleportWidget(w, src, dst)">
      </component>
    </div>
  </div>
</template>

<style scoped>
/* style to make grid happen */
.g-grid-small {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  grid-auto-rows: 78px;
  gap: 8px;
  grid-auto-flow: dense;
}
.g-grid-margin { margin: 0.5em; }

.pasteinput {
  margin: 0 4px; padding: 0 2px; min-width: 20ex;
  color: #888;
  border: 1px solid #888; border-radius: 4px;
}
</style>

<script scoped>

import GridBar from '/src/components/grid-bar.vue'
import PanelEdit from '/src/edit-panels/panel-edit.vue'
import WidgetEdit from '/src/edit-panels/widget-edit.vue'
import WidgetMenu from '/src/menus/widget-menu.vue'
import MinMaxCols from '/src/components/min-max-cols.vue' 
import widget_ops from '/src/utils/widget-grid-ops.js'

const COLW = 120 // min width of widgets in pixels
const GAPW = 8   // gap between widgets in pixels

export default {
  name: 'StdGrid',

  components: { GridBar, PanelEdit, WidgetEdit, WidgetMenu, MinMaxCols },
  inject: [ '$store', '$config', 'palette', 'global' ],

  props: {
    id: { type: String }, // this grid's ID
  },

  data() { return {
    edit_ix: null, // widget being edited
    rolledup: false, // whether grid is rolled-up
    pasting: false, // controls display of paste div
  }},

  computed: {
    // grid config: {id, kind, icon, widgets}
    grid() { return this.$store.gridByID(this.id) },
    minCols() { return this.grid.min_cols || 1 },
    maxCols() { return this.grid.max_cols || 20 },
    gridStyle() {
      // min width to fit N widgets is N*COLW, plus gaps: (N-1)*GAPW, plus l/r padding: 2*GAPW
      let min_width = this.minCols * COLW + (this.minCols+1) * GAPW
      let max_width = this.maxCols * COLW + (this.maxCols+1) * GAPW + 118
      return { minWidth: `${min_width}px`, maxWidth: `${max_width}px` }
    },

    // editComponent returns the component used to edit a widget: widget-edit or panel-edit
    editComponent() {
      return Object.fromEntries(this.grid.widgets.map(wid =>
        [ wid, this.$store.widgetByID(wid).kind.endsWith("Panel") ? "PanelEdit" : "WidgetEdit" ]
      ))
    },
  },

  watch: {
    pasting(nv) {
      if (nv) {
        this.$refs.pasteDiv.addEventListener('paste', this.pasteWidget)
        this.$nextTick(()=>this.$refs.pasteDiv.firstChild.focus())
      } else {
        this.$refs.pasteDiv.removeEventListener('paste', this.pasteWidget)
      }
    },
  },

  methods: {
    toggleEdit(ix, on) { this.edit_ix = on ? ix : null },

    ...widget_ops, // addWidget, deleteWidget, cloneWidget, moveWIdget, teleportWidget

    changeTitle(ev) { this.$store.updateGrid(this.id, { title: ev }) },

  },
}

</script>
