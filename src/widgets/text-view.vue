<!-- TextView - Widget to display plain monospaced text that can be (auto-)scrolled.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div class="mt-0 width100 d-flex flex-column" style="height: 100%;">
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
        <v-chip x-small pill color="green">save</v-chip>
      </v-btn>
      <span class="mr-auto"></span>
    </v-card-text>

    <!-- not editing... -->
    <v-card-text v-if="!editing"
                 class="pt-1 flex-grow-1 flex-shrink-1 overflow-auto d-flex"
                 :style="scrollStyle">
      <pre :style="preStyle" ref="scroller">{{text}}</pre>
    </v-card-text>

    <!-- editing... -->
    <textarea v-if="editing" v-bind:value="text" wrap="off" ref="ta"></textarea>
  </div>
</template>

<style scoped>
  pre { font-size: 85%; line-height: 125%; }
  .title-btn { position: relative; top: -4px; }
  .theme--light .v-btn--icon { background-color: rgba(255, 255, 255, 0.6); }
  .theme--dark .v-btn--icon  { background-color: rgba(30, 30, 30, 0.6); }
  .theme--light .v-card__text { color: rgba(0, 0, 0, 0.6); }
  .theme--dark .v-card__text  { color: rgba(255, 255, 255, 0.7); }
  textarea {
    flex-grow: 1; flex-shrink: 1;
    width:100%;
    cursor:text; overflow: auto;
    font-family: monospace; font-size: 75%; line-height: 125%;
    border-style: none !important; outline: none; padding: 4px;
    -moz-box-shadow:none; -webkit-box-shadow:none; box-shadow:none;
  }
</style>

<script scoped>
export default {
  name: 'TextView',

  full_page: true, // tells the widget-wrapper to provide a full-page button

  help: `Show plain monospaced text.
`,

  props: {
    title: { type: String, default: 'TextView' },
    text: { type: String, default: "" },
    editable: { type: Boolean, default: false, tip: "allow editing of the text"},
    wrap: { type: Boolean, default: false, tip: "wrap text"},
    autoscroll: { type: Boolean, default: true, tip: "auto-scroll to bottom of text (incompatible with editable)"},
  },

  output: { default: null },

  data() { return {
    editing: false,
  }},

  // watch: {
  //   text: {
  //     immediate: false,
  //     handler() {
  //       console.log("TEXT WATCH")
  //       if (this.autoscroll && !this.editable) {
  //         // scroll to bottom
  //         const el = this.$refs.scroller.parentElement
  //         console.log("SCROLL", el.scrollHeight, el.clientHeight)
  //         el.scrollTop = el.scrollHeight - el.clientHeight
  //       }
  //     },
  //   },
  // },

  // mounted() {
  //   if (!this.editable) {
  //     console.log("MOUNT-SCROLLING")
  //     // scroll to bottom
  //     const el = this.$refs.scroller.parentElement
  //     console.log("SCROLL", el.scrollHeight, el.clientHeight)
  //     el.scrollTop = el.scrollHeight - el.clientHeight
  //   }
  // },
  
  computed: {
    preStyle() {
      return {
        'overflow-wrap': this.wrap ? 'anywhere' : 'normal',
        'white-space': this.wrap ? 'pre-wrap' : 'nowrap',
        'word-break': this.wrap ? 'break-all' : 'inherit',
      }
    },
    scrollStyle() { return {
      'flex-direction': this.autoscroll ? 'column-reverse' : 'column',
    }},
  },

  methods: {
    handleEdit() { this.editing = true },
    handleCancel() { this.editing = false },
    handleSave() {
      if (this.editing) this.$emit('send', this.$refs.ta.value)
      this.editing = false;
    },
  },

}
</script>
