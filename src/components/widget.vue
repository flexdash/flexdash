<!-- Widget - Wrapper around actual widget components providing bindings to server data as
     well as editing functionality for modifying the bindings.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

     The Widget gets passed in a configuration, which tells it which actual component to instatiate
     and to which server data variables each of the component's props need to be bound. The Widget
     then draws a v-card with a title and places the component inside.

     It provides an edit button on the widget which brings up a floating card extension with
     controls to change the bindings. The set of available properties are detected by inspecting
     the component, specifically, its list of props. (This probably will need more metadata such as
     help text in the future.)
-->

<template>
  <div><!-- without div the v-for in parent gets confused by v-menu -->
    <!-- v-menu is used to display a floating v-card below the component for editing -->
    <v-menu :value="edit_active" @input="editEvent($event)"
            offset-y content-class="popup-spacer"
            :close-on-content-click="false" :close-on-click="false">

      <!-- Widget proper, i.e. the card and its content-->
      <template v-slot:activator="{ on, attrs }">
        <v-card :color="edit_active?'highlight':''">

          <!-- Widget title & buttons shown when the child component does _not_ show the title -->
          <v-card-text v-if="!childProps.includes('title')" class="d-flex pa-0 pt-1 mb-n1">
            <!-- title and edit button -->
            <span v-if="title" class="mx-auto">{{title}}</span>
            <v-btn small icon class="justify-end align-start mt-n1" v-if="$root.editMode"
                   v-bind="attrs" v-on="on">
              <v-icon small>mdi-pencil</v-icon>
            </v-btn>
          </v-card-text>

          <!-- Widget button(s) w/o title when the child component _does_ show the title -->
          <div display:content v-else-if="$root.editMode">
            <div style="position:absolute; z-index:5; right:0; top:0.5ex;">
              <v-btn small icon class="justify-end align-start mt-n1"
                     v-bind="attrs" v-on="on">
                <v-icon small>mdi-pencil</v-icon>
              </v-btn>
            </div>
          </div>

          <!-- actual component, pass in its bindings -->
          <component :is="config.kind" v-bind="bindings" ref="comp" @send="sendData($event)">
          </component>
        </v-card>
      </template>

      <!-- Editing panel shown floating below widget -->
      <v-card color="panel">
        <v-card-title>
          <span class="headline">Edit widget {{title}}</span>
          <v-spacer></v-spacer>
          <v-btn elevation=0 icon @click="edit_active=false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>

        <v-card-text v-if="edit_active"><!-- v-if 'cause edited_xx vars not always set -->
          <v-container fluid>
            <!-- Display component properties for editing -->
            <v-row align="center">
              <!--v-col class="d-flex" cols="12">
                Widget properties: {{editProps.join(", ")}}
              </v-col-->
              <!-- For each property of the component, show a combobox to select what gets bound -->
              <v-col class="d-flex" cols="12" sm="6" md="4" v-for="prop in editProps" :key=prop>
                <v-text-field v-if="edited_type[prop]==0"
                    :label="prop" dense prefix='"' suffix='"'
                    v-model="edited_config.static[prop]">
                </v-text-field>
                <v-text-field v-if="edited_type[prop]==1"
                    :label="prop" type="number" dense
                    v-model.number="edited_config.static[prop]">
                </v-text-field>
                <v-combobox v-if="edited_type[prop]==2"
                    :label="prop" clearable dense persistent-hint
                    hint='server state variable name or dot-separated path'
                    :items="sdKeys" v-model="edited_config.dynamic[prop]">
                </v-combobox>
                <v-btn-toggle mandatory class="ml-2 mt-3"
                              v-model="edited_type[prop]">
                  <v-btn x-small icon class="pa-0"><v-icon>mdi-format-color-text</v-icon></v-btn>
                  <v-btn x-small icon class="pa-0"><v-icon>mdi-numeric</v-icon></v-btn>
                  <v-btn x-small icon class="pa-0"><v-icon>mdi-link-variant</v-icon></v-btn>
                </v-btn-toggle>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-btn @click="cancelEdit">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="saveEdit">Save</v-btn>
        </v-card-actions>
      </v-card>

    </v-menu>
  </div>
</template>

<script scoped>

export default {
  name: 'Widget',

  props: {
    id: { type: String }, // widget ID
  },

  data() { return {
    childProps: [], // props on the child component
    saved_bindings: {}, // bindings passed into inner component with watchers {propName: value}
    watchers: [], // list of watchers used in bindings so we can remove them
    // component edit panel stuff
    edit_active: false, // edit panel is open
    edited_config: null,  // modified (unsaved) config
    edited_type: {}, // 0: edited_config.dynamic[prop], 1: edited_config.static[prop]
    edited_bindings: {},  // modified (unsaved) bindings
    edited_watchers: [],  // watchers created for edited_bindings

    bindings: {},
  }},

  computed: {
    // title shown by widget wrapper
    title() { return this.bindings.title || "--" },
    // config specifies how each prop of the inner component gets set. It has "static bindings"
    // to literal values and it has "dynamic bindings" to server data fields, i.e. to
    // this.$sd[some_var] (some_var can actually be a path so it's not quite as simple).
    // { kind, id, rows, cols, static, dynamic }
    config() { return this.$config.widgets[this.id] },
    // actual bindings depending on whether we're editing or not
    // Due to problems with reactivity, trying to go ->bindings1->bindings using a watcher...
    bindings1() { return this.edit_active ? this.edited_bindings : this.saved_bindings },
    // kind of inner component, really name of html element
    kind() { return this.$config.kind },
    // list of keys from this.$sd to show in editing combobox
    sdKeys() { return this.propNames(this.$sd).sort() },
    // output binding, well, really just the topic for messages sent to the server
    outputBinding() {
      if (this.edit_active) {
        if ('_output' in this.edited_config.dynamic) return this.edited_config.dynamic._output
        if ('_output' in this.edited_config.static) return this.edited_config.static._output
      } else {
        if ('_output' in this.$config.dynamic) return this.$config.dynamic._output
        if ('_output' in this.$config.static) return this.$config.static._output
      }
      return undefined
    },
    // list if child props for editing, includes title, which often is not in childProps
    editProps() {
      if (this.childProps.includes('title'))
        return ['_output'].concat(this.childProps).sort()
      else
        return ['_output', 'title'].concat(this.childProps).sort()
    },
  },

  mounted() {
    const self = this
    // Perform inspection on the instantiated inner component to get the list of props
    // that can be passed in. This has to happen after the component has been instantiated,
    // hence the $nextTick. Hope this works reliably...
    this.$nextTick(function () {
      let cp = []
      if (this.$refs.comp && this.$refs.comp._isVue)
        cp = self.propNames(this.$refs.comp.$props)
      cp = cp.sort()
      self.childProps = cp
      //console.log(`childProps: ${self.childProps.join(",")}`)

      // giant hack to get at the type definitions of the properties
      //const propDef = Object.getPrototypeOf(this.$refs.comp.$options).props
      //self.childProps = Object.fromEntries(cp.map(p => [p, p in propDef ? propDef[p] : {}]))
    })
    //console.log("$root:", this.$root)
  },
  
  watch: {
    // Generate bindings from this.$sd[some_var] -> this.saved_bindings and -> this.edited_bindings
    // This is how data flows from the server data to the inner component.
    // It would be nice if we could make this.saved_bindings and this.edited_bindings computed
    // properties but this is not possible because it updates watchers as a side-effect.
    config: {
      immediate: true,
      deep: true,
      handler: function(config) {
        this.genBindings(config, this.saved_bindings, this.watchers)
      },
    },
    edited_config: {
      immediate: false,
      deep: true,
      handler: function(config) {
        this.genBindings(config, this.edited_bindings, this.edited_watchers)
        console.log(`edited_bindings[${this.edited_watchers.length}]:`, this.edited_bindings)
      },
    },

    edit_active(nv, ov) {
      if (nv != ov) this.$emit('edit', nv)
    },

    bindings1: {
      immediate: true,
      deep: true,
      handler: function(b) { this.bindings = Object.assign({}, b) },
    },
  },

  inject: [ 'sendSrv' ],

  methods: {
    // propNames is a simple helper to get the property names of an object skipping "_*" ones
    propNames(o) {
      return Object.getOwnPropertyNames(o).filter(v=>{
        return !v.startsWith("_") && !v.startsWith("$")
      })
    },

    // addDynBinding adds a dynamic binding of this.$sd[var_name] -> bindings[key]
    addDynBinding(bindings, key, var_name) {
      const self = this
      //console.log(`dynamic binding from ${var_name} to ${key}`)
      self.$set(bindings, key, self.$sd[var_name])
      return this.$watch(
          () => { return self.$sd[var_name] },
          (newVal) => { self.$set(bindings, key, newVal) },
          {deep: true, immediate: true})
    },

    removeWatchers(watchers) {
      watchers.forEach(w => {w()})
      watchers.length = 0
    },

    // Generate bindings from this.$sd -> bindings according to config. Collect watchers created.
    genBindings(config, bindings, watchers) {
      console.log("Generating bindings, config:", config)
      this.removeWatchers(watchers)
      // generate bindings (we assume the set of props in bindings never changes hence no removal)
      if (config) {
        this.propNames(config.static).forEach(p => {
          this.$set(bindings, p, config.static[p])
        })
        this.propNames(config.dynamic).forEach(p => {
          watchers.push( this.addDynBinding(bindings, p, config.dynamic[p]) )
        })
      }
    },

    editEvent(ev) {
      console.log("EditEvent:", ev)
      if (!ev || this.edit_active) { this.edit_active = false; return }

      console.log("Starting edit")
      const self = this
      // clone this.$config to this.edited_config 2-levels deep
      this.edited_config = {}
      this.propNames(this.$config).forEach(p => {
        self.$set(self.edited_config, p, typeof self.$config[p] === 'object' ?
            Object.assign({}, self.$config[p]) : self.$config[p])
      })
      // show the editing card
      this.edit_active = true
    },

    cancelEdit() {
      this.edit_active = false
      this.removeWatchers(this.edited_watchers)
      this.edited_config = null
      this.edited_bindings = {}
    },

    saveEdit() {
      this.$emit('reconfig', { topic: null, payload: this.edited_config})
      this.edit_active = false
    },

    sendData(data) {
      console.log("It wants to send", data)
      const ob = this.outputBinding
      if (ob) this.sendSrv(ob, data)
      else console.log("Ouput binding is not set")
    },
  },

}

</script>

<style scoped>
.v-card { height: 100%; width: 100% }
.popup-spacer { margin-top: 1px; margin-bottom: 1px; }
.v-input__append-outer { margin-left: 0px !important; }
</style>
