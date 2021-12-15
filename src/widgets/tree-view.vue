<!-- Tree-view -- Displaty a tree of items
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <v-treeview dense :items="items" class="tree-view">
    <template v-slot:append="{item}">
      <!--{{item.mtime ? (new Date(item.mtime)).toISOString() : ""}}-->
      {{fmtSize(item.size)}}
    </template>
  </v-treeview>
</template>

<style scoped>
.unit { vertical-align: 15%; margin-left: 0.1em; }
</style>

<style>
  .tree-view.v-data-table { width: 100%; }
</style>

<script scoped>
export default {
  name: 'TreeView',
  // help displayed in the UI: the first line is used in the widgets menu and is always shown in
  // the edit card. Successive lines can be expanded in the card and are markdown-formatted.
  help: `Display Tree data.
Yadda yadda.`,

  props: {
    items: { default: null, tip: "array of items"},
  },

  computed: {
  },

  methods: {
    fmtSize(sz) {
      if (sz > 1024*1024*1024) return (sz/1024/1024/1024).toFixed(1) + "GB"
      if (sz > 1024*1024) return (sz/1024/1024).toFixed(1) + "MB"
      if (sz > 1024) return (sz/1024).toFixed(1) + "KB"
      return sz + "B"      
    }
  },

}
</script>
