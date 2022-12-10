<!-- Widget - Wrapper around actual widget components providing bindings to server data.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

     The Widget gets passed in a configuration, which tells it which actual component to instatiate
     and to which server data variables each of the component's props need to be bound. The Widget
     then draws a v-card with a title and places the component inside.
-->

<template>
  <v-card :color="color"
          :elevation="no_border ? 0 : undefined"
          :outlined="no_border && canEdit">

    <!-- Widget title & buttons shown when the child component does _not_ show the title -->
    <v-card-text v-if="!has_title && title"
                 class="flex-grow-0 flex-shrink-0 px-0 pt-1 pb-0 mb-n1">
      <!-- title and edit button -->
      <span v-if="title" class="mx-auto text-no-wrap">{{title}}</span>
      <v-btn v-if="canEdit" density="compact" flat class="edit-btn" @click="handleEdit">
        <v-icon icon="mdi-pencil" size="small" />
      </v-btn>
    </v-card-text>

    <!-- Widget edit button w/o title or when the child component shows the title itself -->
    <!-- we need to make sure we're floating way above the widget content... -->
    <v-btn v-else-if="canEdit && !isPanel" density="compact" flat class="edit-btn" style="z-index:5"
           @click="handleEdit">
      <v-icon icon="mdi-pencil" size="small" />
    </v-btn>
    <!-- hack to offset edit button for panel -->
    <v-btn v-else-if="canEdit && isPanel" density="compact" flat class="edit-panel-btn" style="z-index:5"
           @click="handleEdit">
      <v-icon icon="mdi-pencil-box-outline" size="large" />
    </v-btn>

    <!-- Icon to show widget full-page and icon to show pop-up info -->
    <div v-if="(can_full_page || has_pup_info) && !global.editMode" class="full-page-btn">
        <v-btn density="compact" flat v-if="can_full_page" @click="toggleFullPage"
               class="justify-center align-center mt-n1 px-2">
          <!--v-icon small style="background-color:red">mdi-arrow-expand-all</v-icon-->
          <v-icon size="small">{{full_page ? "mdi-arrow-collapse" : "mdi-arrow-expand"}}</v-icon>
        </v-btn>
        <v-btn density="compact" flat v-if="has_pup_info" @click="togglePupInfo"
               class="justify-center align-center mt-n1 px-2">
          <v-icon size="small">{{pup_info ? "mdi-information-off" : "mdi-information"}}</v-icon>
        </v-btn>
    </div>

    <!-- actual component, pass in its bindings -->
    <component :is="widget_kind" :id="config.id" v-bind="final_bindings" ref="comp"
               @send="sendData($event)" class="my-auto">
    </component>

    <!-- dialog box to view the widget magnified full-page -->
    <v-dialog v-model="full_page" class="widget-wrap-full-page">
      <v-card :color="color" class="u-tooltip-attach">
        <!-- Widget title & collapse button -->
        <v-card-text v-if="!has_title && title"
                    class="flex-grow-0 flex-shrink-0 px-0 pt-1 pb-0 mb-n1">
          <span v-if="title" class="mx-auto text-no-wrap">{{title}}</span>
          <v-btn density="compact" flat class="full-page-btn" @click="toggleFullPage">
            <v-icon icon="mdi-arrow-collapse" size="small" />
          </v-btn>
        </v-card-text>
        <!-- actual component, pass in its bindings -->
        <component :is="widget_kind" :id="config.id" v-bind="final_bindings" ref="comp"
                  @send="sendData($event)" class="my-auto">
        </component>
      </v-card>
    </v-dialog>

    <!-- dialog box to view the widget's pop-up "help" information full-page -->
    <v-dialog v-model="pup_info" width="80%" max-width="100ex">
      <v-card v-if="pup_info" class="d-flex flex-column height100">
        <v-card-title class="d-flex align-center width100">
          <span>{{title || "Information"}}</span>
          <v-spacer></v-spacer>
          <v-btn elevation=0 flat class="pr-0" @click="pup_info=false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="flex-grow-1">
          <md class="pt-1" style="width:100%">{{bindings.popup_info}}</md>
        </v-card-text>
      </v-card>
    </v-dialog>

  </v-card>
</template>

<style scoped>
.v-card { height: 100%; width: 100%; overflow: hidden; }
.v-card { display: flex; flex-direction: column; justify-content: flex-start; align-items: center }
.v-card .full-page-btn {
  position:absolute; z-index:4; right:0; top:0.5ex;

}
.v-card .full-page-btn button { padding: 0px 8px; min-width: 0px; }

.v-card .edit-btn {
  position: absolute; right: 0px; top: 0px; padding: 0px; min-width: 0px; z-index: 1;
}
.v-card .edit-panel-btn {
  position: absolute; right: 20px; top: -0px; padding: 0px; min-width: 0px; z-index: 1;
}
.theme--light.v-btn--icon { background-color: rgba(255, 255, 255, 0.6); }
.theme--dark.v-btn--icon  { background-color: rgba(30, 30, 30, 0.6); }
</style>
<style>
  .widget-wrap-full-page .v-overlay__content { width: calc(100% - 48px); height: 100% }
</style>


<script scoped>

import { walkTree } from '/src/store.js'
import Md from '/src/components/md.vue'
//import sfcLoader from '/src/utils/sfc-loader.js'

export default {
  name: 'WidgetWrap',

  components: { Md },
  inject: [ '$store', '$conn', 'palette', 'global' ],

  props: {
    color: { type: String, default: undefined }, // background color to highlight the card
    no_border: { type: Boolean, default: false }, // true causes no "card" border, used by panel
    editable: { type: Boolean, default: true }, // whether to show edit button

    // config specifies how each prop of the inner component gets set. It has "static bindings"
    // to literal values and it has "dynamic bindings" to server data fields, i.e. to
    // store.sd[some_var] (some_var can actually be a path so it's not quite as simple).
    // { kind, id, rows, cols, static, dynamic } (rows & cols are managed by the grid)
    // TODO: should sanity-check the config and show a broken-widget widget if it's not OK
    // TODO: display a 'missing' widget if the component can't be loaded
    config: { type: Object, required: true },
  },

  emits: [ 'edit' ],

  data() { return {
    watchers: [], // list of watchers used in bindings so we can remove them
    bindings: {}, // mapping of prop_name -> current_value used in v-bind to child
    full_page: false, // toggle to show widget full-page
    pup_info: false, // toggle to show pop-up info
  }},

  computed: {
    // has_title is true if the widget wants the title prop to be set
    // unfortunately, title is an html attribute that causes an on-hover tooltip to be shown
    // so we have to suppress it for widgets that don't have a title prop
    has_title() { return 'title' in this.child_props },

    // title shown by widget wrapper, special handling for unknown widgets, etc
    // also see comment for has_title
    title() {
      if (this.widget_kind.startsWith("__")) return this.config.kind
      return this.bindings.title || ""
    },

    // bindings with only the props actually wanted by the widget, eliminates title if
    // not wanted
    final_bindings() {
      return Object.fromEntries(Object.entries(this.bindings).filter(([k,v]) => k in this.child_props))
    },

    canEdit() { return this.global.editMode && this.editable },
    isPanel() { return this.config.kind == "Panel" },

    // child_props holds a description of the properties of the child component, this is used to
    // convert types and raise warning messages. (Note that this is not reactive in the component
    // definition.)
    child_props() {
      const p = this.palette.widgets
      const t = { type: String }
      if (this.config.kind in p) return p[this.config.kind].props || {}
      return {}
    },
    // child_props plus title prop, which may be "missing" due to being automatic
    child_props_plus() { return { title:{type:String}, ...this.child_props } },

    // widgets can be shown full-page if they have a "full-page" property
    can_full_page() {
      const p = this.palette.widgets
      if (this.config.kind in p) return p[this.config.kind].full_page
      return false
    },

    // any widget can have a pop-up information/help panel by having a popup_info property
    has_pup_info() {
      return !!this.bindings.popup_info
    },

    // flag dynamically loaded single-file-component widgets
    is_sfc() { return this.config.kind.startsWith("nr__") && this.config.static?.source },

    // intercept the widget kind and deal with dynamically created widgets as well as unknown widgets
    widget_kind() {
      const p = this.palette.widgets
      if (this.config.kind in p) return this.config.kind
      if (this.is_sfc) {
        //sfcLoader(this.config.kind, this.config.static?.source, p)    
      }
      return this.config.kind.startsWith('nr__') ? 'LoadingWidget__' : 'UnknownWidget__'
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
    // The palette is loaded async, this can cause some widgets to be loaded after they are
    // already instantiated. They end up as UnknownWidget initially and most of the bindings
    // are skipped 'cause UnknownWidget doesn't have props. So we watch widget_kind and
    // regenerate bindings when the widget code is loaded and changes from UnknownWidget.
    widget_kind: {
      handler(kind) { this.genBindings(this.config) },
    },
  },

  methods: {
    // addDynBinding adds a dynamic binding of store.sd[var_name] -> bindings[key]
    addDynBinding(key, var_name) {
      const self = this
      if (!var_name || typeof var_name != 'string') return ()=>{} // empty/null var_name happens during editing
      let path = var_name.split('/').filter(t => t.length > 0)
      if (path.length == 0) return null // can't bind to root
      //console.log(`Dyn binding to ${JSON.stringify(path)}`)
      const n = path.pop()
      // create watcher, important: the walkTree has to happen in the watch query function
      const w = this.$watch(
          () => walkTree(this.$store.sd, path)[n],
          (newVal, oldVal) => { if (newVal != oldVal) self.updateBindingValue(key, newVal) },
          {deep: true, immediate: true})
      return w
    },

    removeWatchers() {
      this.watchers.forEach(w => {w()})
      this.watchers.length = 0
    },

    // Generate bindings from store.sd -> this.bindings according to config. Collect watchers created.
    genBindings(config) {
      //console.log("Generating bindings, config:", JSON.stringify(config))
      this.removeWatchers()
      // generate bindings, dynamic overrides static
      this.bindings = {}
      if (config) {
        if (config.output) this.bindings['output_binding'] = config.output
        Object.keys(config.static||{}).forEach(p => {
          if (this.is_sfc && p == 'source') return // ignore source for sfc widgets
          if (!(p in this.child_props_plus)) return
          const type = this.child_props[p]?.type
          if (config.static[p] !== undefined && config.dynamic[p] === undefined) {
            try {
              this.bindings[p] = this.typeCast(config.static[p], type)
            } catch(e) {
              console.log(`Warning: for ${this.widget_kind} failed to type-cast prop '${p}': ${e}`) // FIXME: show in UI!
            }
          }
        })
        Object.keys(config.dynamic||{}).forEach(p => {
          if (this.is_sfc && p == 'source') return // ignore source for sfc widgets
          if (!(p in this.child_props_plus)) return
          if (config.dynamic[p] === true && config.dyn_root) {
            this.watchers.push( this.addDynBinding(p, config.dyn_root + '/' + p) )
          } else if (config.dynamic[p] !== undefined) {
            this.watchers.push( this.addDynBinding(p, config.dynamic[p]) )
          }
        })
      }
    },

    // Update the value of a dynamic binding, perform some type conversion in the process
    // so we match the type declaration.
    // FIXME: need to have some warning show up in UI if the validation will fail 'cause otherwise
    // it's very difficult to locate such issues
    updateBindingValue(prop, val) {
      if (!(prop in this.child_props_plus)) {
        console.log(`Warning: updating value for ${prop}, but ${this.config.kind} has no ${prop}:`,
          JSON.stringify(this.child_props_plus))
        return
      }
      let type = this.child_props_plus[prop].type // note: may be undefined...

      try {
        //console.log(`Updating ${this.config.kind}.${prop}[${type&&type.name}] <- ${typeof val}`, val)
        val = this.typeCast(val, type)
        this.bindings[prop] = val
      } catch(e) {
        console.log(`Warning: for ${this.widget_kind} failed to type-cast prop '${prop}': ${e}`)
      }
    },

    typeCast(val, type) {
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
        if (val === null) ;
        else if (typeof val === 'number') val = val.toString()
        else if (typeof val !== 'string') val = JSON.stringify(val)

      } else if ((type === Array || type === Object) && typeof val === 'string') {
        try {
          val = JSON.parse(val)
        } catch (exc) {
          val = undefined
          // FIXME: should have a warning show in the UI while in edit mode
          throw new Error(`cannot convert JSON value to ${type.name}`)
        }
      }
      return val
    },

    handleEdit() { this.$emit('edit', 'toggle') },

    toggleFullPage() { this.full_page = !this.full_page; if (this.full_page) this.pup_info = false },
    togglePupInfo() { this.pup_info = !this.pup_info; if (this.pup_info) this.full_page = false },

    // handler for 'send' events emitted by widget
    sendData(data) {
      let o = this.config.output
      if (o) {
        // if (!o.startsWith("$demo"))
        //   console.log(`Widget ${this.config.kind}[${this.config.id}] sending ${o} <-`, data)
        this.$conn.serverSend(o, data)
      }
    },
  },

}

</script>
