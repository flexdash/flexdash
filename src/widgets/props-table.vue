<!-- Props-table -- Displaty a simple table of key-value properties
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <v-simple-table dense fixed-header class="props-table">
    <template v-slot:default>
      <tbody>
        <tr v-for="key in keys" :key="key">
          <th class="px-2">{{key}}:</th><td class="px-2">{{value(key)}}</td>
        </tr>
      </tbody>
    </template>
  </v-simple-table>
</template>

<style scoped>
.unit { vertical-align: 15%; margin-left: 0.1em; }
</style>

<style>
  .props-table.v-data-table { width: 100%; }
</style>

<script scoped>
export default {
  name: 'PropsTable',
  // help displayed in the UI: the first line is used in the widgets menu and is always shown in
  // the edit card. Successive lines can be expanded in the card and are markdown-formatted.
  help: `Display key-value pairs in tabular form.
Yadda yadda.`,

  // properties are inputs to the widget, these can be set to static values or bound to dynamic
  // data by topic in the FlexDash UI. The type is used to display the appropriate kind of input
  // field and also to convert data (ex: string to number). Dynamic is used to bind an input
  // to a data topic right when the widget is created so it animates tight off the bat.
  props: {
    data: { type: Object, default: ()=>({}), dynamic: "", tip: "simple key-value pairs to show in table"},
  },

  computed: {
    // sort property keys alphabetically
    keys() { return Object.keys(this.data).sort() },
  },

  methods: {
    value(key) {
      let v = this.data[key]
      if (typeof v == 'string') return v
      else return JSON.stringify(v)
    },
  }

}
</script>
