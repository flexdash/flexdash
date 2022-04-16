<!-- WidgetEditToolbar - simple toolbar for widget/panel edit panel
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-toolbar flat border rounded color="rgba(128, 128, 128, 0.1)"
             class="widget-edit-toolbar mx-4 px-1 justify-space-between">
    <!-- delete widget -->
    <v-btn v-if="!global.noAddDelete" elevation="2" @click="$emit('delete')">Delete {{kind}}</v-btn>
    <v-spacer></v-spacer>
    <div class="d-flex align-center">
      <!-- panel-only: switch between solid vs grid -->
      <v-tooltip bottom v-if="kind=='panel'">
        <template v-slot:activator="{ props }">
          <v-switch hide-details label="solid" color="primary" class="mt-0 mr-3" v-bind="props"
                    :true-value="true" :false-value="false"
                    :model-value="!!widget.static.solid" @update:modelValue="$emit('changeSolid', $event)">
          </v-switch>
        </template>
        <span>Solid panel background vs transparent panel</span>
      </v-tooltip>
      <!-- move widget -->
      <widget-move :widget_id="widget_id" @move="teleport"></widget-move>
      <!-- clone widget -->
      <v-tooltip bottom v-if="!global.noAddDelete">
        <template v-slot:activator="{ props }">
          <v-btn small icon @click="$emit('clone')" class="ml-2" v-bind="props">
            <v-icon>mdi-folder-multiple</v-icon></v-btn>
        </template>
        <span>Duplicate/clone {{kind}}</span>
      </v-tooltip>
      <!-- move widget up/down -->
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-btn small icon @click="moveWidget(-1)" class="ml-2" v-bind="props">
            <v-icon>mdi-arrow-up-bold</v-icon></v-btn>
        </template>
        <span>Move {{kind}} towards the top-left of the grid</span>
      </v-tooltip>
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-btn small icon @click="moveWidget(1)" v-bind="props">
            <v-icon>mdi-arrow-down-bold</v-icon></v-btn>
        </template>
        <span>Move {{kind}} towards the bottom-right of the grid</span>
      </v-tooltip>
    </div>
    <v-spacer></v-spacer>
    <div>
      <!-- adjust widget rows -->
      <v-btn small icon @click.stop="adjustRows(-1)" class="ml-2">
        <v-icon>mdi-minus</v-icon></v-btn>
      <v-chip small>{{widget.rows}} row{{widget.rows > 1?'s':''}}</v-chip>
      <v-btn small icon @click.stop="adjustRows(1)">
        <v-icon>mdi-plus</v-icon></v-btn>
      <!-- adjust widget columns -->
      <v-btn small icon @click.stop="adjustCols(-1)" class="ml-2">
        <v-icon>mdi-minus</v-icon></v-btn>
      <v-chip small>{{widget.cols}} col{{widget.cols > 1 ? 's' : ''}}</v-chip>
      <v-btn small icon @click.stop="adjustCols(1)">
        <v-icon>mdi-plus</v-icon></v-btn>
    </div>
  </v-toolbar>
</template>

<style>
  .widget-edit-toolbar .v-toolbar__content { justify-content: space-between; }
</style>

<script scoped>

import WidgetMove from '/src/edit-panels/widget-move.vue'
//import copyToClipboard from '/src/utils/clipboard.js'

export default {
  name: 'WidgetEditToolbar',

  components: { WidgetMove },

  props: {
    widget_id: { type: String, required: true }, // my widget ID
    kind: { String, required: true }, // widget or panel
  },

  emits: [ 'delete', 'clone', 'move', 'teleport', 'changeSolid' ],

  inject: [ '$store', 'global' ],

  data() { return {
  }},

  computed: {
    widget() { return this.$store.widgetByID(this.widget_id) },
  },

  methods: {
    // adjust number of rows spanned by widget (dir=-1/+1)
    adjustRows(dir) {
      const w = this.widget
      let r = (w.rows||1) + dir
      if (r < 1) r = 1
      if (r > 16) r = 16
      this.$store.updateWidget(this.widget_id, {rows: r})
    },

    // adjust number of cols spanned by widget (dir=-1/+1)
    adjustCols(dir) {
      const w = this.widget
      let c = (w.cols||1) + dir
      if (c < 1) c = 1
      if (c > 16) c = 16
      this.$store.updateWidget(this.widget_id, {cols: c})
    },

    moveWidget(dir) {
      this.$emit('move', dir)
    },

    teleport(src, dst) {
      this.$emit('teleport', src, dst)
    }

    // copyWidget(dir) {
    //   copyToClipboard(JSON.stringify(this.$store.widgetByID(this.id)))
    //   // FIXME: need some visual feedback
    // },

  },

}

</script>
