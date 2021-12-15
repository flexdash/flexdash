<!-- WidgetMove - Display button to move a widget to a different tab or panel
     When a menu entry is selected, emits a 'select' event with <TBD>.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-menu offset-y v-model="show">
    <!-- Menu activator, i.e. the button -->
    <template v-slot:activator="{ on:menu, attrs }">
      <v-tooltip bottom>
        <template v-slot:activator="{ on:tt }">
          <v-btn small icon :class="button_class" v-bind="attrs" v-on="{...tt, ...menu}">
            <v-icon>mdi-folder-move</v-icon>
          </v-btn>
        </template>
        <span>Move widget to a different grid or panel</span>
      </v-tooltip>
    </template>
    <!-- Menu content -->
    <v-list>
      <v-subheader>Move widget to a different grid</v-subheader>
      <v-list-item v-for="g in grid_list" :key="g.id" @change="select(g.id)" link>
        <v-list-item-title>grid {{g.title}}</v-list-item-title>
        <v-list-item-subtitle>on tab {{g.tab}}</v-list-item-subtitle>
      </v-list-item>
      <v-subheader>Move widget to a panel in this grid</v-subheader>
      <v-list-item v-for="p in panel_list" :key="p.id" @change="select(p.id)" link>
        <v-list-item-title>panel {{p.title}}</v-list-item-title>
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
  name: 'WidgetMove',

  inject: [ '$store', '$config' ],

  props: {
    button_class: [],
    id: null, // widget id
  },

  // A lot of properties are computed here once, it's OK not to use proper computed{} because
  // this widget gets instantiated only when a widget is edited and it's destroyed afterwards,
  // so the stuff computed here doesn't change, and not using computed{} saves hooking and
  // unhooking all watchers.
  data() { 
    const d = { show: false, grid_id: null, panel_id: null, grid_list: [], panel_list: [] }

    // IDs of the grid and possibly panel on which this widget is located
    // first try to find widget in a grid at the top-level 
    for (const g_id in this.$config.grids) {
      const g = this.$config.grids[g_id];
      if (g.widgets.includes(this.id)) {
        d.grid_id = g_id
        break
      }
    }
    // if we didn't find it, look in all panels of all grids (ugh)
    if (!d.grid_id) {
      outer: for (const g_id in this.$config.grids) {
        const g = this.$config.grids[g_id];
        for (const p_id of g.widgets) {
          const p = this.$store.widgetByID(p_id)
          console.log(`Checking ${p.id} ${p.kind} ${this.id} ${p.static.widgets} ${p.kind == "Panel" && p.static.widgets.includes(this.id)}`)
          if (p.kind == "Panel" && p.static.widgets.includes(this.id)) {
            d.grid_id = g_id
            d.panel_id = p_id
            break outer
          }
        }
      }
    }
    if (!d.grid_id) throw new Error(`WidgetMove: widget ${this.id} not found in any grid`)

    // mapping from grid ids to their tabs so we can display "grid X of tab Y"
    let grid_tabs = {}
    this.$config.dash.tabs.forEach((t_id, t_ix) => {
      const tab = this.$config.tabs[t_id]
      tab.grids.forEach((g_id, g_ix) => {
        grid_tabs[g_id] = {
          title: tab.title ? tab.title.toUpperCase() : `#${t_ix+1}`,
          ix: g_ix,
        }
      })
    })

    // list of available target grids for the menu as array of [id, title] pairs
    d.grid_list = Object.values(this.$config.grids).filter(g => (
        d.panel_id || g.id != d.grid_id
      )).map(g => ({
        id: g.id,    
        title: g.title ? `'${g.title}'` : `#${grid_tabs[g.id].ix+1}`,
        tab: grid_tabs[g.id].title,
      }))

    // list of available target panels in this grid
    d.panel_list = this.$store.gridByID(d.grid_id).widgets
      .map(w_id => this.$store.widgetByID(w_id))
      .filter(w => w.kind == "Panel")
      .map((p, ix) => ({ id: p.id, title: p.static.title ? `'${p.static.title}'` : `#${ix+1}` }))
      .filter(p => p.id != d.panel_id)
    
    return d
  },

  methods: {
    // handle menu selection and decorate with current panel/grid_id before sending up
    select(tgt_id) {
      this.$emit('move', this.panel_id || this.grid_id, tgt_id)
    },
  },

}
</script>
