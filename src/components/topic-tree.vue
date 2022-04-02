<!-- TopicTree - Display the dashboard topic tree with values so the user can pick one.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <!-- path text field -->
  <v-text-field clearable label="topic (/-separated path)"
                :model-value="modelValue"
                @input="$emit('update:modelValue',$event)"
                append-inner-icon="mdi-file-tree"
                @click:append-inner="show_tree=!show_tree"
                v-bind="$attrs">
  </v-text-field>
  <!-- tree selector as an overlay -->
  <v-overlay v-model="show_tree" class="topic-tree">
    <v-card class="d-flex flex-column">
      <v-card-title class="d-flex width100 py-2 pb-0">
        <span>{{label}}</span>
        <v-spacer></v-spacer>
        <v-btn elevation=0 icon @click="tree=calcTree()">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
        <v-btn elevation=0 icon @click="show_tree=false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      NOT WORKING YET
      <!--v-treeview dense activatable open-on-click 
                  @update:active="treeSelect"
                  :open="path" :items="tree">
      </v-treeview-->
    </v-card>
  </v-overlay>
</template>

<style>
.topic-tree .v-treeview--dense .v-treeview-node__root { min-height: 1.5rem !important; }
.topic-tree .v-overlay__content { height: 95%; width: 95%; max-width: 400px; }
.topic-tree .v-card { height: 100%; }
.topic-tree .v-treeview { flex-grow: 1; overflow-y: scroll; }
</style>

<script scoped>

export default {
  name: "TopicTree",

  props: {
    label: { default: "path" },
    modelValue: { default: "" },
  },

  emits: [ 'update:model_value' ],

  inject: ['$store'],

  data() { return {
    show_tree: false,
    tree: [],
  }},

  computed: {
    // path is fed into v-treeview, it needs to be an array with the ids (item-keys) of each
    // item along the path (ugh)
    path() {
      if (!this.modelValue) return []
      let node = this.modelValue.split('/')
      node.pop() // remove leaf node name
      let path = node.map(()=>node)
      path = path.map((p,ix)=> p.slice(0, ix+1).join('/'))
      return path
    },
  },

  mounted() {
    this.tree = this.calcTree()
  },

  methods: {

    // tree to feed into v-treeview, nodes need to have a name and a children array
    calcTree() {
      function children(name, id, value) {
        let ret = null
        id = id === null ? name : id +'/' + name
        if (value === null || value === undefined) {
          ret = { name: `${name}: ${value}`, id }
        } else if (Array.isArray(value)) {
          ret = { name, id,
              children: Array.from(value).sort().map((v,ix) => children(ix.toString(), id, v)) }
        } else if (typeof value === 'object') {
          ret = { name, id,
              children: Object.entries(value).sort().map(([k,v])=> children(k, id, v)) }
        } else {
          ret = { name: `${name}: ${value}`, id }
        }
        //console.log(`children(${name}) -> ${JSON.stringify(ret)}`)
        return ret
      }
      
      return Object.entries(this.$store.sd).sort().map(([k,v])=> children(k, null, v))
    },

    treeSelect(ev) {
      this.show_tree = false
      console.log(`treeview ev=${JSON.stringify(ev)}`)
      this.$emit('update:modelValue', ev[0])
    },

  },
}
</script>
