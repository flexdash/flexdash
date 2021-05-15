<!-- Widget - Wrapper around actual widget components providing bindings to server data.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

     The Widget gets passed in a configuration, which tells it which actual component to instatiate
     and to which server data variables each of the component's props need to be bound. The Widget
     then draws a v-card with a title and places the component inside.
-->

<template>
  <v-card :color="color">

    <!-- Widget title & buttons shown when the child component does _not_ show the title -->
    <v-card-text v-if="!('title' in child_props)" class="d-flex pa-0 pt-1 mb-n1">
      <!-- title and edit button -->
      <span v-if="title" class="mx-auto">{{title}}</span>
      <v-btn small icon class="justify-end align-start mt-n1" v-if="$root.editMode"
             @click="handleEdit">
        <v-icon small>mdi-pencil</v-icon>
      </v-btn>
    </v-card-text>

    <!-- Widget edit button w/o title when the child component shows the title itself -->
    <div display:content v-else-if="$root.editMode">
      <!-- we need to make sure we're floating way above the widget content... -->
      <div style="position:absolute; z-index:5; right:0; top:0.5ex;">
        <v-btn small icon class="justify-end align-start mt-n1" @click="handleEdit">
          <v-icon small>mdi-pencil</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- actual component, pass in its bindings -->
    <component :is="config.kind" v-bind="bindings" ref="comp" @send="sendData($event)">
    </component>
  </v-card>
</template>

<script scoped>

export default {
  name: 'WidgetWrap',

  props: {
    suppressOutput: { type: Boolean, default: true }, // suppress child output reaching this.$sd
    color: { type: String, default: undefined }, // background color to highlight the card

    // config specifies how each prop of the inner component gets set. It has "static bindings"
    // to literal values and it has "dynamic bindings" to server data fields, i.e. to
    // this.$sd[some_var] (some_var can actually be a path so it's not quite as simple).
    // { kind, id, rows, cols, static, dynamic } (rows & cols are managed by the grid)
    // TODO: should sanity-check the config and show a broken-widget widget if it's not OK
    config: { type: Object, required: true },
  },

  data() { return {
    watchers: [], // list of watchers used in bindings so we can remove them
    bindings: {}, // mapping of prop_name -> current_value used in v-bind to child
  }},

  computed: {
    // title shown by widget wrapper
    title() { return this.bindings.title || "--" },

    // child_props holds a description of the properties of the child component, this is used to
    // convert types and raise warning messages. (Note that this is not reactive in the component
    // definition.)
    child_props() {
      const p = window.widgetPalette
      if (this.config.kind in p) return p[this.config.kind].props || {}
      return {}
    },
  },

  watch: {
    // Generate bindings from this.$sd[some_var] -> this.bindings
    // This is how data flows from the server data to the inner component.
    // It would be nice if we could make this.bindings computed properties but this is not
    // possible because we have to update this.watchers as a side-effect.
    config: {
      immediate: true,
      deep: true,
      handler(config) { this.genBindings(config) },
    },
  },

  inject: [ 'sendSrv' ],

  methods: {
    // addDynBinding adds a dynamic binding of this.$sd[var_name] -> bindings[key]
    // TODO: perform type conversion and precision adjustment when assigning
    addDynBinding(bindings, key, var_name) {
      const self = this
      console.log(`New dynamic binding from ${var_name} to ${key}, currently: ${self.$sd[var_name]}`)
      self.$set(bindings, key, self.$sd[var_name])
      return this.$watch(
          () => { return self.$sd[var_name] },
          (newVal) => { self.$set(bindings, key, newVal) },
          {deep: true, immediate: true})
    },

    removeWatchers() {
      this.watchers.forEach(w => {w()})
      this.watchers.length = 0
    },

    // Generate bindings from this.$sd -> bindings according to config. Collect watchers created.
    genBindings(config) {
      //console.log("Generating bindings, config:", config)
      this.removeWatchers()
      // generate bindings, dynamic overrides static
      this.bindings = {}
      if (config) {
        Object.keys(config.static||{}).forEach(p => {
          if (config.static[p] !== undefined)
            this.$set(this.bindings, p, config.static[p])
        })
        Object.keys(config.dynamic||{}).forEach(p => {
          if (config.dynamic[p] !== undefined)
            this.watchers.push( this.addDynBinding(this.bindings, p, config.dynamic[p]) )
        })
      }
    },

    handleEdit() { console.log(`handleEdit() in widget-wrap`); this.$emit('edit', 'toggle') },

    sendData(data) {
      const o = this.config.output
      if (!this.suppressOutput && o) {
        console.log(`Widget ${this.config.kind}[${this.config.id}] sending ${o} <-`, data)
        this.sendSrv(o, data)
      } else {
        console.log(`Output of widget ${this.config.kind}[${this.config.id}] suppressed`)
      }
    },
  },

}

</script>

<style scoped>
.v-card { height: 100%; width: 100% }
</style>
