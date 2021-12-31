<!-- Props-table -- Display a simple table of key-value properties
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div class="mt-0 width100">
    <!-- title and edit button -->
    <v-card-text class="d-flex pa-0 pt-1 mb-0">
      <span v-if="title" class="ml-auto mr-1 text-no-wrap">{{title}}</span>
      <!-- edit button (when not editing) -->
      <v-btn small icon class="title-btn mr-auto ml-0" v-if="editable && !editing" @click="handleEdit">
        <v-icon small>mdi-pencil</v-icon>
      </v-btn>
      <!-- save/cancel buttons (when editing) -->
      <v-btn small icon class="title-btn mr-1 ml-0" v-if="editing" @click="handleCancel">
        <v-icon small>mdi-close-thick</v-icon>
      </v-btn>
      <v-btn small icon class="title-btn mr-auto ml-1" v-if="editing" @click="handleSave">
        <v-icon small color="green">mdi-check-bold</v-icon>
      </v-btn>
      <span class="mr-auto"></span>
    </v-card-text>

    <!-- table of properties -->
    <v-simple-table dense fixed-header class="props-table">
      <template v-slot:default>
        <tbody>
          <tr v-for="key, ix in keys" :key="ix">
            <td align="right" class="px-1"><b>{{key}}:</b></td>
            <!-- non-editing -->
            <td v-if="!editing" class="px-2">{{value[key]}}</td>
            <!-- edit string -->
            <td v-else-if="kind[key]==='string'" class="px-2">
              <input type="text" :value="value[key]" @input="handleInput(key, $event)"/>
            </td>
            <!-- edit number -->
            <td v-else-if="kind[key]==='number'" class="px-2">
              <input type="number" :value="value[key]" @input="handleInput(key, $event)"/>
            </td>
            <!-- edit boolean -->
            <td v-else-if="kind[key]==='boolean'" class="px-2">
              <input type="checkbox" :value="value[key]" @input="handleInput(key, $event)"/>
            </td>
            <!-- other types: not sure.... -->
            <td v-else class="px-2">
              <input type="text" :value="value[key]" @input="handleInput(key, $event)"/>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
  </div>
</template>

<style scoped>
  .unit { vertical-align: 15%; margin-left: 0.1em; }
  .title-btn { position: relative; top: -4px; }
  .theme--light .v-btn--icon { background-color: rgba(255, 255, 255, 0.6); }
  .theme--dark .v-btn--icon  { background-color: rgba(30, 30, 30, 0.6); }
  .theme--light .v-card__text { color: rgba(0, 0, 0, 0.6); }
  .theme--dark .v-card__text  { color: rgba(255, 255, 255, 0.7); }
  td input {
    width: 100%; padding: 0px 1px;
    -webkit-appearance: none; -moz-appearance: none;
    background: none;
    border: 1px solid #888; border-radius: 2px;
  }
</style>

<style>
  .props-table.v-data-table { width: 100%; }
</style>

<script scoped>
// Map an object to another one through a function that transforms the values
var ObjectMap = (o, fn) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fn(k, v)]))

export default {
  name: 'PropsTable',
  // help displayed in the UI: the first line is used in the widgets menu and is always shown in
  // the edit card. Successive lines can be expanded in the card and are markdown-formatted.
  help: `Display key-value pairs in tabular form.
The table can be set as editable which allows the user to change the property values.
Each change is sent to the configured topic with payload \`[ key, new_value]\`.`,

  // properties are inputs to the widget, these can be set to static values or bound to dynamic
  // data by topic in the FlexDash UI. The type is used to display the appropriate kind of input
  // field and also to convert data (ex: string to number). Dynamic is used to bind an input
  // to a data topic right when the widget is created so it animates tight off the bat.
  props: {
    title: { type: String, default: 'PropsTable' },
    data: { type: Object, default: () => ({ "key1": "value1", "key2": "value2" }),
            tip: "simple key-value pairs to show in table"},
    editable: { type: Boolean, default: false, tip: "allow editing of the table"},
  },

  output: { default: null },

  data() { return {
    editing: false,
    new_values: {},
  }},

  computed: {
    // sort property keys alphabetically
    keys() { return Object.keys(this.data).sort() },
    kind() { return ObjectMap(this.data, (k,v) => typeof v) },
    value() { return ObjectMap(this.data, (k,v) => {
      if (typeof v == 'string') return v
      else return JSON.stringify(v)
    })},
  },

  methods: {
    handleEdit() { this.editing = true },
    handleCancel() { this.editing = false; this.new_values = {} },
    handleSave() {
      this.editing = false;
      this.$emit('send', this.new_values)
      this.new_values = {}
    },
    handleInput(key, ev) { this.new_values[key] = ev.target.value },
  }

}
</script>
