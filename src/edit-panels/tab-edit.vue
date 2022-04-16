<!-- TabEdit - Button and panel to edit the properties of a tab
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-btn density="compact" flat position="absolute" right top class="px-0" min-width="0"
         @click.stop="tab_edit=!tab_edit">
    <v-icon icon="mdi-pencil" size="small" />
  </v-btn>

  <v-menu v-model="tab_edit" anchor="bottom center" xorigin="top center" class="mt-1"
          allow-overflow :activator="activator"
          max-width="40ex" :close-on-content-click="false">
    <v-defaults-provider :defaults="{VTextField:{hideDetails:false}}">
      <!-- Editing panel shown floating below tab -->
      <v-card color="surface">
        <v-card-text class="d-flex px-2">
          <!-- move tab left/right -->
          <v-tooltip bottom>
            <template v-slot:activator="{ props }">
              <v-btn icon @click="moveTab(-1)" density="compact" v-bind="props">
                <v-icon>mdi-arrow-left-bold</v-icon></v-btn>
            </template>
            <span>Move tab left</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ props }">
              <v-btn small icon @click="moveTab(1)" v-bind="props">
                <v-icon>mdi-arrow-right-bold</v-icon></v-btn>
            </template>
            <span>Move tab right</span>
          </v-tooltip>
          <v-spacer></v-spacer>

          <!-- delete tab -->
          <v-btn small v-if="!global.noAddDelete" @click="deleteTab" class="mx-auto">Delete tab</v-btn>
          <v-spacer></v-spacer>

          <!-- close dialog button -->
          <v-btn elevation=0 icon @click="tab_edit=false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-text>

        <v-card-text class="d-flex flex-column">
          <!-- icon selector -->
          <v-text-field label="icon" hint=yes persistent-hint
                        :modelValue="tab.icon" @update:modelValue="handleEdit('icon', $event)">
            <template #message>
              <span>See <a target="_blank" href='https://materialdesignicons.com'>
                    materialdesignicons.com</a>
                <v-icon color="primary" x-small>mdi-open-in-new</v-icon>
              </span>
            </template>
          </v-text-field>

          <!-- tab title -->
          <v-text-field label="tab title" class="flex-grow-0"
                        :value="tab.title" @update:modelValue="handleEdit('title', $event)">
          </v-text-field>

          <!-- tab type chip -->
          <div class="d-flex align-baseline justify-center">
            <span class="text-body-1 font-weight-medium">Tab type:</span>
            <v-chip small class="ml-2">{{tab_kind}}</v-chip>
          </div>

          <!-- for a grid tab, add-a-grid button -->
          <div v-if="tab_kind=='grid' && !global.noAddDelete"
               class="d-flex mx-2 align-center justify-start">
            <v-card-text class="px-1 mr-3" style="width: auto;">
              {{grid_num}} grid{{grid_num>1 ? "s" : ""}}
            </v-card-text>
            <v-btn small @click="addGrid" class="">Add grid</v-btn>
          </div>

          <!-- for an iframe tab, URL field -->
          <div v-if="tab_kind=='iframe'" class="mx-2">
            <v-radio-group row mandatory hide-details :value="tab.slot">
              <template v-slot:label>
                <span class="mr-2">Slot:</span>
              </template>
              <v-radio label="A" value="a" @click="handleEdit('slot', 'a')"></v-radio>
              <v-radio label="B" value="b" @click="handleEdit('slot', 'b')"></v-radio>
            </v-radio-group>
            <v-text-field dense label="url" :value="tab.url" @input="handleEdit('url', $event)"
                          class="mt-4" style="width:40ex;"> <!-- push v-card to max-width-->
            </v-text-field>
          </div>
        </v-card-text>

      </v-card>
    </v-defaults-provider>
  </v-menu>
</template>

<style scoped>
</style>

<script scoped>
export default {
  name: "TabEdit",
  inject: [ '$config', '$store', 'global' ],

  model: { prop: "tab_edit", event: "change" },

  props: {
    tab_ix: null,
    tab_id: null,
    activator: null,
  },

  emits: [ 'update:tab_edit' ],

  computed: {
    tab() { return this.tab_id ? this.$config.tabs[this.tab_id] : {} },
    tab_kind() { return 'grids' in this.tab ? 'grid' : 'iframe' },
    grid_num() { return (this.tab.grids||[]).length },
  },

  data() { return {
    tab_edit: false, // turns tab editing menu on/off
    htmlHint: 'I\'m a hint with <b>HTML</b>',
  }},

  methods: {
    deleteTab() {
      this.$store.deleteTab(this.tab_ix)
      // tab_ix will auto-update in the parent component
      this.$emit('change', false) // i.e.: this.tab_edit = false
    },

    // edit tab props, such as title
    handleEdit(what, ev) {
      console.log('handleEdit', what, ev)
      const prop = {}; prop[what] = ev
      this.$store.updateTab(this.tab_id, prop)
    },

    moveTab(dir) {
      const ix = this.tab_ix
      const tabs = this.$config.dash.tabs
      if (!(ix+dir >= 0 && ix+dir < tabs.length)) return
      let tt = [ ...tabs ] // clone
      let t = tt[ix]; tt[ix] = tt[ix+dir]; tt[ix+dir] = t // swap
      this.$store.updateDash({ tabs: tt })
      // we need to force a full re-eval of the rendered stuff else the association between
      // the tabs and the content is screwed-up
      console.log(`Moving tab ${this.tab_ix} to ${ix+dir}`)
      this.$emit('reload', ix+dir)
    },

    addGrid() {
      this.$store.addGrid(this.tab_id)
    },

  },

}
</script>
