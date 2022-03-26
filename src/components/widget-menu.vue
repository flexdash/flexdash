<!-- WidgetMenu - Display button to add a widget via a menu
     When a menu entry is selected, emits a 'select' event with the widget kind.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-menu offset-y v-model="show">
    <!-- Menu activator, i.e. the button -->
    <template v-slot:activator="{ on:menu, attrs }">
      <v-tooltip bottom>
        <template v-slot:activator="{ on:tt }">
          <v-btn small icon :class="button_class" color="primary" v-bind="attrs" v-on="{...tt, ...menu}">
            <v-icon>mdi-card-plus</v-icon>
          </v-btn>
        </template>
        <span>Add a widget to the end of the grid</span>
      </v-tooltip>
    </template>
    <!-- Menu content -->
    <v-list>
      <v-list-subheader>Add Widget to the end of the grid</v-list-subheader>
      <v-list-item v-for="(descr, kind) in widget_list" :key="kind"
                   @click="$emit('select', kind)" link>
          <v-list-item-title>{{kind}}</v-list-item-title>
          <v-list-item-subtitle v-if="descr">{{descr}}</v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<style scoped>
/* reduce height of menu */
.v-menu__content .v-list-item { min-height: 2rem; width: 500px;}
.v-menu__content .v-list-item__title { flex: 0 0 auto; margin-right: 12px; }
</style>

<script scoped>
export default {
  name: 'WidgetMenu',

  inject: [ 'palette' ],

  props: {
    button_class: [],
  },

  data() { return {
    show: false,
  }},

  computed: {
    // list of available widgets for the menu
    widget_list() {
      // the map() below extracts the first line from the help for inclusion in the menu
      const widget_names = Object.keys(this.palette.widgets).filter(w =>
        !w.startsWith('nr__') && !w.endsWith('__')
      ).sort()
      return Object.fromEntries(widget_names.map(w =>
        [ w, (this.palette.widgets[w].help||"").replace(/^([^.\n]{0,80}).*/s, "$1") ]
      ))
    },
  },

}
</script>
