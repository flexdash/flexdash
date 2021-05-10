<template>
  <div>
    <!-- Floating button and menu to add a widget -->
    <v-menu offset-x min-width="10em" v-model="add_menu">
      <!-- Menu activator, i.e. the floating button -->
      <template v-slot:activator="{ on, attrs }">
          <v-btn fab right absolute small class="primary" style="z-index:10; margin-top:1em;"
                 v-bind="attrs" v-on="on">
            <v-icon>mdi-plus-box</v-icon>
          </v-btn>
      </template>

      <!-- Menu to add a widget -->
      <v-list>
        <v-list-item v-for="kind in palette()" :key="kind" @click="addWidget(kind)">
          <v-list-item-title>{{kind}}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- Grid of widgets -->
    <v-container fluid class="g-grid-small">
      <widget :config="statConfig"></widget>
      <widget v-for="(w, ix) in config.widgets" :key="w.id"
              :config="w" :sd="sd" @reconfig="reconfig(ix, $event)"></widget>
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
    config: { type: Object, default() { return {widgets: [] }}}, // tab config
  },

  data() { return {
    add_menu: null, // true while adding widget menu is shown
  }},

  computed: {
    // extract widgets from config
    widgetCount() { return this.config.widgets.length },
    statConfig() { return { kind: 'stat', dynamic: {},
        static: {title: 'Widgets', editable: false, value: this.widgetCount} }},
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

    // addWidget adds a widget configured in the modal pop-up
    addWidget(kind) {
      let c = { kind: kind, id: this.genId(), static: { title: kind }, dynamic: {} }
      console.log(`Adding ${kind} widget`)
      // send the entire config to be updated
      this.$emit('reconfig', { topic: 'widgets', payload: this.config.widgets.concat(c) })
      this.add_modal = false
    },

    // reconfig handles a widget reconfig event, this is how config changes propagate up
    // and get sent back to the server for persistence.
    // msg must have topic and payload, topic is relative to the widget's root and if null/""
    // the entire widget's config gets updated
    reconfig(ix, msg) {
      console.log(`widget reconfig(${ix}, ${msg})`)
      msg.topic = msg.topic ? `widgets.${ix}.${msg.topic}` : `widgets.${ix}`
      this.$emit('reconfig', msg) // propagate event up
    },
  },

}

</script>

<style scoped>
/* not sure why this is here... */
.gauge-large .gauge-value { line-height: 3rem; font-size: 2rem; }
.gauge-large .gauge-title { line-height: 1.5rem; font-size: 1rem; }

.g-grid {
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
.g-2w { grid-column: span 2; }
.g-2w-2h { grid-column: span 2; grid-row: span 2; }
.g-3w { grid-column: span 3; }
.g-3w-2h { grid-column: span 3; grid-row: span 2; }
.g-4w-2h { grid-column: span 4; grid-row: span 2; }
.g-in-card .v-card { background-color:#eeeeee; }
</style>
