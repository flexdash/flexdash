<!-- UploadButton - Simple button that pops-up a file picker and uploads the chosen file
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
     
-->
<template>
  <div class="uploadbutton d-flex align-center justify-center width100 px-1">
    <v-tooltip top :open-on-hover="!!tooltip">
      <template v-slot:activator="{ props }">
        <v-file-input :accept="accept" :label="title" solo dense hide-details single-line
                      v-bind="Object.assign(bindings, props)" :value="value" ref="fileupload"
                      @change="clickEv($event)">
        </v-file-input>
      </template>
      <span v-if="tooltip">{{ tooltip }}</span>
    </v-tooltip>
  </div>
</template>

<script scoped>

import upload from '/src/utils/upload.js'

export default {
  name: 'UploadButton',

  help: `Button to upload a file.
Pressing the button brings up a file picker and after the user picks a file it uploads the
file to the server.`,

  props: {
    enabled: { default: true },
    icon: { default: null, tip: "material-design-icon name" },
    title: { default: 'Upload' },
    tooltip: { default: null, tip: "tooltip to show on hover" },
    accept: { default: null, tip: "comma-separated list of file extensions and mime types to accept" },
    output_binding: { default: null },
  },

  data() {
    return {
      value: null,
    }
  },

  output: { default: null },

  inject: [ '$store' ], // FIXME: this is yuck!
 
  computed: {
    // actual bindings passed into v-btn
    bindings() { return {
      disabled: !this.enabled,
    }},
  },

  mounted() {
    //this.uploader = new SocketIOFileUpload(null)
  },

  methods: {
    clickEv(ev) {
      if (!ev) return
      console.log("UploadButton event:", ev)
      const conn = { serverQuery: this.$store.serverQuery, serverSend: this.$store.serverSend }
      upload(this.output_binding, ev, conn)
      //this.value = [] // reset file input, FIXME: show some progress thing...
      this.$refs.fileupload.reset()
    },
  },

}
</script>

<style scoped>
.uploadbutton { height: 100%; }
</style>
