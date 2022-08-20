<!-- ColorPicker - Color picker used when editing widget properties.
     Can show material-design colors, 20-distinct colors, and arbitrary colors.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
    <v-overlay v-model="show_picker" location-strategy="connected" max-width="600px">
      <template #activator="{ props }">
        <!-- color field -->
        <v-btn variant="flat" :rounded="0" border="1" class="ma-0 pa-0"
               height="40px" min-width="28px" max-width="28px"
               :color="modelValue"
               @click="show_picker=!show_picker">T</v-btn>
        <v-text-field :label="label" :model-value="modelValue" v-bind="{...$attrs, ...props}"
                      append-inner-icon="mdi-palette"
                      @update:modelValue="$emit('input', $event.hex)"
                      @click:append-inner="show_picker=!show_picker">
        </v-text-field>
      </template>
      <v-card class="d-flex flex-column mb-2">
        <!-- color picker title bar with name of field and close (cancel) button -->
        <v-card-title class="w-100 py-1 pb-0 d-flex">
          <span>{{label}}</span>
          <v-spacer></v-spacer>
          <v-btn elevation=0 icon @click="show_picker=false">
            <v-icon icon="mdi-close" />
          </v-btn>
        </v-card-title>
        <!-- color picker swatches -->
        <div class="w-100 pa-1 d-flex flex-row justify-space-around align-top flex-wrap">
          <div v-for="(color, name) in swatches" :key="name" class="d-flex flex-column">
            <div class="mt-1 mx-auto">{{name}}</div>
            <v-tooltip v-for="(hex, fullname) in color" :key="fullname">
              <template #activator="{ props }">
                <v-btn v-if="hex" class="ma-1" v-bind="props"
                       :color="hex" @click="changeColor(fullname)" />
              </template>
              <div class="d-flex flex-column">
                <span class="mx-auto">{{fullname}}</span>
                <span class="mx-auto">{{hex}}</span>
              </div>
            </v-tooltip>
          </div>
        </div>
      </v-card>
    </v-overlay>
</template>

<script scoped>

//import colors from '/src/utils/colors.js'
import colors from 'vuetify/lib/util/colors'

// swatches for custom color picker
const swatches = {}
const levels = { // mapping from JS color names to what components expect
  'lighten3': '-lighten-3',
  'accent3': '-accent-3',
  'base': '',
  'darken3': '-darken-3',
}
for (let name in colors) {
  const color = colors[name]
  const n = name.replace(/[A-Z]/g, t => '-' + t.toLowerCase()) // snake-case
  if (name == 'shades') {
    swatches["bw"] = Object.assign({}, color)
  } else {
    swatches[n] = Object.fromEntries(
      Object.entries(levels).map(([lev, suf]) => [n+suf, color[lev]]) )
  }
}
swatches['bw']['text'] = 'text' // transparent -> text color

export default {
  name: "ColorPicker",

  props: {
    label: { default: null },
    modelValue: { default: null },
  },

  emits: [ 'update:modelValue' ],

  data() { return {
    show_picker: false,
    swatches,
  }},

  methods: {
    changeColor(name) {
      if (name == "text") {
        this.$emit('update:modelValue', "") // gives us text color with theme support
      } else {
        this.$emit('update:modelValue', name)
      }
      this.show_picker = false
    },
  },

}
</script>
