<!-- Grid - Container to manage a grid of widgets dynamically placed on the page.
     Handles the layout of the widgets as well as the editing mode.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div style="display: contents;">
    <!-- Edit bar above the grid proper -->
    <v-toolbar v-if="$root.editMode" dense color="surface" class="editmode">
      <!--v-toolbar-title class="mr-4">Edit Grid</v-toolbar-title-->
      <div>
        <v-chip small>fixed size grid</v-chip>
      </div>

      <!-- Menu to add widget -->
      <div>
        <v-menu offset-y v-model="add_menu">
          <!-- Menu activator, i.e. the button -->
          <template v-slot:activator="{ on:menu, attrs }">
            <v-tooltip bottom>
              <template v-slot:activator="{ on:tt }">
                <v-btn small icon color="primary" v-bind="attrs" v-on="{...tt, ...menu}">
                  <v-icon>mdi-card-plus</v-icon>
                </v-btn>
              </template>
              <span>Add a widget to the end of the grid</span>
            </v-tooltip>
          </template>
          <!-- Menu to add a widget -->
          <v-list>
            <v-subheader>Add Widget to the end of the grid</v-subheader>
            <v-list-item v-for="kind in palette()" :key="kind"
                         @click="$store.addWidget(id, kind)">
              <v-list-item-title>{{kind}}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <v-spacer></v-spacer>
    </v-toolbar>

    <!-- Grid of widgets -->
    <v-container fluid class="g-grid-small">
      <widget-edit v-for="(w,ix) in grid.widgets" :key="w" :id="w" :grid_id="id"
                   :edit_active="ix == edit_ix" @edit="toggleEdit(ix, $event)"
                   @move="moveWidget(ix, $event)" @delete="deleteWidget(ix)">
      </widget-edit>
    </v-container>
  </div>
</template>

<script scoped>

import WidgetEdit from '@/components/widget-edit'

export default {
  name: 'FixedGrid',

  components: { WidgetEdit },
  inject: [ '$store', '$config' ],

  props: {
    id: { type: String }, // this grid's ID
  },

  data() { return {
    add_menu: null, // true while adding widget menu is shown
    edit_ix: null, // widget being edited
  }},

  computed: {
    // grid config: {id, kind, icon, widgets}
    grid() { return this.$store.gridByID(this.id) },
  },

  methods: {
    // palette returns the list of available widgets for the add-widget drop-down
    palette() {
      console.log("Palette:", window.widgetPalette);
      return Object.keys(window.widgetPalette)
    },

    toggleEdit(ix, on) { this.edit_ix = on ? ix : null },

    // handle the delete button
    deleteWidget(ix) {
      this.$store.deleteWidget(this.id, ix)
      this.endEdit()
    },

    // move a widget up/down (dir=-1/1)
    moveWidget(ix, dir) {
      console.log(`Moving widget #${ix} by ${dir}`)
      if (!(ix+dir >= 0 && ix+dir < this.grid.widgets.length)) return
      let ww = [ ...this.grid.widgets ] // clone
      let w = ww[ix]; ww[ix] = ww[ix+dir]; ww[ix+dir] = w // swap
      this.$store.updateGrid(this.id, { widgets: ww })
      this.edit_ix += dir
    },

  },

}

</script>

<style scoped>

/* style for button groups in the edit toolbar */
.v-toolbar__content div { margin-right: 4ex; }

/* style to make grid happen */
.g-grid-large {
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

</style>
<style>
.editmode.theme--light .v-toolbar__content { border-top: 1px solid #e0e0e0; }
.editmode.theme--dark .v-toolbar__content { border-top: 1px solid #111; }
</style>
