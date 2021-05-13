<!-- Grid - Container to manage a grid of widgets dynamically placed on the page.
     Handles the layout of the widgets as well as the editing mode.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div style="display: contents;">
    <!-- Edit bar above the grid proper -->
    <v-toolbar v-if="$root.editMode" flat dense color="panel">
      <!--v-toolbar-title class="mr-4">Edit Grid</v-toolbar-title-->
      <v-spacer></v-spacer>
      <div>
        <v-chip small>fixed size</v-chip>
      </div>

      <!-- Menu to add widget -->
      <div>
        <v-menu offset-y v-model="add_menu">
          <!-- Menu activator, i.e. the button -->
          <template v-slot:activator="{ on, attrs }">
            <v-btn small icon color="primary" v-bind="attrs" v-on="on">
              <v-icon>mdi-card-plus</v-icon>
            </v-btn>
          </template>
          <!-- Menu to add a widget -->
          <v-list>
            <v-subheader>Add Widget to the end of the grid</v-subheader>
            <v-list-item v-for="kind in palette()" :key="kind" @click="addWidget(kind)">
              <v-list-item-title>{{kind}}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <!-- Buttons to edit selected widget -->
      <div v-if="edit_ix !== null">
        <!-- delete widget -->
        <v-btn small icon @click="deleteWidget()">
          <v-icon>mdi-delete</v-icon></v-btn>
        <!-- move widget up/down -->
        <v-btn small icon @click="moveWidget(-1)" class="ml-2">
          <v-icon>mdi-arrow-up-bold</v-icon></v-btn>
        <v-btn small icon @click="moveWidget(1)">
          <v-icon>mdi-arrow-down-bold</v-icon></v-btn>
        <!-- adjust widget rows -->
        <v-btn small icon @click="widgetRows(-1)" class="ml-2">
          <v-icon>mdi-minus</v-icon></v-btn>
        <v-chip small>{{widgetRows()}} row{{widgetRows() > 1?'s':''}}</v-chip>
        <v-btn small icon @click="widgetRows(1)">
          <v-icon>mdi-plus</v-icon></v-btn>
        <!-- adjust widget columns -->
        <v-btn small icon @click="widgetCols(-1)" class="ml-2">
          <v-icon>mdi-minus</v-icon></v-btn>
        <v-chip small>{{widgetCols()}} col{{widgetCols() > 1 ? 's' : ''}}</v-chip>
        <v-btn small icon @click="widgetCols(1)">
          <v-icon>mdi-plus</v-icon></v-btn>
      </div>

      <v-spacer></v-spacer>
    </v-toolbar>

    <!-- Grid of widgets -->
    <v-container fluid class="g-grid-small">
      <widget :config="statConfig"></widget>
      <widget v-for="(w, ix) in config.widgets" :key="w.id"
              :config="w" :sd="sd"
              :style="widgetStyle(w)"
              @reconfig="reconfig(ix, $event)" @edit="editWidget(ix, $event)"></widget>
    </v-container>
  </div>
</template>

<script scoped>

import Widget from '/src/components/widget'

export default {
  name: 'SmallFixedGrid',

  components: {
    Widget,
  },

  props: {
    sd: { type: Object, default() { return {} } }, // server data
    // config for the tab, currently just a list of widgets
    // each widget: { kind, id, static{k:v}, dynamic{k:v} }
    config: { type: Object, default() { return {widgets:[]}}}, // tab config
  },

  data() { return {
    add_menu: null, // true while adding widget menu is shown
    edit_ix: null, // index of widget being edited, null if not editing
  }},

  computed: {
    widgetCount() { return this.config.widgets.length },
    statConfig() { return { kind: 'stat', dynamic: {},
        static: {title: 'Widgets', editable: false, value: this.widgetCount} }},
  },

  watch: {
    // watch config and massage for schema upgrades (a bit of a hack..)
    config: { deep: true, immediate: true, handler: function(nc) {
      nc.widgets.forEach(w => {
        if (!('rows' in w)) w.rows = 1
        if (!('cols' in w)) w.cols = 1
      })
    }},
  },

  methods: {
    // propNames is a simple helper to get the property names of an object skippin "_*" ones
    propNames(o) { return Object.getOwnPropertyNames(o).filter(v=>{return !v.startsWith("_")}) },

    // genId produces a unique widget id within this container
    genId() {
      let id = this.config.widgets.length;
      this.config.widgets.forEach(w => { if (w.id >= id) id = w.id+1; })
      return id
    },

    palette() { console.log("Palette:", window.widgetPalette); return window.widgetPalette },

    // produce style options for a widget
    widgetStyle(w) {
      const row = `grid-row-start: span ${w.rows||3}`
      const col = `grid-column-start: span ${w.cols||1}`
      return `${row}; ${col};`
    },

    // addWidget adds a widget configured in the modal pop-up
    addWidget(kind) {
      let c = { kind: kind, id: this.genId(), static: { title: kind }, dynamic: {} }
      console.log(`Adding ${kind} widget`)
      // send the entire config to be updated
      this.$emit('reconfig', { topic: 'widgets', payload: this.config.widgets.concat(c) })
      this.add_modal = false
    },

    // reconfig handles a widget reconfig event, this is how config changes propagate up
    // from child components and get sent back to the server for persistence.
    // msg must have topic and payload, topic is relative to the widget's root and if null/""
    // the entire widget's config gets updated
    reconfig(ix, msg) {
      console.log(`widget reconfig(${ix}, ${msg})`)
      msg.topic = msg.topic ? `widgets.${ix}.${msg.topic}` : `widgets.${ix}`
      this.$emit('reconfig', msg) // propagate event up
    },

    // editWidget handles edit events from widgets, if 'started' then editing started else ended
    editWidget(ix, started) {
      this.edit_ix = started ? ix : null;
    },

    deleteWidget() {
      const ix = this.edit_ix
      console.log(`Deleting widget ${ix}`)
      let w = this.config.widgets.concat([]) // shallow copy
      w.splice(ix, 1) // delete the widget in question
      this.$emit('reconfig', { topic: 'widgets', payload: w })
      this.edit_ix = null
    },

    // move a widget up/down (dir=-1/1)
    moveWidget(dir) {
      const ix = this.edit_ix
      console.log(`Moving widget ${ix} by ${dir}`)
      // check that we're within bounds
      if (!(ix >= 0 && ix < this.config.widgets.length)) return
      if (!(ix+dir >= 0 && ix+dir < this.config.widgets.length)) return

      // swap widgets for move
      let ww = this.config.widgets.concat([]) // shallow copy
      const w = ww[ix]
      ww[ix] = ww[ix+dir]
      ww[ix+dir] = w
      this.$emit('reconfig', { topic: 'widgets', payload: ww })
      this.edit_ix += dir // FIXME: should only happen after the update...
    },

    // adjust number of rows spanned by widget (dir=-1/+1)
    widgetRows(dir) {
      const ix = this.edit_ix

      // getter
      if (dir === undefined) return this.config.widgets[ix].rows

      //setter
      console.log(`Adjusting widget ${ix} rows by ${dir}`)
      let w = Object.assign({}, this.config.widgets[ix])
      w.rows = (w.rows||1) + dir
      if (w.rows < 1) w.rows = 1
      if (w.rows > 16) w.rows = 16
      this.$emit('reconfig', { topic: `widgets.${ix}`, payload: w })
    },

    // adjust number of cols spanned by widget (dir=-1/+1)
    widgetCols(dir) {
      const ix = this.edit_ix

      // getter
      if (dir === undefined) return this.config.widgets[ix].cols

      // setter
      console.log(`Adjusting widget ${ix} cols by ${dir}`)
      let w = Object.assign({}, this.config.widgets[ix])
      w.cols = (w.cols||1) + dir
      if (w.cols < 1) w.cols = 1
      if (w.cols > 16) w.cols = 16
      this.$emit('reconfig', { topic: `widgets.${ix}`, payload: w })
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
