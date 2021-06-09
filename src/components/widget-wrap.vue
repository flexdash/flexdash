<!-- Widget - Wrapper around actual widget components providing bindings to server data.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

     The Widget gets passed in a configuration, which tells it which actual component to instatiate
     and to which server data variables each of the component's props need to be bound. The Widget
     then draws a v-card with a title and places the component inside.
-->

<template>
  <!--class="d-flex flex-column justify-start align-center"-->
  <v-card :color="color" :class="full_page ? 'full-page' : undefined"
          style="overflow: hidden">

    <!-- Widget title & buttons shown when the child component does _not_ show the title -->
    <v-card-text v-if="!('title' in child_props) && title" class="d-flex pa-0 pt-1 mb-n1">
      <!-- title and edit button -->
      <span v-if="title" class="mx-auto">{{title}}</span>
      <v-btn small icon class="justify-end align-start mt-n1" v-if="$root.editMode"
             @click="handleEdit">
        <v-icon small>mdi-pencil</v-icon>
      </v-btn>
    </v-card-text>

    <!-- Widget edit button w/o title when the child component shows the title itself -->
    <!--div display:content v-else-if="$root.editMode"-->
      <!-- we need to make sure we're floating way above the widget content... -->
      <div v-else-if="$root.editMode"
           style="position:absolute; z-index:5; right:0; top:0.5ex;">
        <v-btn small icon class="justify-end align-start mt-n1" @click="handleEdit">
          <v-icon small>mdi-pencil</v-icon>
        </v-btn>
      </div>
    <!--/div-->

    <div v-if="can_full_page && !$root.editMode" class="full-page-btn"
         style="position:absolute; right:0; top:0.5ex;">
        <v-btn small icon @click="toggleFullPage"
               class="justify-center align-center mt-n1">
          <!--v-icon small style="background-color:red">mdi-arrow-expand-all</v-icon-->
          <v-icon small>{{full_page ? "mdi-arrow-collapse" : "mdi-arrow-expand"}}</v-icon>
        </v-btn>
    </div>

    <!-- actual component, pass in its bindings -->
    <component :is="config.kind" v-bind="bindings" ref="comp" @send="sendData($event)">
    </component>
  </v-card>
</template>

<style scoped>
.v-card { height: 100%; width: 100% }
.v-card { display: flex; flex-direction: column; justify-content: flex-start; align-items: center }
.v-card.full-page { position: absolute; left: 1%; top: 1%; z-index: 10; width: 98%; height: 98% }
.v-card.full-page .full-page-btn { z-index: 11 }
.theme--light.v-btn--icon { background-color: #ffffff; }
.theme--dark.v-btn--icon  { background-color: #1e1e1e; }
</style>

<script scoped>

import { walkTree } from '/src/store.js'

export default {
  name: 'WidgetWrap',

  props: {
    suppress_output: { type: Boolean, default: true }, // suppress child output reaching store.sd
    color: { type: String, default: undefined }, // background color to highlight the card

    // config specifies how each prop of the inner component gets set. It has "static bindings"
    // to literal values and it has "dynamic bindings" to server data fields, i.e. to
    // store.sd[some_var] (some_var can actually be a path so it's not quite as simple).
    // { kind, id, rows, cols, static, dynamic } (rows & cols are managed by the grid)
    // TODO: should sanity-check the config and show a broken-widget widget if it's not OK
    // TODO: display a 'missing' widget if the component can't be loaded
    config: { type: Object, required: true },
  },

  data() { return {
    watchers: [], // list of watchers used in bindings so we can remove them
    bindings: {}, // mapping of prop_name -> current_value used in v-bind to child
    full_page: false,
  }},

  computed: {
    // title shown by widget wrapper
    title() { return this.bindings.title || "" },

    // child_props holds a description of the properties of the child component, this is used to
    // convert types and raise warning messages. (Note that this is not reactive in the component
    // definition.)
    child_props() {
      const p = this.palette.widgets
      if (this.config.kind in p) return p[this.config.kind].props || {}
      return {}
    },

    can_full_page() {
      const p = this.palette.widgets
      if (this.config.kind in p) return p[this.config.kind].full_page
      return false
    },
  },

  watch: {
    // Generate bindings from store.sd[some_var] -> this.bindings
    // This is how data flows from the server data to the inner component.
    // It would be nice if we could make this.bindings computed properties but this is not
    // possible because we have to update this.watchers as a side-effect.
    config: {
      immediate: true,
      deep: true,
      handler(config) { this.genBindings(config) },
    },
  },

  inject: [ '$store', 'palette' ],

  methods: {
    // addDynBinding adds a dynamic binding of store.sd[var_name] -> bindings[key]
    addDynBinding(key, var_name) {
      const self = this
      if (!var_name) return ()=>{} // empty/null var_name happens during editing
      let path = var_name.split('/').filter(t => t.length > 0)
      if (path.length == 0) return null // can't bind to root
      const n = path.pop()
      const dir = walkTree(this.$store.sd, path)
      // now bind to dir[n]
      if (!(n in dir)) {
        // in vue2 we can't add a watcher to something that doesn't exist
        // so we create it as undefined and handle that properly when we eventually insert
        // something *it's a hack*
        self.$set(dir, n, undefined)
      }
      const w = this.$watch(
          () => dir[n],
          (newVal) => { self.updateBindingValue(key, newVal) },
          {deep: true, immediate: true})
      return w
    },

    removeWatchers() {
      this.watchers.forEach(w => {w()})
      this.watchers.length = 0
    },

    // Generate bindings from store.sd -> bindings according to config. Collect watchers created.
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
            this.watchers.push( this.addDynBinding(p, config.dynamic[p]) )
        })
      }
    },

    // Update the value of a dynamic binding, perform some type conversion in the process
    // so we match the type declaration.
    // FIXME: need to have some warning show up in UI if the validation will fail 'cause otherwise
    // it's very difficult to locate such issues
    updateBindingValue(prop, val) {
      if (!(prop in this.child_props)) {
        console.log(`Warning: updating value for ${prop}, but ${this.config.kind} has no ${prop}:`,
          JSON.stringify(this.child_props))
        return
      }
      let type = this.child_props[prop].type // note: may be undefined...

      if (type === Boolean) {
        if (typeof val === 'number') {
          val = !!val
        } else if (typeof val === 'string') {
          val = val.toLowerCase()
          val = ['true','ok','1','yes'].includes(val)
        } else if (typeof val !== 'boolean') {
          val = undefined
        }

      } else if (type === Number) {
        if (typeof val === 'string') val = parseFloat(val)
        else if (typeof val === 'boolean') val = val ? 1 : 0
        else if (typeof val !== 'number') val = undefined
        if (val !== undefined)
          val = Number.parseFloat(val.toPrecision(4)) // FIXME: let the user specify precision

      } else if (type === String) {
        if (typeof val === 'number') val = val.toString()
        else if (typeof val !== 'string') val = JSON.stringify(val)

      } else if ((type === Array || type === Object) && typeof val === 'string') {
        try {
          val = JSON.parse(val)
        } catch (exc) {
          val = undefined
          // FIXME: should have a warning show in the UI while in edit mode
          console.log(`Cannot convert string value for ${prop} to ${type.name}`)
        }
      }

//console.log(`Updating ${this.config.kind}.${prop}[${type&&type.name}] <- ${typeof val} ${val}`)

      this.$set(this.bindings, prop, val)
    },

    handleEdit() { console.log(`handleEdit() in widget-wrap`); this.$emit('edit', 'toggle') },

    toggleFullPage() { this.full_page = !this.full_page },

    // handler for 'send' events emitted by widget
    sendData(data) {
      let o = this.config.output
      if (!this.suppress_output && o) {
        if (!o.startsWith("$demo"))
          console.log(`Widget ${this.config.kind}[${this.config.id}] sending ${o} <-`, data)
        this.$root.serverSend(o, data)
      } else {
        console.log(`Output of widget ${this.config.kind}[${this.config.id}] suppressed`)
      }
    },
  },

}

</script>
