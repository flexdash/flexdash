<!-- StdGrid - Container to manage a grid of widgets dynamically placed on the page.
     Handles the layout of the widgets as well as the editing mode.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div class="u-tooltip-attach" ref="outer">
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
      <min-max-cols :grid="grid" :max-widget="maxWidget"></min-max-cols>
    </grid-bar>

    <!-- Grid of widgets -->
    <div v-if="!rolledup" v-bind:style="gridScale">
      <div class="container g-grid-small pt-0 px-2 pb-2" v-bind:style="gridStyle" ref="grid">
        <component v-for="(w,ix) in widgets" :key="w" :widget_id="w" :is="editComponent[w]"
                  :ix="ix" :edit_active="ix == edit_ix" @edit="toggleEdit(ix, $event)"
                  @move="moveWidget(ix, $event)" @delete="deleteWidget(ix)"
                  @clone="cloneWidget(ix)" @teleport="(src,dst)=>teleportWidget(w, src, dst)">
        </component>
      </div>
    </div>
    <div v-if="gridScale && scale != '1.00'" class="scale">grid scale {{ scale }}x</div>
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

.scale {
  transform-origin: top right;
  rotate: 90deg;
  position: absolute; bottom: 0px; right: 1px; z-index: 2;
  font-size: 9pt; font-weight: 700; color: #808080;
  line-height: 10pt;
}
</style>

<script scoped>

import GridBar from '/src/components/grid-bar.vue'
import PanelEdit from '/src/edit-panels/panel-edit.vue'
import WidgetEdit from '/src/edit-panels/widget-edit.vue'
import DisabledEdit from '/src/edit-panels/disabled-edit.vue'
import WidgetMenu from '/src/menus/widget-menu.vue'
import MinMaxCols from '/src/components/min-max-cols.vue' 
import widget_ops from '/src/utils/widget-grid-ops.js'

const COLW = 120 // min width of widgets in pixels
const GAPW = 8   // gap between widgets in pixels

export default {
  name: 'StdGrid',

  components: { GridBar, PanelEdit, WidgetEdit, DisabledEdit, WidgetMenu, MinMaxCols },
  inject: [ '$store', '$config', 'palette', 'global' ],

  props: {
    id: { type: String }, // this grid's ID
  },

  data() { return {
    edit_ix: null, // widget being edited
    rolledup: false, // whether grid is rolled-up
    pasting: false, // controls display of paste div
    gridScale: "", // style to scale grid up to fill width
    scale: 1, // scale of grid for debug purposes
  }},

  computed: {
    // grid config: {id, kind, icon, widgets}
    grid() { return this.$store.gridByID(this.id) },
    widgets() { return this.grid.widgets.filter(w =>
      !w.startsWith('x') && this.$config.widgets[w]?.id == w
    )},
    minCols() { return Math.max(this.grid.min_cols || 1, this.maxWidget) },
    maxCols() { return this.grid.max_cols || 20 },
    maxWidget() { // width of widest widget (in columns)
      return Math.max(1, ...this.widgets.map(id => {
        try { return this.$store.widgetByID(id).cols }
        catch (e) { return 1 }
      }))
    },
    gridStyle() {
      // min width to fit N widgets is N*COLW, plus gaps: (N-1)*GAPW, plus l/r padding: 2*GAPW
      let min_width = this.minCols * COLW + (this.minCols + 1) * GAPW
      let max_width = this.maxCols * COLW + (this.maxCols + 1) * GAPW + (COLW + GAPW - 2)
      return { minWidth: `${min_width}px`, maxWidth: `${max_width}px` }
    },

    // editComponent returns the component used to edit a widget: widget-edit or panel-edit
    editComponent() {
      return Object.fromEntries(this.widgets.map(wid => {
        if (wid.startsWith('x')) return [wid, "DisabledEdit"]
        if (this.$store.widgetByID(wid).kind.endsWith("Panel")) return [wid, "PanelEdit"]
        return [wid, "WidgetEdit"]
      }))
    },
  },

  created() { this._ro = new ResizeObserver(() => this.scaleGrid()) },
  mounted() { this._ro.observe(this.$refs.grid); this._ro.observe(this.$refs.outer) },
  unmounted() { if(this._ro) this._ro.disconnect() },

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

    scaleGrid() {
      let g = this.$refs.grid
      let p = g.parentElement
      if (!p.clientWidth || ! g.clientWidth) {
        this.gridScale = ""
        return
      }
      let scale = p.clientWidth / g.clientWidth
      if (scale > 1.33) scale = 1.33
      if (scale < 0.75) scale = 0.75
      this.scale = scale.toFixed(2)
      //console.log(`parentWidth=${p.clientWidth} gridWidth=${g.clientWidth} gridHeight=${g.clientHeight} scale=${scale}`)
      this.gridScale = {
        'transform-origin': 'top left',
        transform: `scale(${scale})`,
        height: `${g.clientHeight*scale}px`,
      }
    },

  },
}

</script>
