<!-- Grid - Container to manage a grid of widgets dynamically placed on the page.
     Handles the layout of the widgets as well as the editing mode.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div style="display: contents;">
    <!-- Edit bar above the grid proper -->
    <v-toolbar v-if="$root.editMode" dense color="surface" class="editmode">
      <!--v-toolbar-title class="mr-4">Edit Grid</v-toolbar-title-->
      <div>
        <v-chip small>fixed size grid</v-chip>
      </div>

      <!-- Menu to add widget -->
      <div>
        <v-menu offset-y v-model="add_menu">
          <!-- Menu activator, i.e. the button -->
          <template v-slot:activator="{ on:menu, attrs }">
            <v-tooltip bottom>
              <template v-slot:activator="{ on:tt }">
                <v-btn small icon color="primary" v-bind="attrs" v-on="{...tt, ...menu}">
                  <v-icon>mdi-card-plus</v-icon>
                </v-btn>
              </template>
              <span>Add a widget to the end of the grid</span>
            </v-tooltip>
          </template>
          <!-- Menu to add a widget -->
          <v-list>
            <v-subheader>Add Widget to the end of the grid</v-subheader>
            <v-list-item v-for="kind in palette()" :key="kind" @click="addWidget(kind)">
              <v-list-item-title>{{kind}}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <!-- Button to restore a deleted widget -->
        <v-tooltip bottom v-if="deleted_widget!==null">
          <template v-slot:activator="{ on, attrs }">
            <v-btn small icon @click="restoreWidget()"
                   v-bind="attrs" v-on="on">
              <v-icon>mdi-delete-restore</v-icon></v-btn>
          </template>
          <span>Restore deleted widget</span>
        </v-tooltip>
      </div>

      <!-- Buttons to edit selected widget -->
      <div v-if="edit_id !== null">
        <!-- delete widget -->
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn small icon @click="deleteWidget()" v-on="on">
              <v-icon>mdi-delete</v-icon></v-btn>
          </template>
          <span>Delete widget</span>
        </v-tooltip>
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
        <!-- adjust widget rows -->
        <v-btn small icon @click="adjustRows(-1)" class="ml-2">
          <v-icon>mdi-minus</v-icon></v-btn>
        <v-chip small>{{edit_config.rows}} row{{edit_config.rows > 1?'s':''}}</v-chip>
        <v-btn small icon @click="adjustRows(1)">
          <v-icon>mdi-plus</v-icon></v-btn>
        <!-- adjust widget columns -->
        <v-btn small icon @click="adjustCols(-1)" class="ml-2">
          <v-icon>mdi-minus</v-icon></v-btn>
        <v-chip small>{{edit_config.cols}} col{{edit_config.cols > 1 ? 's' : ''}}</v-chip>
        <v-btn small icon @click="adjustCols(1)">
          <v-icon>mdi-plus</v-icon></v-btn>
        <v-btn small @click="handleEdit(null, 'cancel')" class="ml-2">Cancel</v-btn>
        <v-btn small color="primary" @click="saveEdit()" class="ml-2">Save</v-btn>
      </div>

      <v-spacer></v-spacer>
    </v-toolbar>

    <!-- Grid of widgets -->
    <v-container fluid class="g-grid-small">
      <widget-wrap :config="statConfig"></widget-wrap>
      <widget-edit v-for="w in widgets" :key="w"
                   :config="w==edit_id ? edit_config : _config.widgets[w]"
                   :edit_active="w==edit_id"
                   @change="handleChange(...$event)"
                   @edit="handleEdit(w, $event)">
      </widget-edit>
    </v-container>
  </div>
</template>

<script scoped>

import WidgetWrap from '/src/components/widget-wrap'
import WidgetEdit from '/src/components/widget-edit'
import store from '@/store.js'

export default {
  name: 'FixedGrid',

  components: { WidgetWrap, WidgetEdit },

  props: {
    id: { type: String },
  },

  data() { return {
    add_menu: null, // true while adding widget menu is shown
    edit_id: null, // id of widget being edited
    edit_config: {}, // widget config being edited
    deleted_widget: null, // deleted widget [pos, config] for undo
    edit_move_ix: null, // if non-null, edited widget's moved position
  }},

  computed: {
    // config: {id, kind, icon, widgets}
    config() { return store.config.grids[this.id] },

    // array of widgets taking edited widget move into account
    widgets() {
      if (this.edit_id === null || this.edit_move_ix == null) return this.config.widgets
      const ix = this.config.widgets.indexOf(this.edit_id)
      let ww = this.config.widgets.concat() // shallow copy
      ww.splice(ix, 1) // remove widget
      ww.splice(this.edit_move_ix, 0, this.edit_id)
      return ww
    },

    // config for stat widget to show widget count for debug purposes
    statConfig() { return { kind: 'stat', id: "debugStat", dynamic: {},
        static: {title: 'Widgets', value: this.widgetCount} }},
    widgetCount() { return this.config.widgets.length },

    // make store.config visible in vue debugger
    _config() { return store.config },
  },

  methods: {
    // propNames is a simple helper to get the property names of an object skippin "_*" ones
    propNames(o) { return Object.getOwnPropertyNames(o).filter(v=>{return !v.startsWith("_")}) },

    // palette returns the list of available widgets for the add-widget drop-down
    palette() {
      console.log("Palette:", window.widgetPalette);
      return Object.keys(window.widgetPalette)
    },

    // generate an id for a new widget
    genId() {
      const ids = Object.keys(store.config.widgets)
      let id = null
      while (!id || id in ids) {
        id = "00000" + Math.floor(Math.random() * 10000)
        id = "w" + id.substring(id.length-5)
      }
      return id
    },

    // addWidget adds a widget and edits it
    addWidget(kind) {
      const c = { kind, id: this.genId(), row:1, cols:1, static: {title:kind}, dynamic: {} }
      console.log(`Adding ${kind}[${c.id}] widget`)
      // add the widget to the config
      //store.store.addWidget(...)
      // start editing it
      //this.handleEdit(c.id, 'toggle')
    },

    // handleChange handles change events from the widget edit panel, these change the
    // value passed to a prop of the widget.
    handleChange(what, prop, value) { // what:dynamic/static
      console.log(`handleChange(${what},${prop},${value}) in fixed-grid`)
      this.$set(this.edit_config[what], prop, value)
    },

    // handleEdit handles edit events from widgets that toggle editing of a widget on/off.
    // 'what' may be 'toggle' or 'cancel'
    handleEdit(id, what) {
      console.log(`handleEdit(${id},${what}) in fixed-grid`)
      if (what == 'cancel' || what == 'toggle' && this.edit_id == id) {
        // cancel edit
        this.edit_id = null
        this.edit_config = {}
        this.edit_move_ix = null
      } else if (what == 'toggle' && this.edit_id !== id) {
        // start edit
        this.edit_id = id
        this.deleted_widget = null // can no longer undelete
        this.edit_move_ix = null
        // clone config 2 levels deep
        this.edit_config = { static: {}, dynamic: {} }
        const c = store.config.widgets[id]
        Object.keys(c).forEach(k => {
          this.$set(this.edit_config, k,
            typeof c[k] === 'object' ? Object.assign({}, c[k]) : c[k])
        })
        console.log(`starting edit of ${id}, edit_config:`, this.edit_config)
      } else {
        console.log(`Unknown event in fixed-grid: handleEdit(${id}, ${what})`)
      }
    },

    saveEdit() {
      console.log(`saveEdit for widget ${this.edit_id}`)
    },

    deleteWidget() {
      const id = this.edit_id
      console.log(`Deleting widget ${id}`)
      // first cancel the edit
      this.handleEdit(id, 'cancel')
      // save the widget for restore
      const ix = this.config.widgets.indexOf(id)
      if (ix < 0) return
      this.deleted_widget = [ix, store.config.widgets[id]]
      console.log(`Deleted widget:`, this.deleted_widget)
      // FIXME: need to go through store!
      delete store.config.widgets[id]
      this.config.widgets.splice(ix, 1) // delete the widget in question
    },

    restoreWidget() {
      const [ix, w] = this.deleted_widget
      console.log(`Restoring widget ${w.id}`)
      // FIXME: need to go through store!
      store.config.widgets[w.id] = w
      this.config.widgets.splice(ix, 0, w.id)
      this.deleted_widget = null
    },

    // move a widget up/down (dir=-1/1)
    moveWidget(dir) {
      const id = this.edit_id
      let ix = this.edit_move_ix === null ? this.config.widgets.indexOf(id) : this.edit_move_ix
      console.log(`Moving widget ${id} at ${ix} by ${dir}`)
      ix += dir
      if (!(ix >= 0 && ix < this.config.widgets.length)) return
      this.edit_move_ix = ix
    },

    // adjust number of rows spanned by widget (dir=-1/+1)
    adjustRows(dir) {
      let w = this.edit_config
      w.rows = (w.rows||1) + dir
      if (w.rows < 1) w.rows = 1
      if (w.rows > 16) w.rows = 16
    },

    // adjust number of cols spanned by widget (dir=-1/+1)
    adjustCols(dir) {
      let w = this.edit_config
      w.cols = (w.cols||1) + dir
      if (w.cols < 1) w.cols = 1
      if (w.cols > 16) w.cols = 16
    },

  },

}

</script>

<style scoped>
/* not sure why this is here... */
.gauge-large .gauge-value { line-height: 3rem; font-size: 2rem; }
.gauge-large .gauge-title { line-height: 1.5rem; font-size: 1rem; }

/* style for button groups in the edit toolbar */
.v-toolbar__content div { margin-right: 4ex; }

/* style to make grid happen */
.g-grid-large {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18em, 1fr));
  gap: 0.5em;
  grid-auto-flow: dense;
}
.g-grid-small {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7em, 1fr));
  grid-auto-rows: 4.5em;
  gap: 0.5em;
  grid-auto-flow: dense;
}
.g-grid-margin { margin: 0.5em; }

</style>
<style>
.editmode.theme--light .v-toolbar__content { border-top: 1px solid #e0e0e0; }
.editmode.theme--dark .v-toolbar__content { border-top: 1px solid #111; }
</style>
