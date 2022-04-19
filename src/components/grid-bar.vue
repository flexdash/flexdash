<!-- GridBar - Bar at the top of a grid with rull-up/down button, optional title, edit mode
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <!-- Hacky roll-up/roll-down icon at the top-center of the grid if there's no title -->
  <div v-if="rollupMini" :class="rollerClasses">
    <v-tooltip>
      <template v-slot:activator="{ props }">
        <v-btn size="small" flat icon class="mx-auto" style="margin-top: 2px"
                @click="toggleRoll" v-bind="props">
          <v-icon size="small">mdi-arrow-{{rolledup ? 'down' : 'up'}}-drop-circle</v-icon>
        </v-btn>
      </template>
      <span>Roll widgets up/down</span>
    </v-tooltip>
  </div>

  <!-- Normal-mode title bar, when we have a title -->
  <v-toolbar flat v-if="rollupMaxi" height=36 color="background"
              class="d-flex justify-start">
    <!-- roll-up/down button -->
    <v-tooltip>
      <template v-slot:activator="{ props }">
        <v-btn x-small icon height="24px" class="mx-auto" @click="toggleRoll" v-bind="props">
          <v-icon>mdi-arrow-{{rolledup ? 'down' : 'up'}}-drop-circle</v-icon>
        </v-btn>
      </template>
      <span>Roll widgets up/down</span>
    </v-tooltip>
    <!-- grid title -->
    <v-toolbar-title>{{title}}</v-toolbar-title>
  </v-toolbar>

  <!-- Editing toolbar above grid proper -->
  <v-toolbar v-if="global.editMode" density="compact" flat color="background" class="editmode">
    <!-- roll-up/down button -->
    <v-tooltip>
      <template v-slot:activator="{ props }">
        <v-btn icon color="grey" @click="toggleRoll" class="mr-4" v-bind="props">
          <v-icon>mdi-arrow-{{rolledup ? 'down' : 'up'}}-drop-circle</v-icon>
        </v-btn>
      </template>
      <span>Roll widgets up/down</span>
    </v-tooltip>

    <span class="mr-2">{{kind}}</span>

    <!-- grid title text field -->
    <v-tooltip>
      <template v-slot:activator="{ props }">
        <v-text-field hide-details label="grid title" class="mr-6 flex-grow-0" style="width: 20ex"
                      v-bind="props" :value="title" @update:modelValue="$emit('changeTitle', $event)">
        </v-text-field>
      </template>
      <span>Title to show at top of grid, if empty the grid bar is thinner</span>
    </v-tooltip>

    <slot></slot>

    <v-spacer></v-spacer>
    <!-- Button to delete the grid -->
    <v-tooltip v-if="!global.noAddDelete">
      <template v-slot:activator="{ props }">
        <v-btn @click="$emit('delete')" class="mc-auto" v-bind="props">
          Delete grid
        </v-btn>
      </template>
      <span>Delete this grid and all its widgets</span>
    </v-tooltip>

  </v-toolbar>
</template>

<style scoped>
/* style for button groups in the edit toolbar */
.v-toolbar__content div { margin-right: 4ex; }

/* style for roll-up/roll-down bar when there's no toolbar */
.roller { width: 100% }
.roller.roller__minimal { height: 22px; }
</style>
<style>
.editmode.theme--light .v-toolbar__content { border-top: 1px solid #e0e0e0; }
.editmode.theme--dark .v-toolbar__content { border-top: 1px solid #111; }
</style>

<script scoped>

export default {
  name: 'GridBar',

  inject: [ 'global' ],

  props: {
    kind: { type: String, default: '' }, // type of grid (StdGrid, ArrayGrid, ... )
    title: { type: String, default: '' }, // grid title
    has_widgets: false,
    rolledup: false, // whether grid is rolled-up
  },

  emits: [ 'update:rolledup', 'changeTitle', 'delete' ],

  data() { return {
  }},

  computed: {
    // grid config: {id, kind, icon, widgets}
    grid() { return this.$store.gridByID(this.id) },
    rollupMini() { return !this.global.editMode && !this.title },
    rollupMaxi() { return !this.global.editMode &&  this.title },
    rollerClasses() { // classes for mini roll-up div
      const rm = this.has_widgets && !this.rolledup && 'roller__minimal'
      return [ 'd-flex', 'roller', rm ]
    },
  },

  methods: {
    toggleRoll() { this.$emit('update:rolledup', !this.rolledup) },
  },
}

</script>
