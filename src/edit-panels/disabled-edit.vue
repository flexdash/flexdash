<!-- DisabledEdit - Replacement for WidgetEdit for disabled/deleted/missing widgets
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file

     When Node-RED can figure out details about the node that is missing it produces an
     explicit DisabledWidget. When it can't figure anything out, it produces a
     'x<ID> reference that lands here, so we actually have no info other than the node-red ID.
-->

<template>
  <div class="widget-edit">
    <widget-wrap :editable="false" :config="config">
    </widget-wrap>
  </div>
</template>

<style scoped>
.widget-edit { max-width: 100%; min-height: 1em; }
</style>

<script scoped>

import WidgetWrap from '/src/components/widget-wrap.vue'

export default {
  name: 'DisabledEdit',

  components: { WidgetWrap },

  props: {
    widget_id: { type: String, required: true }, // my widget ID
    edit_active: { type: Boolean, default: false }, // we're being edited
    editable: { type: Boolean, default: true }, // can we be edited? (just passed down to widget-wrap)
    no_border: { type: Boolean, default: false }, // true causes no "card" border, used by panel
  },

  computed: {
    nr_id() { return this.widget_id.substring(1) },

    config() { return {
      kind: "DisabledWidget", id: this.widget_id, rows: 1, cols: 1, static: {}, dynamic: {}
    }},
  },

}

</script>
