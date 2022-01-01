<!-- TopicTree - Display the dashboard topic tree with values so the user can pick one.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div style="display: content;">
    <!-- path text field -->
    <v-text-field dense clearable persistent-hint :label="label" :hint="hint" :value="value"
                  @input="$emit('input',$event)">
      <template v-slot:append-outer>
        <v-btn icon x-small @click="show_tree=!show_tree">
          <v-icon>mdi-file-tree</v-icon>
        </v-btn>
      </template>
    </v-text-field>
    <!-- tree selector as an overlay -->
    <v-overlay v-model="show_tree" class="topic-tree" :dark="false">
      <v-card class="d-flex flex-column">
        <v-card-title class="d-flex align-baseline width100 pt-0 pb-0">
          <span>{{label}}</span>
          <v-spacer></v-spacer>
          <v-btn elevation=0 icon @click="tree=calcTree()">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
          <v-btn elevation=0 icon @click="show_tree=false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-treeview dense activatable open-on-click 
                    @update:active="treeSelect"
                    :open="path" :items="tree">
        </v-treeview>
      </v-card>
    </v-overlay>
  </div>
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
    hint: { default: "" },
    value: { default: "" },
  },

  inject: ['$store'],

  data() { return {
    show_tree: false,
    tree: [],
  }},

  computed: {
    // path is fed into v-treeview, it needs to be an array with the ids (item-keys) of each
    // item along the path (ugh)
    path() {
      if (!this.value) return []
      let node = this.value.split('/')
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
      this.$emit('input', ev[0])
    },

  },
}
</script>
