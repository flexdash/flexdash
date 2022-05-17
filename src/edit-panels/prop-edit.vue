<!-- PropEdit - Edit field for one prop
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-defaults-provider :defaults="{global:{hideDetails:true}, VTooltip:{anchor:'bottom'}}">
    <div class="width100 prop-edit" v-bind="$attrs">
      <div class="d-flex align-center width100">
        <div style="width:5em; margin-right: 4px">{{nameText}}</div>
        <!-- menu to change type of prop ->
        <v-menu v-model="type_menu">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props">
              <v-icon icon="mdi-menu-down" />
              <v-icon icon="mdi-link-variant" />
            </v-btn>
          </template>
          <v-list v-model:selected="type">
            <v-list-item v-for="t in types" :key="t">
              <v-list-item-icon><v-icon :icon="info.icon" /></v-list-item-icon>
            </v-list-item>
          </v-list>
        </v-menu-->
        <!-- toggle buttons to select static vs. dynamic -->
        <v-tooltip>
          <template v-slot:activator="{ props }">
            <v-btn-toggle mandatory class="ma-0" variant="contained-text"
                          :modelValue="is_static"
                          @update:modelValue="$emit('update:is_static', $event)">
              <v-btn xsize="small" icon v-bind="props"><v-icon icon="mdi-link-variant" /></v-btn>
              <v-btn xsize="small" icon v-bind="props"><v-icon :icon="info.icon" /></v-btn>
            </v-btn-toggle>
          </template>
          <span>Toggle dynamic link vs. literal value</span>
        </v-tooltip>

        <!-- dynamic link -->
        <topic-tree v-if="!is_static"
            class="flex-grow-1"
            :modelValue="modelValue" @update:modelValue="handleEdit('dynamic', $event)">
        </topic-tree>
        <!-- number -->
        <v-text-field v-else-if="info.type === Number"
            class="flex-grow-1" style="max-width:auto"
            :label="name" type="number"
            :model-value="modelValue" @update:modelValue="handleEdit('static', $event)">
        </v-text-field>
        <!-- boolean -->
        <v-switch v-else-if="info.type === Boolean"
            :label="name" append-icon="" class="ml-2 flex-grow-1"
            :model-value="modelValue" @update:modelValue="handleEdit('static', $event)">
        </v-switch>
        <!-- array -->
        <v-text-field v-else-if="info.type === Array"
            :label="name" class="flex-grow-1"
            :rules="[validateArray]"
            :model-value="JSON.stringify(modelValue||info.default)"
            @update:modelValue="handleEdit('static', $event)">
        </v-text-field>
        <!-- object -->
        <v-text-field v-else-if="info.type === Object"
            :label="name" class="flex-grow-1"
            :rules="[validateObject]"
            :model-value="JSON.stringify(modelValue||info.default)"
            @update:modelValue="handleEdit('static', $event)">
        </v-text-field>
        <!-- color -->
        <color-picker v-else-if="name === 'color' || name.endsWith('_color')"
            :label="name" class="flex-grow-1"
            :modelValue="modelValue||info.default"
            @update:modelValue="handleColorEdit($event)">
        </color-picker>
        <!-- string -->
        <div style="display: content" class="d-flex flex-grow-1" v-else>
          <v-text-field class="w-edit"
              :label="name" :hint="info.hint"
              append-inner-icon="mdi-arrow-expand-all"
              :model-value="modelValue||info.default"
              @update:modelValue="handleEdit('static', $event)"
              @click:append-inner="popupTextField(name)">
          </v-text-field>
        </div>
      </div>

      <div class="d-flex width100">
        <div style="min-width: 5em; width: 5em; margin-right: 4px; flex: 0 0;"></div>
        <div class="flex-grow-1 text-caption">
          <span>{{hint}}</span>
        </div>

      </div>

      <!-- dialog box to edit a string input value full-page ->
      <v-dialog v-model="dialog" content-class="height80 widget-edit-dialog"
                width="80%" max-width="100ex">
        <v-card v-if="dialog" class="d-flex flex-column height100">
          <v-card-title class="d-flex align-baseline">
            <span>Edit <span style="font-weight: 700">{{dialog_prop}}</span></span>
            <v-spacer></v-spacer>
            <v-btn elevation=0 icon @click="dialog=false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text class="flex-grow-1">
            <v-textarea dense hide-details filled class="height100"
                :model-value="widget.static[dialog_prop]||prop_info[dialog_prop].default"
                @update:modelValue="handleEdit('static', dialog_prop, $event)">
            </v-textarea>
          </v-card-text>
        </v-card>
      </v-dialog-->
    </div>
  </v-defaults-provider>
</template>

<style>
  .prop-edit .v-btn-group {
    flex: 0 0 fit-content; /* avoid any size change, which messes-up bg color */
    height: 40px; /* same as input field */
    border-radius: 8px 0px 0px 8px;
  }
  .prop-edit .v-btn { padding: 0px 12px; }
  .prop-edit .v-field__overlay {
    border-radius: 0px 8px 0px 0px;
  }
  .prop-edit .v-field--appended { padding-right: 4px; }

  .prop-edit {
      break-inside: avoid-column; /* CSS std */
      page-break-inside: avoid; /* for older firefox */
  }
</style>

<script scoped>

import md from '/src/components/md.vue'
import ColorPicker from '/src/components/color-picker.vue'
import TopicTree from '/src/components/topic-tree.vue'

export default {
  name: 'PropEdit',

  components: { md, ColorPicker, TopicTree },
  inject: [ '$store', 'palette' ],

  props: {
    name: { type: String, required: true }, // name of prop being edited
    is_static: { type: Number, default: 0 }, // 1: static prop, 0: dynamic
    modelValue: null,
    // info about prop: {type, default, validator, hint, icon, dynamic}
    // types: String, Number, Boolean, Array, Object, Date //, Function, Symbol
    info: { type: Object, required: true },
  },

  emits: [ 'update:is_static', 'update:modelValue' ],

  data() { return {
    // pop-up dialog to edit string property full-page
    dialog: false,
    dialog_prop: null,
  }},

  computed: {
    nameText() {
      let n = this.name.replace(/_([a-z])/g, m => ' ' + m[1])
      return n.charAt(0).toLocaleUpperCase() + n.slice(1)
    },
    hint() { return this.info.hint },
  },

  methods: {

    handleEdit(which, value) {
      console.log("handleEdit", which, value)
      this.$emit('update:modelValue', which, value)
    },

    handleColorEdit(value) {
      console.log("handleColorEdit", value)
      if (value == "") value = null
      this.handleEdit('static', value)
    },

    validateArray(v) {
      let a
      try {
        a = JSON.parse(v)
      } catch(e) {
        return e.toString().replace(/^.*?parse:/, "")
      }
      if (!Array.isArray(a)) return "array required"
      return true
    },

    validateObject(v) {
      let a
      try {
        a = JSON.parse(v)
      } catch(e) {
        return e.toString().replace(/^.*?parse:/, "")
      }
      if (typeof a !== 'object') return "object required"
      return true
    },

    // pop up a dialog box to edit a text field
    popupTextField(prop) {
      if (this.dialog) {
        this.dialog = false
      } else {
        this.dialog_prop = prop
        this.dialog = true
      }
    },

  },

}

</script>
