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
                   :config="w==edit_id ? edit_config : config_widgets[w]"
                   :edit_active="w==edit_id"
                   @change="handleChange(...$event)"
                   @edit="handleEdit(w, $event)">
      </widget-edit>

      <!-- notification, shows up at top -->
      <v-snackbar v-model="notif" top left text absolute timeout="2000"
                  color="primary" content-class="d-flex">
        <span class="mx-auto">{{notif_msg}}</span>
      </v-snackbar>
    </v-container>

    <!-- Overlay with spinning save animation -->
    <v-overlay z-index="10" :value="overlay">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <v-chip color="primary" class="ml-4 pr-10">Saving...</v-chip>
    </v-overlay>
  </div>
</template>

<script scoped>

import WidgetWrap from '@/components/widget-wrap'
import WidgetEdit from '@/components/widget-edit'
import store from '@/store.js'
import _ from 'lodash'

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
    overlay: false, // controls the visibility of the save-spinner overlay
    notif: false, // notification pop-up
    notif_msg: "", // message in notification
  }},

  computed: {
    // config: {id, kind, icon, widgets}
    config() { return store.config.grids[this.id] },

    // array of widget indexes taking edited widget move into account
    widgets() {
      if (this.edit_id === null || this.edit_move_ix == null) return this.config.widgets
      const ix = this.config.widgets.indexOf(this.edit_id)
      let ww = this.config.widgets.concat() // shallow copy
      ww.splice(ix, 1) // remove widget
      ww.splice(this.edit_move_ix, 0, this.edit_id)
      return ww
    },

    config_widgets() { return store.config.widgets },

    // config for stat widget to show widget count for debug purposes
    statConfig() { return { kind: 'stat', id: "debugStat", dynamic: {},
        static: {title: 'Widgets', value: this.widgetCount} }},
    widgetCount() { return this.config.widgets.length },

    // editing helpers
    widgetEdited() {
      console.log("widgetEdited:", !_.isEqual(this.config_widgets[this.edit_id], this.edit_config))
      return !_.isEqual(this.config_widgets[this.edit_id], this.edit_config) },
    widgetMoved() {
      console.log("widgetsMoved:", this.edit_move_ix, this.config.widgets.indexOf(this.edit_id))
      return this.edit_move_ix !== null && this.edit_move_ix !=
    this.config.widgets.indexOf(this.edit_id) }
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
      //console.log(`handleChange(${what},${prop},${value}) in fixed-grid`)
      this.$set(this.edit_config[what], prop, value)
    },

    // handleEdit handles edit events from widgets that toggle editing of a widget on/off.
    // 'what' may be 'toggle' or 'cancel'
    handleEdit(id, what) {
      console.log(`handleEdit(${id},${what}) in fixed-grid`)
      if (what == 'cancel' || what == 'toggle' && this.edit_id == id) {
        this.cancelEdit()

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

    // helper function to end editing
    cancelEdit() {
      this.edit_id = null
      this.edit_config = {}
      this.edit_move_ix = null
    },

    saveEdit() {
      console.log(`***** saveEdit for widget ${this.edit_id}`)

      // detect if nothing has changed
      if (!this.widgetEdited && !this.widgetMoved) {
        this.notif_msg = "Nothing changed"
        this.notif = true
        window.setTimeout(() => this.cancelEdit(), 500)
        return
      }
      console.log("Edited", this.widgetEdited, this.widgetMoved)

      // save by sending update to server
      if (this.widgetEdited)
        this.$emit('reconfig', {topic: "widgets/"+this.edit_id, payload: this.edit_config})
      if (this.widgetMoved)
        this.$emit('reconfig', {topic: `grids/${this.id}/widgets`, payload: this.widgets})

      // start spinner and wait for saved data to come back to us or time-out
      this.overlay = true
      const self = this
      let watcher = null
      // start a time-out after which we return the user to the edit mode to try again or cancel
      const timeout = window.setTimeout(() => {
        console.log("Saving timed-out", self.widgetEdited, self.widgetMoved)
        self.notif_msg = "Saving failed (or is slow)"
        self.notif = true
        self.overlay = false
        if (watcher) watcher() // cancel watcher
      }, 5000)
      // start a watcher to see the saved config match the edited config, which means that the
      // edit has round-tripped to the server and back and thus we're good
      watcher = this.$watch(() => self.widgetEdited || self.widgetMoved,
        () => {
          if (!self.widgetEdited && !self.widgetMoved) {
            // edited matches saved, all good
            if (self.overlay) self.overlay = false
            if (timeout) window.clearTimeout(timeout)
            watcher() // cancel watcher
            self.cancelEdit()
          }
        }, { deep: true, immediate: true }
      )
    },

    // deleteWidget handles the delete button
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

    // restoreWidget handles the undo-delete button
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
