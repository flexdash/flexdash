<!-- IFrameGrid - Container to display an iframe
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div class="grid-outer u-tooltip-attach">

    <!-- Hacky roll-up/roll-down icon at the top-center of the grid if there's no title -->
    <div v-if="rollupMini" :class="rollerClasses">
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-btn x-small icon height="24px" class="mx-auto" @click="toggleRoll" v-bind="props">
            <v-icon>mdi-arrow-{{rolledup ? 'down' : 'up'}}-drop-circle</v-icon>
          </v-btn>
        </template>
        <span>Roll iframe up/down</span>
      </v-tooltip>
    </div>

    <!-- Normal-mode title bar, when we have a title -->
    <v-toolbar dense flat v-if="rollupMaxi" height=36 color="background"
               class="d-flex justify-start">
      <!-- roll-up/down button -->
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-btn x-small icon height="24px" class="mx-auto" @click="toggleRoll" v-bind="props">
            <v-icon>mdi-arrow-{{rolledup ? 'down' : 'up'}}-drop-circle</v-icon>
          </v-btn>
        </template>
        <span>Roll iframe up/down</span>
      </v-tooltip>
      <!-- grid title -->
      <v-toolbar-title>{{grid.title}}</v-toolbar-title>
    </v-toolbar>

    <!-- Editing toolbar above grid proper -->
    <v-toolbar v-if="global.editMode" dense flat color="background" class="editmode">
      <!-- roll-up/down button -->
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-btn small icon color="grey" @click="toggleRoll" class="mr-4" v-bind="props">
            <v-icon>mdi-arrow-{{rolledup ? 'down' : 'up'}}-drop-circle</v-icon>
          </v-btn>
        </template>
        <span>Roll iframe up/down</span>
      </v-tooltip>

      <!-- iframe title text field -->
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-text-field single-line dense hide-details label="title" class="mr-6 flex-grow-0"
                        v-bind="props" :value="grid.title" @change="changeUrl" style="width: 20ex">
          </v-text-field>
        </template>
        <span>Title to show at top of grid, if empty the grid bar is thinner</span>
      </v-tooltip>

      <!-- iframe source URL -->
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-text-field single-line dense hide-details label="url" class="mr-6 flex-grow-1"
                        v-bind="props" :value="grid.url" @change="changeUrl">
          </v-text-field>
        </template>
        <span>Source URL to fill the iframe with</span>
      </v-tooltip>

      <v-spacer></v-spacer>
      <!-- Button to delete the grid -->
      <v-tooltip bottom>
        <template v-slot:activator="{ props }">
          <v-btn small @click="$emit('delete')" class="mc-auto" v-bind="props">
            Delete grid
          </v-btn>
        </template>
        <span>Delete this grid and all its widgets</span>
      </v-tooltip>

    </v-toolbar>

    <!-- Iframe - the first div occupies the rest of the viewport (browser window) and establishes
         a new sizing context; the second div uses that sizing context, and the iframe then fills
         it all. The net result is that the iframe fills the rest of the window and there's only
         one scrollbar (in the iframe) if the content needs to scroll. (There's probably a trick
         to eliminate one of the divs... -->
    <div style="position: relative; height: 100%;">
      <div class="iframe-wrap">
        <iframe v-if="!rolledup" :src="grid.url"
                frameborder="0" marginheight="0" marginwidth="0">
        </iframe>
      </div>
    </div>
  </div>
</template>

<script scoped>

export default {
  name: 'IFrameGrid',

  inject: [ '$store', '$config', 'global' ],

  props: {
    id: { type: String }, // this grid's ID
  },

  data() { return {
    rolledup: false, // whether grid is rolled-up
    //url: "https://tve.github.io/flexdash",
  }},

  computed: {
    // grid config: {id, kind, icon, widgets}
    grid() { return this.$store.gridByID(this.id) },
    rollupMini() { return !this.global.editMode && !this.grid.title },
    rollupMaxi() { return !this.global.editMode &&  this.grid.title },
    rollerClasses() { // classes for mini roll-up div
      const rm = this.grid.url &&  !this.rolledup && 'roller__minimal'
      return [ 'd-flex', 'roller', rm ]
    },

  },

  methods: {
    toggleRoll() { this.rolledup = !this.rolledup },
    changeTitle(ev) { this.$store.updateGrid(this.id, { title: ev }) },
    changeUrl(ev) { this.$store.updateGrid(this.id, { url: ev }) },

  },
}

</script>

<style scoped>
/* style for button groups in the edit toolbar */
.v-toolbar__content div { margin-right: 4ex; }

/* style for roll-up/roll-down bar when there's no toolbar */
.roller { width: 100% }
.roller.roller__minimal { height: 22px; }

/* iframe */
.grid-outer { height: 100%; }
.iframe-wrap {
  position: absolute;
  left: 0; right: 0; bottom: 0; top: 0px;
} 
iframe { border: none; width:100%; height:100%; display: block; object-position: center top; }
</style>

<style>
.editmode.theme--light .v-toolbar__content { border-top: 1px solid #e0e0e0; }
.editmode.theme--dark .v-toolbar__content { border-top: 1px solid #111; }
</style>
