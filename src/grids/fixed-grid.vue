<!-- Grid - Container to manage a grid of widgets dynamically placed on the page.
     Handles the layout of the widgets as well as the editing mode.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div class="u-tooltip-attach">

    <!-- Hacky roll-up/roll-down icon at the top-center of the grid if there's no title -->
    <div v-if="rollupMini" :class="rollerClasses">
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn x-small icon height="24px" class="mx-auto" @click="toggleRoll" v-on="on">
            <v-icon>mdi-arrow-{{rolledup ? 'down' : 'up'}}-drop-circle</v-icon>
          </v-btn>
        </template>
        <span>Roll widgets up/down</span>
      </v-tooltip>
    </div>

    <!-- Normal-mode title bar, when we have a title -->
    <v-toolbar dense flat v-if="rollupMaxi" height=36 color="background"
               class="d-flex justify-start">
      <!-- roll-up/down button -->
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn x-small icon height="24px" class="mx-auto" @click="toggleRoll" v-on="on">
            <v-icon>mdi-arrow-{{rolledup ? 'down' : 'up'}}-drop-circle</v-icon>
          </v-btn>
        </template>
        <span>Roll widgets up/down</span>
      </v-tooltip>
      <!-- grid title -->
      <v-toolbar-title>{{grid.title}}</v-toolbar-title>
    </v-toolbar>

    <!-- Editing toolbar above grid proper -->
    <v-toolbar v-if="$root.editMode" dense flat color="background" class="editmode">
      <!-- roll-up/down button -->
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn small icon color="grey" @click="toggleRoll" class="mr-4" v-on="on">
            <v-icon>mdi-arrow-{{rolledup ? 'down' : 'up'}}-drop-circle</v-icon>
          </v-btn>
        </template>
        <span>Roll widgets up/down</span>
      </v-tooltip>

      <!-- grid title text field -->
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-text-field single-line dense hide-details label="title" class="mr-6 flex-grow-0"
                        v-on="on" :value="grid.title" @change="changeTitle" style="width: 20ex">
          </v-text-field>
        </template>
        <span>Title to show at top of grid, if empty the grid bar is thinner</span>
      </v-tooltip>

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
          <!-- Menu content -->
          <v-list>
            <v-subheader>Add Widget to the end of the grid</v-subheader>
            <v-list-item v-for="(descr, kind) in widgets" :key="kind"
                             @click="addWidget(kind)" link>
                <v-list-item-title>{{kind}}</v-list-item-title>
                <v-list-item-subtitle v-if="descr">{{descr}}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <v-spacer></v-spacer>
      <!-- Button to delete the grid -->
      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <v-btn small @click="$emit('delete')" class="mc-auto" v-on="on">
            Delete grid
          </v-btn>
        </template>
        <span>Delete this grid and all its widgets</span>
      </v-tooltip>

    </v-toolbar>

    <!-- Grid of widgets -->
    <v-container fluid v-if="!rolledup" class="g-grid-small pt-0">
      <widget-edit v-for="(w,ix) in grid.widgets" :key="w" :id="w" :grid_id="id"
                   :edit_active="ix == edit_ix" @edit="toggleEdit(ix, $event)"
                   @move="moveWidget(ix, $event)" @delete="deleteWidget(ix)">
      </widget-edit>
    </v-container>
  </div>
</template>

<script scoped>

import WidgetEdit from '/src/components/widget-edit.vue'

export default {
  name: 'FixedGrid',

  components: { WidgetEdit },
  inject: [ '$store', '$config', 'palette' ],

  props: {
    id: { type: String }, // this grid's ID
  },

  data() { return {
    add_menu: null, // true while adding widget menu is shown
    edit_ix: null, // widget being edited
    rolledup: false, // whether grid is rolled-up
  }},

  computed: {
    // grid config: {id, kind, icon, widgets}
    grid() { return this.$store.gridByID(this.id) },
    rollupMini() { return !this.$root.editMode && !this.grid.title },
    rollupMaxi() { return !this.$root.editMode &&  this.grid.title },
    rollerClasses() { // classes for mini roll-up div
      const rm = this.grid.widgets.length>0 &&  !this.rolledup && 'roller__minimal'
      return [ 'd-flex', 'roller', rm ]
    },

    // widgets provides the list of available widgets for the add-widget drop-down
    widgets() {
      console.log("Palette:", this.palette.widgets);
      return Object.fromEntries(Object.keys(this.palette.widgets).sort().map(w =>
        [ w, (this.palette.widgets[w].help||"").replace(/^([^.\n]{0,80}).*/s, "$1") ]
      ))
    },

  },

  methods: {
    toggleEdit(ix, on) { this.edit_ix = on ? ix : null },

    addWidget(kind) {
      const widget_ix = this.$store.addWidget(this.id, kind)
      this.edit_ix = widget_ix // start editing the new widget
    },

    // handle widget delete event coming up from widget-edit
    deleteWidget(ix) {
      this.$store.deleteWidget(this.id, ix)
      this.edit_ix = null
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

    toggleRoll() { this.rolledup = !this.rolledup },
    changeTitle(ev) { this.$store.updateGrid(this.id, { title: ev }) },

  },
}

</script>

<style scoped>

/* style for button groups in the edit toolbar */
.v-toolbar__content div { margin-right: 4ex; }

/* style for roll-up/roll-down bar when there's no toolbar */
.roller { width: 100% }
.roller.roller__minimal { height: 22px; }

/* reduce height of add-widget menu */
.v-menu__content .v-list-item { min-height: 2rem; width: 500px;}
.v-menu__content .v-list-item__title { flex: 0 0 auto; margin-right: 12px; }


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
